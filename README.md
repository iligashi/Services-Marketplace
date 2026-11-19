# Services Marketplace

A local services marketplace repository with an Express API, a Vite admin dashboard, and an Expo mobile app.

## Stack

- API: Node.js, Express, MySQL, Socket.IO
- Admin: React, Vite
- Mobile: React Native, Expo
- Local infrastructure: MySQL and Redis with Docker Compose

## Run with Docker Compose

Requirements: Docker with the Compose plugin.

1. Copy `.env.example` to `.env`.
2. Replace both password placeholders with unique local values and set `JWT_SECRET` and `JWT_REFRESH_SECRET` to two different random values (the API will not start without them).
3. Start the services:

```bash
docker compose up --build
```

The API is available on port 3000 and the admin dashboard on port 3001. Compose starts MySQL and Redis as supporting services.

The checked-in `.env.example` contains placeholders only. Keep your real `.env` file private and never reuse local demo credentials in a deployed environment.

## Run components individually

### API

```bash
cd backend
npm ci
```

Copy `backend/.env.example` to `backend/.env`, set local database and application secrets, then run:

```bash
npm run migrate
npm run seed
npm run dev
```

`npm run migrate` applies every migration in order (`migrate.js` to `migrate_v4.js`); each step is safe to re-run.

### Tests

```bash
cd backend
npm test
```

### Payments

Payments use Stripe manual capture as an escrow:

| Status | Meaning |
| --- | --- |
| `pending` | PaymentIntent created, card not yet authorised |
| `held` | Funds authorised (from the `payment_intent.amount_capturable_updated` webhook, or checked with Stripe on release) |
| `releasing` | Release claimed; capture and provider transfer in progress |
| `released` | Captured and paid out to the provider |
| `failed` | Authorisation failed; the customer can retry |

Creating a payment is idempotent (one row per job, Stripe idempotency keys), and release never calls Stripe inside a database transaction. A release interrupted midway stays `releasing` and is resumed by the hourly escrow job; Stripe idempotency keys make the retried capture and transfer return the original result instead of charging or paying out twice.

### Admin dashboard

```bash
cd admin
npm install
npm run dev
```

### Mobile app

```bash
cd mobile
npm install
npm start
```

The API package also provides `npm start` for a non-development server, and the admin package provides `npm run build` for a production bundle.
