<?php
/**
 * TMC TimeIntel ProjectFlow Integration
 * Get My Workpackages Endpoint
 * 
 * GET /webServices/getMyWorkpackages.php
 * Returns workpackages where user is assigned with task counts
 * 
 * Required Parameters:
 *   - user_id (integer): User ID of the assignee
 * 
 * Optional Parameters:
 *   - project_id (integer): Filter by specific project
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
    
    // Get optional project_id parameter
    $projectId = !empty($_GET['project_id']) ? (int) $_GET['project_id'] : null;
    
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
                wp.DELIVERABLE_WP_ID,
                wp.WP_CODE,
                wp.WP_DESCRIPTION,
                wp.WP_STATUS_ID,
                wp.WP_START_DATE,
                wp.WP_END_DATE,
                d.BUILD_DELIVERABLE_ID,
                b.PROJECT_BUILD_ID,
                p.PROJECT_ID,
                (SELECT COUNT(*) FROM TMC_WORKPACKAGE_TASK 
                 WHERE WP_TASK_WP_ID = wp.DELIVERABLE_WP_ID) AS task_count,
                (SELECT COUNT(*) FROM TMC_WORKPACKAGE_TASK 
                 WHERE WP_TASK_WP_ID = wp.DELIVERABLE_WP_ID 
                 AND WP_TASK_STATUS_ID IN (11, 21)) AS completed_task_count
            FROM TMC_BUILD_DELIVERABLE_WP wp
            JOIN TMC_WP_ASSIGNEE a ON wp.DELIVERABLE_WP_ID = a.WP_ASSIGNEE_WP_ID
            JOIN TMC_BUILD_DELIVERABLE d ON wp.WP_DELIVERABLE_ID = d.BUILD_DELIVERABLE_ID
            JOIN TMC_PROJECT_BUILD b ON d.DELIVERABLE_BUILD_ID = b.PROJECT_BUILD_ID
            JOIN TMC_PROJECT p ON b.BUILD_PROJECT_ID = p.PROJECT_ID
            WHERE a.WP_ASSIGNEE_USER_ID = :user_id";
    
    // Add optional project filter
    if ($projectId !== null && $projectId > 0) {
        $sql .= " AND p.PROJECT_ID = :project_id";
    }
    
    $sql .= " ORDER BY p.PROJECT_ID, wp.WP_CODE";
    
    // Prepare binds
    $binds = array(
        ':user_id' => $userId
    );
    
    if ($projectId !== null && $projectId > 0) {
        $binds[':project_id'] = $projectId;
    }
    
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
    
    // Bind parameters
    oci_bind_by_name($stmt, ':user_id', $binds[':user_id']);
    
    if ($projectId !== null && $projectId > 0) {
        oci_bind_by_name($stmt, ':project_id', $binds[':project_id']);
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
    $workpackages = array();
    while ($row = oci_fetch_assoc($stmt)) {
        $wp = array(
            'wp_id' => (int) $row['DELIVERABLE_WP_ID'],
            'wp_code' => $row['WP_CODE'],
            'wp_description' => $row['WP_DESCRIPTION'],
            'wp_status_id' => (int) $row['WP_STATUS_ID'],
            'wp_start_date' => $row['WP_START_DATE'],
            'wp_end_date' => $row['WP_END_DATE'],
            'deliverable_id' => (int) $row['BUILD_DELIVERABLE_ID'],
            'build_id' => (int) $row['PROJECT_BUILD_ID'],
            'project_id' => (int) $row['PROJECT_ID'],
            'task_count' => (int) $row['TASK_COUNT'],
            'completed_task_count' => (int) $row['COMPLETED_TASK_COUNT']
        );
        
        $workpackages[] = $wp;
    }
    
    // Clean up
    closeStatement($stmt);
    closeConnection($conn);
    
    // Log API call
    logApiCall('getMyWorkpackages', $userId, array(
        'project_id' => $projectId
    ));
    
    // Return success response
    http_response_code(200);
    echo json_encode(array(
        'success' => true,
        'data' => $workpackages,
        'count' => count($workpackages)
    ));
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'error' => 'Internal server error',
        'code' => 'INTERNAL_ERROR'
    ));
    error_log('Get My Workpackages Error: ' . $e->getMessage());
}

?>
