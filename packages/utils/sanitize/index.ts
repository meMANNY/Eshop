import sanitizeHtml from "sanitize-html";

/*
  Product descriptions are authored in the seller's rich-text editor and stored
  as raw HTML, then rendered with `dangerouslySetInnerHTML` on the public
  product page. Nothing sanitised them at any point, so any seller could run
  script in every shopper's browser — stored XSS, reaching every visitor to
  that product.

  One allowlist shared by the write path (product-service, so the payload never
  reaches the database) and the read path (user-ui, which also covers the rows
  written before this existed). Sanitising in both places is deliberate: the
  write side keeps the data clean, the read side is what protects the rows
  already in there.

  Allowlist rather than blocklist. Only the tags the editor can actually
  produce are permitted; `allowedSchemes` is what stops `javascript:` hrefs, and
  every surviving link is forced to rel="noopener noreferrer" so a target=_blank
  link cannot reach back through window.opener.
*/
const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "s",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "blockquote",
    "a",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      rel: "noopener noreferrer",
      target: "_blank",
    }),
  },
};

/**
 * Strip anything the rich-text editor could not legitimately have produced.
 * Safe to call on `null`/`undefined`; always returns a string.
 */
export const sanitizeRichText = (html?: string | null): string => {
  if (!html) return "";

  // The editor emits &nbsp; for ordinary spacing, which survives sanitisation
  // and then refuses to wrap — long descriptions overflow their container.
  const normalized = html.replace(/&nbsp;/gi, " ").replace(/\u00A0/g, " ");

  return sanitizeHtml(normalized, RICH_TEXT_OPTIONS);
};
