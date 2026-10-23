This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

For a production preview of the static export, run `npm run build` followed by `npm run start`.

## Android APK

The Android app is a Trusted Web Activity that opens the Firebase-hosted PWA. It requires internet access for Firebase sign-in and cross-device case sync; it is intended for direct APK sharing, not Play Store publishing.

Build and deploy the web app from the repository root:

```powershell
npm run build
firebase deploy --only hosting --project adv-diary-100ff
```

Build the signed APK from this directory after the Android JDK and SDK are configured:

```powershell
.\android-twa\build-apk.ps1
```

Keep `android-twa/advdiary-release.jks` and the locally encrypted signing-password file. They are required to sign future APK updates with the same identity; never commit or share the keystore publicly.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Hosting

Production builds use Next.js static export and are deployed to Firebase Hosting as described above. The app uses Firebase Authentication and Firestore, so sign-in and cross-device data sync require an internet connection.

## Security

Copy `.env.example` to `.env.local` and keep `.env.local` out of Git. Firebase web configuration, including `NEXT_PUBLIC_FIREBASE_API_KEY`, is included in browser code and is not a server secret. Restrict that key to the production site and only the Firebase APIs this app uses in Google Cloud Console. Do not put Firebase Admin credentials or service-account keys in this client app.

Firestore access is enforced by `firestore.rules`; deploy the rules whenever they change. Keep the rules owner-scoped and verify them against the Firebase Emulator before broadening access.
