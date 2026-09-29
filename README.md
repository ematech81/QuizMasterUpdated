# QuizMaster

Play quizzes, earn real money, withdraw it. The app is monetized by Google ads
(banner, interstitial, rewarded), not by taking a cut of what players earn.

> A points-only / no-withdrawal version of this app was built and then
> reverted back to this real-money version. That version's code is preserved
> commented-out throughout the codebase (search for "POINTS VERSION
> (disabled)") rather than deleted, in case it's switched back to later.

## Architecture

- **`api/`** - Node.js + Express + MongoDB API. Owns auth, the wallet/ledger,
  scoring, withdrawals, and the leaderboard. This is the only place a user's
  balance can change - the mobile app never sets its own earnings. Deploy this
  folder as its own service (e.g. Railway: set the service's root directory to
  `api`).
- **Mobile app** (this directory) - Expo/React Native. Talks only to the
  Express API (`src/api/`). Firebase is used **only** as the question bank,
  read server-side by Express via the Firebase Admin SDK - the app has no
  Firebase SDK or config in it at all.
- **`src/ads/`** - Ad placement layer (banner/interstitial/rewarded) behind a
  mock provider, since the project runs on Expo Go for now. Swap the internals
  of this folder for `react-native-google-mobile-ads` later (requires an Expo
  Dev Client build) - no screen code needs to change.

## One-time setup

### 1. Firebase service account (for the API to read questions)

Firebase Console -> Project Settings -> Service Accounts -> **Generate new
private key**, for the `game-app-3980e` project. Save the downloaded JSON as:

```
api/src/config/serviceAccountKey.json
```

(This file is gitignored - never commit it.)

### 2. MongoDB

Run MongoDB locally (`mongod`, default `mongodb://127.0.0.1:27017`) or create a
free MongoDB Atlas cluster and use its connection string.

### 3. API environment

```
cd api
cp .env.example .env
```

Edit `.env`: set `MONGODB_URI` (if not using the local default) and
`JWT_SECRET` to a long random string.

### 4. Install and run the API

```
cd api
npm install
npm run dev
```

The API listens on `http://localhost:4000` by default. Check
`http://localhost:4000/api/health`.

### 5. Promote yourself to admin (to approve withdrawals)

Sign up in the app first, then:

```
cd api
npm run make-admin -- you@example.com
```

Admin-only endpoints (`GET/PATCH /api/admin/withdrawals`) let you list pending
withdrawal requests and mark them `paid` or `rejected` once you've sent the
money yourself (bank transfer / PayPal) - there is no live payment-provider
integration yet, by design.

### 6. Mobile app environment

```
cp .env.example .env
```

Edit `.env` and set `EXPO_PUBLIC_API_URL` to point at the server:
- Android emulator: `http://10.0.2.2:4000/api`
- iOS simulator: `http://localhost:4000/api`
- Physical device: `http://<your-computer's-LAN-IP>:4000/api`

### 7. Run the app

```
npm install
npm start
```

## Deploying the API (Railway)

1. Create a new Railway service from this repo and set its **root directory**
   to `api`.
2. Set environment variables in Railway to match `api/.env.example`
   (`MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`). Railway sets
   `PORT` automatically - the app already reads `process.env.PORT`.
3. The service account JSON can't be committed, and Railway has no file
   upload for a plain service - paste the downloaded key file's full contents
   into a `FIREBASE_SERVICE_ACCOUNT_JSON` variable instead (the app checks for
   this before falling back to a file path).
4. Railway auto-detects `npm start` (`node server.js`) via Nixpacks - no extra
   build config needed.
5. Once deployed, point the mobile app's `EXPO_PUBLIC_API_URL` at the Railway
   URL (e.g. `https://your-service.up.railway.app/api`).

## Known simplifications (documented, not oversights)

- No email verification or password-reset flow (would need an email-sending
  service).
- JWT tokens are long-lived (30 days) with no refresh-token rotation.
- Withdrawals are approved manually by an admin; no live Paystack/PayPal payout
  API call is made.
- Daily login bonus is disabled ("No daily login rewards") - code is
  commented out, not deleted, in `api/src/controllers/rewards.controller.js`
  and `api/src/routes/rewards.routes.js`.
- Ads are a mock placeholder (Expo Go can't load `react-native-google-mobile-ads`,
  which needs a dev client build).
