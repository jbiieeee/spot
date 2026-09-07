# S.P.O.T. Web Command Center

Production web dashboard for **Security Patrol Operations & Tracking**.
The app uses Firebase Auth, Cloud Firestore, and Storage directly.

## Included

- Dashboard, Guards, Checkpoints, Routes, Schedules, Patrol Logs, and Incidents
- Firebase Auth supervisor sign-in
- Guard face enrollment records for app-side login/attendance checks
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
4. Add your first SuperAdmin account in Authentication.
5. Create a Firestore database in production mode.
6. Add a matching `users/{uid}` document for the supervisor:

```txt
name     (string)  = "Your Name"
role     (string)  = "superadmin"
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
| `faceProfiles` | Enrolled guard face photos and detection metadata |
| `attendance`  | Guard time-in/time-out and face enrollment/login events |
| `incidents`   | Guard incident reports |

## Checkpoint App Sync Contract

The web checkpoint generator stores a unique `qrCode` string such as `SPOT-CP-ABC123`.
The Android scanner should decode that string, find the matching document in `checkpoints` by `qrCode`, and write a `checkpoint_logs` document with these fields:

```txt
guardId       (string)
guardName     (string)
checkpointId  (string)  // checkpoints document ID
checkpointName(string)
siteId        (string)
clientId      (string)
verified      (boolean)
timestamp     (timestamp)
```

The website listens to `checkpoint_logs` in real time and adds verified scans to the activity and notification stream. New sites and checkpoints created by an Admin carry the active `clientId`, keeping the web and field app records in the same client scope.

## Face Enrollment Notes

The web dashboard captures and stores an enrolled guard face profile; it does not perform full biometric identity matching by itself. When supported by the browser, native face detection is used to confirm that a face is present before enrollment. The guard/mobile app can read `faceProfiles/{guardId}` after the guard is authenticated and use its own on-device or backend biometric matcher for face login.

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
