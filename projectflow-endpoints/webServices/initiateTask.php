<?php
/**
 * TMC TimeIntel ProjectFlow Integration
 * Initiate Task Endpoint
 * 
 * POST /webServices/initiateTask.php
 * Marks a task as initiated and updates its status to In Progress
 * 
 * Required Parameters:
 *   - wp_task_id (integer): Work package task ID
 *   - initiated_by_user_id (integer): User ID initiating the task
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
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(array(
            'success' => false,
            'error' => 'Method not allowed. Use POST.',
            'code' => 'METHOD_NOT_ALLOWED'
        ));
        exit;
    }
    
    // Parse JSON request body
    $input = json_decode(file_get_contents('php://input'), true);
    
    if ($input === null) {
        http_response_code(400);
        echo json_encode(array(
            'success' => false,
            'error' => 'Invalid JSON in request body',
            'code' => 'INVALID_JSON'
        ));
        exit;
    }
    
    // Validate required parameters
    if (empty($input['wp_task_id'])) {
        http_response_code(400);
        echo json_encode(array(
            'success' => false,
            'error' => 'Missing required parameter: wp_task_id',
            'code' => 'MISSING_PARAMETER'
        ));
        exit;
    }
    
    if (empty($input['initiated_by_user_id'])) {
        http_response_code(400);
        echo json_encode(array(
            'success' => false,
            'error' => 'Missing required parameter: initiated_by_user_id',
            'code' => 'MISSING_PARAMETER'
        ));
        exit;
    }
    
    // Parse and validate parameters
    $wpTaskId = (int) $input['wp_task_id'];
    $initiatedByUserId = (int) $input['initiated_by_user_id'];
    
    if ($wpTaskId <= 0) {
        http_response_code(400);
        echo json_encode(array(
            'success' => false,
            'error' => 'Invalid wp_task_id: must be a positive integer',
            'code' => 'INVALID_PARAMETER'
        ));
        exit;
    }
    
    if ($initiatedByUserId <= 0) {
        http_response_code(400);
        echo json_encode(array(
            'success' => false,
            'error' => 'Invalid initiated_by_user_id: must be a positive integer',
            'code' => 'INVALID_PARAMETER'
        ));
        exit;
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
    
    // Begin transaction
    if (!beginTransaction($conn)) {
        http_response_code(500);
        closeConnection($conn);
        echo json_encode(array(
            'success' => false,
            'error' => 'Failed to begin transaction',
            'code' => 'TRANSACTION_ERROR'
        ));
        exit;
    }
    
    try {
        // Step 1: Fetch current task status
        $fetchSql = "SELECT WP_TASK_STATUS_ID, WP_TASK_INITIATE FROM TMC_WORKPACKAGE_TASK WHERE WP_TASK_ID = :task_id";
        $fetchStmt = oci_parse($conn, $fetchSql);
        
        if ($fetchStmt === false) {
            throw new Exception('Failed to parse fetch statement');
        }
        
        oci_bind_by_name($fetchStmt, ':task_id', $wpTaskId);
        
        if (!oci_execute($fetchStmt)) {
            throw new Exception('Failed to execute fetch statement');
        }
        
        $taskData = oci_fetch_assoc($fetchStmt);
        closeStatement($fetchStmt);
        
        if ($taskData === false) {
            throw new Exception('Task not found');
        }
        
        $currentStatus = (int) $taskData['WP_TASK_STATUS_ID'];
        $isAlreadyInitiated = $taskData['WP_TASK_INITIATE'] === 'Y';
        
        // Step 2: Update task initiation
        $updateSql = "UPDATE TMC_WORKPACKAGE_TASK 
                      SET WP_TASK_INITIATE = 'Y',
                          WP_TASK_INITIATION_DATE = SYSDATE,
                          WP_TASK_UPDATED_AT = SYSDATE,
                          WP_TASK_UPDATED_BY = :updated_by";
        
        // If status is Not Started (17), change to In Progress (19)
        if ($currentStatus === 17) {
            $updateSql .= ", WP_TASK_STATUS_ID = 19";
        }
        
        $updateSql .= " WHERE WP_TASK_ID = :task_id";
        
        $updateStmt = oci_parse($conn, $updateSql);
        
        if ($updateStmt === false) {
            throw new Exception('Failed to parse update statement');
        }
        
        oci_bind_by_name($updateStmt, ':updated_by', $initiatedByUserId);
        oci_bind_by_name($updateStmt, ':task_id', $wpTaskId);
        
        if (!oci_execute($updateStmt)) {
            throw new Exception('Failed to execute update statement');
        }
        
        closeStatement($updateStmt);
        
        // Step 3: Call saveStatusHistory if available
        if (function_exists('saveStatusHistory')) {
            saveStatusHistory($wpTaskId, null, $initiatedByUserId);
        }
        
        // Commit transaction
        if (!commitTransaction($conn)) {
            throw new Exception('Failed to commit transaction');
        }
        
        // Fetch updated task data for response
        $fetchFinalSql = "SELECT WP_TASK_INITIATION_DATE FROM TMC_WORKPACKAGE_TASK WHERE WP_TASK_ID = :task_id";
        $fetchFinalStmt = oci_parse($conn, $fetchFinalSql);
        oci_bind_by_name($fetchFinalStmt, ':task_id', $wpTaskId);
        oci_execute($fetchFinalStmt);
        
        $finalData = oci_fetch_assoc($fetchFinalStmt);
        closeStatement($fetchFinalStmt);
        closeConnection($conn);
        
        $initiationDate = !empty($finalData) ? $finalData['WP_TASK_INITIATION_DATE'] : date('c');
        
        // Log API call
        logApiCall('initiateTask', $initiatedByUserId, array(
            'wp_task_id' => $wpTaskId,
            'was_already_initiated' => $isAlreadyInitiated,
            'old_status_id' => $currentStatus
        ));
        
        // Return success response
        http_response_code(200);
        echo json_encode(array(
            'success' => true,
            'initiated_date' => $initiationDate,
            'status_changed' => ($currentStatus === 17),
            'message' => $isAlreadyInitiated ? 'Task was already initiated' : 'Task initiated successfully'
        ));
        
    } catch (Exception $e) {
        // Rollback on error
        rollbackTransaction($conn);
        closeConnection($conn);
        
        http_response_code(500);
        echo json_encode(array(
            'success' => false,
            'error' => $e->getMessage(),
            'code' => 'INITIATE_ERROR'
        ));
        error_log('Initiate Task Error: ' . $e->getMessage());
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'error' => 'Internal server error',
        'code' => 'INTERNAL_ERROR'
    ));
    error_log('Initiate Task Error: ' . $e->getMessage());
}

?>
