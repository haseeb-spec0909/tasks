# TMC TimeIntel ProjectFlow Integration - Quick Start Guide

## 5-Minute Setup

### 1. Copy Files
```bash
cp -r webServices /path/to/projectflow/_webServices/
```

### 2. Configure ProjectFlow
Add to your main config file (`config.php` or similar):
```php
$GLOBALS['API_KEY'] = 'your-secret-api-key-here';
$GLOBALS['DB_USER'] = 'oracle_user';
$GLOBALS['DB_PASS'] = 'oracle_password';
$GLOBALS['DB_NAME'] = 'oracle_tns_alias';
```

### 3. Test Connection
```bash
curl -H "API_KEY: your-secret-api-key-here" \
  https://projectflow.example.com/webServices/healthcheck.php
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-04T12:34:56+00:00",
  "database": "connected",
  "version": "1.0.0"
}
```

## Common Workflows

### Get Tasks for User 42
```bash
curl -H "API_KEY: your-key" \
  "https://projectflow.example.com/webServices/getMyTasks.php?user_id=42"
```

### Get Workpackages for User 42
```bash
curl -H "API_KEY: your-key" \
  "https://projectflow.example.com/webServices/getMyWorkpackages.php?user_id=42"
```

### Update Task Progress to 75%
```bash
curl -X POST \
  -H "API_KEY: your-key" \
  -H "Content-Type: application/json" \
  -d '{"wp_task_id":1001,"progress_pct":75,"updated_by_user_id":42}' \
  https://projectflow.example.com/webServices/updateTaskProgress.php
```

### Initiate a Task
```bash
curl -X POST \
  -H "API_KEY: your-key" \
  -H "Content-Type: application/json" \
  -d '{"wp_task_id":1001,"initiated_by_user_id":42}' \
  https://projectflow.example.com/webServices/initiateTask.php
```

## Using with TimeIntel

TimeIntel can call these endpoints to:
- Fetch all tasks assigned to a team member
- Track progress changes in real-time
- Initiate tasks from TimeIntel's interface
- Sync task hierarchies back to ProjectFlow

## Troubleshooting

**401 Unauthorized?**
- Verify API_KEY in request header matches `$GLOBALS['API_KEY']`
- Check client IP is allowed (see api_auth.php)

**500 Database Error?**
- Check Oracle connection parameters
- Verify OCI8 extension is installed: `php -m | grep oci8`
- Test Oracle connectivity: `sqlplus user/pass@tnsalias`

**Task Not Found?**
- Verify wp_task_id exists in TMC_WORKPACKAGE_TASK
- Check user_id exists in database

See README.md for complete documentation.
