# 📈 Investment Portfolio Tracker

A beautiful, real-time cryptocurrency investment portfolio tracker built with React, TypeScript, Firebase, and Tailwind CSS. Track your crypto investments and share your portfolio with friends!

## ✨ Features

- **Real-time Price Updates**: Crypto prices update automatically every 60 seconds via CoinGecko API
- **Multi-User Support**: Full authentication system with email/password
- **Portfolio Sharing**: Generate unique share codes to let friends view your investments
- **Beautiful UI**: Modern glass-morphism design with smooth animations
- **Live Profit/Loss Tracking**: See your gains and losses in real-time with percentage and absolute values
- **Portfolio Analytics**: View total portfolio value, invested amount, and overall profit/loss
- **Multi-Currency**: Hold investments in USD, EUR, GBP, JPY, CHF, CAD or AUD, and pick one currency to see your totals in
- **Multiple Views**:
  - My Portfolio: Your personal investments
  - Shared: View portfolios from friends you've joined
  - Everyone: Portfolios from users who opted in to public listing
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
- **Testing**: Vitest + Testing Library

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

## 🧪 Local Development with the Firebase Emulator (Docker)

Don't want to touch your production database — or install Java — while
developing? The emulators (Authentication + Realtime Database) run in a
**Docker container**, isolated from production and starting from an empty
dataset. No JDK, no `firebase-tools`, and no real Firebase credentials are
needed on your machine; you only run Vite on the host.

**Prerequisite:** Docker Desktop running.

**Run the app against the emulator (one command):**
```bash
pnpm dev:docker
```
This starts the emulator container and the Vite dev server together. Then open:
- **App:** `http://localhost:5173`
- **Emulator UI** (inspect/edit Auth users & DB data): `http://localhost:4000`

Or run just the emulators:
```bash
pnpm emulators:docker   # docker compose up
```

**How it works:**
- Vite runs in `--mode emulator`, loading [`.env.emulator`](./.env.emulator),
  which sets `VITE_USE_FIREBASE_EMULATOR=true` plus throwaway config so
  `src/config/firebase.ts` redirects all Auth and Database traffic to the
  container (`127.0.0.1:9099/9000`) instead of production.
- `docker/Dockerfile` bundles a JRE + `firebase-tools` and pre-caches the
  emulator JARs; `docker-compose.yml` publishes ports `9099` (auth),
  `9000` (database), `4000` (UI), `4400` (hub).
- The container loads the same [`database.rules.json`](./database.rules.json)
  (bind-mounted) and runs the `demo-tracker` demo project, so you test against
  the real security model with no login.
- Data persists in a named Docker volume across restarts; wipe it with
  `docker compose down -v`.
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
2. Copy your unique 8-character share code, or the shareable link
3. Share it with friends via text, email, etc.

Anyone with the code can view your portfolio, and viewing it adds it to their
Shared tab. Your investments are **not** visible on the Everyone tab unless you
tick "Show my portfolio on the Everyone tab" in the same modal.

### Joining a Friend's Portfolio
1. Click "Share Portfolio"
2. Enter your friend's share code in the "Join a Portfolio" section
3. Click "Join Portfolio"
4. Switch to the "Shared" tab to view their investments

### Choosing Your Totals Currency
Pick a currency from the selector in the header. The **Total Value** and
**Total Profit/Loss** cards are converted into it, so a portfolio spread across
several currencies still adds up to one number. Individual investments keep the
currency they were bought in. Your choice is remembered in the browser.

Exchange rates are derived from the CoinGecko prices already being fetched — no
separate FX service is involved. If prices can't be fetched, the totals say so
rather than showing a converted figure that isn't.

### Changing Your Display Name
Click your name in the header. Renaming updates it everywhere it appears,
including on investments people already see in their Shared tab.

### Viewing Your Progress
- **My Portfolio**: Shows only your investments
- **Shared**: Shows investments from portfolios you've joined
- **Everyone**: Shows investments from users who opted in to public listing

The dashboard shows:
- Current value of each investment
- Profit/Loss in the investment's own currency, as an amount and a percentage
- Total portfolio value, converted to your chosen currency
- Overall profit/loss
- Live price updates every 60 seconds

## 🎨 Features Breakdown

### Real-time Price Updates
- Automatically fetches crypto prices every 60 seconds
- Uses CoinGecko's free API (no API key required)
- Caches prices per coin and currency, so switching tabs or changing your
  totals currency costs no extra requests
- Collapses duplicate in-flight requests into one
- Backs off for a few minutes if CoinGecko rate-limits, and keeps showing the
  last known prices while it waits
- Shows "LIVE" indicator when prices are updating

### Investment Management
- Search cryptocurrencies by name
- Auto-calculate quantity based on investment amount
- Shows current price vs. buy price
- Real-time profit/loss calculation
- Edit or delete your own investments
- Changing an investment's currency converts its buy price rather than just
  relabelling it

### Portfolio Sharing System
- Each user gets a unique 8-character share code
- Share codes are automatically generated
- Join multiple friend portfolios
- View shared portfolios in dedicated tab
- Can't join your own portfolio (validation)
- Public listing on the Everyone tab is opt-in per user

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

Access is enforced by [Realtime Database rules](./database.rules.json), not just
by the UI:

- Firebase Authentication for user management
- A user's own record (`users/{uid}`) is readable only by that user, so email
  addresses are never exposed to anyone else
- Investments live under `investments/{ownerUid}` and are readable by the owner,
  by users who joined with the owner's share code, and by everyone signed in
  only if the owner opted in to public listing
- Only the owner can write or delete their own investments
- Share codes resolve through a lookup-only `shareCodeIndex` node, so codes
  cannot be enumerated and the index holds no personal data
- Each account can claim exactly one share code
- Stored values are validated server-side: currencies must be one of the
  supported codes, amounts must be positive, and text fields are length-capped
- Environment variables for configuration

> **Deploying rule changes:** the rules are only enforced once published. Run
> `firebase deploy --only database` after pulling changes to
> `database.rules.json`.

## 📊 Firebase Structure

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for the full tree and setup steps.

**users/{uid}** — private to the owner
```javascript
{
  id: string,
  email: string,
  displayName: string,
  createdAt: timestamp,
  shareCode: string,
  sharedPortfolios: { [ownerUid: string]: shareCode }  // portfolios joined
}
```

**shareCodeIndex/{code}** — lookup only, no personal data
```javascript
{ uid: string, displayName: string }
```

**publicProfiles/{uid}** — present only for users listed on the Everyone tab
```javascript
{ displayName: string }
```

**investments/{ownerUid}/{investmentId}**
```javascript
{
  userId: string,
  userName: string,
  assetName: string,
  assetSymbol: string,
  coinId: string,       // CoinGecko id used for price lookups
  buyPrice: number,
  investmentAmount: number,
  quantity: number,
  currency: string,     // USD | EUR | GBP | JPY | CHF | CAD | AUD
  name?: string,        // optional label, e.g. "Long-term"
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
│   ├── error/          # ErrorBoundary
│   ├── investments/    # Investment form, card, list, summary, share modal
│   ├── layout/         # Header, Dashboard, ProfileModal
│   ├── public/         # Shared-portfolio viewer
│   └── ui/             # Reusable components (Button, Input, Card, Modal)
├── config/             # Firebase configuration
├── context/            # React context (Auth, Toast, Currency)
├── hooks/              # Custom hooks (useInvestments, useCryptoPrices)
├── services/           # API services (auth, investment, coingecko)
├── types/              # TypeScript type definitions
├── utils/              # Helpers (calculations, currency, formatters)
└── App.tsx             # Main app component
```

### Testing

```bash
pnpm test           # single run
pnpm test:watch     # re-run on change
pnpm test:ui        # Vitest UI
pnpm test:coverage  # single run with coverage
pnpm lint
```

### Key Technologies

- **React Hook Form**: Form validation and management
- **Firebase SDK**: Authentication and Realtime Database
- **CoinGecko API**: Real-time cryptocurrency prices, and the source of the
  exchange rates used for portfolio totals
- **Tailwind CSS**: Utility-first styling
- **TypeScript**: Type safety and better DX
- **Vitest**: Unit and component tests

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
