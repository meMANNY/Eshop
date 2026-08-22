# Improvements for `org`, derived from a comparison with ZUZI

A file-by-file comparison of this monorepo against `ZUZI-ecommerce-microservices-monorepo`, a sibling project with the same architecture (Nx, three Next.js apps, Express services behind an API gateway, Prisma + MongoDB, Stripe, Kafka, Redis, ImageKit).

**Verdict: do not deploy yet.** The comparison turned up one critical payment vulnerability, one stored-XSS hole, and an authentication bug that surfaces fifteen minutes after any real user logs in. None of these are ZUZI-specific insights — they are defects in this codebase that the comparison brought to the surface. Everything below Tier 1 is an optional roadmap.

It is worth saying plainly that this is not a one-sided comparison. `org` is ahead of ZUZI on payments infrastructure, logging, error handling, CI, and code documentation. Section 6 lists what to leave alone, and what not to copy.

Every claim below cites `path:line` and was verified by reading the code.

---

## Tier 0 — fix before deploying

### 0.1 The client sets the amount it pays — CRITICAL

`apps/order-service/src/controllers/order.controller.ts:86-95`

```ts
export const createPaymentIntent = async (req, res, next) => {
  const { amount, sellerStripeAccountId, sessionId } = req.body;
  const customerAmount = Math.round(amount * 100);
  const platformFee = Math.floor(customerAmount * 0.1);
```

`amount` comes straight from the request body. It is never checked against the cart, the Redis session, or the `products` table. The route is authenticated (`routes/order.routes.ts:10`), but authentication only proves *who* is buying, not *what the price is*.

A logged-in buyer can `POST /order/api/create-payment-intent` with `amount: 0.50` and check out anything for fifty cents. `sellerStripeAccountId` is also taken from the body, so the destination of the funds is client-controlled too.

Nothing downstream catches it. The webhook (`createOrder`, same file) reads the cart back out of Redis and computes `orderTotal` from `item.sale_price` — which was also client-supplied, at `createPaymentSession:189`:

```ts
const totalAmount = cart.reduce((total, item) => total + item.quantity * item.sale_price, 0);
```

The only database query in that function fetches shop and seller Stripe IDs (`:170-179`); prices are never re-read. And `grep amount_received` across the whole order controller returns nothing, so the amount Stripe actually captured is never compared against anything. The resulting order looks completely legitimate.

**Fix.** Recompute server-side and never trust a price off the wire:

1. In `createPaymentSession`, fetch each `productId` and build line items from the database's `sale_price`. Store *that* total in the Redis session.
2. In `createPaymentIntent`, derive the amount from the stored session (looked up by `sessionId`), not from `req.body`. Drop `amount` from the request contract entirely.
3. Resolve `sellerStripeAccountId` server-side from `shopId`.
4. In the webhook, reject when `paymentIntent.amount_received < expectedTotalCents`.

ZUZI's equivalent is `buildTrustedCheckout` (`ZUZI/apps/order-service/src/utils/order/order.helpers.ts:744`). The "Trusted" prefix is a naming convention marking server-recomputed values, and it is worth adopting — it makes it visually obvious at the call site that Stripe is being charged from a number the server owns.

### 0.2 Expired sessions return HTTP 500, so token refresh never fires

`jwt.verify` throws `TokenExpiredError` when an access token expires. All four middlewares in `packages/middleware/` end with `catch (error) { return next(error) }`. `packages/error-handler/error-middleware.ts:20` then tests `err instanceof AppError` — `TokenExpiredError` is not one, so it falls through to the 500 branch at `:47`.

Meanwhile every frontend interceptor keys the refresh flow on 401 (`apps/user-ui/src/utils/axiosInstance.ts:62` and siblings). A 500 doesn't match, so **the refresh never runs**. Access tokens live 15 minutes (`auth.controller.ts:166`), so any user who idles past that gets 500s on every request until they manually log in again.

This is invisible in development because sessions rarely idle that long between reloads.

**Fix.** Map JWT errors to 401 in all four middlewares, as ZUZI does:

```ts
if (error instanceof jwt.TokenExpiredError)
  return next(new AuthError("Access token expired"));
if (error instanceof jwt.JsonWebTokenError)
  return next(new AuthError("Invalid access token"));
return next(error);
```

`AuthError` already exists at `packages/error-handler/index.ts:45` and carries 401.

### 0.3 Stored XSS — seller rich text rendered raw to every buyer

`apps/user-ui/src/shared/modules/product/product-details.tsx:482`

```tsx
<div
  className="prose prose-sm ..."
  dangerouslySetInnerHTML={{ __html: productDetails?.detailed_description }}
/>
```

`detailed_description` is authored in the seller's rich-text editor and stored verbatim — there is no sanitization on write either. `grep -rE "sanitize|DOMPurify"` across all of `apps/` and `packages/` returns nothing, and `sanitize-html` is not in `package.json`.

Any seller can inject script that executes in every shopper's browser. Cookies are `httpOnly`, which blunts direct token theft, but session-riding through the victim's own authenticated axios calls, and credential-phishing overlays served from a legitimate domain, both remain.

**Fix.** ZUZI's config at `ZUZI/apps/user-ui/src/components/products/product-description-section.tsx:85-113` is directly portable:

```ts
sanitizeHtml(description, {
  allowedTags: ["p","br","strong","em","u","s","ul","ol","li","h1","h2","h3","blockquote","a"],
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto"],          // blocks javascript:
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
  },
});
```

Sanitize on write in `createProduct`/`updateProduct` as well as on render. Render-side alone leaves the payload in the database and exposed to every other consumer of the API.

### 0.4 Hardcoded hosts make the app undeployable as-is

29 `localhost:PORT` literals across `apps/*/src`. The ones that break deployment:

| Location | Problem |
|---|---|
| `apps/api-gateway/src/main.ts:50-57` | Six `proxy("http://localhost:PORT")` calls — the gateway can only reach services on its own machine |
| `packages/utils/kafka/index.ts:6` | `brokers: ["pkc-41p56.asia-south1.gcp.confluent.cloud:9092"]` hardcoded, with no override |
| `apps/auth-service/src/controller/auth.controller.ts:636-637` | Stripe Connect `refresh_url`/`return_url` point at `http://localhost:3000/settings/payments`, so sellers finishing onboarding are sent to localhost. Two bugs: the host, and port 3000 is user-ui when this is a seller flow (should be 3001) |
| CORS origin arrays in five service `main.ts` files | Hardcoded `localhost:3000/3001/3002` |

**Fix.** ZUZI's pattern keeps the development experience identical (`ZUZI/apps/api-gateway/src/main.ts:12-21`):

```ts
const orderServiceUrl = process.env.ORDER_SERVICE_URL || "http://localhost:6004";
```

Same default, deployable. Note that `apps/kafka-service/src/main.ts` already does exactly this for `CORS_ORIGIN` — the pattern just needs to spread.

### 0.5 No Stripe webhook idempotency

`prisma/schema.prisma:216` — `sessionId String?`. It is indexed (`:226`) but **not** `@unique`, and `createOrder` has no duplicate guard.

Stripe retries failed webhooks with backoff for up to three days — the `IN_FLIGHT_TTL_SECONDS` comment at `order.controller.ts:76-84` shows this was already thought about. But a retry arriving after a *slow success* (Stripe timed out waiting; the handler finished anyway) re-runs the entire path: a second order, a second stock decrement, a second set of notifications, duplicated analytics.

**Do NOT make `orders.sessionId` `@unique`.** A cart spanning several shops creates one order *per shop*, all sharing the same `sessionId` — `order.controller.ts:391-397` creates inside `for (const shopId in shopGrouped)`. A unique index would break every multi-shop checkout after the first shop, and `prisma db push` would likely fail outright against existing multi-shop data.

It would also walk into the exact trap your own schema comment at `prisma/schema.prisma:17-29` documents: `sessionId` is `String?`, and on MongoDB a `@unique` on an optional field becomes a **non-sparse** index that reads a missing field as `null`, so the second row without one collides. That is the P2002 incident that already cost you the `images` model.

**Fix.** Use a separate row keyed on the payment, not on the order — ZUZI's `orderPayment` model (`ZUZI/prisma/schema.prisma:373-390`) with `sessionId @unique`, `paymentIntentId @unique` and `stripeEventId`. One row per checkout rather than per shop-order, so the multi-shop fan-out is unaffected. Declare those fields **required, not optional**, for the reason above.

Insert that row first inside the handler and treat a P2002 as "this is a retry, return 200". ZUZI reads before writing (`ZUZI/apps/order-service/src/controllers/order-webhook.controller.ts:59-67`):

```ts
const existingPayment = await prisma.orderPayment.findFirst({
  where: { OR: [{ sessionId }, { paymentIntentId: paymentIntent.id }] },
});
if (existingPayment) return res.status(200).json({ received: true, duplicate: true });
```

A read-then-write still races two concurrent retries, so prefer letting the unique insert be the guard and catching P2002 — the database is the only thing that can arbitrate this atomically.

Related: the stock decrement at `order.controller.ts:416` is unconditional, so stock can go negative under concurrency. ZUZI uses a conditional update inside a transaction and fails the order if nothing matched:

```ts
where: { id: item.productId, stock: { gte: item.quantity } },
...
if (stockUpdate.count === 0) throw new ValidationError(`Insufficient stock for ${item.title}`);
```

### 0.6 `getAllAdmins` returns password hashes

`apps/admin-service/src/controller/admin.controller.ts:139`

```ts
const admins = await prisma.users.findMany({ where: { role: "admin" } });
return res.status(200).json({ success: true, admins });
```

No `select`, so every field ships — including the bcrypt hash.

The same shape exists in the middleware layer: `isAuthenticated`, `isSeller`, `isAdmin` and `isAnyAuthenticated` all attach the entire Prisma row to `req.user` / `req.seller` / `req.admin`, so any handler that does `res.json(req.user)` leaks it. ZUZI applies an explicit field allowlist (`getSafeAdmin`, `ZUZI/apps/admin-service/src/utils/admin-auth.ts`) before the object is ever attached.

**Fix.** Add a `select` to `getAllAdmins`, and a shared `getSafeUser`/`getSafeSeller` projection in `packages/middleware/`.

### 0.7 No `.env.example`

`.gitignore:49-51` already whitelists `!.env.example` — the file was simply never written. Your `.env` is correctly untracked (`git ls-files | grep .env` is empty), so this is a missing convenience, not a leak. But a fresh clone or a new deploy target has to reverse-engineer `process.env` reads in order to boot.

ZUZI ships a 43-line grouped one with obviously-fake placeholders. Yours needs at least: `DATABASE_URL`, `REDIS_URL`, the four `SMTP_*`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, three `IMAGEKIT_*`, `KAFKA_API_KEY`, `KAFKA_API_SECRET`, plus `CORS_ORIGIN` and `KAFKA_HTTP_PORT` (read by `kafka-service/src/main.ts` but absent from the current `.env`), plus whatever service-URL variables 0.4 introduces.

### 0.8 Two smaller hardening items

**The rate limiter buckets IPv6 wrongly.** `apps/api-gateway/src/main.ts:41` uses `keyGenerator: (req) => req.ip`. express-rate-limit v7+ warns about this: an IPv6 client can rotate freely within its /64 and evade the limit. ZUZI imports the library's own `ipKeyGenerator`, which normalizes the prefix.

**The gateway may consume the Stripe webhook body.** `apps/order-service/src/main.ts:35-44` registers `bodyParser.raw()` before `express.json()` correctly, and the comment explaining why is good. But `api-gateway/src/main.ts:29` applies `express.json({limit:"100mb"})` unconditionally — so if your webhook URL points at the gateway rather than at order-service directly, signature verification will fail. **Verify where your webhook is actually pointed.** If it routes through the gateway, adopt ZUZI's conditional skip (`ZUZI/apps/api-gateway/src/main.ts:34-58`), which bypasses parsing for `multipart/form-data` and for the webhook path.

---

## Tier 1 — real bugs, small fixes

### 1.1 `ValidationError` cannot carry a specific message

`packages/error-handler/index.ts:38`

```ts
constructor(message: "Invalid request data", details?: any) {
```

That is a string *literal type* with no default, so the compiler forces all 92 call sites to pass exactly `"Invalid request data"` and push the real message into `details`. Every 400 the API emits has an identical top-level `message`, which is why callers have to dig into `details` to learn anything.

ZUZI's differs by one character — `message = "Invalid request data"`, a default rather than a literal type. Change it and existing call sites still compile; you can then simplify them opportunistically.

### 1.2 Two routes still chain `isAuthenticated, isSeller`

`apps/seller-service/src/routes/sellerRoutes.ts:26-31` (`update-shop-settings`) and `:33-38` (`get-shop-deletion-state`).

`isAuthenticated` reads only the `accessToken` cookie and looks the id up in `prisma.users`, so it 401s a seller before `isSeller` ever runs. This is the same trap that was fixed on `/get-stripe-account`, and which that file's own comment at `:55-56` documents for `mark-notification-as-read`. Chaining them is an AND, which a seller-only session can never satisfy.

Also audit `apps/admin-service/src/routes/adminRoutes.ts:28` (`get-user-notifications`), which has the same shape.

A structural fix worth considering: collapse the four middlewares into one factory over the cookie map that already exists in `isAnyAuthenticated.ts`:

```ts
const ACCESS_COOKIE = { user: "accessToken", seller: "seller-access-token", admin: "access_token" };
export const requireSession = (...roles: SessionRole[]) => async (req, res, next) => { ... };
```

`requireSession("seller")` replaces `isSeller`; `requireSession("user","seller","admin")` replaces `isAnyAuthenticated`. Because it takes roles as arguments, the accidental AND-chain becomes unrepresentable.

### 1.3 Sellers cannot edit a product

`apps/seller-ui/.../dashboard/all-products/page.tsx` links each row to `/dashboard/edit-product/${id}`. That route does not exist — `dashboard/` contains `all-events, all-products, create-event, create-product, discount-codes, inbox, notifications, orders, payments, settings`. The pencil icon is a 404.

There is no update endpoint in product-service either, so this is a missing feature rather than a broken link. ZUZI has both the route (`dashboard/products/[productId]/edit`) and `PATCH /api/seller/products/:id`, and its handler diffs the image list to delete ImageKit files that were removed (`ZUZI/apps/product-service/src/controllers/product.controller.ts:3330-3372`) — worth copying, given 1.7.

### 1.4 Seller order status update is silently unreliable

`apps/seller-ui/src/app/(routes)/order/[id]/page.tsx:37-52` uses `useEffect` + `useState` + raw axios rather than React Query, and updates status like this:

```ts
await axiosInstance.put(`/order/api/update-status/${order.id}`, { deliveryStatus: newStatus });
setOrder((prev) => ({ ...prev, deliveryStatus: newStatus }));
} catch (err) { console.error("failed to update the status"); }
```

Two problems. Nothing invalidates `["seller-orders"]`, so the orders table keeps showing the old status until `staleTime` elapses. And on failure the only feedback is a console line — the select stays on the new value while the server holds the old one, so the seller believes a change happened that didn't.

Fix: move to `useMutation`, `setQueryData` on the detail key, `invalidateQueries(["seller-orders"])`, and surface errors with a toast. `Toaster` is already mounted at `apps/seller-ui/src/app/layout.tsx:71`.

### 1.5 seller-ui's axios interceptor is missing three fixes user-ui already has

`apps/user-ui/src/utils/axiosInstance.ts` guards `error?.response?.status` (`:59-62`), calls the refresh with plain `axios` to avoid recursing through its own interceptor (`:80`), and rejects in the catch (`:96`).

`apps/seller-ui/src/utils/axiosInstance.ts` has none of them: `error.response.status` unguarded at `:54` (a network error with no response throws inside the interceptor), `axiosInstance.post` for the refresh at `:69`, and no `return Promise.reject(...)` in the catch — so on refresh failure the promise resolves with `undefined` and callers crash on `res.data`.

`apps/admin-ui/src/utils/axiosInstance.ts` is fine — it already has all three. This is a same-repo port from user-ui to seller-ui; no ZUZI needed.

One idea worth taking from ZUZI: a `publicRoutes` allowlist (`ZUZI/apps/seller-ui/src/lib/axios.ts`) so signup and OTP endpoints returning 401 don't trigger refresh-then-logout.

### 1.6 The review count displays the average rating

`apps/user-ui/src/shared/modules/product/product-details.tsx:208` renders `({productDetails?.ratings} Reviews)` — that's the average, so a 4.5-star product advertises "4.5 Reviews". Blocked on 2.2 for a real count.

### 1.7 The deletion cron orphans every ImageKit file

`apps/product-service/src/jobs/product-crone.job.ts` runs a bare `prisma.products.deleteMany(...)`. Images are never deleted from ImageKit, and because `images` is a separate collection with no `onDelete: Cascade`, the rows are orphaned too. Every soft-deleted product leaks its assets permanently.

ZUZI deletes the files first with `Promise.allSettled` and **skips the database delete if any file delete failed**, so it retries next hour instead of losing the reference (`ZUZI/apps/product-service/src/jobs/cleanupDeletedProducts.job.ts`). Both projects run the same hourly `cron.schedule("0 * * * *")`.

---

## Tier 2 — high value, moderate effort

### 2.1 The Prisma schema has one index

`prisma/schema.prisma` declares **1** `@@index` (`orders.sessionId`) and **2** enums across 395 lines. ZUZI declares 48 and 11. On MongoDB, `@@index` is what `prisma db push` materializes into an actual index — without it, every query is a collection scan.

This is the highest value-to-effort item in the document: roughly fifteen lines.

| Model | Missing index | Query it serves |
|---|---|---|
| `orders` | `[userId]`, `[userId, createdAt]`, `[shopId]` | `getUserOrders`, `getSellerOrders` |
| `orderItems` | `[orderId]`, `[productId]` | every order detail fetch |
| `message` | `[conversationId, createdAt]` | chat pagination — the hottest query you have |
| `participant` | `[conversationId]`, `[userId]`, `[sellerId]` | conversation lookup |
| `notifications` | `[receiverId]`, `[isRead]` | every notification list and unread badge |
| `images` | `[productId]`, `[userId]`, `[shopId]` | all three are lookup keys |
| `address` | `[userId]` | checkout address list |
| `shopReviews` | `[shopId]`, `[userId]` | shop profile |

**A related modelling bug.** `prisma/schema.prisma:220-221`:

```prisma
status         String @default("shipped")
deliveryStatus String @default("Ordered")
```

Every new order is born with `status: "shipped"`. Two overlapping status fields, both untyped, and the default on one of them is wrong. ZUZI keeps fulfilment and payment orthogonal with `OrderStatus` and `PaymentStatus` enums. Other stringly-typed fields worth promoting: `message.senderType`, `message.status`, `users.role`, `discount_codes.discountType`.

**Where you are ahead, and should stay ahead:** `org` declares 16 `@relation`s to ZUZI's 3. ZUZI deliberately uses bare ObjectIds with indexes instead, which is the microservice-orthodox choice. Keep your relations *and* add the indexes — and consider `onDelete: Cascade` on `images`, which would fix half of 1.7 at the schema level. Neither project declares a single cascade today, but you are the one with the relations to hang it on.

### 2.2 Product reviews — the largest missing feature

Right now `shopReviews` (`prisma/schema.prisma:78-87`) holds only a `rating` float — no comment, no title, no status, no link to an order. It is read in exactly one place (`auth.controller.ts:849-885`) and **written nowhere**. There is no create-review endpoint in any service. That means `products.ratings` and `shops.ratings` are permanently static, and `product-details.tsx:489-503` renders a hardcoded string:

> "No reviews yet. Be the first to review this product."

ZUZI's system is worth studying before building your own, mainly for how it prevents fake reviews. Five independent layers:

1. **Capability token** — `ZUZI/packages/libs/review-token/index.ts`. The emailed link carries `publicId.secret` (18 and 32 random bytes, base64url). Only `sha256(token)` is stored. Lookup is by the indexed `publicId`, then the full token is verified against the hash. A database leak yields no usable review links, and verification is still a single indexed read.
2. **`productReview.orderItemId @unique`** — one review per purchased line item, enforced by the database rather than by a check that can race.
3. **`reviewRequest.orderItemId @unique`** — one request per line item.
4. **Re-validation at submit time** — the order must *still* be Delivered and Paid, the product must still exist, and no review may already exist.
5. **Requests are only created on the Delivered transition**, gated by `isDeliveredPaidOrder(order)`.

Ratings are then recomputed from scratch (not incremented) after every create, update, delete, hide and publish, via `recalculateProductRating` / `recalculateShopRating`.

The `publicId.secret` + stored-hash pattern generalizes well — it is the right shape for password reset, unsubscribe, and guest order-tracking links too.

Surface area to plan for: public review list and summary, eligibility check, tokenized submit, my-reviews with edit and delete, seller reply and report, admin moderation. In the UI that is a `reviews/submit/[code]` page, a review section on the product page, a profile tab, and a seller `dashboard/reviews`.

Input hygiene worth copying verbatim (`ZUZI/apps/product-service/src/utils/review.helpers.ts:93-143`): strip tags, strip control characters, collapse whitespace, enforce 120/2000 character limits, require an integer rating 1–5.

### 2.3 No service or hook layer on the frontend

`apps/user-ui/src/services` does not exist, and `hooks/` holds four files. React Query is called inline in roughly thirty page components, each with its own `queryFn` and a bare string-literal key.

Because keys carry no parameters (`["seller-orders"]` regardless of page or filter), paginated and filtered views cannot cache independently, and invalidation depends on every call site spelling the same string.

ZUZI layers it as `services/*.api.ts` → `hooks/use*.ts` → pages, with exported key factories (`sellerOrdersQueryKey(params)`, `reviewQueryKeys.*`) as `as const` tuples. Two cheap wins alongside that: `placeholderData: (prev) => prev` on paginated queries so page changes don't flash empty, and shared `isAuthError`/`getErrorMessage` helpers so error states can distinguish "log in again" from "the server broke".

Start with orders — that is where 1.4 already bit.

### 2.4 Duplicated domain logic that belongs in shared libraries

**Pricing.** `ZUZI/packages/libs/product-pricing/index.ts` is one pure, `now`-injectable module exporting `getProductEventStatus`, `getProductEffectivePricing` and `validateEventSalePrice`. The important part is that *both* the product read path and the checkout path import it, so the price shown on the page and the price charged by Stripe come from the same function. It also refuses an event price higher than the normal sale price, rather than silently charging it.

Here, price computation is spread across at least seven backend call sites (`order.controller.ts:190,371,382,884`, `product.controller.ts:488,584,664`) plus a client-side `windowState()` in `admin-ui/src/app/dashboard/events/page.tsx:76`. The repeated bug-fix comments about `starting_date`/`ending_date` Mongo filters in `admin.controller.ts:19-26,80-87` and `product.controller.ts:488-489` are what duplication looks like once it starts costing money. Extracting this also gives 0.1 an obvious home.

While you are in there: ZUZI carries integer cents (`unitAmountCents`, `totalCents`) through checkout and converts only at the boundary. `org` multiplies floats directly, which drifts on order totals.

**Order status.** The five-status array is redeclared in three files with no `Cancelled` or `Refunded` handling, and `updateDeliveryStatus` (`order.controller.ts:781-850`) validates only membership — so `Ordered → Delivered` and `Delivered → Packed` are both accepted. ZUZI enforces a transition map (`getAllowedNextStatuses`) and appends to a `statusHistory` audit trail.

Keep your `DELIVERY_NOTICE` table, though. Pairing each status with its buyer-facing copy, so a new state cannot be added without deciding what it announces, is a genuinely nice pattern that ZUZI lacks. Just add the transition map beside it.

### 2.5 No path aliases

`tsconfig.base.json` has no `paths` block, so every backend file reaches shared code by relative path:

```ts
import prisma from "../../../../packages/libs/primsa";
```

That is also how the `primsa` typo spread to 20+ import strings. ZUZI declares `@libs/*`, `@middleware/*`, `@error-handler` and friends. Everything else in the two base configs is byte-identical, so adding the block is low-risk — and it is the natural moment to fix the typo, since you are touching every import anyway.

### 2.6 No shared query-parameter or pagination helpers

Most list endpoints (`getUserOrders`, `getSellerOrders`, `getAdminOrders`, `sellerNotifications`) return unbounded arrays, and page/limit parsing is re-derived per controller.

Worth noting: **ZUZI's backend has no zod either** — its zod usage is three frontend schema files. So the realistic recommendation is not "adopt zod", it is "adopt named validator helpers". `ZUZI/apps/admin-service/src/utils/admin-query.ts` is the piece to port: `isObjectIdLike`, `getQueryString` (array-safe), `getPositiveNumber`, `getDateQuery`, `getAllowedFilter`, `getListParams` (limit capped at 50), and `getPagination(total, page, limit)` returning `hasNextPage`/`hasPreviousPage`.

If you do want zod later, fix 1.1 first — then `catch (e) { if (e instanceof ZodError) throw new ValidationError(e.message, e.flatten()) }` slots straight in, since `details` is already surfaced by the error middleware.

---

## Tier 3 — larger projects, judgement calls

**Commission ledger.** You already charge a 10% `application_fee_amount` (`order.controller.ts:88`) but record it nowhere, so neither you nor your sellers can answer "what did I earn last month". ZUZI's `platformCommission` writes a row per shop-order inside the order transaction and recognizes revenue on *delivery* rather than on charge. Add the ledger; leave your Connect flow alone (see section 6).

**Server-side cart.** Your cart is localStorage-only; the server first sees it at checkout — which is part of why 0.1 is possible. ZUZI persists it with a guest-to-login merge endpoint. Doing this properly also fixes the variant bug below.

**Cart store upgrades.** `apps/user-ui/src/store/index.tsx` matches cart lines on `id` alone, so the same product in two sizes collapses into one line. ZUZI keys on `getCartItemKey(productId, selectedOptions)`. Also worth taking: `partialize` plus an `onRehydrateStorage` hydration flag (avoids the first-paint flash), and moving coupon state into the store — it currently lives in `useState` in `cart/page.tsx:30-37` and is lost on navigation.

**Chat over socket.io.** `apps/user-ui/src/context/web-socket-context.tsx` is a raw browser `WebSocket` that understands exactly one message type (`UNSEEN_COUNT_UPDATE`) and never reconnects. ZUZI's socket.io provider handles typing indicators, presence, delivery acks, seen receipts, and optimistic-send reconciliation via `clientMessageId`. Largest effort here, and the least urgent — your chat works, it is just thin.

**Notifications.** Take the `dedupeKey` idea (a unique key makes webhook-retry duplicates impossible generically) and a `recipientType` enum to replace the `receiverId: "admin"` magic string that `seller.controller.ts:515-522` has to special-case. Add unread-count, pagination, mark-all-read and delete endpoints. **Do not** extract a separate notification microservice — `seller-service` is already the natural home, and a thirteenth app buys you a Kafka hop and another port.

**`shopDailyAnalytics`.** You have lifetime totals but no time series, so "visits this week" is currently unbuildable. ZUZI's daily rollup is a single upsert on `@@unique([shopId, date])`. Cheap. Your country/city/device histograms and `uniqueShopVisitors` have no ZUZI equivalent — keep them.

**Kafka resilience.** `consumeKafkaMessages().catch(() => process.exit(1))` kills the service on one fatal error. ZUZI reconnects with exponential backoff (5s→60s), drains the queue on SIGTERM, and exposes `getKafkaConfigStatus()` for diagnostics. Also: no `org` service handles SIGTERM, so containers get SIGKILLed on every deploy.

**README.** Yours is the unmodified 4.7 KB Nx template ("✨ Your new, shiny Nx workspace is ready ✨") and documents none of your thirteen services or their ports. ZUZI's is 49 KB with a Mermaid architecture diagram, per-service reference and an environment-variable table. For a project this size that is the difference between onboarding and archaeology.

**The ten `-e2e` projects are dead weight.** Every spec is untouched Nx scaffolding asserting `{ message: 'Hello API' }` against `port ?? 3000`, which is no service's port. They are excluded from jest in `nx.json`, two are gitignored outright, and all ten are still referenced by `tsconfig.json` — so `nx typecheck` builds ten dead project references. Delete them or make them real; ZUZI deleted theirs.

---

## What `org` already does better — leave these alone

The comparison was not one-directional. These are places where copying ZUZI would be a downgrade:

- **Stripe Connect.** `createPIWithFallback` (`order.controller.ts:29-68`) inspects the connected account's live `transfers` capability and chooses a destination charge or a direct charge accordingly, and `getStripeAccount` surfaces real balances and payouts. ZUZI has no `transfer_data`, no `application_fee_amount`, no `on_behalf_of` — money never actually reaches its sellers. Your payments *plumbing* is well ahead; it is only the amount validation (0.1) that needs fixing.
- **Logging.** `logAsync` → Kafka `logs` topic → logger-service → WebSocket fan-out is a working pipeline. ZUZI's logger-service is an empty scaffold that returns a greeting.
- **`error-middleware.ts`.** Splits expected errors to `warning` and unhandled ones to `error` so real 500s aren't buried, logs only method/path/message because bodies carry passwords and OTPs, and returns one consistent response shape. ZUZI's is 24 lines of `console.log` with two different response shapes and a typo in the user-facing string.
- **`packages/libs/imagekit`.** Typed `uploadFile`/`deleteFile`/`deleteFiles`/`buildUrl`. ZUZI's is a six-line client.
- **`seller-service` as its own app.** A clean boundary; ZUZI scatters seller concerns across a 4,261-line product controller and auth-service.
- **`shop_settings`.** Per-shop `lowStockThreshold` and notification channel preferences, with the low-stock alert edge-triggered in the order path (`order.controller.ts:436`). ZUZI has no notification preferences and no low-stock alerting at all.
- **Three-cookie auth.** ZUZI uses a single `access_token`, which is structurally simpler but means a user and a seller cannot be signed in in the same browser. Your three namespaces buy that deliberately, and `isAnyAuthenticated.ts` documents the reasoning. Fix the chaining bug (1.2); keep the design.
- **Role re-read from the database** in `isAdmin`/`isAnyAuthenticated` rather than trusting the JWT claim, so revoking admin takes effect on the next request rather than at token expiry. ZUZI's shared middleware re-checks nothing.
- **`Cache-Control: no-store`** on per-account list endpoints (`seller.controller.ts:483-490`), defending against Express's ETag → 304 → cross-account cache leak. ZUZI has the same exposure and no defence.
- **`authorizeRoles`**, `shopFollowers`, `productSimilarity` with a per-neighbour `reason`, 28-day shop restore, `uniqueShopVisitors`, the address book with `addressType` labels, site-config management, and `AI.enhancements.ts` — none have ZUZI equivalents.
- **CI.** Yours runs `prisma generate` before typecheck (with a comment explaining why) and files a deduplicated GitHub issue when `master` breaks. ZUZI's CI has no `prisma generate` step at all, and with 39 files importing the generated client it is likely broken on a clean checkout.
- **A real `prisma db seed`.** ZUZI has none.
- **The comments.** The explanatory "why this fix exists" notes throughout this codebase — the P2002 non-sparse-index incident in the schema, the EADDRINUSE collision in logger-service, the Stripe raw-body ordering — are the single clearest quality advantage over ZUZI, which is almost comment-free.

**Do not copy from ZUZI:** its `error-middleware.ts`, its `imageKit` lib, its inverted `NODE_ENV` check in the Prisma lib, its CI, its dual-shaped legacy `notifications` model (a `receiverId`/`recipientId` compatibility layer written twice on every create), or its single-cookie auth model.

---

## Suggested sequencing

**Before you deploy**

1. Server-side price recomputation and amount validation — 0.1
2. JWT errors → 401 — 0.2
3. Sanitize `detailed_description` on write and on render — 0.3
4. Environment-configure service URLs, Kafka broker, Stripe return URLs — 0.4
5. An `orderPayment` row with `sessionId @unique` as the webhook guard — 0.5 (**not** `@unique` on `orders.sessionId`; see the warning there)
6. `select` on `getAllAdmins`; stop attaching password hashes to `req.*` — 0.6
7. Write `.env.example` — 0.7
8. Confirm where the Stripe webhook points; fix the rate-limit key generator — 0.8
9. Add the ~15 `@@index` lines and run `prisma db push` — 2.1

**Then, first week after**

10. Un-chain the two seller routes — 1.2
11. Port the axios fixes to seller-ui — 1.5
12. Fix the seller order status mutation — 1.4
13. Fix `ValidationError` — 1.1
14. ImageKit cleanup in the deletion cron — 1.7
15. Product edit route and endpoint — 1.3

**Then, as product work**

16. Product reviews end to end — 2.2
17. `services/` + `hooks/` layer with key factories, starting with orders — 2.3
18. Extract `product-pricing` and a shared order-status module — 2.4
19. Path aliases and the `primsa` rename — 2.5
20. Query and pagination helpers — 2.6

Tier 3 after that, in whatever order the product demands.

Items 1–9 are the ones that matter for shipping. Everything below is real, but none of it will hurt you in production.
