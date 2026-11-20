# Services Marketplace

**A two-sided marketplace for local home services, with payments held in escrow until the job is done.**

Customers post a job, verified local professionals bid on it, and the customer picks the offer that fits. The customer's money is held by Stripe and only reaches the provider once the work is confirmed. That protects both sides.

![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-Expo%2058-000020?logo=expo&logoColor=white)
![React](https://img.shields.io/badge/Admin-React%20%2B%20Vite-61DAFB?logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![Stripe](https://img.shields.io/badge/Payments-Stripe%20Connect-635BFF?logo=stripe&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Realtime-Socket.IO-010101?logo=socket.io&logoColor=white)

---

## Live deployment

| Part | Where |
| --- | --- |
| Admin dashboard | [marketplace-admin-ie1u.onrender.com](https://marketplace-admin-ie1u.onrender.com) |
| API | [marketplace-api-b0sd.onrender.com](https://marketplace-api-b0sd.onrender.com/api/health) (health check at `/api/health`) |
| Mobile app | Expo Go, through EAS Update (see [Try it in Expo Go](#try-it-in-expo-go-without-a-store-build-free)) |

Everything runs on free tiers (Render, TiDB Cloud, Expo). The API sleeps when idle, so the first request can take about a minute. Card payments stay off until Stripe keys are added to the API's environment.

---

## Contents

- [Live deployment](#live-deployment)
- [The business idea](#the-business-idea)
- [Screenshots](#screenshots)
- [How it works](#how-it-works)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Deploying to production](#deploying-to-production)
- [Configuration](#configuration)
- [Security](#security)
- [Testing](#testing)
- [API overview](#api-overview)
- [Roadmap and known limitations](#roadmap-and-known-limitations)

---

## The business idea

### The problem

Finding someone reliable for a small job, such as a leaking tap, a ceiling light or an end-of-lease clean, still runs on word of mouth and phone calls. Both sides carry risk:

- **Customers** cannot compare prices easily. They often pay up front with no guarantee the work will be finished.
- **Providers** spend time on quotes that go nowhere. After the work is done, they can wait a long time to be paid, or never be paid at all.

### The solution

Services Marketplace puts the whole job on one platform, from request to payout:

1. **Competitive bidding.** A customer describes the job once and receives several priced offers from nearby providers.
2. **Escrow payments.** When a bid is accepted, the customer's card is authorised and the funds are *held*, not paid out. The provider can see the money is there before starting.
3. **Release on confirmation.** The provider is paid when the work is confirmed. If the customer doesn't respond, the funds are released automatically after 72 hours. If something goes wrong, a dispute freezes the money until an admin decides.
4. **Reputation.** Reviews, ratings and verification badges help good providers win more work.

### Revenue model

The platform takes a **commission on every job paid through escrow**. The default rate is 12% and can be configured with `PLATFORM_FEE_PERCENT`. The commission goes down as a provider builds trust, which gives providers a reason to keep their work on the platform:

| Provider tier | Requirements | Platform fee | Badge |
| --- | --- | --- | --- |
| Standard | Not verified | **12%** | – |
| Verified | Identity verified by an admin | **11%** | Verified |
| Trusted | Verified, rating ≥ 4.5, 10+ jobs | **10%** | Top Rated |
| Elite | Verified, rating ≥ 4.8, 20+ jobs | **8%** | Elite Pro |

Payouts go to each provider's **Stripe Connect** account. The platform keeps the fee, and Stripe handles card data and compliance.

### Who uses it

| Role | Client | What they do |
| --- | --- | --- |
| **Customer** | Mobile app | Posts jobs, compares bids, pays into escrow, chats, confirms and reviews |
| **Provider** | Mobile app | Finds nearby jobs, bids, does the work, gets paid, builds a reputation |
| **Admin** | Web dashboard | Verifies providers, manages categories, monitors payments and resolves disputes |

---

## Screenshots

> Captured from the local development build, with the demo data described in [Demo accounts](#demo-accounts).

### Customer app

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/customer-home.png?v=2" width="220" alt="Customer home"><br><sub>Home</sub></td>
    <td align="center"><img src="docs/screenshots/customer-post-job.png?v=2" width="220" alt="Post a job"><br><sub>Post a job</sub></td>
    <td align="center"><img src="docs/screenshots/customer-my-jobs.png?v=2" width="220" alt="My jobs"><br><sub>My jobs</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/customer-job-detail.png?v=2" width="220" alt="Job details with progress timeline"><br><sub>Job details and progress</sub></td>
    <td align="center"><img src="docs/screenshots/customer-bids.png?v=2" width="220" alt="Compare bids"><br><sub>Compare bids</sub></td>
    <td align="center"><img src="docs/screenshots/mobile-login.png?v=2" width="220" alt="Sign in"><br><sub>Sign in</sub></td>
  </tr>
</table>

### Provider app

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/provider-dashboard.png?v=2" width="220" alt="Provider Today dashboard"><br><sub>Today</sub></td>
    <td align="center"><img src="docs/screenshots/provider-browse.png?v=2" width="220" alt="Browse jobs"><br><sub>Browse jobs</sub></td>
    <td align="center"><img src="docs/screenshots/provider-submit-bid.png?v=2" width="220" alt="Submit a bid"><br><sub>Submit a bid</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/provider-my-bids.png?v=2" width="220" alt="My bids"><br><sub>My bids</sub></td>
    <td align="center"><img src="docs/screenshots/chat.png?v=2" width="220" alt="Real-time chat"><br><sub>Real-time chat</sub></td>
    <td align="center"><img src="docs/screenshots/provider-earnings.png?v=2" width="220" alt="Earnings"><br><sub>Earnings</sub></td>
  </tr>
</table>

### Admin dashboard

| Overview | Users and verification |
| --- | --- |
| ![Admin dashboard](docs/screenshots/admin-dashboard.png) | ![Admin users](docs/screenshots/admin-users.png) |
| **Payments and escrow** | **Service categories** |
| ![Admin payments](docs/screenshots/admin-payments.png) | ![Admin categories](docs/screenshots/admin-categories.png) |

---

## How it works

### Job lifecycle

```mermaid
flowchart LR
    A[Customer posts job] --> B[Providers submit bids]
    B --> C[Customer accepts a bid]
    C --> D[Card authorised:<br/>funds HELD in escrow]
    D --> E[Provider starts work]
    E --> F[Provider marks job done]
    F --> G{Customer confirms?}
    G -- Yes --> H[Payment captured]
    G -- No reply in 72h --> H
    G -- Problem --> X[Dispute opened:<br/>funds frozen]
    X -- Admin: release --> H
    X -- Admin: refund --> R[Customer refunded]
    H --> I[Payout to provider<br/>minus platform fee]
    I --> J[Both sides leave reviews]
```

Step by step:

1. **Post.** The customer creates a job with a title, description, category, budget, location and optional photos.
2. **Bid.** Providers send a price, an estimated duration and a message. The customer sees each provider's rating, badge and completed jobs.
3. **Accept.** The customer accepts one bid. The other bids are rejected automatically and the job is assigned.
4. **Hold funds.** A Stripe PaymentIntent is created with `capture_method: manual`. The card is authorised but not charged, and the payment moves to `held`.
5. **Do the work.** The provider starts the job and the two sides coordinate in a real-time chat tied to the job.
6. **Complete.** The provider marks the job done and the customer confirms. The capture and the payout to the provider's Stripe Connect account happen together.
7. **Auto-release.** If the customer never confirms, an hourly job releases payments that have been held for more than **72 hours**. Providers are not left waiting forever.
8. **Dispute.** Either side can open a dispute. This blocks the release until an admin resolves it with a refund or a release. See the [known limitations](#roadmap-and-known-limitations) for how resolution currently settles with Stripe.
9. **Review.** After completion, both sides can leave a 1–5 star review. Reviews feed the provider's rating, badge and fee tier.

### Payment states

```mermaid
stateDiagram-v2
    [*] --> pending: PaymentIntent created
    pending --> held: card authorised (webhook)
    pending --> failed: authorisation failed
    failed --> pending: customer retries
    held --> releasing: confirmed / auto-release / admin release
    releasing --> released: captured and transferred
    releasing --> release_failed: Stripe error
    release_failed --> releasing: admin retry
    held --> disputed: dispute opened
    disputed --> released: admin releases
    disputed --> refunded: admin refunds
    released --> [*]
    refunded --> [*]
```

| Status | Meaning |
| --- | --- |
| `pending` | PaymentIntent created, card not yet authorised |
| `held` | Funds authorised and held, either from the `payment_intent.amount_capturable_updated` webhook or verified with Stripe on release |
| `releasing` | Release claimed; capture and provider transfer in progress |
| `released` | Captured and paid out to the provider |
| `release_failed` | Capture or transfer failed. Shown to admins with a **Retry** action |
| `failed` | Authorisation failed; the customer can retry |
| `disputed` | Dispute open. Release is blocked |
| `refunded` | Authorisation cancelled or refunded to the customer |

**Reliability guarantees**

- Creating a payment is idempotent: one row per job, plus Stripe idempotency keys.
- Release never calls Stripe inside a database transaction.
- A release interrupted midway stays `releasing` and is picked up again by the hourly escrow job. The retried capture and transfer reuse the same idempotency keys, so a job can never be charged or paid out twice.

### Payment modes

Each job has a `payment_mode`, which an admin can change through the API:

| Mode | Behaviour |
| --- | --- |
| `online_escrow` (default) | Full Stripe escrow flow described above |
| `cash` | Paid in person. The platform tracks the job but does not touch money |
| `manual` | Settled outside the platform, for example by bank transfer, and recorded by an admin |

---

## Features

**Customers**
- Post jobs with category, budget, location and photos
- Compare bids with provider rating, badge and history
- Accept or reject bids; cancel open jobs
- Escrow payment with confirmation on completion
- Real-time chat for each job, in-app and push notifications
- Save jobs, review providers, open disputes

**Providers**
- Dashboard with earnings, pending payouts, active jobs and bid stats
- Browse jobs: *For You* (recommended by skills) and *All Jobs*, with distance-based nearby search
- Submit bids with a live estimate of earnings after the platform fee
- Track bids and active jobs, mark work as done
- Earnings history and a public provider profile with reviews and badge

**Admins**
- Platform metrics: users, jobs, revenue and payment status
- User management: search, filter by role, verify or unverify providers, suspend accounts through the API
- Payment monitoring with a retry for failed releases
- Dispute resolution (refund or release)
- Service category management

**Platform**
- JWT access tokens (15 min) with rotating refresh tokens (7 days)
- Suspended accounts are blocked on every request and on the socket handshake, even with an older token
- Socket.IO rooms for each job and each user, for live chat and notifications
- Expo push notifications
- Rate limiting that is shared through Redis when it is configured

---

## Tech stack

| Layer | Technology |
| --- | --- |
| **API** | Node.js, Express 4, Joi validation, Helmet, express-rate-limit (+ Redis store), Winston logging, Multer uploads |
| **Database** | MySQL 8 through `mysql2` (pooled, parameterised queries) |
| **Realtime** | Socket.IO 4, with JWT-authenticated handshake |
| **Payments** | Stripe PaymentIntents with manual capture (escrow), Stripe Connect transfers, signed webhooks |
| **Mobile app** | React Native 0.88 with Expo SDK 58 and React 19, Redux Toolkit, React Navigation 7, Axios, socket.io-client. Runs on iOS, Android and the web through `react-native-web` |
| **Admin dashboard** | React 18 and Vite 5, served by nginx in Docker |
| **Notifications** | Expo Server SDK (push) plus in-app notifications |
| **Infrastructure** | Docker Compose (MySQL 8, Redis 7, API, admin) |
| **Testing** | Node's built-in test runner (`node --test`) |

---

## Architecture

```mermaid
flowchart TB
    subgraph Clients
        M[Mobile app<br/>Expo / React Native<br/>iOS · Android · Web]
        W[Admin dashboard<br/>React + Vite]
    end

    subgraph API["Express API (Node.js)"]
        R[REST routes<br/>/api/*]
        S[Socket.IO<br/>chat & notifications]
        J[Hourly escrow job<br/>auto-release & recovery]
    end

    DB[(MySQL 8)]
    RD[(Redis 7<br/>shared rate limits)]
    ST[Stripe<br/>PaymentIntents · Connect]
    EX[Expo Push Service]

    M -- HTTPS + JWT --> R
    M -- WebSocket + JWT --> S
    W -- HTTPS + JWT --> R
    R --> DB
    S --> DB
    J --> DB
    R --> RD
    R <-- signed webhooks --> ST
    J --> ST
    R --> EX
```

### Repository structure

```text
Services-Marketplace/
├── backend/                 Express API
│   ├── src/
│   │   ├── config/          Environment parsing and validation
│   │   ├── controllers/     Request handlers per domain
│   │   ├── database/        Migrations (v1–v5) and seed script
│   │   ├── middleware/      Auth, role checks, validation, errors, uploads
│   │   ├── routes/          Route definitions per domain
│   │   ├── services/        Escrow, payment state, reputation, geo, notifications
│   │   ├── sockets/         Socket.IO auth and chat handlers
│   │   ├── validators/      Joi schemas
│   │   ├── app.js           Express app (security headers, CORS, rate limits)
│   │   └── server.js        HTTP + Socket.IO server, scheduled jobs
│   └── test/                Unit tests
├── admin/                   React + Vite admin dashboard
├── mobile/                  Expo / React Native app
│   └── src/
│       ├── screens/         customer/, provider/, shared/
│       ├── store/           Redux Toolkit slices
│       ├── navigation/      Role-based navigators
│       └── config.js        API / socket URL resolution
├── docs/screenshots/        Images used in this README
└── docker-compose.yml       MySQL, Redis, API and admin
```

---

## Getting started

### Prerequisites

- Node.js 18 or newer and npm
- MySQL 8 (local or through Docker)
- Optional: Docker with the Compose plugin, Redis 7, a Stripe test account, and the Expo Go app for testing on a device

### Option A: Docker Compose (API, admin, MySQL, Redis)

```bash
cp .env.example .env
```

Edit `.env`: replace both password placeholders with unique local values, and set `JWT_SECRET` and `JWT_REFRESH_SECRET` to two **different** random values. The API refuses to start without them. To generate a value:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

```bash
docker compose up --build
```

Then create the schema and demo data inside the API container:

```bash
docker compose exec backend npm run migrate
```

```bash
docker compose exec backend npm run seed
```

| Service | URL |
| --- | --- |
| API | http://localhost:3000/api |
| Admin dashboard | http://localhost:3001 |
| MySQL | localhost:3306 |
| Redis | localhost:6379 |

The mobile app is not part of Compose. Run it with Option B, step 3.

### Option B: Run each part locally

**1. API**

```bash
cd backend
npm ci
cp .env.example .env      # set DB_*, JWT secrets, Stripe test keys
npm run migrate           # applies migrate.js → migrate_v5.js in order; safe to re-run
npm run seed              # categories + demo accounts
npm run dev               # http://localhost:3000
```

**2. Admin dashboard**

```bash
cd admin
npm ci
npm run dev               # Vite dev server
```

The dashboard calls `http://localhost:3000/api` by default. Set `VITE_API_URL` in `admin/.env.local` to point it somewhere else.

**3. Mobile app**

```bash
cd mobile
npm ci
npm start                 # press w for web, or scan the QR code with Expo Go
```

The app resolves the API from `mobile/.env.local`:

| Variable | Use |
| --- | --- |
| `EXPO_PUBLIC_SERVER_URL` | API origin, e.g. `http://localhost:3000` (used on web and simulators) |
| `EXPO_PUBLIC_LAN_SERVER_URL` | Your machine's LAN address, e.g. `http://192.168.1.20:3000`, for a physical device running Expo Go |

### Demo accounts

`npm run seed` creates:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@marketplace.local` | `admin123` |
| Customer | `customer@demo.local` | `customer123` |
| Provider | `provider@demo.local` | `provider123` |

> These accounts are for local development only. Never run the seed script against a production database.

---

## Deploying to production

The repository ships a [Render Blueprint](render.yaml) that runs on Render's free tier, with MySQL from an external managed provider (Render's free tier has no MySQL):

| Service | Where | Notes |
| --- | --- | --- |
| `marketplace-api` | Render web service (free) | Runs migrations and `npm run bootstrap` on start |
| `marketplace-admin` | Render static site (free) | Built with the API host injected as `VITE_API_HOST` |
| `marketplace-redis` | Render Key Value (free) | Shared rate-limit counters, private network only |
| MySQL-compatible database | [TiDB Cloud](https://tidbcloud.com) free tier | Connected through `DATABASE_URL` over verified TLS |

1. Create a free cluster on TiDB Cloud and copy its connection string. Any MySQL 8 provider also works; with a private CA (for example Aiven), also set `DB_SSL_CA`.
2. In Render, choose **New → Blueprint** and select this repository.
3. Fill in the values Render asks for:
   - `DATABASE_URL`: the connection string, as `mysql://user:password@host:port/database?ssl-mode=REQUIRED`
   - `DB_SSL_CA`: leave empty for TiDB Cloud, which uses a public CA
   - `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD` (12+ characters)

   JWT secrets are generated by Render.
4. After the first deploy, sign in to the admin dashboard, then delete `ADMIN_PASSWORD` from the API's environment. The bootstrap only creates an admin when none exists.
5. In Stripe, add a webhook endpoint pointing to `https://<api-host>/api/payments/webhook`, and copy its signing secret into `STRIPE_WEBHOOK_SECRET`.

TiDB has no MySQL full-text indexes, so that migration step is skipped there, and job search and provider job matching fall back to keyword (`LIKE`) matching.

> Free-tier limits: the API sleeps after 15 minutes without traffic, so the first request after that takes about a minute. It also has no persistent disk, so uploaded photos are lost on each deploy or restart. Before real users upload photos, move the API to a paid plan with a disk, or to object storage.

`npm run bootstrap` inserts the default categories and the first admin. It never creates demo accounts; do not run `npm run seed` in production.

### Mobile app

Store builds use [EAS](https://docs.expo.dev/build/introduction/). The production API URL is set per profile in [`mobile/eas.json`](mobile/eas.json) (`EXPO_PUBLIC_SERVER_URL`).

```bash
cd mobile
npx eas-cli login
npx eas-cli init
npx eas-cli build --platform all --profile production
npx eas-cli submit --platform ios --latest
npx eas-cli submit --platform android --latest
```

Publishing needs an Apple Developer Program membership and a Google Play developer account.

#### Try it in Expo Go without a store build (free)

The app is published with [EAS Update](https://docs.expo.dev/eas-update/introduction/) to the `production` channel, which Expo Go can open at any time (sign in to Expo Go with an account that is a member of the Expo project):

```
exp://u.expo.dev/b67a27a8-ac17-43ae-be4e-d1846d5d6202?channel-name=production
```

To publish a new version (`--no-bytecode` because the Hermes compiler does not run on every Windows setup):

```bash
cd mobile
EXPO_PUBLIC_SERVER_URL=https://marketplace-api-b0sd.onrender.com npx expo export --platform ios --no-bytecode --output-dir dist
npx eas-cli update --branch production --platform ios --skip-bundler --input-dir dist --message "describe the change"
```

`runtimeVersion` uses the `sdkVersion` policy so Expo Go can load these updates. Push notifications do not work inside Expo Go; they need a store or TestFlight build.

---

## Configuration

All API settings are read from `backend/.env`. See [`backend/.env.example`](backend/.env.example) for the full list.

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | API port |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | – | MySQL connection |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | – | Two different secrets of 32+ characters. Required outside development |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | `15m` / `7d` | Token lifetimes |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | – | Stripe API key and webhook signing secret |
| `PLATFORM_FEE_PERCENT` | `12` | Base commission, before the tier discounts |
| `CLIENT_URL` / `ADMIN_URL` | `http://localhost:8081` / `http://localhost:3001` | Allowed CORS origins |
| `REDIS_URL` or `REDIS_HOST` + `REDIS_PORT` | – | Optional. Shares rate-limit counters across API instances |
| `RATE_LIMIT_WINDOW_MINUTES` | `15` | Rate-limit window |
| `RATE_LIMIT_GLOBAL_MAX` | `1000` | Requests per IP per window, across the whole API |
| `RATE_LIMIT_AUTH_MAX` | `20` | Login, register and refresh-token attempts per window |
| `RATE_LIMIT_PAYMENTS_MAX` | `60` | Payment requests per window. The Stripe webhook is never limited |
| `TRUST_PROXY` | – | Number of proxy hops (usually `1`) behind a load balancer, so the API sees each client's real IP |
| `UPLOAD_DIR` / `MAX_FILE_SIZE` | `./uploads` / `5242880` | Image uploads |

**Stripe webhooks in development**

```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

Copy the `whsec_…` secret that this command prints into `STRIPE_WEBHOOK_SECRET`.

---

## Security

- **Authentication:** short-lived JWT access tokens and rotating refresh tokens. Passwords are hashed with bcrypt.
- **Authorisation:** role middleware (`customer`, `provider`, `admin`) and ownership checks on every job, bid, payment and message. Suspended accounts are rejected on each request and on the socket handshake. The socket role is read from the database, not trusted from the token.
- **Input validation:** Joi schemas on request bodies. All SQL is parameterised.
- **Transport and headers:** Helmet security headers and an explicit CORS allow-list.
- **Abuse protection:** global, auth and payment rate limits, configurable and shared through Redis.
- **Payments:** card data never touches the API, because Stripe handles it. Webhooks are verified by signature, and release and capture are idempotent.
- **Secrets:** only placeholder `.env.example` files are committed. Real `.env` and `.env*.local` files are git-ignored.

If you find a vulnerability, please report it privately to the maintainer instead of opening a public issue.

---

## Testing

```bash
cd backend
npm test
```

The suite uses Node's built-in test runner. It covers authentication and account status (HTTP and sockets), the escrow and payment state machine (idempotent release, recovery of interrupted releases, disputes), configuration parsing and rate-limit setup.

---

## API overview

All routes are prefixed with `/api`. Every route except register, login, refresh-token, categories and the Stripe webhook needs a `Bearer` access token.

| Group | Main endpoints |
| --- | --- |
| **Auth** | `POST /auth/register`, `/auth/login`, `/auth/refresh-token`, `/auth/logout` · `GET/PUT /auth/profile` · `POST /auth/avatar`, `/auth/push-token` |
| **Jobs** | `GET /jobs`, `/jobs/my`, `/jobs/:id`, `/jobs/categories`, `/jobs/saved` · `POST /jobs` · `PATCH /jobs/:id/start`, `/complete`, `/cancel` |
| **Bids** | `POST /bids` · `GET /bids/my`, `/bids/job/:jobId` · `PATCH /bids/:id/accept`, `/reject` |
| **Payments** | `POST /payments/create-intent`, `/payments/confirm-completion` · `GET /payments/history` · `POST /payments/webhook` (Stripe) |
| **Providers** | `GET /providers/dashboard`, `/nearby-jobs`, `/recommended-jobs`, `/earnings`, `/active-jobs` |
| **Reviews** | Create reviews and list them for each user |
| **Disputes** | Open, list and resolve disputes |
| **Messages** | Chat history and messages for each job (also live over Socket.IO) |
| **Notifications** | List and mark notifications as read |
| **Admin** | `GET /admin/stats`, `/admin/users`, `/admin/payments` · `PATCH /admin/users/:id/status`, `/admin/users/:id/verify`, `/admin/jobs/:id/payment-mode` · `POST /admin/payments/:id/retry-release` · category CRUD |

---

## Roadmap and known limitations

This project is in active development. These items are known and planned:

- [ ] **In-app checkout:** the API supports the escrow flow (`/payments/create-intent`), but the mobile app does not yet collect a card after a bid is accepted.
- [ ] **Stripe Connect onboarding:** providers need a connected account to receive payouts. An in-app onboarding link is planned.
- [ ] **Settle disputes through Stripe:** resolving a dispute currently updates the database only. *Release* should go through the escrow service (capture and transfer), and *refund* should cancel or refund the PaymentIntent.
- [ ] **Stricter job transitions:** require held funds before work can start on `online_escrow` jobs, and allow a customer to confirm only after the provider marks the job done.
- [ ] **Admin UI** for payment mode and account suspension. Both are available in the API today.
- [ ] **Cash option** in the Post Job form.
- [ ] Better error states in the mobile job details screen.
- [ ] CI pipeline (lint, tests, builds) and a LICENSE.
- [ ] **Persistent uploads:** the free API host has no disk, so uploaded photos are lost on restart. Move them to object storage.
- [ ] **Store release:** iOS and Android store builds through EAS, with a unique bundle identifier.
- [x] Production deployment guide (managed MySQL, Redis, API host, admin on static hosting, EAS builds and updates).

---

## Author

**Ilaz Gashi**: [github.com/iligashi](https://github.com/iligashi)
