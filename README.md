# S.P.O.T. Web Command Center

Production web dashboard for **Security Patrol Operations & Tracking**.
The app uses Firebase Auth, Cloud Firestore, and Storage directly.

## Included

- Dashboard, Guards, Checkpoints, Routes, Schedules, Patrol Logs, and Incidents
- Firebase Auth supervisor sign-in
- Real-time Firestore listeners with persistent offline cache
- QR code generator for checkpoints
- CSV export for patrol logs
- Firestore security rules in `firestore.rules`

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Fill every `VITE_FB_*` value in `.env` before signing in. The app uses only your configured Firebase project.

## Firebase Setup

1. Create a Firebase project.
2. Register a Web app and copy its config values into `.env`.
3. Enable Email/Password in Firebase Authentication.
4. Add your first supervisor account in Authentication.
5. Create a Firestore database in production mode.
6. Add a matching `users/{uid}` document for the supervisor:

```txt
name     (string)  = "Your Name"
role     (string)  = "supervisor"
email    (string)  = "admin@spot.local"
active   (boolean) = true
```

7. Publish `firestore.rules` in the Firebase Console.
8. Enable Storage if your guard app will upload incident evidence.

## Shared Collections

| Collection    | Purpose |
| ------------- | ------- |
| `users`       | Supervisors and guards |
| `sites`       | Managed patrol sites |
| `checkpoints` | Physical QR scan points |
| `routes`      | Ordered checkpoint sequences |
| `schedules`   | Guard shift assignments |
| `patrolLogs`  | Field scan records |
| `incidents`   | Guard incident reports |

## Project Structure

```txt
src/
  App.jsx
  index.css
  context/AuthContext.jsx
  lib/firebase.js
  lib/dataSource.js
  components/
  pages/
firestore.rules
.env.example
```

## Build

```bash
npm run build
```
