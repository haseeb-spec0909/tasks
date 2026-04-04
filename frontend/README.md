# TMC TimeIntel - Frontend

A modern React 19 SPA for TMC TimeIntel - an AI-powered work intelligence platform.

## Prerequisites

- Node.js 18+ and npm/yarn
- Firebase account setup

## Setup

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Create a `.env.local` file with Firebase credentials:

```bash
cp .env.example .env.local
```

Then fill in your Firebase project details.

3. Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint on source files

## Project Structure

```
src/
├── components/
│   └── common/           # Reusable UI components
├── contexts/             # React contexts (Auth, Realtime)
├── hooks/                # Custom React hooks
├── services/             # API service layer
├── utils/                # Utility functions
└── styles/               # Global styles
```

## Key Features

- **Authentication**: Firebase Google OAuth with @tmcltd.ai domain verification
- **Real-time Updates**: Server-Sent Events (SSE) for live notifications
- **Task Management**: Multi-source task aggregation (Google Tasks, ProjectFlow)
- **Priority Management**: Drag-and-drop priority board
- **Calendar Integration**: Free/busy checking and task rescheduling
- **Analytics**: Personal and team stats dashboards
- **Responsive Design**: Mobile-first, dark mode support

## Architecture

### State Management
- **React Query**: Server state (data fetching, caching)
- **Zustand**: Client state (UI state, user preferences)
- **Context API**: Auth and realtime subscriptions

### Component Design
- Functional components with hooks
- Composition over inheritance
- Prop drilling minimized via context
- Reusable UI components in `common/`

### Styling
- Tailwind CSS 4 with custom color palette
- Dark mode support via `dark:` prefix
- Class variance authority for component variants

## Environment Variables

```
VITE_FIREBASE_API_KEY          - Firebase API key
VITE_FIREBASE_AUTH_DOMAIN      - Firebase auth domain
VITE_FIREBASE_PROJECT_ID       - Firebase project ID
VITE_FIREBASE_STORAGE_BUCKET   - Firebase storage bucket
VITE_FIREBASE_MESSAGING_SENDER_ID - Firebase messaging sender ID
VITE_FIREBASE_APP_ID           - Firebase app ID
VITE_ADMIN_EMAIL               - Admin email (haseeb@tmcltd.ai)
```

## API Integration

The frontend connects to the backend API at `/api` which is proxied to `http://localhost:8080` in development.

See `src/services/api.js` for all available endpoints.

## Build & Deployment

Build for production:

```bash
npm run build
```

Deploy to Firebase Hosting:

```bash
firebase deploy --only hosting
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Notes

- Only @tmcltd.ai email addresses can authenticate
- Backend API must be running for full functionality
- SSE requires persistent server connection
