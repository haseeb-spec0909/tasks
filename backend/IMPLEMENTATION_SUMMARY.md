# TMC TimeIntel Backend - Implementation Summary

## Overview
Complete production-grade Node.js/Express backend API for TMC TimeIntel, an AI-powered work intelligence platform. Deployed on Google Cloud Run with PostgreSQL, Redis, and Vertex AI integration.

**Admin Email:** haseeb@tmcltd.ai (TallyMarks Consulting)

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── index.js          # Central configuration loader
│   │   ├── database.js       # PostgreSQL connection pool
│   │   └── redis.js          # Redis client with helpers
│   ├── middleware/
│   │   ├── auth.js           # Firebase JWT verification
│   │   ├── errorHandler.js   # Global error handling
│   │   └── rateLimiter.js    # Rate limiting (200/50/20 req/min)
│   ├── models/
│   │   ├── User.js           # User data access layer
│   │   ├── Task.js           # Task management (Google + ProjectFlow)
│   │   ├── Habit.js          # Habit tracking
│   │   ├── SchedulingState.js # AI scheduling states
│   │   └── SyncLog.js        # Sync logs and ProjectFlow state
│   ├── services/
│   │   ├── googleCalendar.js     # Google Calendar API wrapper
│   │   ├── googleTasks.js        # Google Tasks API wrapper
│   │   ├── projectflowSync.js    # ProjectFlow bi-directional sync
│   │   ├── chatBot.js           # Google Chat bot service
│   │   ├── vertexAI.js          # Vertex AI/Gemini integration
│   │   └── notifications.js     # Notification dispatch
│   ├── routes/
│   │   ├── auth.js           # Authentication (OAuth, profile)
│   │   ├── tasks.js          # Task CRUD + AI prioritization
│   │   ├── calendar.js       # Calendar events + webhooks
│   │   ├── habits.js         # Habit management
│   │   ├── stats.js          # Personal + team statistics
│   │   ├── team.js           # Team management (manager-only)
│   │   ├── settings.js       # User settings + ProjectFlow connection
│   │   └── chat.js           # Google Chat webhook
│   ├── utils/
│   │   ├── validators.js     # Zod schemas for request validation
│   │   └── helpers.js        # Utility functions
│   └── server.js             # Express app initialization
├── package.json              # Dependencies + scripts
├── .env.example             # Environment template
└── .gitignore               # Git ignore rules
```

## Key Features

### 1. Authentication & Authorization
- Firebase JWT verification
- Role-based access control (user, manager, admin)
- @tmcltd.ai domain enforcement
- OAuth 2.0 integration with Google

### 2. Task Management
- Unified task interface for Google Tasks and ProjectFlow
- AI-powered prioritization using Vertex AI
- Task metadata: priority, progress %, estimated effort
- Supports subtasks, dependencies, and custom properties

### 3. Calendar Integration
- Google Calendar event management
- Free/busy queries
- Push notifications via webhooks
- Event classification (meeting, personal, focus, etc.)
- Incremental sync with syncToken support

### 4. ProjectFlow Synchronization
- Bi-directional sync (inbound/outbound)
- Status mapping (17→not_started, 19→in_progress, etc.)
- Conflict resolution (ProjectFlow takes precedence for project fields)
- Work breakdown structure (WBS) tracking
- Automatic sync state management

### 5. AI Scheduling Engine
- Task scheduling with conflict detection
- Capacity analysis based on work hours
- Focus block optimization
- Natural language parsing via Gemini
- Schedule explanations and conflict summaries

### 6. Google Chat Bot
- Command handling (/tasks, /schedule, /overdue, /next)
- Card-based messages (v2 format)
- Real-time task notifications
- Daily/weekly digests
- Inline action buttons

### 7. Habit Tracking
- Template-based habit creation
- Daily/weekly/monthly frequency
- Completion logging with statistics
- Progress visualization

### 8. Analytics & Reporting
- Personal: completion rate, focus time, capacity
- Team: workload distribution, at-risk tasks, utilization
- ProjectFlow health: delivery metrics, WBS tracking
- Weekly recaps and capacity analysis

## Database Schema (PostgreSQL)

### Core Tables
- `users` - User profiles with Google OAuth info
- `tasks` - Unified task store (Google + ProjectFlow)
- `pf_task_meta` - ProjectFlow-specific metadata
- `user_settings` - Timezone, work hours, preferences
- `habits` - Habit definitions and tracking
- `habit_logs` - Daily/weekly habit completion
- `scheduling_states` - AI-generated schedule blocks
- `sync_logs` - Sync history and error tracking
- `pf_sync_state` - Current ProjectFlow sync state
- `team_members` - Manager-employee relationships
- `notification_logs` - Notification history

## API Endpoints

### Authentication
- `POST /api/auth/google` - OAuth callback
- `GET /api/auth/me` - Current user profile
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh tokens

### Tasks
- `GET /api/tasks` - List tasks (filtered)
- `GET /api/tasks/:taskId` - Get task details
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:taskId` - Update task
- `PUT /api/tasks/:taskId/complete` - Mark complete
- `PUT /api/tasks/:taskId/progress` - Update progress %
- `PUT /api/tasks/:taskId/priority` - Update priority
- `GET /api/tasks/up-next` - Next 5 AI-prioritized tasks
- `GET /api/tasks/overdue` - Overdue tasks
- `GET /api/tasks/stats` - Task statistics

### Calendar
- `GET /api/calendar/events` - Events (with sync token)
- `POST /api/calendar/webhook` - Push notification receiver
- `GET /api/calendar/free-busy` - Availability
- `POST /api/calendar/reschedule` - Trigger reschedule
- `PUT /api/calendar/pause` - Pause scheduling

### Habits
- `GET /api/habits` - User's habits
- `GET /api/habits/templates` - Available templates
- `POST /api/habits` - Create habit
- `PUT /api/habits/:habitId` - Update habit
- `DELETE /api/habits/:habitId` - Deactivate
- `POST /api/habits/from-template` - Clone template
- `POST /api/habits/:habitId/log` - Log completion
- `GET /api/habits/:habitId/stats` - Habit stats

### Statistics
- `GET /api/stats/personal` - Personal stats
- `GET /api/stats/team` - Team stats (manager-only)
- `GET /api/stats/pf-delivery` - ProjectFlow health
- `GET /api/stats/capacity` - Capacity analysis
- `GET /api/stats/weekly-recap` - Weekly summary

### Team (Manager Only)
- `GET /api/team/members` - Team list
- `GET /api/team/workload` - Workload heatmap
- `GET /api/team/at-risk` - At-risk tasks
- `GET /api/team/wbs-tracker` - ProjectFlow WBS tree
- `GET /api/team/capacity` - Per-member capacity

### Settings
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings
- `GET /api/settings/pf-connection` - ProjectFlow status
- `POST /api/settings/pf-sync` - Manual sync
- `POST /api/settings/pf-connect` - Connect ProjectFlow
- `POST /api/settings/onboarding` - Onboarding wizard

### Chat
- `POST /api/chat/webhook` - Receive messages
- `POST /api/chat/card-action` - Card button clicks

### System
- `GET /health` - Health check
- `GET /api/events/stream` - Server-sent events

## Rate Limiting

| Endpoint Type | Limit | Window |
|---|---|---|
| General | 200 req/min | Per user |
| Write (POST/PUT/DELETE) | 50 req/min | Per user |
| ProjectFlow sync | 20 req/min | Per user |
| Authentication | 10 req/min | Per IP |

## Configuration

All config from environment variables:

```bash
# Copy template
cp .env.example .env

# Fill in required variables
GCP_PROJECT_ID=your-project
PROJECTFLOW_API_KEY=your-key
FIREBASE_PROJECT_ID=your-firebase
# ... etc
```

## Dependencies

### Core
- `express` - Web framework
- `pg` - PostgreSQL driver
- `ioredis` - Redis client
- `googleapis` - Google APIs
- `@google-cloud/vertexai` - Vertex AI/Gemini
- `@google-cloud/logging` - Cloud Logging
- `dayjs` - Date/time utilities
- `zod` - Schema validation

### Middleware
- `helmet` - Security headers
- `cors` - CORS handling
- `express-rate-limit` - Rate limiting
- `jsonwebtoken` - JWT handling

### Development
- `nodemon` - Auto-reload
- `jest` - Testing
- `supertest` - HTTP assertions

## Running the Server

### Development
```bash
npm install
npm run dev
```

### Production
```bash
npm install --production
npm run start
```

### Testing
```bash
npm test
npm test -- --coverage
```

### Database Migrations
```bash
npm run migrate
```

## Security Considerations

1. **JWT Verification**: Firebase tokens verified before access
2. **Domain Restriction**: Only @tmcltd.ai emails allowed
3. **Rate Limiting**: Per-user and per-IP limits
4. **Input Validation**: Zod schemas for all requests
5. **HTTPS Only**: In production
6. **CORS**: Restricted to timeintel.tmcltd.ai
7. **Helmet**: Security headers enabled
8. **SQL Injection**: Parameterized queries throughout
9. **Error Handling**: No sensitive data in error messages

## Integration Points

### Google Services
- **Calendar**: Event management, free/busy, webhooks
- **Tasks**: Task lists, task CRUD, notes parsing
- **Vertex AI**: Event classification, NLU, explanations
- **Cloud Logging**: Structured logging

### ProjectFlow
- **API**: Bi-directional task sync
- **Status Mapping**: 5 internal statuses ↔ ProjectFlow IDs
- **Health Check**: Connection validation

### Google Chat
- **Webhooks**: Message and card action handling
- **Cards v2**: Rich formatted messages
- **Commands**: /tasks, /schedule, /overdue, /next

## Error Handling

Global error handler returns structured JSON:
```json
{
  "error": "Error Type",
  "message": "Human-readable message",
  "details": [{
    "path": "field.name",
    "message": "Validation error"
  }],
  "traceId": "uuid-in-production"
}
```

## Monitoring

- Cloud Logging integration for all errors
- Request logging in debug mode
- Network request tracking
- Sync state monitoring
- Health check endpoint

## Performance Optimizations

1. **Connection Pooling**: 20 max PostgreSQL connections
2. **Caching**: Redis cache-through pattern with TTL
3. **Incremental Sync**: Google Calendar syncToken support
4. **Batch Operations**: Batch event creation (up to 50)
5. **Query Optimization**: Indexed fields, LIMIT/OFFSET pagination

## Scaling Considerations

- Stateless server design (no session storage)
- Redis for distributed cache
- Connection pooling for database
- Rate limiting prevents abuse
- Horizontal scalability ready (Cloud Run)

## Next Steps

1. **Database Setup**: Initialize PostgreSQL with schema
2. **Google Cloud Setup**: Configure service accounts, APIs
3. **Firebase Setup**: Create Firebase project, configure JWT
4. **Environment**: Configure .env file
5. **Local Testing**: Run `npm run dev`
6. **Deployment**: Deploy to Cloud Run

---

**Created:** 2024
**Owner:** TallyMarks Consulting (haseeb@tmcltd.ai)
**License:** PROPRIETARY
