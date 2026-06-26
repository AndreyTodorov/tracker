# 📈 Investment Portfolio Tracker

A beautiful, real-time cryptocurrency investment portfolio tracker built with React, TypeScript, Firebase, and Tailwind CSS. Track your crypto investments and share your portfolio with friends!

## ✨ Features

- **Real-time Price Updates**: Crypto prices update automatically every 60 seconds via CoinGecko API
- **Multi-User Support**: Full authentication system with email/password
- **Portfolio Sharing**: Generate unique share codes to let friends view your investments
- **Beautiful UI**: Modern glass-morphism design with smooth animations
- **Live Profit/Loss Tracking**: See your gains and losses in real-time with percentage and absolute values
- **Portfolio Analytics**: View total portfolio value, invested amount, and overall profit/loss
- **Multiple Views**:
  - My Portfolio: Your personal investments
  - Shared: View portfolios from friends you've joined
  - Everyone: See all public investments
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS with custom glass-morphism effects
- **Backend**: Firebase (Authentication + Realtime Database)
- **API**: CoinGecko (free tier)
- **Deployment**: GitHub Pages
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **Date Formatting**: date-fns

## 📦 Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/tracker.git
cd tracker
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up Firebase**

Follow the detailed guide in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) to:
- Create a Firebase project
- Enable Authentication (Email/Password)
- Set up the Realtime Database
- Configure security rules
- Get your Firebase credentials

> Prefer not to set up a real Firebase project yet? Skip ahead to
> [Local Development with the Firebase Emulator](#-local-development-with-the-firebase-emulator)
> to run everything offline.

4. **Configure environment variables**

Create a `.env` file in the root directory (copy from [`.env.example`](./.env.example)):
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
```

5. **Run the development server**
```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

This connects to your **real** Firebase project (the values in `.env`). To
develop against a local, throwaway database instead, use the emulator below.

## 🧪 Local Development with the Firebase Emulator

Don't want to touch your production database while developing? The project is
wired up for the **Firebase Local Emulator Suite**, which runs Authentication
and the Realtime Database entirely on your machine — isolated from production
and starting from an empty dataset. No real Firebase credentials (or even a
`.env` file) are required.

**Prerequisite — Java (JDK):** the Auth and Database emulators run on the JVM.
```bash
java -version            # verify a JDK is installed
brew install openjdk@17  # macOS, if you don't have one
```
> The pinned `firebase-tools` (v13) works with **JDK 17+**. Newer
> `firebase-tools` (v14+) require **JDK 21+** — install a newer JDK if you
> bump that dependency.

**Run the app against the emulator (one command):**
```bash
pnpm dev:emulator
```
This starts the emulators and the Vite dev server together. Then open:
- **App:** `http://localhost:5173`
- **Emulator UI** (inspect/edit Auth users & DB data): `http://localhost:4000`

Or run the emulators on their own:
```bash
pnpm emulators   # Auth :9099, Database :9000, UI :4000
```

**How it works:**
- `pnpm dev:emulator` runs Vite in `--mode emulator`, loading
  [`.env.emulator`](./.env.emulator). That file sets
  `VITE_USE_FIREBASE_EMULATOR=true` plus throwaway config, so
  `src/config/firebase.ts` redirects all Auth and Database traffic to the local
  emulators instead of production.
- The emulator enforces the same rules from
  [`database.rules.json`](./database.rules.json), so you test against the real
  security model.
- Data lives in memory and resets when you stop the emulator. To persist it
  between runs, export on exit and import next time:
  ```bash
  # first run creates the snapshot on exit
  firebase emulators:start --export-on-exit=./.emulator-data
  # later runs restore it
  firebase emulators:start --import=./.emulator-data --export-on-exit=./.emulator-data
  ```
  (`./.emulator-data` is git-ignored.)
- Plain `pnpm dev` is unaffected — it still uses your real project via `.env`.

## 🏗️ Building for Production

```bash
pnpm build
```

The built files will be in the `dist` directory.

## 🌐 Deployment to GitHub Pages

This project is configured to automatically deploy to GitHub Pages using GitHub Actions.

1. **Add Firebase secrets to GitHub**:
   - Go to your repository settings
   - Navigate to Secrets and variables > Actions
   - Add all Firebase environment variables as secrets

2. **Enable GitHub Pages**:
   - Go to repository Settings > Pages
   - Set Source to "GitHub Actions"

3. **Push to your branch**:
```bash
git push origin your-branch
```

The workflow will automatically build and deploy your app!

## 📱 How to Use

### First Time Setup
1. **Create an Account**: Register with your email and password
2. **Get Your Share Code**: Click "Share Portfolio" to see your unique code
3. **Add Your First Investment**:
   - Search for a cryptocurrency (e.g., Bitcoin, Dogecoin)
   - Enter the price you bought it at
   - Enter how much money you invested
   - Click "Add Investment"

### Sharing Your Portfolio
1. Click "Share Portfolio" in the header
2. Copy your unique 8-character share code
3. Share it with friends via text, email, etc.

### Joining a Friend's Portfolio
1. Click "Share Portfolio"
2. Enter your friend's share code in the "Join a Portfolio" section
3. Click "Join Portfolio"
4. Switch to the "Shared" tab to view their investments

### Viewing Your Progress
- **My Portfolio**: Shows only your investments
- **Shared**: Shows investments from portfolios you've joined
- **Everyone**: Shows all investments from all users

The dashboard shows:
- Current value of each investment
- Profit/Loss in dollars and percentage
- Total portfolio value
- Overall profit/loss
- Live price updates every 30 seconds

## 🎨 Features Breakdown

### Real-time Price Updates
- Automatically fetches crypto prices every 30 seconds
- Uses CoinGecko's free API (no API key required)
- Caches prices to minimize API calls
- Shows "LIVE" indicator when prices are updating

### Investment Management
- Search cryptocurrencies by name
- Auto-calculate quantity based on investment amount
- Shows current price vs. buy price
- Real-time profit/loss calculation
- Delete your own investments
- Edit functionality (future enhancement)

### Portfolio Sharing System
- Each user gets a unique 8-character share code
- Share codes are automatically generated
- Join multiple friend portfolios
- View shared portfolios in dedicated tab
- Can't join your own portfolio (validation)

### Beautiful UI/UX
- Glass-morphism design with backdrop blur
- Gradient backgrounds
- Smooth animations and transitions
- Color-coded profit (green) and loss (red)
- Responsive grid layouts
- Mobile-friendly navigation
- Loading states and spinners
- Empty states with helpful messages

## 🔒 Security

- Firebase Authentication for user management
- Firestore security rules prevent unauthorized access
- Users can only delete their own investments
- Read access requires authentication
- Environment variables for sensitive data

## 📊 Firebase Structure

### Collections

**users**
```javascript
{
  id: string,
  email: string,
  displayName: string,
  createdAt: timestamp,
  shareCode: string,
  sharedPortfolios: string[]
}
```

**investments**
```javascript
{
  id: string,
  userId: string,
  userName: string,
  assetName: string,
  assetSymbol: string,
  buyPrice: number,
  investmentAmount: number,
  quantity: number,
  purchaseDate: timestamp,
  createdAt: timestamp
}
```

## 🛠️ Development

### Project Structure
```
src/
├── components/
│   ├── auth/           # Login, Register, AuthLayout
│   ├── investments/    # Investment form, card, list, summary
│   ├── layout/         # Header, Dashboard
│   └── ui/             # Reusable components (Button, Input, Card, Modal)
├── config/             # Firebase configuration
├── context/            # React context (AuthContext)
├── hooks/              # Custom hooks (useInvestments, useCryptoPrices)
├── services/           # API services (auth, investment, coingecko)
├── types/              # TypeScript type definitions
├── utils/              # Helper functions (calculations, formatters)
└── App.tsx             # Main app component
```

### Key Technologies

- **React Hook Form**: Form validation and management
- **Firebase SDK**: Authentication and Firestore database
- **CoinGecko API**: Real-time cryptocurrency prices
- **Tailwind CSS**: Utility-first styling
- **TypeScript**: Type safety and better DX

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- [CoinGecko](https://www.coingecko.com/) for the free crypto API
- [Firebase](https://firebase.google.com/) for backend services
- [Tailwind CSS](https://tailwindcss.com/) for the styling framework
- [Lucide](https://lucide.dev/) for the beautiful icons

## 📧 Support

If you have any questions or need help, please open an issue on GitHub.

---

Built with ❤️ using React, TypeScript, and Firebase
