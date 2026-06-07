# TransportMW — Malawi's Ride Hub

Production-ready transport booking platform for Malawi. No user accounts required — anonymous identity system via device tokens.

## Features

- 🚗 **Multi-vehicle listings** — Taxi, Motorcycle, Minibus, Hire Car, Airport Transfer, Cargo
- 🔴 **Live availability feed** — Real-time Supabase subscriptions
- 💰 **Fare estimator** — Route-based and duration-based estimates (MWK)
- 📅 **Anonymous booking** — Full booking tracker with state machine
- 🛡️ **Trust & Safety** — Report listings, SOS overlay, safety tips
- ⭐ **Premium upgrades** — Airtel Money / TNM Mpamba payment flow
- 📱 **PWA** — Installable, offline-friendly, mobile-first
- 🔔 **Notifications** — DB-triggered, token-based, no auth required

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Supabase (Postgres + Realtime)
- Wouter (routing)
- TanStack Query
- PWA (Service Worker)

## Setup

### 1. Clone & Install
```bash
npm install
```

### 2. Environment Variables
Create `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database
Run `schema.sql` in Supabase SQL editor. This creates:
- `listings` — transport operator listings
- `bookings` — anonymous bookings
- `reviews` — one-tap ratings
- `reports` — trust & safety reports
- `premium_listings` — upgrade purchase log
- `operator_notifications` — token-based notifications

### 4. Supabase Realtime
Enable Realtime for tables: `listings`, `bookings`, `operator_notifications`

### 5. Run
```bash
npm run dev
```

### 6. Deploy (Vercel)
```bash
vercel --prod
```
`vercel.json` handles SPA routing and security headers automatically.

## Anonymous Identity System

No accounts. When an operator posts a listing:
1. A UUID token is generated and stored in `localStorage`
2. The token is attached to the listing as `operator_token`
3. From the same device, the operator can edit/delete/toggle listings
4. The Dashboard shows all listings owned by the current device token

## Payment Flow (Malawi)

- **Airtel Money**: 0999 626 944
- **TNM Mpamba**: 0888 712 272
- **Cash**: On arrival

Premium upgrades: operator sends payment → submits reference → admin verifies → Premium badge activated.

## Contact

WhatsApp: +265 999 626 944  
Built by O-techy
