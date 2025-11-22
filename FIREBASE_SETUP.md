# Firebase Setup Guide - Realtime Database

This guide will walk you through setting up Firebase Realtime Database for the Investment Portfolio Tracker.

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

## Step 3: Create Realtime Database

1. Click "Realtime Database" in the left sidebar (NOT "Firestore Database")
2. Click "Create Database"
3. Choose a database location closest to your users
4. Select "Start in **locked mode**" (we'll set up rules next)
5. Click "Enable"

## Step 4: Configure Realtime Database Security Rules

### Method 1: Copy from the database.rules.json file (Recommended)

1. Open the `database.rules.json` file in your project root
2. Copy ALL the contents
3. In Firebase Console, go to **Realtime Database** → **Rules** tab
4. **Delete everything** in the rules editor
5. Paste the contents from `database.rules.json`
6. Click "Publish"

### Method 2: Copy from here

In Realtime Database, click on the "Rules" tab and paste this **JSON format**:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "investments": {
      ".read": "auth != null",
      "$investmentId": {
        ".write": "auth != null && (!data.exists() || data.child('userId').val() === auth.uid)"
      }
    }
  }
}
```

### What These Rules Do:

- **Users**: Any authenticated user can read user profiles, but users can only write their own data
- **Investments**:
  - Any authenticated user can read all investments
  - Users can only create new investments or edit/delete their own investments

### Important Notes:

- Make sure you're in **Realtime Database** (not Firestore Database)
- The rules format is **JSON** for Realtime Database
- Click "Publish" to save the rules

## Step 5: Register Your Web App

1. In Project Overview, click the web icon (</>)
2. Enter an app nickname (e.g., "Investment Tracker Web")
3. **Do NOT** check "Also set up Firebase Hosting" (we're using GitHub Pages)
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
  appId: "1:123456789:web:abc123",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com"
};
```

**Important:** Make sure you have the `databaseURL` field! This is required for Realtime Database.

## Step 6: Get Your Database URL

If the config doesn't show `databaseURL`:

1. Go to **Realtime Database** in Firebase Console
2. Look at the top of the page - you'll see your database URL
3. It looks like: `https://your-project-default-rtdb.firebaseio.com`
4. Copy this URL - you'll need it for environment variables

## Step 7: Configure Environment Variables

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
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
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
   - `VITE_FIREBASE_DATABASE_URL` ⚠️ **Don't forget this one!**

## Step 8: Enable GitHub Pages

1. Go to your GitHub repository
2. Click "Settings" > "Pages"
3. Under "Build and deployment":
   - Source: "GitHub Actions"
4. The workflow will automatically deploy when you push to the main branch

## Step 9: Update Firebase Authorized Domains

1. In Firebase Console, go to "Authentication" > "Settings" > "Authorized domains"
2. Add your GitHub Pages domain:
   - `your-username.github.io`
3. Add localhost for local development (should already be there):
   - `localhost`
4. Click "Add domain"

## Testing Your Setup

1. Run locally: `pnpm dev`
2. Try creating an account
3. Try adding an investment
4. Check Realtime Database to see if data is being saved:
   - Go to Realtime Database → Data tab
   - You should see `users` and `investments` nodes

## Database Structure

Your Realtime Database will have this structure:

```
{
  "users": {
    "user-id-1": {
      "id": "user-id-1",
      "email": "user@example.com",
      "displayName": "John Doe",
      "createdAt": 1234567890,
      "shareCode": "ABC12345",
      "sharedPortfolios": ["XYZ67890"]
    }
  },
  "investments": {
    "investment-id-1": {
      "userId": "user-id-1",
      "userName": "John Doe",
      "assetName": "Bitcoin",
      "assetSymbol": "bitcoin",
      "buyPrice": 50000,
      "investmentAmount": 1000,
      "quantity": 0.02,
      "purchaseDate": 1234567890,
      "createdAt": 1234567890
    }
  }
}
```

## Troubleshooting

### "Permission denied"
- Check that your Database Rules are correctly set up
- Make sure you're authenticated (logged in)
- Verify the rules were published

### "Database URL not found"
- Make sure you added `databaseURL` to your `.env` file
- Verify the URL format: `https://PROJECT-ID-default-rtdb.firebaseio.com`
- Check that you copied the correct URL from Firebase Console

### Environment variables not working
- Make sure `.env` file is in the root directory
- Restart your dev server after changing `.env`
- Variable names must start with `VITE_`

### "Can't find Realtime Database"
- Don't confuse with Firestore - you need **Realtime Database**
- Look for "Realtime Database" in the left sidebar (with the barrel/database icon)
- NOT "Firestore Database" (with the document icon)

## Important Differences from Firestore

This app uses **Firebase Realtime Database**, not Firestore:

| Feature | Realtime Database | Firestore |
|---------|------------------|-----------|
| Data Format | JSON tree | Collections/Documents |
| Rules Format | JSON | Security Rules Language |
| Queries | Limited | Advanced |
| Real-time | Yes | Yes |
| Offline | Yes | Yes |

Make sure you're using **Realtime Database** throughout!

## Support

If you need help, check:
- [Firebase Realtime Database Documentation](https://firebase.google.com/docs/database)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
