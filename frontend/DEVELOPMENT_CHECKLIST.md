# Development Checklist

## Quick Start Checklist

- [ ] Clone the repository
- [ ] Run `npm install`
- [ ] Copy `.env.example` to `.env.local`
- [ ] Add Firebase credentials to `.env.local`
- [ ] Run `npm run dev`
- [ ] Navigate to `http://localhost:5173`
- [ ] Sign in with your @tmcltd.ai email

## Core Features Implementation

### Authentication (Complete)
- [x] Firebase Google OAuth setup
- [x] @tmcltd.ai domain restriction
- [x] JWT token management
- [x] Auto-redirect on auth failure
- [ ] Role-based access control (RBAC)
- [ ] Permission checks for manager routes

### API Integration (Complete)
- [x] Axios instance with interceptors
- [x] React Query setup
- [x] Task endpoints
- [x] Calendar endpoints
- [x] Stats endpoints
- [x] Settings endpoints
- [x] Team endpoints
- [x] Auth interceptor
- [ ] Error handling & retry logic
- [ ] Request/response logging

### Real-time Updates (Complete)
- [x] SSE connection setup
- [x] Event subscription system
- [x] Event types: schedule_updated, task_changed, notification, pf_sync_complete
- [ ] Reconnection logic
- [ ] Offline fallback
- [ ] Connection status indicator

### UI Components (Complete)
- [x] Layout (main wrapper)
- [x] Sidebar (navigation)
- [x] TopBar (header + user menu)
- [x] TaskCard (task display)
- [x] Modal (dialog)
- [x] ConfirmDialog (confirmation)
- [x] EmptyState (empty states)
- [x] LoadingSpinner (loading indicator)
- [x] PriorityChip (priority badge)
- [x] SourceBadge (source badge)
- [x] StatusBadge (status badge)
- [ ] Form components (Input, Select, Textarea)
- [ ] DatePicker component
- [ ] TimePicker component
- [ ] Tag/Chip input
- [ ] Pagination component
- [ ] Sorting/Filtering UI

## Page Components To Build

### Planner (High Priority)
- [ ] Weekly calendar grid
- [ ] Task blocks with drag-drop
- [ ] Time distribution bar
- [ ] Day/week/month view toggle
- [ ] Task detail panel
- [ ] Rescheduling UI
- [ ] Availability checking

### Task Engine (High Priority)
- [ ] Task list view
- [ ] Filtering (source, priority, status)
- [ ] Sorting options
- [ ] Bulk actions
- [ ] Create task modal
- [ ] Edit task modal
- [ ] Task detail view
- [ ] Progress tracking

### Priority Board (High Priority)
- [ ] Kanban board (drag-drop)
- [ ] P1, P2, P3, P4 columns
- [ ] Add/remove tasks
- [ ] Reorder by drag
- [ ] Quick edit modal
- [ ] Filter by source

### Focus Time (Medium Priority)
- [ ] Timer/stopwatch
- [ ] Current focus task display
- [ ] Break reminders
- [ ] Focus session history
- [ ] Deep work insights

### Habits (Medium Priority)
- [ ] Habit list
- [ ] Create habit modal
- [ ] Daily check-in UI
- [ ] Habit streak display
- [ ] Calendar view
- [ ] Edit/delete habits

### Stats (Medium Priority)
- [ ] Personal stats dashboard
- [ ] Charts & graphs (recharts)
- [ ] Productivity metrics
- [ ] Time allocation breakdown
- [ ] Task completion rate
- [ ] ProjectFlow delivery health
- [ ] Capacity overview

### Team Dashboard (Medium Priority - Manager Only)
- [ ] Team member list
- [ ] Individual stats
- [ ] Team metrics
- [ ] Capacity planning
- [ ] Performance charts
- [ ] Workload distribution

### Settings (Low Priority)
- [ ] Profile settings
- [ ] Notification preferences
- [ ] Integration settings (Google, ProjectFlow)
- [ ] Default preferences
- [ ] Theme/appearance
- [ ] Privacy settings

### Onboarding (Low Priority)
- [ ] Welcome screen
- [ ] Account setup
- [ ] Integration setup wizard
- [ ] Calendar connection
- [ ] Google Tasks sync
- [ ] ProjectFlow sync
- [ ] Completion checklist

## Styling & Design

### Tailwind CSS
- [x] Color palette configured
- [x] Dark mode support
- [x] Custom font settings
- [ ] Responsive breakpoints review
- [ ] Animation utilities
- [ ] Custom component classes

### Color System
- [x] Primary color (blue)
- [x] Category colors (meeting types, task types)
- [x] Priority colors (P1-P4)
- [x] Status colors (planned, scheduled, etc.)
- [x] Utility colors (success, error, warning)

## Code Quality

### Linting & Formatting
- [x] ESLint configured
- [ ] Prettier configured
- [ ] Pre-commit hooks (husky)
- [ ] GitHub Actions CI/CD

### Testing
- [ ] Unit tests (Vitest)
- [ ] Component tests (React Testing Library)
- [ ] E2E tests (Cypress or Playwright)
- [ ] API mocking (MSW)

### Documentation
- [x] README.md
- [x] SETUP_GUIDE.md
- [ ] API documentation
- [ ] Component storybook
- [ ] Code comments for complex logic

## Performance Optimization

- [ ] Code splitting by route
- [ ] Lazy load non-critical components
- [ ] Image optimization
- [ ] Bundle analysis
- [ ] Lighthouse audit
- [ ] Implement virtualization for long lists
- [ ] Optimize React Query caching

## Accessibility (A11y)

- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Focus management
- [ ] Color contrast check
- [ ] Screen reader testing
- [ ] Form accessibility

## Security

- [ ] Remove console logs in production
- [ ] Sanitize user input
- [ ] CSRF protection review
- [ ] XSS prevention
- [ ] Secure storage of tokens
- [ ] API key rotation

## Deployment

- [ ] Firebase hosting configured
- [ ] Environment variables for production
- [ ] Build optimization
- [ ] Monitoring setup
- [ ] Error reporting (Sentry)
- [ ] Analytics integration

## Browser Support

- [ ] Chrome/Edge latest
- [ ] Firefox latest
- [ ] Safari latest
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Documentation

- [ ] API endpoints documented
- [ ] Component prop types documented
- [ ] Usage examples for each component
- [ ] Deployment guide
- [ ] Troubleshooting guide

## Monitoring & Analytics

- [ ] Error tracking (Sentry)
- [ ] User analytics (Google Analytics or Mixpanel)
- [ ] Performance monitoring
- [ ] API call logging
- [ ] User session tracking

## Future Enhancements

- [ ] Offline support with service workers
- [ ] PWA installation
- [ ] Mobile app (React Native or Flutter)
- [ ] Slack integration
- [ ] Email notifications
- [ ] SMS alerts
- [ ] Calendar subscriptions
- [ ] Zapier/IFTTT integration
- [ ] AI-powered insights
- [ ] Voice commands
