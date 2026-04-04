# TMC TimeIntel ProjectFlow Integration - PHP Endpoints

Production-ready PHP endpoints for integrating TMC TimeIntel with ProjectFlow's Oracle backend.

## Overview

This package provides 5 API endpoints and supporting configuration modules for managing tasks and workpackages in ProjectFlow via REST HTTP calls. All endpoints validate API keys, enforce IP allowlisting, use Oracle OCI8 prepared statements, and maintain transaction integrity.

**Author:** haseeb@tmcltd.ai  
**Version:** 1.0.0

## Endpoints

### 1. GET `/webServices/healthcheck.php`

Health check endpoint to verify service availability and database connectivity.

**Authentication:**
- Required: API_KEY header

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-04-04T12:34:56+00:00",
  "database": "connected",
  "version": "1.0.0"
}
```

**Error Responses:**
- 401: Missing or invalid API key
- 503: Database connection failed
- 500: Internal server error

---

### 2. GET `/webServices/getMyTasks.php`

Retrieve all tasks assigned to a user with full WBS (Work Breakdown Structure) hierarchy.

**Authentication:**
- Required: API_KEY header

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| user_id | integer | Yes | User ID of task owner |
| updated_since | string | No | ISO 8601 timestamp for delta sync (e.g., 2026-04-01T00:00:00Z) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "wp_task_id": 1001,
      "wp_task_name": "Design database schema",
      "wp_task_status_id": 19,
      "wp_task_start_date": "2026-04-01",
      "wp_task_end_date": "2026-04-15",
      "wp_task_initiate": "Y",
      "progress_pct": 65,
      "last_updated_at": "2026-04-04 10:30:45",
      "wp_id": 501,
      "wp_code": "WP-001",
      "wp_description": "Database design workpackage",
      "deliverable_id": 201,
      "deliverable_name": "Database & Infrastructure",
      "build_id": 101,
      "build_name": "Phase 1 Build",
      "project_id": 5,
      "project_name": "TimeIntel Platform"
    }
  ],
  "count": 1
}
```

**Error Responses:**
- 400: Missing user_id or invalid updated_since format
- 401: Invalid API key or IP not allowed
- 500: Database error

**Notes:**
- Returns tasks in hierarchical order: Project > Build > Deliverable > Workpackage > Task
- Use `updated_since` for incremental syncs to reduce payload

---

### 3. GET `/webServices/getMyWorkpackages.php`

Retrieve workpackages where user is assigned, with task completion counts.

**Authentication:**
- Required: API_KEY header

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| user_id | integer | Yes | User ID of assignee |
| project_id | integer | No | Filter by specific project ID |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "wp_id": 501,
      "wp_code": "WP-001",
      "wp_description": "Database design workpackage",
      "wp_status_id": 19,
      "wp_start_date": "2026-04-01",
      "wp_end_date": "2026-04-15",
      "deliverable_id": 201,
      "build_id": 101,
      "project_id": 5,
      "task_count": 8,
      "completed_task_count": 5
    }
  ],
  "count": 1
}
```

**Error Responses:**
- 400: Missing user_id
- 401: Invalid API key or IP not allowed
- 500: Database error

**Notes:**
- Includes task counts for workload assessment
- `completed_task_count` includes tasks with status ID 11 (Complete) or 21 (Closed)

---

### 4. POST `/webServices/updateTaskProgress.php`

Update task progress percentage and cascade updates through WBS hierarchy.

**Authentication:**
- Required: API_KEY header

**Request Body (JSON):**
```json
{
  "wp_task_id": 1001,
  "progress_pct": 75,
  "updated_by_user_id": 42
}
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| wp_task_id | integer | Yes | Work package task ID |
| progress_pct | integer | Yes | Progress percentage (0-100) |
| updated_by_user_id | integer | Yes | User ID performing update |

**Response (200 OK):**
```json
{
  "success": true,
  "new_progress": 75,
  "wp_progress": 68,
  "deliverable_progress": 72
}
```

**Error Responses:**
- 400: Invalid or missing parameters
- 401: Invalid API key or IP not allowed
- 500: Database error or cascade failure

**CRITICAL:** This endpoint:
- Wraps all updates in an Oracle transaction (BEGIN/COMMIT/ROLLBACK)
- Calls cascade functions: `updateWPActualProgress()`, `updateDeliverableActualProgress()`, `updateBuildActualProgress()`, `updateProjectActualProgress()`
- Calls `saveStatusHistory()` and `saveDateHistory()` if available
- Rolls back entire transaction on any failure

---

### 5. POST `/webServices/initiateTask.php`

Mark a task as initiated and transition status from Not Started to In Progress.

**Authentication:**
- Required: API_KEY header

**Request Body (JSON):**
```json
{
  "wp_task_id": 1001,
  "initiated_by_user_id": 42
}
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| wp_task_id | integer | Yes | Work package task ID |
| initiated_by_user_id | integer | Yes | User ID initiating the task |

**Response (200 OK):**
```json
{
  "success": true,
  "initiated_date": "2026-04-04T12:34:56+00:00",
  "status_changed": true,
  "message": "Task initiated successfully"
}
```

**Error Responses:**
- 400: Invalid or missing parameters
- 401: Invalid API key or IP not allowed
- 500: Database error

**CRITICAL:** This endpoint:
- Wraps update in an Oracle transaction
- Sets `WP_TASK_INITIATE = 'Y'`
- Sets `WP_TASK_INITIATION_DATE = SYSDATE`
- If status is 17 (Not Started), changes to status 19 (In Progress)
- Calls `saveStatusHistory()` if available

---

## Installation

### Prerequisites
- PHP 7.4 or higher
- OCI8 extension compiled and configured
- Oracle client libraries installed
- Write access to ProjectFlow's `_webServices` directory

### Setup Steps

1. **Copy files to ProjectFlow:**
   ```bash
   cp -r webServices/* /path/to/projectflow/_webServices/
   ```

2. **Set permissions:**
   ```bash
   chmod 755 /path/to/projectflow/_webServices/webServices/*.php
   chmod 755 /path/to/projectflow/_webServices/webServices/config/*.php
   ```

3. **Update ProjectFlow configuration** in your main config file (e.g., `config.php`):
   ```php
   $GLOBALS['API_KEY'] = 'your-secret-api-key-here';
   $GLOBALS['TIMEINTEL_API_KEY'] = 'timeintel-specific-key-here';
   $GLOBALS['DB_USER'] = 'projectflow_user';
   $GLOBALS['DB_PASS'] = 'password';
   $GLOBALS['DB_NAME'] = 'oracle_tns_alias';
   ```

---

## API Key Management

### Primary API Key
- Used for all endpoints by default
- Store in `$GLOBALS['API_KEY']`
- Extract from request header: `API_KEY` or `Authorization: Bearer <key>`

### TimeIntel-Specific Key
- Alternative key for dedicated integrations
- Store in `$GLOBALS['TIMEINTEL_API_KEY']`
- Use `requireAuth(true)` to validate against this key

### Request Header Examples

```bash
# Using API_KEY header
curl -H "API_KEY: your-secret-key" https://projectflow.example.com/webServices/healthcheck.php

# Using Authorization Bearer
curl -H "Authorization: Bearer your-secret-key" https://projectflow.example.com/webServices/healthcheck.php
```

---

## IP Allowlisting

All endpoints enforce IP-based access control. Configure allowed ranges in `/webServices/config/api_auth.php`.

**Default Allowed Ranges:**
- Google Cloud Run IP ranges (8.34.208.0/20, 8.35.192.0/20, 34.16.0.0/14, etc.)
- Localhost (127.0.0.1, ::1)

**To Add Custom IP Ranges:**

Edit `isAllowedIp()` function in `api_auth.php`:
```php
$allowedRanges = array(
    '8.34.208.0/20',    // Existing Cloud Run
    '192.168.1.0/24',   // Your corporate network
    '203.0.113.0/24',   // Partner network
);
```

**Testing IP:**
```bash
curl -H "API_KEY: key" -H "X-Forwarded-For: 203.0.113.42" \
  https://projectflow.example.com/webServices/healthcheck.php
```

---

## Transaction Management

### updateTaskProgress Transactions

The `updateTaskProgress.php` endpoint uses critical transaction management:

1. **BEGIN:** Manual commit mode activated
2. **UPDATE:** Primary task record
3. **CALL:** Cascade functions (updateWPActualProgress, etc.)
4. **CALL:** saveStatusHistory() and saveDateHistory()
5. **COMMIT:** If all steps succeed
6. **ROLLBACK:** If any step fails

```
UPDATE t.WP_TASK_PROGRESS
├── Call updateWPActualProgress(wp_id)
├── Call updateDeliverableActualProgress(del_id)
├── Call updateBuildActualProgress(build_id)
├── Call updateProjectActualProgress(project_id)
├── Call saveStatusHistory()
├── Call saveDateHistory()
└── COMMIT or ROLLBACK
```

### initiateTask Transactions

Similar transaction wrapping for task initiation:

1. **BEGIN:** Manual commit mode
2. **UPDATE:** WP_TASK_INITIATE and optionally WP_TASK_STATUS_ID
3. **CALL:** saveStatusHistory() if available
4. **COMMIT:** If successful, **ROLLBACK** if failed

---

## Cascade Function Dependencies

The endpoints assume existing ProjectFlow functions. Ensure these are available in your environment:

- **`updateWPActualProgress($wp_id)`** - Updates workpackage aggregate progress
- **`updateDeliverableActualProgress($deliverable_id)`** - Updates deliverable aggregate progress
- **`updateBuildActualProgress($build_id)`** - Updates build aggregate progress
- **`updateProjectActualProgress($project_id)`** - Updates project aggregate progress
- **`saveStatusHistory($task_id, $status_id, $user_id)`** - Logs status change history
- **`saveDateHistory($task_id, $date_field, $user_id)`** - Logs date change history
- **`eventLog($event_type, $source, $details, $user_id, $level)`** - Logs to SYS_EVENT_LOG

If any function is unavailable, the endpoint logs a notice but continues execution (non-fatal).

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

**Common Error Codes:**
| Code | HTTP Status | Meaning |
|------|-------------|---------|
| MISSING_API_KEY | 401 | API_KEY header is missing |
| INVALID_API_KEY | 401 | API key does not match configured value |
| INVALID_IP | 401 | Client IP not in allowlist |
| MISSING_PARAMETER | 400 | Required parameter missing |
| INVALID_PARAMETER | 400 | Parameter format or range invalid |
| INVALID_JSON | 400 | Request body is not valid JSON |
| METHOD_NOT_ALLOWED | 405 | Wrong HTTP method (GET vs POST) |
| DB_CONNECTION_ERROR | 500 | Oracle connection failed |
| SQL_PARSE_ERROR | 500 | SQL syntax error |
| SQL_EXECUTE_ERROR | 500 | SQL execution failed |
| TRANSACTION_ERROR | 500 | Transaction BEGIN/COMMIT/ROLLBACK failed |
| INTERNAL_ERROR | 500 | Unhandled exception |

---

## Testing

### Health Check
```bash
curl -X GET \
  -H "API_KEY: your-api-key" \
  https://projectflow.example.com/webServices/healthcheck.php
```

### Get My Tasks
```bash
curl -X GET \
  -H "API_KEY: your-api-key" \
  "https://projectflow.example.com/webServices/getMyTasks.php?user_id=42&updated_since=2026-04-01T00:00:00Z"
```

### Get My Workpackages
```bash
curl -X GET \
  -H "API_KEY: your-api-key" \
  "https://projectflow.example.com/webServices/getMyWorkpackages.php?user_id=42&project_id=5"
```

### Update Task Progress
```bash
curl -X POST \
  -H "API_KEY: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"wp_task_id":1001,"progress_pct":75,"updated_by_user_id":42}' \
  https://projectflow.example.com/webServices/updateTaskProgress.php
```

### Initiate Task
```bash
curl -X POST \
  -H "API_KEY: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"wp_task_id":1001,"initiated_by_user_id":42}' \
  https://projectflow.example.com/webServices/initiateTask.php
```

---

## Rate Limiting

Recommended rate limit configuration: **100 requests per minute per API key**

Implement at your HTTP server layer (nginx, Apache) or via a WAF. Example nginx configuration:

```nginx
limit_req_zone $http_api_key zone=timeintel:10m rate=100r/m;

location /webServices/ {
    limit_req zone=timeintel burst=10 nodelay;
    # ... other config
}
```

---

## Security Considerations

1. **API Key Rotation:** Change API keys regularly (recommend quarterly)
2. **HTTPS Only:** All endpoints must use HTTPS in production
3. **Prepared Statements:** All queries use OCI8 bind variables to prevent SQL injection
4. **Hash Comparison:** API key validation uses `hash_equals()` to prevent timing attacks
5. **Database Credentials:** Store in environment variables or secure config, never hardcode
6. **Logging:** All API calls logged to SYS_EVENT_LOG with user_id and client IP
7. **IP Validation:** CIDR ranges validated before accepting requests
8. **Transaction Rollback:** Failed updates automatically rollback to prevent partial updates

---

## Logging

All API activity is logged to SYS_EVENT_LOG table via `logApiCall()` function:

- **Event Type:** TIMEINTEL_API_CALL
- **Source:** TMC TimeIntel API
- **Details:** JSON with endpoint, user_id, client_ip, and parameters
- **Log Level:** INFO

Access logs in ProjectFlow:
```sql
SELECT * FROM SYS_EVENT_LOG 
WHERE EVENT_TYPE = 'TIMEINTEL_API_CALL' 
ORDER BY CREATED_DT DESC;
```

---

## Troubleshooting

### Connection Timeout
- Verify Oracle client libraries installed
- Check `$GLOBALS['DB_NAME']` TNS alias exists
- Confirm network connectivity to Oracle server

### SQL Parse Errors
- Check Oracle SQL syntax compatibility
- Verify table names and column names match schema
- Run test query directly in SQL*Plus

### Transaction Rollback on Update
- Check if cascade functions exist and are callable
- Verify user_id exists in TMC_USER table
- Check if task status codes 17, 19, 11, 21 exist in database

### API Key Validation Failing
- Confirm `$GLOBALS['API_KEY']` is set
- Check for whitespace in API key value
- Verify request header name is exactly `API_KEY` (case-sensitive)

### IP Allowlist Rejection
- Verify client IP in error response
- Check if IP falls within configured ranges
- Test with localhost (127.0.0.1) first for debugging

---

## Support

For issues or questions:
- Author: haseeb@tmcltd.ai
- Check PHP error log: `/var/log/php-errors.log`
- Check Oracle error log: `$ORACLE_BASE/diag/rdbms/*/*/trace/`
- Review SYS_EVENT_LOG for call history

---

## Version History

**1.0.0 (2026-04-04)**
- Initial production release
- 5 endpoints: healthcheck, getMyTasks, getMyWorkpackages, updateTaskProgress, initiateTask
- Full transaction support with cascading updates
- Oracle OCI8 prepared statements
- API key + IP allowlist authentication
- Comprehensive error handling and logging

