<?php
/**
 * TMC TimeIntel ProjectFlow Integration
 * Get My Tasks Endpoint
 * 
 * GET /webServices/getMyTasks.php
 * Returns all tasks assigned to a user with full WBS hierarchy
 * 
 * Required Parameters:
 *   - user_id (integer): User ID of the task owner
 * 
 * Optional Parameters:
 *   - updated_since (string): ISO 8601 timestamp for delta sync
 * 
 * @author haseeb@tmcltd.ai
 * @version 1.0.0
 * @package webServices
 */

// Set response type to JSON
header('Content-Type: application/json');

// Include configuration and database helpers
require_once __DIR__ . '/config/api_auth.php';
require_once __DIR__ . '/config/database.php';

try {
    // Validate API key and IP
    requireAuth();
    
    // Validate request method
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(array(
            'success' => false,
            'error' => 'Method not allowed. Use GET.',
            'code' => 'METHOD_NOT_ALLOWED'
        ));
        exit;
    }
    
    // Get and validate user_id parameter
    if (empty($_GET['user_id'])) {
        http_response_code(400);
        echo json_encode(array(
            'success' => false,
            'error' => 'Missing required parameter: user_id',
            'code' => 'MISSING_PARAMETER'
        ));
        exit;
    }
    
    $userId = (int) $_GET['user_id'];
    
    if ($userId <= 0) {
        http_response_code(400);
        echo json_encode(array(
            'success' => false,
            'error' => 'Invalid user_id: must be a positive integer',
            'code' => 'INVALID_PARAMETER'
        ));
        exit;
    }
    
    // Get optional updated_since parameter
    $updatedSince = !empty($_GET['updated_since']) ? $_GET['updated_since'] : null;
    
    // Validate updated_since format if provided
    if ($updatedSince !== null) {
        if (!isValidIso8601($updatedSince)) {
            http_response_code(400);
            echo json_encode(array(
                'success' => false,
                'error' => 'Invalid updated_since format. Use ISO 8601 timestamp.',
                'code' => 'INVALID_PARAMETER'
            ));
            exit;
        }
    }
    
    // Get database connection
    $conn = getOracleConnection();
    
    if ($conn === false) {
        http_response_code(500);
        echo json_encode(array(
            'success' => false,
            'error' => 'Database connection failed',
            'code' => 'DB_CONNECTION_ERROR'
        ));
        exit;
    }
    
    // Build SQL query
    $sql = "SELECT 
                t.WP_TASK_ID,
                t.WP_TASK_NAME,
                t.WP_TASK_STATUS_ID,
                t.WP_TASK_START_DATE,
                t.WP_TASK_END_DATE,
                t.WP_TASK_INITIATE,
                t.WP_TASK_PROGRESS,
                t.WP_TASK_UPDATED_AT,
                wp.DELIVERABLE_WP_ID,
                wp.WP_CODE,
                wp.WP_DESCRIPTION,
                d.BUILD_DELIVERABLE_ID,
                d.DELIVERABLE_NAME,
                b.PROJECT_BUILD_ID,
                b.BUILD_NAME,
                p.PROJECT_ID,
                p.PROJECT_NAME
            FROM TMC_WORKPACKAGE_TASK t
            JOIN TMC_BUILD_DELIVERABLE_WP wp ON t.WP_TASK_WP_ID = wp.DELIVERABLE_WP_ID
            JOIN TMC_BUILD_DELIVERABLE d ON wp.WP_DELIVERABLE_ID = d.BUILD_DELIVERABLE_ID
            JOIN TMC_PROJECT_BUILD b ON d.DELIVERABLE_BUILD_ID = b.PROJECT_BUILD_ID
            JOIN TMC_PROJECT p ON b.BUILD_PROJECT_ID = p.PROJECT_ID
            WHERE t.WP_TASK_OWNER_ID = :user_id";
    
    // Add optional updated_since filter
    if ($updatedSince !== null) {
        $sql .= " AND t.WP_TASK_UPDATED_AT >= TO_TIMESTAMP(:updated_since, 'YYYY-MM-DD\"T\"HH24:MI:SSXFF')";
    }
    
    $sql .= " ORDER BY p.PROJECT_NAME, b.BUILD_NAME, wp.WP_CODE, t.WP_TASK_NAME";
    
    // Execute query
    $stmt = oci_parse($conn, $sql);
    
    if ($stmt === false) {
        http_response_code(500);
        closeConnection($conn);
        echo json_encode(array(
            'success' => false,
            'error' => 'SQL parse error',
            'code' => 'SQL_PARSE_ERROR'
        ));
        exit;
    }
    
    // Bind parameters directly to variables (not array values)
    oci_bind_by_name($stmt, ':user_id', $userId);
    
    if ($updatedSince !== null) {
        oci_bind_by_name($stmt, ':updated_since', $updatedSince);
    }
    
    // Execute statement
    if (!oci_execute($stmt)) {
        $e = oci_error($stmt);
        http_response_code(500);
        closeStatement($stmt);
        closeConnection($conn);
        echo json_encode(array(
            'success' => false,
            'error' => 'SQL execution error',
            'code' => 'SQL_EXECUTE_ERROR'
        ));
        error_log('SQL Error: ' . $e['message']);
        exit;
    }
    
    // Fetch all results
    $tasks = array();
    while ($row = oci_fetch_assoc($stmt)) {
        $task = array(
            'wp_task_id' => (int) $row['WP_TASK_ID'],
            'wp_task_name' => $row['WP_TASK_NAME'],
            'wp_task_status_id' => (int) $row['WP_TASK_STATUS_ID'],
            'wp_task_start_date' => $row['WP_TASK_START_DATE'],
            'wp_task_end_date' => $row['WP_TASK_END_DATE'],
            'wp_task_initiate' => $row['WP_TASK_INITIATE'],
            'progress_pct' => (int) $row['WP_TASK_PROGRESS'],
            'last_updated_at' => $row['WP_TASK_UPDATED_AT'],
            'wp_id' => (int) $row['DELIVERABLE_WP_ID'],
            'wp_code' => $row['WP_CODE'],
            'wp_description' => $row['WP_DESCRIPTION'],
            'deliverable_id' => (int) $row['BUILD_DELIVERABLE_ID'],
            'deliverable_name' => $row['DELIVERABLE_NAME'],
            'build_id' => (int) $row['PROJECT_BUILD_ID'],
            'build_name' => $row['BUILD_NAME'],
            'project_id' => (int) $row['PROJECT_ID'],
            'project_name' => $row['PROJECT_NAME']
        );
        
        $tasks[] = $task;
    }
    
    // Clean up
    closeStatement($stmt);
    closeConnection($conn);
    
    // Log API call
    logApiCall('getMyTasks', $userId, array(
        'updated_since' => $updatedSince
    ));
    
    // Return success response
    http_response_code(200);
    echo json_encode(array(
        'success' => true,
        'data' => $tasks,
        'count' => count($tasks)
    ));
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'error' => 'Internal server error',
        'code' => 'INTERNAL_ERROR'
    ));
    error_log('Get My Tasks Error: ' . $e->getMessage());
}

/**
 * Validate ISO 8601 timestamp format
 * 
 * @param string $timestamp Timestamp string to validate
 * @return bool True if valid ISO 8601 format
 */
function isValidIso8601($timestamp) {
    $pattern = '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/';
    return preg_match($pattern, $timestamp) === 1;
}

?>
