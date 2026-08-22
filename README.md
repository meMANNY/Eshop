# Eshop — E-Commerce Microservices Monorepo

A full-stack, multi-vendor e-commerce platform built on a microservices architecture and managed as an **Nx monorepo**. Eshop connects **buyers**, **sellers**, and **platform administrators** through ten independently runnable backend services and three dedicated Next.js frontend applications.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Services Reference](#services-reference)
  - [API Gateway](#api-gateway-port-8080)
  - [Auth Service](#auth-service-port-6001)
  - [Product Service](#product-service-port-6002)
  - [Order Service](#order-service-port-6004)
  - [Admin Service](#admin-service-port-6005)
  - [Recommendation Service](#recommendation-service-port-6006)
  - [Logger Service](#logger-service-port-6007)
  - [Chatting Service](#chatting-service-port-6008)
  - [Seller Service](#seller-service-port-6009)
  - [Kafka Service](#kafka-service-port-6010)
- [Frontend Applications](#frontend-applications)
  - [User UI (Storefront)](#user-ui-port-3000)
  - [Seller UI (Dashboard)](#seller-ui-port-3001)
  - [Admin UI (Panel)](#admin-ui-port-3002)
- [Shared Packages](#shared-packages)
- [Data Models](#data-models)
- [Key Features](#key-features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Database Setup](#database-setup)
  - [Running the Project](#running-the-project)
- [API Reference](#api-reference)
- [Environment Variables Reference](#environment-variables-reference)
- [CI/CD](#cicd)
- [Architecture Decisions](#architecture-decisions)
- [Known Gaps and Roadmap](#known-gaps-and-roadmap)

---

## Architecture Overview

Eshop is an Nx monorepo containing three Next.js frontends, an Express API Gateway, nine backend microservices, shared packages for cross-service infrastructure, and external systems for payments, media, email, caching, and event streaming.

All frontend HTTP traffic enters through the API Gateway. Two services additionally expose raw WebSocket endpoints that clients connect to directly: chatting-service for messaging, and logger-service for the live log console in the admin panel.

```mermaid
flowchart LR
  subgraph FrontendApps[Frontend Apps]
    UserUI[User UI<br/>Next.js :3000]
    SellerUI[Seller UI<br/>Next.js :3001]
    AdminUI[Admin UI<br/>Next.js :3002]
  end

  Gateway[API Gateway<br/>Express :8080]

  subgraph BackendServices[Backend Microservices]
    Auth[Auth Service<br/>:6001]
    Product[Product Service<br/>:6002]
    Order[Order Service<br/>:6004]
    Admin[Admin Service<br/>:6005]
    Recommend[Recommendation Service<br/>:6006]
    Logger[Logger Service<br/>:6007 + WebSocket]
    Chat[Chatting Service<br/>:6008 + WebSocket]
    Seller[Seller Service<br/>:6009]
    Analytics[Kafka Service<br/>:6010 consumer + /track]
  end

  subgraph SharedPackages[Shared Packages]
    PrismaClient[packages/libs/primsa<br/>Prisma client]
    Middleware[packages/middleware<br/>role auth]
    KafkaClient[packages/utils/kafka<br/>KafkaJS client]
    RedisClient[packages/libs/redis<br/>Redis client]
    ImageKitClient[packages/libs/imagekit<br/>typed ImageKit wrapper]
    LogUtil[packages/utils/logs<br/>logAsync]
    Sanitize[packages/utils/sanitize<br/>rich-text allowlist]
    CorsUtil[packages/utils/cors<br/>shared origin list]
    ErrorHandler[packages/error-handler<br/>typed errors]
    SharedComponents[packages/components<br/>shared form UI]
  end

  subgraph DataStores[Persistence and Cache]
    Mongo[(MongoDB<br/>via Prisma)]
    Redis[(Redis)]
  end

  subgraph Messaging[Event Streaming]
    Kafka[(Kafka)]
    UserEvents[user-events]
    ChatTopic[chat.new_message]
    LogsTopic[logs]
  end

  subgraph ExternalSystems[External Systems]
    Stripe[Stripe<br/>Connect, PaymentIntents, webhooks]
    ImageKit[ImageKit<br/>media storage]
    SMTP[SMTP Email]
  end

  UserUI -->|HTTP API| Gateway
  SellerUI -->|HTTP API| Gateway
  AdminUI -->|HTTP API| Gateway
  UserUI -.->|WebSocket unread counts| Chat
  SellerUI -.->|WebSocket unread counts| Chat
  AdminUI -.->|WebSocket log stream| Logger
  UserUI -.->|POST /track analytics| Analytics
  SellerUI -.->|shared form components| SharedComponents

  Gateway -->|/product/*| Product
  Gateway -->|/order/*| Order
  Gateway -->|/admin/*| Admin
  Gateway -->|/chatting/*| Chat
  Gateway -->|/seller/*| Seller
  Gateway -->|/recommendation/*| Recommend
  Gateway -->|fallback / -> auth| Auth

  Auth --> PrismaClient
  Product --> PrismaClient
  Order --> PrismaClient
  Admin --> PrismaClient
  Chat --> PrismaClient
  Seller --> PrismaClient
  Recommend --> PrismaClient
  Analytics --> PrismaClient
  PrismaClient --> Mongo

  Auth -.-> Middleware
  Product -.-> Middleware
  Order -.-> Middleware
  Seller -.-> Middleware
  Admin -.-> Middleware

  Order --> RedisClient
  Chat --> RedisClient
  RedisClient --> Redis

  UserUI -->|Stripe.js| Stripe
  Auth -->|seller Connect onboarding| Stripe
  Order -->|PaymentIntents + webhook| Stripe
  Seller -->|balances and payouts| Stripe

  Product --> ImageKitClient
  Admin --> ImageKitClient
  ImageKitClient --> ImageKit

  Auth -->|OTP and reset emails| SMTP
  Order -->|order confirmation| SMTP

  Product -.-> Sanitize
  UserUI -.-> Sanitize
  Order -.-> ErrorHandler
  Product -.-> ErrorHandler
  Auth -.-> ErrorHandler
  Seller -.-> ErrorHandler

  KafkaClient --> Kafka
  Kafka --> UserEvents
  Kafka --> ChatTopic
  Kafka --> LogsTopic
  UserEvents --> Analytics
  ChatTopic --> Chat
  LogsTopic --> Logger
  LogUtil --> LogsTopic
  Analytics -->|user, product, shop analytics| Mongo
  Recommend -->|reads productSimilarity index| Mongo
```

### Event and Data Flow

```mermaid
flowchart LR
  Actions[User UI actions<br/>views, cart, wishlist, shop visits] -->|POST /track| KafkaSvc[Kafka Service :6010]
  KafkaSvc -->|produce user-events| Topic[Kafka user-events]
  Topic --> KafkaSvc
  KafkaSvc -->|userAnalytics, productAnalytics,<br/>shopAnalytics, uniqueShopVisitors| Mongo[(MongoDB)]

  IndexJob[buildIndex job<br/>offline] -->|co-occurrence + cosine similarity| Mongo
  RecReq[GET /recommendation/api/get-related-products] --> RecSvc[Recommendation Service]
  RecSvc -->|reads precomputed productSimilarity| Mongo

  Checkout[Checkout] -->|create-payment-session| OrderSvc[Order Service]
  OrderSvc -->|trusted cart priced from DB| Redis[(Redis session)]
  OrderSvc -->|PaymentIntent| Stripe[Stripe]
  Stripe -->|webhook payment_intent.succeeded| OrderSvc
  OrderSvc -->|orderPayment guard, orders,<br/>stock, notifications| Mongo

  AnyService[Any service] -->|logAsync| LogsTopic[Kafka logs]
  LogsTopic --> LoggerSvc[Logger Service]
  LoggerSvc -->|WebSocket fan-out| AdminConsole[Admin log console]

  ChatClients[User / Seller chat] <-->|REST + WebSocket| ChatSvc[Chatting Service]
  ChatSvc -->|chat.new_message| ChatTopic[Kafka chat.new_message]
  ChatTopic -->|batched, backpressure-aware consumer| ChatSvc
  ChatSvc -->|messages, conversations| Mongo
```

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| **Monorepo Tooling** | Nx | 22.7 |
| **Backend Runtime** | Node.js | 20 LTS |
| **Backend Framework** | Express.js | 4.21 |
| **Frontend Framework** | Next.js (React 19) | ~16.1 |
| **Language** | TypeScript | ~5.9 |
| **Database** | MongoDB (via Prisma ORM) | Prisma 6.19 |
| **Cache / Sessions** | Redis | ioredis 5.11 |
| **Message Broker** | Apache Kafka | KafkaJS 2.2 |
| **Real-time** | Raw WebSocket (`ws`) | 8.21 |
| **Authentication** | JWT + bcryptjs | jsonwebtoken 9.x |
| **Payments** | Stripe (Connect) | 22.3 |
| **Image Storage** | ImageKit | @imagekit/nodejs 7.10 |
| **Email** | Nodemailer + EJS templates | 9.x |
| **HTML Sanitization** | sanitize-html | 2.17 |
| **Client State** | Zustand + Jotai | 5.x / 2.x |
| **Server State** | TanStack Query | 5.101 |
| **Tables** | TanStack Table | 8.21 |
| **Styling** | Tailwind CSS | 3.4 |
| **Charts** | ApexCharts, Recharts, d3-geo | — |
| **Animation** | Framer Motion | 13.x |
| **Forms** | react-hook-form | 7.83 |
| **Rich Text** | react-quill-new | 3.8 |
| **Scheduling** | node-cron | 4.6 |
| **Rate Limiting** | express-rate-limit | 8.5 |
| **Testing** | Jest | 30.x |
| **CI** | GitHub Actions | — |

---

## Project Structure

```
org/
├── apps/
│   ├── api-gateway/            # Entry-point reverse proxy (:8080)
│   ├── auth-service/           # Auth for all three roles (:6001)
│   ├── product-service/        # Catalogue, shops, events (:6002)
│   ├── order-service/          # Checkout, orders, Stripe (:6004)
│   ├── admin-service/          # Platform admin API (:6005)
│   ├── recommendation-service/ # Related products (:6006)
│   ├── logger-service/         # Kafka -> WebSocket log stream (:6007)
│   ├── chatting-service/       # Chat REST + WebSocket (:6008)
│   ├── seller-service/         # Shop settings, follows, payouts (:6009)
│   ├── kafka-service/          # Analytics consumer + /track (:6010)
│   ├── user-ui/                # Next.js storefront (:3000)
│   ├── seller-ui/              # Next.js seller dashboard (:3001)
│   ├── admin-ui/               # Next.js admin panel (:3002)
│   └── *-e2e/                  # Nx e2e scaffolds (see Known Gaps)
│
├── packages/
│   ├── components/             # Shared React form components
│   │   ├── color-selector/
│   │   ├── custom-properties/
│   │   ├── custom-specifications/
│   │   ├── input/
│   │   ├── rich-text-editor/
│   │   └── size-selector/
│   ├── error-handler/          # Typed errors + Kafka-logging middleware
│   ├── libs/
│   │   ├── imagekit/           # Typed ImageKit wrapper
│   │   ├── primsa/             # Shared Prisma client (note: misspelled)
│   │   └── redis/              # Shared ioredis client
│   ├── middleware/             # Role auth: user / seller / admin
│   └── utils/
│       ├── cors/               # Shared CORS origin allowlist
│       ├── kafka/              # KafkaJS client + producer
│       ├── logs/               # logAsync fire-and-forget logger
│       └── sanitize/           # Rich-text HTML allowlist
│
├── prisma/
│   ├── schema.prisma           # Shared MongoDB schema
│   └── seed.ts                 # Database seeder
│
├── .env.example                # Backend environment template
├── .github/workflows/ci.yml    # GitHub Actions pipeline
├── improvements.md             # Prioritised technical roadmap
├── nx.json
├── package.json
└── tsconfig.base.json
```

---

## Services Reference

### API Gateway (port 8080)

The single HTTP entry point for all three frontends. Applies cross-cutting concerns once, then proxies downstream.

**Responsibilities:**
- Reverse proxying to every backend service
- Rate limiting: **100 req/15 min** unauthenticated, **1000 req/15 min** authenticated
- CORS via the shared allowlist (`CORS_ORIGIN`, defaulting to `localhost:3000/3001/3002`)
- Cookie parsing and JSON/urlencoded body parsing — **skipped for the Stripe webhook path**, so the raw bytes Stripe signed reach order-service intact
- Site configuration initialization on startup

**Proxy Routes:**

| Prefix | Downstream Service | Port | Env override |
|---|---|---|---|
| `/product` | Product Service | 6002 | `PRODUCT_SERVICE_URL` |
| `/order` | Order Service | 6004 | `ORDER_SERVICE_URL` |
| `/admin` | Admin Service | 6005 | `ADMIN_SERVICE_URL` |
| `/recommendation` | Recommendation Service | 6006 | `RECOMMENDATION_SERVICE_URL` |
| `/chatting` | Chatting Service | 6008 | `CHAT_SERVICE_URL` |
| `/seller` | Seller Service | 6009 | `SELLER_SERVICE_URL` |
| `/` (fallback) | Auth Service | 6001 | `AUTH_SERVICE_URL` |

Health check: `GET /gateway-health`

---

### Auth Service (port 6001)

Authentication and profile management for all three roles. Each role has its own cookie namespace, so a user, a seller, and an admin session can coexist in one browser.

| Role | Access cookie | Refresh cookie |
|---|---|---|
| User | `accessToken` | `refreshToken` |
| Seller | `seller-access-token` | `seller-refresh-token` |
| Admin | `access_token` | `refresh_token` |

**User flow:**
- `POST /api/user-registration` — register, sends OTP email
- `POST /api/verify-user` — verify OTP and activate
- `POST /api/login-user` — issues access + refresh cookies
- `POST /api/forgot-password-user` → `POST /api/verify-forgot-password-otp` → `POST /api/reset-password-user`
- `GET /api/logged-in-user` — current session
- `POST /api/change-password`

**Seller flow:**
- `POST /api/seller-registration` → `POST /api/verify-seller`
- `POST /api/create-shop` — create the shop record
- `POST /api/create-stripe-link` — Stripe Connect onboarding link
- `POST /api/login-seller`, `GET /api/logged-in-seller`
- `PUT /api/update-seller-profile`
- `GET /api/get-shop-reviews`

**Admin flow:**
- `POST /api/login-admin`, `GET /api/logged-in-admin`

**Shipping addresses:**
- `GET /api/shipping-addresses`, `POST /api/add-address`, `DELETE /api/delete-address/:addressId`

**Shared:**
- `POST /api/refresh-token` — rotates the access cookie back into whichever namespace the session came from
- `POST /api/logout` — deliberately unauthenticated, clears cookies for the declared role

---

### Product Service (port 6002)

The catalogue: products, shops, flash-sale events, and discount codes. Runs an hourly cron that permanently deletes products whose 24-hour soft-delete window has expired.

**Public:**
- `GET /api/get-all-products`, `GET /api/get-product/:slug`
- `GET /api/get-filtered-products` — category, price, rating, brand, stock filters
- `GET /api/get-filtered-offers`, `GET /api/get-all-events`
- `GET /api/get-filtered-shops`, `GET /api/top-shops`
- `GET /api/search-products`
- `GET /api/get-categories`

**Seller (authenticated):**
- `POST /api/create-product` — rich-text description is sanitized on write
- `GET /api/get-shop-products`
- `DELETE /api/delete-product/:productId` — soft delete with a 24-hour window
- `PUT /api/restore-product/:productId`
- `POST /api/upload-product-image`, `DELETE /api/delete-product-image`
- `POST /api/create-discount-code`, `GET /api/get-discount-codes`, `DELETE /api/delete-discount-code/:id`

---

### Order Service (port 6004)

Checkout, Stripe payments, and order lifecycle. This is the only service with a raw-body route, registered before `express.json()` so Stripe signature verification works.

**Checkout (authenticated):**
- `POST /api/create-payment-session` — prices the cart **from the database**, resolves each item's shop, validates the coupon server-side, and stores the trusted totals in a Redis session
- `POST /api/create-payment-intent` — takes only `sessionId`; the amount and destination account are read from the stored session, never from the request
- `GET /api/verifying-payment-session`
- `GET /api/get-order-by-session/:sessionId`

**Stripe webhook:**
- `POST /api/create-order` — handles `payment_intent.succeeded`. Writes a unique `orderPayment` row first as an idempotency guard, rejects underpayment against the trusted total, then creates one order per shop, decrements stock, and fans out notifications.

**Orders:**
- `GET /api/get-user-orders`, `GET /api/get-order-details/:orderId`
- `GET /api/get-seller-orders`, `GET /api/get-seller-order-details/:orderId`
- `PUT /api/update-status/:orderId` — seller advances delivery status
- `GET /api/get-admin-orders`
- `POST /api/verify-coupon`

**Stripe Connect:** `createPIWithFallback` inspects the connected account's live `transfers` capability and chooses a **destination charge** on the platform account (with `application_fee_amount` and `on_behalf_of`) when transfers are active, falling back to a **direct charge** on the connected account otherwise. The response reports which, so the client loads Stripe.js in the matching context.

---

### Admin Service (port 6005)

Platform oversight and site configuration. Admins are `users` rows with `role: "admin"`.

- `GET /api/get-all-users`, `GET /api/get-all-sellers`
- `GET /api/get-all-products`, `GET /api/get-all-events`
- `GET /api/get-all-admins`, `PUT /api/add-new-admin`
- `GET /api/get-all-notifications`, `GET /api/get-user-notifications`
- `GET /api/get-site-config`, `GET /api/get-all` (public site config)
- `PUT /api/update-categories`
- `POST /api/upload-logo`, `POST /api/upload-banner`

---

### Recommendation Service (port 6006)

Serves related and recommended products from a **precomputed similarity index** rather than training a model at request time.

- `GET /api/get-recommendation-products` — personalised suggestions
- `GET /api/get-related-products/:productId` — neighbours from the index
- `POST /api/rebuild-index` — trigger a rebuild

**How the index is built:** an offline job (`src/jobs/buildIndex.ts`, also runnable via `npm run build-recommendations`) computes product-to-product neighbours from two signals — **co-occurrence** in past orders ("bought together") and **cosine similarity** over product metadata ("similar item") — and writes them to the `productSimilarity` collection with a `reason` recorded per neighbour, so the UI can explain why something is being suggested.

---

### Logger Service (port 6007)

A working centralised log pipeline, not a stub. Consumes the Kafka `logs` topic and fans each entry out over WebSocket to any connected admin console.

Any service logs into it with one call:

```ts
import { logAsync, setLogSource } from "packages/utils/logs/send-logs";

setLogSource("order-service");           // once, at boot
logAsync({ type: "info", message: "…" }); // never throws, never awaited
```

`errorMiddleware` calls it automatically for every failure, so a new route gets error reporting without the author remembering to add it.

---

### Chatting Service (port 6008)

Buyer-seller messaging over REST plus a raw WebSocket connection.

**HTTP (authenticated):**
- `POST /api/create-user-conversationGroup`
- `GET /api/get-user-conversations`, `GET /api/get-seller-conversations`
- `GET /api/get-user-messages/:conversationId`, `GET /api/get-seller-messages/:conversationId`

**WebSocket:** clients send a plain-text handshake (`user_<id>` / `seller_<id>`) on open and receive `UNSEEN_COUNT_UPDATE` events.

**Persistence:** messages are produced to the Kafka `chat.new_message` topic and written by a batching consumer that **pauses and resumes the topic under load** and commits offsets manually with retry backoff, so a slow database cannot drop messages.

---

### Seller Service (port 6009)

Everything a seller owns that is not the catalogue or an order.

- `GET /api/get-shop-settings`, `PUT /api/update-shop-settings` — low-stock threshold and notification channels
- `DELETE /api/delete-shop`, `GET /api/get-shop-deletion-state`, `PUT /api/restore-shop` — soft delete with a **28-day restore window**
- `GET /api/get-stripe-account` — live balances, `payouts_enabled`, `charges_enabled`, recent payouts
- `GET /api/get-seller/:id`, `GET /api/get-seller-products/:shopId`, `GET /api/get-seller-events/:shopId`
- `POST /api/follow-shop`, `POST /api/unfollow-shop`, `GET /api/is-following/:shopId`
- `GET /api/seller-notifications`, `POST /api/mark-notification-as-read`

Per-account list endpoints send `Cache-Control: no-store` to defend against Express's ETag → 304 path serving one account's data to another.

---

### Kafka Service (port 6010)

Both an HTTP ingest endpoint and an analytics consumer.

- `POST /track` — browsers post behaviour events here, so no Kafka client ever ships to the browser. CORS-restricted to the three frontends.

**Consumed actions on `user-events`:**

| Action | Updates |
|---|---|
| `product_view` | `userAnalytics`, `productAnalytics.views` |
| `add_to_cart` / `remove_from_cart` | `userAnalytics`, `productAnalytics.cartAdds` |
| `add_to_wishlist` / `remove_from_wishlist` | `userAnalytics`, `productAnalytics.wishlistAdds` |
| `shop_visit` | `shopAnalytics`, `uniqueShopVisitors`, country/city/device histograms |
| `purchase` | `productAnalytics.purchases` |

---

## Frontend Applications

### User UI (port 3000)

Next.js App Router storefront.

| Route | Description |
|---|---|
| `/` | Home with hero, offers, and recommended products |
| `/products` | Filterable, paginated catalogue |
| `/product/[slug]` | Product detail with image magnifier, variants, related products |
| `/offers` | Flash-sale and event products |
| `/shops` | Shop directory |
| `/shop/[id]` | Shop profile with products, events, and reviews |
| `/cart` | Cart with coupon entry |
| `/checkout` | Stripe Elements checkout |
| `/payment-success` | Post-payment confirmation with polling |
| `/wishlist` | Saved products |
| `/profile` | Account overview |
| `/order/[orderId]` | Order detail with delivery progress rail |
| `/inbox` | Chat with sellers |
| `/login`, `/signup`, `/forgot-password` | Auth (OTP-verified) |

**Notable:** image magnifier on product pages, device and location tracking feeding analytics, WebSocket unread badge, confetti on successful payment, Zustand cart persisted to localStorage.

### Seller UI (port 3001)

| Route | Description |
|---|---|
| `/dashboard` | Sales overview and charts |
| `/dashboard/all-products` | Product list with low-stock warnings |
| `/dashboard/create-product` | Full product builder |
| `/dashboard/all-events`, `/dashboard/create-event` | Flash sales |
| `/dashboard/orders`, `/order/[id]` | Orders and status updates |
| `/dashboard/payments` | Stripe earnings |
| `/dashboard/discount-codes` | Coupon management |
| `/dashboard/inbox` | Buyer conversations |
| `/dashboard/notifications` | Notification centre |
| `/dashboard/settings` | Shop preferences, withdraw method, danger zone |
| `/edit-profile` | Seller profile |
| `/login`, `/signup` | Seller auth and shop setup |

**Notable:** AI-assisted product copy (`utils/AI.enhancements.ts`), TanStack Table data grids, low-stock threshold that drives both the product table badge and the order-time alert.

### Admin UI (port 3002)

| Route | Description |
|---|---|
| `/dashboard` | Platform KPIs |
| `/dashboard/users`, `/dashboard/sellers` | Account management |
| `/dashboard/products`, `/dashboard/events` | Catalogue oversight |
| `/dashboard/orders`, `/order/[id]` | Orders with drill-down detail |
| `/dashboard/payments` | Payment records |
| `/dashboard/loggers` | Live log console over WebSocket |
| `/dashboard/customization` | Logo, banner, and category management |
| `/dashboard/management` | Admin accounts |
| `/dashboard/notifications` | Platform notifications |

---

## Shared Packages

Everything under `packages/` is imported by relative path from the apps (see [Known Gaps](#known-gaps-and-roadmap) — path aliases are on the roadmap).

| Package | Description |
|---|---|
| `packages/error-handler` | `AppError`, `NotFoundError`, `ValidationError`, `AuthError`, `ForbiddenError`, `DatabaseError`, `RateLimitError`, plus `errorMiddleware`, which splits expected failures to `warning` and unhandled ones to `error`, and logs only method/path/message because bodies carry passwords and OTPs |
| `packages/middleware` | `isAuthenticated` (user), `isSeller`, `isAdmin`, `isAnyAuthenticated` (any of the three, role declared by the caller), `authorizeRoles(...roles)`, and `toAuthError` which maps expired/invalid JWTs to 401 instead of 500 |
| `packages/libs/primsa` | Shared Prisma client singleton |
| `packages/libs/redis` | Shared ioredis instance |
| `packages/libs/imagekit` | Typed `uploadFile`, `deleteFile`, `deleteFiles`, `buildUrl` |
| `packages/utils/kafka` | KafkaJS client with env-configurable brokers, plus a memoised producer |
| `packages/utils/logs` | `setLogSource`, `logAsync` — fire-and-forget, never throws |
| `packages/utils/sanitize` | `sanitizeRichText` — the allowlist applied to seller HTML on both write and render |
| `packages/utils/cors` | `ALLOWED_ORIGINS`, one list shared by the gateway and every service |
| `packages/components` | `ColorSelector`, `CustomProperties`, `CustomSpecifications`, `Input`, `RichTextEditor`, `SizeSelector` |

---

## Data Models

All models live in `prisma/schema.prisma`, targeting MongoDB.

### User and Seller

| Model | Key Fields |
|---|---|
| `users` | `email (unique)`, `name`, `password?`, `role`, `following[]`, `avatar`, `isBanned`, `bannedAt`, `banReason` |
| `sellers` | `email (unique)`, `name`, `country`, `phone_number`, `stripeId?`, `isDeleted`, `deletedAt` |
| `shops` | `sellerId`, `name`, `bio`, `category`, `avatar`, `coverBanner`, `address`, `opening_hours`, `ratings` |
| `shop_settings` | `shopId (unique)`, `lowStockThreshold`, `notifications` (email / web / app) |
| `shopFollowers` | `shopId`, `userId` |
| `blocked_seller_emails` | `email (unique)` |
| `address` | `userId`, `label` (Home / Work / Other), `name`, `street`, `city`, `zip`, `country`, `isDefault` |
| `images` | `file_id`, `url`, optional `userId` / `shopId` / `productId` |

### Catalogue

| Model / Enum | Key Fields |
|---|---|
| `products` | `title`, `slug (unique)`, `category`, `subCategory`, `tags[]`, `brand?`, `colors[]`, `sizes[]`, `stock`, `sale_price`, `regular_price`, `starting_date?`, `ending_date?`, `status`, `isDeleted`, `deletedAt`, `custom_properties`, `custom_specification`, `ratings`, `totalSales` |
| `productStatus` | `Active`, `Pending`, `Draft` |
| `discount_codes` | `public_name`, `discountType`, `discountValue`, `discountCode (unique)`, `sellerId` |
| `site_config` | `categories[]`, `subCategories`, logo and banner |
| `shopReviews` | `userId`, `shopId`, `rating` |

### Orders

| Model | Key Fields |
|---|---|
| `orders` | `userId`, `shopId`, `total`, `sessionId`, `shippingAddressId?`, `couponCode?`, `discountAmount?`, `status`, `deliveryStatus` |
| `orderItems` | `orderId`, `productId`, `quantity`, `price`, `selectedOptions` |
| `orderPayment` | `sessionId (unique)`, `paymentIntentId?`, `userId`, `amountReceived?`, `currency?`, `source` — the webhook idempotency guard |

### Chat and Notifications

| Model | Key Fields |
|---|---|
| `conversationGroup` | `isGroup`, `name?`, `creatorId`, `participantIds[]` |
| `participant` | `conversationId`, `userId?`, `sellerId?`, `lastSeenAt`, `isOnline`, `unreadCount`, `muted` |
| `message` | `conversationId`, `senderId`, `senderType`, `content?`, `attachments[]`, `status` |
| `notifications` | `title`, `message`, `creatorId`, `receiverId`, `redirect_link?`, `isRead` |

### Analytics

| Model | Key Fields |
|---|---|
| `userAnalytics` | `userId`, `actions`, `recommendations`, `lastTrained` |
| `productAnalytics` | `productId`, `views`, `cartAdds`, `wishlistAdds`, `purchases`, `lastViewedAt` |
| `shopAnalytics` | `shopId`, `totalVisitors`, `countryStats`, `cityStats`, `deviceStats` |
| `uniqueShopVisitors` | `shopId + userId (unique)` |
| `productSimilarity` | `productId`, neighbours with `score` and `reason` |

---

## Key Features

### Authentication and Authorisation
- **Three isolated role namespaces** — user, seller, and admin sessions coexist in one browser, each with its own cookie pair
- JWT access + refresh tokens in HttpOnly cookies, with refresh rotation back into the originating namespace
- OTP email verification for user and seller registration
- Forgot-password flow with OTP verification
- Admin role is re-read from the database on every request, so revoking access takes effect immediately rather than at token expiry

### Catalogue
- Multi-image products via ImageKit, plus colours, sizes, custom properties, custom specifications, warranty, and rich-text descriptions
- **Seller HTML is sanitized on write and again on render** against a tag/attribute/scheme allowlist
- Soft delete with a 24-hour restore window, swept hourly by a cron job
- Flash-sale events bounded by start and end dates
- Full-text search plus category, price, rating, brand, and stock filters

### Checkout and Payments
- **Server-side pricing** — the cart is re-priced from the database at session creation; line prices, shop attribution, and coupon value all come from the server
- **Stripe Connect** with capability-aware charge selection: destination charge with a 10% application fee where transfers are active, direct charge on the connected account otherwise
- **Webhook idempotency** via a unique `orderPayment` row, so Stripe's three-day retry window cannot duplicate an order
- Underpayment rejection against the trusted total
- A multi-shop cart becomes one order per shop, each with its own tracking page
- Seller payout visibility: live balances, payout history, and Connect account status

### Seller Operations
- Configurable **low-stock threshold** per shop, driving both the product table badge and an edge-triggered alert at order time — it fires on the crossing, not on every subsequent sale
- Shop soft delete with a 28-day restore window
- Shop followers
- Discount codes scoped to a seller's own products

### Analytics and Recommendations
- Behaviour events posted from the browser to `/track`, produced to Kafka, and aggregated by a dedicated consumer
- Country, city, and device histograms per shop, plus deduplicated unique visitors
- Related products served from a precomputed similarity index built offline from order co-occurrence and metadata cosine similarity, with a human-readable reason per neighbour

### Observability
- Every service logs through `logAsync` into a Kafka topic, fanned out over WebSocket to a live admin console
- Expected errors and unhandled errors are logged at different severities so real 500s are not buried
- CI files a single deduplicated GitHub issue when `master` breaks, adding a comment per subsequent failure rather than opening new issues

---

## Getting Started

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 20 LTS | Runtime |
| npm | 10+ | Package manager |
| MongoDB | 6+ | Database — must be a **replica set**, since Prisma requires one for MongoDB |
| Redis | 7+ | Payment sessions and chat buffering |
| Apache Kafka | 3+ | Analytics, chat persistence, logs (Confluent Cloud works) |
| Stripe CLI | Latest | Webhook forwarding in local development |

### Installation

```bash
git clone https://github.com/<your-org>/Eshop.git
cd Eshop/org
npm install
```

### Environment Configuration

```bash
cp .env.example .env
cp apps/user-ui/.env.example   apps/user-ui/.env
cp apps/seller-ui/.env.example apps/seller-ui/.env
cp apps/admin-ui/.env.example  apps/admin-ui/.env
```

At minimum, fill in:
- `DATABASE_URL` — MongoDB connection string
- `REDIS_URL` — Redis connection string
- `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` — generate with `openssl rand -base64 48`
- `SMTP_*` — for OTP and order emails
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `IMAGEKIT_*`
- `KAFKA_BROKER`, `KAFKA_API_KEY`, `KAFKA_API_SECRET`

The service-URL variables are optional locally — each defaults to its localhost port.

### Database Setup

```bash
npx prisma generate      # generate the client (required before typecheck)
npx prisma db push       # create collections and indexes
npm run seed             # optional: populate sample data
```

> `@prisma/client` ships as an empty stub. Nothing typechecks until `prisma generate` has run, which is why CI runs it before every build.

### Running the Project

**Everything at once:**
```bash
npm run dev              # nx run-many --target=serve --all
```

**Individual frontends:**
```bash
npm run user-ui          # http://localhost:3000
npm run seller-ui        # http://localhost:3001
npm run admin-ui         # http://localhost:3002
```

**Individual services:**
```bash
npx nx serve @org/api-gateway
npx nx serve @org/auth-service
npx nx serve @org/product-service
npx nx serve @org/order-service
npx nx serve @org/admin-service
npx nx serve @org/seller-service
npx nx serve @org/chatting-service
npx nx serve @org/recommendation-service
npx nx serve @org/logger-service
npx nx serve @org/kafka-service
```

**Stripe webhook forwarding:**
```bash
npm run stripe:listen
# stripe listen --forward-to localhost:6004/api/create-order
```

Forwarding straight to order-service on 6004 bypasses the gateway entirely. Pointing it at `localhost:8080/order/api/create-order` also works — the gateway skips body parsing for that path so the signature stays verifiable.

**Rebuild the recommendation index:**
```bash
npm run build-recommendations
```

**Other Nx targets:**
```bash
npx nx run-many -t typecheck    # all projects
npx nx run-many -t build
npx nx run-many -t test
npx nx graph                    # dependency graph
```

---

## API Reference

All frontend traffic goes through the gateway on port `8080`.

| Service | Base URL via Gateway |
|---|---|
| Auth Service | `http://localhost:8080/api/...` |
| Product Service | `http://localhost:8080/product/api/...` |
| Order Service | `http://localhost:8080/order/api/...` |
| Admin Service | `http://localhost:8080/admin/api/...` |
| Seller Service | `http://localhost:8080/seller/api/...` |
| Chatting Service | `http://localhost:8080/chatting/api/...` |
| Recommendation Service | `http://localhost:8080/recommendation/api/...` |

Two endpoints are reached directly rather than through the gateway: the Kafka `/track` ingest on `:6010`, and the WebSocket endpoints on chatting-service (`:6008`) and logger-service (`:6007`).

Authentication travels in the HttpOnly cookie for the relevant role, or as `Authorization: Bearer <token>`.

---

## Environment Variables Reference

### Root `.env` (backend services)

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | ✅ | MongoDB connection string (replica set) | `mongodb+srv://user:pass@cluster.mongodb.net/eshop` |
| `REDIS_URL` | ✅ | Redis connection URI | `redis://localhost:6379` |
| `ACCESS_TOKEN_SECRET` | ✅ | JWT access token secret | random 48+ byte string |
| `REFRESH_TOKEN_SECRET` | ✅ | JWT refresh token secret | random 48+ byte string |
| `SMTP_HOST` | ✅ | SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | ✅ | SMTP port | `587` |
| `SMTP_SERVICE` | ✅ | Service name | `gmail` |
| `SMTP_USER` | ✅ | SMTP username | `noreply@yourdomain.com` |
| `SMTP_PASSWORD` | ✅ | SMTP password / app password | app-specific password |
| `STRIPE_SECRET_KEY` | ✅ | Stripe secret key | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Webhook signing secret | `whsec_...` |
| `IMAGEKIT_PUBLIC_KEY` | ✅ | ImageKit public key | `public_...` |
| `IMAGEKIT_PRIVATE_KEY` | ✅ | ImageKit private key | `private_...` |
| `IMAGEKIT_URL_ENDPOINT` | ✅ | ImageKit URL endpoint | `https://ik.imagekit.io/your_id` |
| `KAFKA_BROKER` | ⬜ | Comma-separated brokers | `pkc-xxx.gcp.confluent.cloud:9092` |
| `KAFKA_API_KEY` | ⬜ | Kafka SASL username | — |
| `KAFKA_API_SECRET` | ⬜ | Kafka SASL password | — |
| `KAFKA_HTTP_PORT` | ⬜ | Port for the `/track` endpoint | `6010` |
| `AUTH_SERVICE_URL` | ⬜ | Gateway target, defaults to localhost | `http://localhost:6001` |
| `PRODUCT_SERVICE_URL` | ⬜ | Gateway target | `http://localhost:6002` |
| `ORDER_SERVICE_URL` | ⬜ | Gateway target | `http://localhost:6004` |
| `ADMIN_SERVICE_URL` | ⬜ | Gateway target | `http://localhost:6005` |
| `RECOMMENDATION_SERVICE_URL` | ⬜ | Gateway target | `http://localhost:6006` |
| `CHAT_SERVICE_URL` | ⬜ | Gateway target | `http://localhost:6008` |
| `SELLER_SERVICE_URL` | ⬜ | Gateway target | `http://localhost:6009` |
| `SELLER_UI_URL` | ⬜ | Stripe Connect return destination | `http://localhost:3001` |
| `CORS_ORIGIN` | ⬜ | Comma-separated allowlist | `https://shop.example.com,...` |
| `NODE_ENV` | ⬜ | Runtime environment | `development` |

### Frontend `.env` files

`NEXT_PUBLIC_*` values are inlined into the browser bundle — never put a secret in one.

| Variable | App | Description |
|---|---|---|
| `NEXT_PUBLIC_SERVER_URI` | all three | API Gateway base URL |
| `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` | user-ui | Stripe publishable key |
| `NEXT_PUBLIC_SELLER_SERVER_URI` | user-ui | Seller UI link target |
| `NEXT_PUBLIC_CHATTING_WEBSOCKET_URI` | user-ui, seller-ui | Chat WebSocket (`ws://localhost:6008`) |
| `NEXT_PUBLIC_USER_UI_LINK` | seller-ui, admin-ui | Storefront link target |
| `NEXT_PUBLIC_SOCKET_URI` | admin-ui | Logger WebSocket (`ws://localhost:6007`) |

---

## CI/CD

**GitHub Actions** (`.github/workflows/ci.yml`), on pushes to `master` and all pull requests:

1. Checkout with full history (for Nx affected detection)
2. Node 20 with npm cache
3. `npm ci`
4. **`npx prisma generate`** — the model types do not exist until the client is generated, and `node_modules` is not committed
5. `npx nx run-many -t lint test build typecheck`
6. `npx nx fix-ci` (always runs)

A second `report-failure` job opens or updates a single `ci-failure` issue when `master` breaks, appending a comment per subsequent failure so repeated breakage does not spawn issue spam. Pull-request failures are skipped, since they are already visible on the PR.

---

## Architecture Decisions

**Nx monorepo** — one repository for every service and shared package, giving shared TypeScript types, atomic cross-service commits, and affected-project detection in CI.

**One Prisma schema** — a single `schema.prisma` covers every model and every service imports the same client, so there is no drift between service-local model definitions. MongoDB's document model suits the JSON-shaped fields (`custom_properties`, analytics histograms) well.

**Gateway as sole HTTP ingress** — rate limiting, CORS, and cookie parsing are applied once instead of nine times. The one deliberate exception is the Stripe webhook path, where body parsing is skipped so the signed bytes survive the proxy hop.

**Three cookie namespaces rather than one** — a single `access_token` would be simpler, but it would mean logging into the seller dashboard silently destroys your shopper session in the same browser. The cost is that a route must use the middleware matching its audience; `isAnyAuthenticated` exists for routes all three consoles call.

**Server-priced checkout** — the browser says *what* it wants to buy; the server decides what that costs. Prices, shop attribution, and coupon values are all recomputed from the database and stored in a Redis session, and the payment intent reads its amount from there. Authentication proves who is buying, never what the price is.

**Database-enforced webhook idempotency** — Stripe retries for up to three days, and a retry after a slow success would otherwise duplicate an entire order. A unique insert is the guard rather than a read-then-write, because only the database can arbitrate two concurrent retries atomically.

**Precomputed recommendations** — neighbours are computed offline into `productSimilarity` rather than scored per request, so the product page does a single indexed read. Each neighbour records *why* it was chosen, which makes the suggestion explainable in the UI.

**Kafka for anything that can lag** — analytics, chat persistence, and logs are all write-heavy and tolerant of a few seconds of delay. Chat is delivered over WebSocket immediately and persisted through Kafka separately, so socket latency is never gated on a database write.

**Fire-and-forget logging** — `logAsync` never throws and is never awaited. A logging failure must not be able to fail the request it is describing.

---

## Known Gaps and Roadmap

This project has a prioritised technical roadmap in **[`improvements.md`](./improvements.md)**, produced from a comparison against a sibling codebase. Highlights of what is *not* built yet:

- **Product reviews.** `shopReviews` stores a rating only — no comments, no moderation, and no write endpoint. Product ratings are currently static.
- **No product edit.** Sellers can create, soft-delete, and restore products, but there is no update route or endpoint.
- **Order status has no transition map.** Any status can move to any other, and there is no audit trail.
- **No commission ledger.** The 10% application fee is charged but never recorded, so per-seller earnings cannot be reported.
- **Cart is client-side only.** It lives in localStorage and reaches the server at checkout.
- **Chat is thin.** Raw WebSocket with one message type; no typing indicators, presence, delivery receipts, or reconnection.
- **The ten `*-e2e` projects are Nx scaffolding**, excluded from the jest runner and containing no real tests.

See `improvements.md` for the full list, each item with file references and a suggested fix.
