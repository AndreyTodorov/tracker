# Firebase Setup Guide

This guide will walk you through setting up Firebase for the Investment Portfolio Tracker.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter a project name (e.g., "investment-tracker")
4. Disable Google Analytics (optional, but not needed for this project)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, click "Authentication" in the left sidebar
2. Click "Get started"
3. Click on the "Sign-in method" tab
4. Enable "Email/Password" authentication:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"

## Step 3: Create Firestore Database

1. Click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Select "Start in production mode" (we'll set up rules next)
4. Choose a location closest to your users
5. Click "Enable"

## Step 4: Configure Firestore Security Rules

1. In Firestore Database, click on the "Rules" tab
2. Replace the rules with the following:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user document
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Users can read all investments but only write their own
    match /investments/{investmentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

3. Click "Publish"

## Step 5: Register Your Web App

1. In Project Overview, click the web icon (</>)
2. Enter an app nickname (e.g., "Investment Tracker Web")
3. **Important:** Check "Also set up Firebase Hosting" if you want to use Firebase hosting (optional)
4. Click "Register app"
5. You'll see your Firebase configuration object - **COPY THIS!**

It will look like:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 6: Configure Environment Variables

### For Local Development:

1. Create a `.env` file in the project root (copy from `.env.example`)
2. Fill in the values from your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### For GitHub Pages Deployment:

1. Go to your GitHub repository
2. Click "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret" for each of these:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

## Step 7: Enable GitHub Pages

1. Go to your GitHub repository
2. Click "Settings" > "Pages"
3. Under "Build and deployment":
   - Source: "GitHub Actions"
4. The workflow will automatically deploy when you push to the branch

## Step 8: Update Firebase Authorized Domains

1. In Firebase Console, go to "Authentication" > "Settings" > "Authorized domains"
2. Add your GitHub Pages domain:
   - `your-username.github.io`
3. Click "Add domain"

## Testing Your Setup

1. Run locally: `pnpm dev`
2. Try creating an account
3. Try adding an investment
4. Check Firestore to see if data is being saved

## Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"
- Make sure your domain is added to authorized domains in Firebase Console

### "Missing or insufficient permissions"
- Check your Firestore security rules are correctly set up

### Environment variables not working
- Make sure `.env` file is in the root directory
- Restart your dev server after changing `.env`
- Variable names must start with `VITE_`

## Support

If you need help, check:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
