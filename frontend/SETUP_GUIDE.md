# TMC TimeIntel Frontend - Setup Guide

## Project Overview

This is a production-grade React 19 SPA for TMC TimeIntel - an AI-powered work intelligence platform. It's hosted on Firebase Hosting at `timeintel.tmcltd.ai`.

## Core Infrastructure Created

### 1. Build & Development Setup
- **Vite 5** - Lightning-fast development server and build tool
- **React 19** - Latest React with improved performance and features
- **React Router 7** - Client-side routing
- **TailwindCSS 4** - Utility-first CSS framework with dark mode

### 2. State Management
- **React Query 5** - Server state (data fetching, caching, synchronization)
- **Zustand** - Lightweight client state management (future use)
- **Context API** - Auth and realtime events

### 3. Key Dependencies
- `firebase` - Authentication and hosting
- `axios` - HTTP client with interceptors
- `dayjs` - Date/time utilities
- `recharts` - Data visualization
- `@dnd-kit/*` - Drag-and-drop for priority board
- `@headlessui/react` - Headless UI components
- `lucide-react` - Icon library
- `class-variance-authority` - Component variant management
- `clsx` - Conditional CSS classes

## File Structure

```
frontend/
├── src/
│   ├── App.jsx                    # Main app with routing
│   ├── main.jsx                   # React entry point
│   ├── components/
│   │   └── common/                # Reusable UI components
│   │       ├── Layout.jsx         # Main layout wrapper
│   │       ├── Sidebar.jsx        # Navigation sidebar
│   │       ├── TopBar.jsx         # Header with user menu
│   │       ├── TaskCard.jsx       # Task display component
│   │       ├── Modal.jsx          # Dialog component
│   │       ├── ConfirmDialog.jsx  # Confirmation dialog
│   │       ├── EmptyState.jsx     # Empty state placeholder
│   │       ├── LoadingSpinner.jsx # Loading indicator
│   │       ├── PriorityChip.jsx   # Priority badge
│   │       ├── SourceBadge.jsx    # Task source badge
│   │       └── StatusBadge.jsx    # Status badge
│   ├── contexts/
│   │   ├── AuthContext.jsx        # Firebase auth + domain check
│   │   └── RealtimeContext.jsx    # SSE for live updates
│   ├── hooks/
│   │   ├── useTasks.js            # Task queries & mutations
│   │   ├── useCalendar.js         # Calendar operations
│   │   ├── useStats.js            # Statistics queries
│   │   └── useSettings.js         # Settings management
│   ├── services/
│   │   └── api.js                 # Axios instance + all endpoints
│   ├── utils/
│   │   ├── colors.js              # Color mapping utilities
│   │   └── formatters.js          # Data formatting utilities
│   └── styles/
│       └── globals.css            # Global styles with Tailwind
├── index.html                     # HTML entry point
├── package.json                   # Dependencies
├── vite.config.js                 # Vite configuration
├── tailwind.config.js             # Tailwind color palette
├── postcss.config.js              # PostCSS plugins
├── .eslintrc.cjs                  # ESLint rules
├── .env.example                   # Environment variables template
├── .gitignore                     # Git ignore rules
└── README.md                      # Project documentation
```

## Installation & Setup

### Prerequisites
- Node.js 18+ (use `nvm` if needed)
- npm or yarn
- Firebase project (for credentials)

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Configure Environment

Copy the example env file and add Firebase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase project details. You can find these in Firebase Console > Project Settings.

### Step 3: Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

Development server includes:
- Hot module replacement (HMR)
- API proxy to `http://localhost:8080` (backend)
- Fast refresh on code changes

### Step 4: Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

## Authentication

### Overview
- Uses Firebase Google OAuth
- Enforces `@tmcltd.ai` domain restriction
- Admin email: `haseeb@tmcltd.ai`
- JWT token attached to all API requests
- Auto-redirect to login on 401 responses

### Implementation
Located in `src/contexts/AuthContext.jsx`:

```jsx
import { useAuth } from '@/contexts/AuthContext'

export default function MyComponent() {
  const { user, signIn, signOut, loading } = useAuth()
  
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" />
  
  return <div>{user.email}</div>
}
```

## API Integration

### Base Setup
- BaseURL: `/api` (proxied to backend in dev)
- Auth interceptor adds Firebase JWT
- Response interceptor handles 401 → redirect to login

### Hooks Pattern
All API calls use React Query hooks for automatic caching, refetching, and synchronization:

```jsx
import { useTasksQuery, useUpdateTask } from '@/hooks/useTasks'

export default function Tasks() {
  const { data: tasks, isLoading } = useTasksQuery({ priority: 'P1' })
  const updateMutation = useUpdateTask()
  
  const handleUpdate = (id, data) => {
    updateMutation.mutate({ id, data })
  }
  
  return (...)
}
```

## Real-time Updates

### SSE Connection
The `RealtimeContext` establishes a persistent SSE connection that listens for:
- `schedule_updated` - Calendar changes
- `task_changed` - Task modifications
- `notification` - System notifications
- `pf_sync_complete` - ProjectFlow sync complete

### Usage
```jsx
import { useRealtime } from '@/contexts/RealtimeContext'

export default function MyComponent() {
  const { subscribe } = useRealtime()
  
  useEffect(() => {
    const unsubscribe = subscribe('task_changed', (data) => {
      console.log('Task updated:', data)
      // Re-fetch or update UI
    })
    
    return unsubscribe
  }, [subscribe])
}
```

## Styling & Design System

### Color Palette (Tailwind)
```js
{
  'tmc-primary': '#3B82F6',           // Blue
  'tmc-one-on-one': '#3B82F6',        // Blue
  'tmc-team-meeting': '#7C3AED',      // Purple
  'tmc-external': '#EC4899',          // Pink
  'tmc-personal': '#FB7185',          // Coral
  'tmc-google-task': '#10B981',       // Green
  'tmc-projectflow': '#0D9488',       // Teal
  'tmc-focus': '#4F46E5',             // Indigo
  'tmc-habit': '#F59E0B',             // Amber
}
```

### Dark Mode
All components support dark mode via `dark:` prefix:

```jsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  Dark mode ready!
</div>
```

### Component Utilities
- `formatDuration()` - Convert minutes to "2h 30m"
- `formatRelativeDate()` - Convert date to "Today", "Tomorrow", "In 3 days"
- `formatTimeRange()` - Format time intervals
- `getPriorityLabel()` - Get priority text
- `getStatusLabel()` - Get status text
- `getCategoryColor()` - Get hex color for event category
- `getPriorityColorClass()` - Get Tailwind classes for priority

## Component Architecture

### Common Components
All reusable components are in `src/components/common/`:

```jsx
// TaskCard - Displays task with expandable details
<TaskCard 
  task={taskData}
  onComplete={handleComplete}
  onClick={handleSelect}
/>

// Modal - Dialog component
<Modal isOpen={open} onClose={handleClose} title="Create Task">
  <Form />
</Modal>

// ConfirmDialog - Confirmation dialog for destructive actions
<ConfirmDialog
  isOpen={open}
  onClose={handleClose}
  isDangerous
  onConfirm={handleDelete}
  message="Are you sure?"
/>

// EmptyState - Display when no data
<EmptyState
  icon={TaskIcon}
  title="No tasks"
  description="Create your first task"
  actionLabel="New Task"
  onAction={handleCreate}
/>

// LoadingSpinner - Loading indicator
<LoadingSpinner size="md" />
```

### Layout System
- `Layout` - Main wrapper with sidebar + top bar
- `Sidebar` - Navigation (collapsible on mobile)
- `TopBar` - Header with search, notifications, user menu

All pages are wrapped in `<Layout>`:

```jsx
export default function TaskPage() {
  return (
    <Layout>
      <h1>Tasks</h1>
      {/* Page content */}
    </Layout>
  )
}
```

## Available Scripts

```bash
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # Build for production (dist/)
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
```

## Environment Variables

Create `.env.local` with:

```env
# Firebase credentials
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Admin email
VITE_ADMIN_EMAIL=haseeb@tmcltd.ai
```

## Deployment to Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Build the project:
```bash
npm run build
```

3. Deploy:
```bash
firebase deploy --only hosting
```

The app will be available at `timeintel.tmcltd.ai`

## Development Guidelines

### Code Style
- Use functional components with hooks
- Prefer composition over inheritance
- Keep components small and focused
- Use custom hooks for logic extraction

### Component Props
All components use JSDoc for prop documentation:

```jsx
/**
 * TaskCard component - displays a single task
 * @param {Object} task - Task data object
 * @param {string} task.id - Task ID
 * @param {string} task.title - Task title
 * @param {Function} onComplete - Callback when task completed
 * @param {Function} onClick - Callback on card click
 */
export default function TaskCard({ task, onComplete, onClick }) {
  // ...
}
```

### Error Handling
- Use React Query's error states
- Show user-friendly error messages
- Log errors to console in development
- Retry failed requests automatically (React Query)

### Performance
- Code split route components (lazy load)
- Use React.memo for expensive components
- Implement virtualization for long lists
- Cache API responses with React Query

## Troubleshooting

### Port 5173 already in use
```bash
npm run dev -- --port 3000
```

### Firebase auth not working
- Verify `.env.local` has correct Firebase credentials
- Check that your Firebase project allows Google sign-in
- Ensure Authorized domains includes `localhost:5173`

### API calls failing
- Ensure backend is running on `http://localhost:8080`
- Check network tab in DevTools
- Verify user is authenticated (token in Authorization header)
- Check backend CORS configuration

### Tailwind styles not applying
- Rebuild: `npm run dev`
- Clear cache: `rm -rf node_modules/.vite`
- Check that class names match config

## Next Steps

1. Implement remaining page components (Planner, Tasks, etc.)
2. Add form validation and error handling
3. Implement analytics/tracking
4. Set up E2E tests with Cypress/Playwright
5. Add PWA support
6. Set up CI/CD pipeline

## Resources

- [React 19 Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [React Query](https://tanstack.com/query)
- [Firebase Auth](https://firebase.google.com/docs/auth)
