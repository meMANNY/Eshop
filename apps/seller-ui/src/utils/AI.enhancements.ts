/**
 * ImageKit AI / enhancement presets.
 *
 * Each `transformation` value is the raw token ImageKit expects in the `?tr=`
 * query string, so an enhancement is applied purely on the delivery URL — no
 * extra upload or API round-trip. ImageKit renders the enhanced image on the fly.
 *
 * The AI transforms (bgremove / dropshadow / retouch / upscale) come with a free
 * monthly usage quota on ImageKit's free plan; the rest (sharpen / contrast /
 * grayscale) are standard transformations that are always free.
 *
 * Docs: https://imagekit.io/docs/ai-transformations
 */

export interface AiEnhancement {
    label: string;
    /** Token appended to the ImageKit `?tr=` query, e.g. "e-bgremove". */
    transformation: string;
}

export const aiEnhancements: AiEnhancement[] = [
    { label: "Remove Background", transformation: "e-bgremove" },
    { label: "Drop Shadow", transformation: "e-dropshadow" },
    { label: "Retouch", transformation: "e-retouch" },
    { label: "Upscale", transformation: "e-upscale" },
    { label: "Sharpen", transformation: "e-sharpen" },
    { label: "Contrast", transformation: "e-contrast" },
    { label: "Grayscale", transformation: "e-grayscale" },
];

/**
 * Build an ImageKit delivery URL with the given transformation applied.
 * Strips any existing `?tr=` so effects don't stack unintentionally.
 */
export const applyEnhancement = (url: string, transformation: string): string => {
    const base = url.split("?")[0];
    return `${base}?tr=${transformation}`;
};
