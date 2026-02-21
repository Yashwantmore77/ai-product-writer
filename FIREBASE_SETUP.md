Firebase setup: enable Email/Password and publish Firestore rules

1) Enable Email/Password sign-in in the Firebase Console

- Open the Firebase Console for your project: https://console.firebase.google.com/
- Select your project → Authentication → "Sign-in method".
- Click on "Email/Password", enable it, and save.

2) Publish Firestore rules

- In the Firebase Console, go to Firestore Database → Rules.
- Replace the rules with the contents of `firebase.rules` in this repo and click "Publish".

Recommended (production) rules are already in `firebase.rules` and restrict the `users/{userId}`
document so only the authenticated user with matching `request.auth.uid` can read/write it.

3) Optional: deploy rules via Firebase CLI

Install and login (if you prefer CLI):

```bash
npm install -g firebase-tools
firebase login
```

Then initialize (if needed) and deploy only rules:

```bash
firebase init firestore   # choose rules and select your project (only do once)
firebase deploy --only firestore:rules
```

4) After enabling auth and publishing rules

- Restart your Next.js dev server:

```bash
npm run dev
```

- Sign up and sign in from the app. If you see "Missing or insufficient permissions", ensure:
  - The Firebase project matches the `.env.local` config values.
  - Email/Password auth is enabled in the Console.
  - The Firestore rules were published.

If you'd like, I can also add a server-side Admin endpoint (using a Firebase Admin SDK) to
perform privileged writes or to mint custom tokens — tell me if you want that.
