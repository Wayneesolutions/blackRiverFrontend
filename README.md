# Logistiq / Black River – Frontend

React 19 + TypeScript + Vite + Tailwind + Ant Design. Redux Toolkit for state, Socket.IO for chat and live updates, Leaflet and Google Maps for tracking.
Production: https://portal.logistiqinnovations.ca

Backend lives in a separate repo: `Wayneesolutions/blackRiverBackend`. **Start the backend first** (see its README).

---

## 1. Prerequisites

- Node.js **20.19 or newer** (tested on 22)
- The backend running locally on `http://localhost:3000`

---

## 2. Install and run

```bash
git clone https://github.com/Wayneesolutions/blackRiverFrontend.git
cd blackRiverFrontend
npm ci
npm run dev
```

Open **http://localhost:5173**

---

## 3. Environment variables

The app works with **no `.env` at all** for local development, because it falls back to `http://localhost:3000/api/v1`.

To point it somewhere else, create `.env.local` (git-ignored):

```env
VITE_APP_BASE_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
VITE_OPENCAGE_API_KEY=            # optional, used for address geocoding
```

| Variable | Used for | Default |
|---|---|---|
| `VITE_APP_BASE_URL` | All API calls, and the Socket.IO URL is derived from it | `http://localhost:3000/api/v1` |
| `VITE_SOCKET_URL` | Socket.IO server | derived from the base URL |
| `VITE_OPENCAGE_API_KEY` | Geocoding in address fields | none |

No Google Maps key is set here. Maps render with Leaflet, and address search and directions go through the backend (`/api/v1/places/...`), which uses the backend's `GOOGLE_MAPS_API_KEY`.

> Vite reads env vars only when it starts. After changing `.env.local`, restart `npm run dev`.

---

## 4. Logging in locally

Follow **"First login"** in the backend README to create the first users. Then:

| Portal | URL |
|---|---|
| Super Admin | http://localhost:5173/superadmin/login |
| Company login (admin, dispatcher, HR, accounts etc.) | http://localhost:5173/ |
| Company sign-up | http://localhost:5173/register |

After login, users land in their role's area: `/admin`, `/dispatch`, `/Management` (HR), `/accounts`, `/fleetmaintenance`, `/compliance`, `/healthandsafety`, `/mechanics`, `/gps-dashboard`.

---

## 5. Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload (port 5173) |
| `npm run build` | Type-check (`tsc -b`) and production build into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run lint` | ESLint |

Production builds remove every `console.*` and `debugger` call (see `vite.config.ts`). Use the dev server when debugging.

---

## 6. Building for production (`dist.zip`)

The live server serves the frontend from a **`dist.zip` committed in the backend repo**, so a frontend change is not live until that zip is updated.

1. Create `.env.production.local` (git-ignored):
   ```env
   VITE_APP_BASE_URL=https://portal.logistiqinnovations.ca/api/v1
   VITE_SOCKET_URL=https://portal.logistiqinnovations.ca
   ```
2. Build:
   ```bash
   npm run build
   ```
3. Zip the **contents** of `dist/`, so `index.html` sits at the root of the zip, not inside a `dist/` folder:
   ```bash
   cd dist && zip -r ../dist.zip . && cd ..
   ```
4. Copy `dist.zip` into the backend repo root, commit it there, then deploy (see the backend README, "Deploy").

⚠️ If you forget step 1, the build points at `localhost:3000` and production breaks.

---

## 7. Common problems

| Problem | Fix |
|---|---|
| Login says "Network Error" | The backend isn't running on port 3000, or `VITE_APP_BASE_URL` is wrong. Check the browser console: it logs `VITE_APP_BASE_URL: ...` |
| Changed `.env.local` but nothing changed | Restart `npm run dev` |
| Address search or routes don't work | The backend needs `GOOGLE_MAPS_API_KEY` |
| Logged out instantly | Token expired or the backend `JWT_SECRET` changed. Clear localStorage and log in again |
| Fix is merged but not on the live site | `dist.zip` in the backend repo wasn't rebuilt (see section 6) |
| `npm run build` fails with TypeScript errors | Run `npx tsc -b` to see them. The build is stricter than the dev server |

---

## 8. Project layout

```
src/
  main.tsx, App.tsx        app entry
  routes/                  route groups per role (index.tsx is the top-level router)
  pages/                   screens: admin/, superadmin/, customer/, gpsDashboard/
  components/              layouts, headers and sidebars per portal, plus common/ widgets
  axios/                   apiClient.ts (base URL, token handling) and api/* modules
  redux/                   store and slices (user, superAdmin)
  services/, socket/       Socket.IO client
  contexts/, hooks/, customHooks/
  theme/                   colors and icons
```
