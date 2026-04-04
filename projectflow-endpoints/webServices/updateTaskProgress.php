<?php
/**
 * TMC TimeIntel ProjectFlow Integration
 * Update Task Progress Endpoint
 * 
 * POST /webServices/updateTaskProgress.php
 * Updates task progress percentage and cascades updates through WBS hierarchy
 * 
 * Required Parameters:
 *   - wp_task_id (integer): Work package task ID
 *   - progress_pct (integer): Progress percentage (0-100)
 *   - updated_by_user_id (integer): User ID performing the update
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
    
    if (!isset($input['progress_pct'])) {
        http_response_code(400);
        echo json_encode(array(
            'success' => false,
            'error' => 'Missing required parameter: progress_pct',
            'code' => 'MISSING_PARAMETER'
        ));
        exit;
    }
    
    if (empty($input['updated_by_user_id'])) {
        http_response_code(400);
        echo json_encode(array(
            'success' => false,
            'error' => 'Missing required parameter: updated_by_user_id',
            'code' => 'MISSING_PARAMETER'
        ));
        exit;
    }
    
    // Parse and validate parameters
    $wpTaskId = (int) $input['wp_task_id'];
    $progressPct = (int) $input['progress_pct'];
    $updatedByUserId = (int) $input['updated_by_user_id'];
    
    if ($wpTaskId <= 0) {
        http_response_code(400);
        echo json_encode(array(
            'success' => false,
            'error' => 'Invalid wp_task_id: must be a positive integer',
            'code' => 'INVALID_PARAMETER'
        ));
        exit;
    }
    
    if ($progressPct < 0 || $progressPct > 100) {
        http_response_code(400);
        echo json_encode(array(
            'success' => false,
            'error' => 'Invalid progress_pct: must be between 0 and 100',
            'code' => 'INVALID_PARAMETER'
        ));
        exit;
    }
    
    if ($updatedByUserId <= 0) {
        http_response_code(400);
        echo json_encode(array(
            'success' => false,
            'error' => 'Invalid updated_by_user_id: must be a positive integer',
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
        // Step 1: Fetch current task data and WP ID
        $fetchSql = "SELECT WP_TASK_WP_ID, WP_TASK_PROGRESS FROM TMC_WORKPACKAGE_TASK WHERE WP_TASK_ID = :task_id";
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
        
        $wpId = (int) $taskData['WP_TASK_WP_ID'];
        $oldProgress = (int) $taskData['WP_TASK_PROGRESS'];
        
        // Step 2: Update task progress
        $updateSql = "UPDATE TMC_WORKPACKAGE_TASK 
                      SET WP_TASK_PROGRESS = :progress_pct,
                          WP_TASK_UPDATED_AT = SYSDATE,
                          WP_TASK_UPDATED_BY = :updated_by
                      WHERE WP_TASK_ID = :task_id";
        
        $updateStmt = oci_parse($conn, $updateSql);
        
        if ($updateStmt === false) {
            throw new Exception('Failed to parse update statement');
        }
        
        oci_bind_by_name($updateStmt, ':progress_pct', $progressPct);
        oci_bind_by_name($updateStmt, ':updated_by', $updatedByUserId);
        oci_bind_by_name($updateStmt, ':task_id', $wpTaskId);
        
        if (!oci_execute($updateStmt)) {
            throw new Exception('Failed to execute update statement');
        }
        
        closeStatement($updateStmt);
        
        // Step 3: Call cascade functions to update parent levels
        // These assume existing functions in ProjectFlow
        $cascadeFunctions = array(
            'updateWPActualProgress' => $wpId,
            'updateDeliverableActualProgress' => null,
            'updateBuildActualProgress' => null,
            'updateProjectActualProgress' => null
        );
        
        // Fetch deliverable and build IDs for cascade calls
        $getParentsSql = "SELECT d.BUILD_DELIVERABLE_ID, b.PROJECT_BUILD_ID 
                         FROM TMC_BUILD_DELIVERABLE_WP wp
                         JOIN TMC_BUILD_DELIVERABLE d ON wp.WP_DELIVERABLE_ID = d.BUILD_DELIVERABLE_ID
                         JOIN TMC_PROJECT_BUILD b ON d.DELIVERABLE_BUILD_ID = b.PROJECT_BUILD_ID
                         WHERE wp.DELIVERABLE_WP_ID = :wp_id";
        
        $getParentsStmt = oci_parse($conn, $getParentsSql);
        
        if ($getParentsStmt === false) {
            throw new Exception('Failed to parse parent fetch statement');
        }
        
        oci_bind_by_name($getParentsStmt, ':wp_id', $wpId);
        
        if (!oci_execute($getParentsStmt)) {
            throw new Exception('Failed to fetch parent IDs');
        }
        
        $parentsData = oci_fetch_assoc($getParentsStmt);
        closeStatement($getParentsStmt);
        
        if ($parentsData !== false) {
            $deliverableId = (int) $parentsData['BUILD_DELIVERABLE_ID'];
            $buildId = (int) $parentsData['PROJECT_BUILD_ID'];
            
            // Call cascade functions if they exist
            if (function_exists('updateWPActualProgress')) {
                updateWPActualProgress($wpId);
            }
            
            if (function_exists('updateDeliverableActualProgress')) {
                updateDeliverableActualProgress($deliverableId);
            }
            
            if (function_exists('updateBuildActualProgress')) {
                updateBuildActualProgress($buildId);
            }
            
            if (function_exists('updateProjectActualProgress')) {
                if ($parentsData !== false) {
                    $getProjectSql = "SELECT p.PROJECT_ID FROM TMC_PROJECT_BUILD b
                                     JOIN TMC_PROJECT p ON b.BUILD_PROJECT_ID = p.PROJECT_ID
                                     WHERE b.PROJECT_BUILD_ID = :build_id";
                    
                    $getProjectStmt = oci_parse($conn, $getProjectSql);
                    oci_bind_by_name($getProjectStmt, ':build_id', $buildId);
                    oci_execute($getProjectStmt);
                    
                    $projectData = oci_fetch_assoc($getProjectStmt);
                    closeStatement($getProjectStmt);
                    
                    if ($projectData !== false) {
                        updateProjectActualProgress((int) $projectData['PROJECT_ID']);
                    }
                }
            }
        }
        
        // Step 4: Save status history
        if (function_exists('saveStatusHistory')) {
            saveStatusHistory($wpTaskId, null, $updatedByUserId);
        }
        
        // Step 5: Save date history
        if (function_exists('saveDateHistory')) {
            saveDateHistory($wpTaskId, null, $updatedByUserId);
        }
        
        // Commit transaction
        if (!commitTransaction($conn)) {
            throw new Exception('Failed to commit transaction');
        }
        
        // Fetch updated progress values for response
        $fetchFinalSql = "SELECT t.WP_TASK_PROGRESS, 
                                 COALESCE(wp.WP_PROGRESS, 0) as WP_PROGRESS, 
                                 COALESCE(d.DELIVERABLE_PROGRESS, 0) as DELIVERABLE_PROGRESS
                         FROM TMC_WORKPACKAGE_TASK t
                         LEFT JOIN TMC_BUILD_DELIVERABLE_WP wp ON wp.DELIVERABLE_WP_ID = :wp_id
                         LEFT JOIN TMC_BUILD_DELIVERABLE d ON d.BUILD_DELIVERABLE_ID = :del_id
                         WHERE t.WP_TASK_ID = :task_id";
        
        $fetchFinalStmt = oci_parse($conn, $fetchFinalSql);
        oci_bind_by_name($fetchFinalStmt, ':task_id', $wpTaskId);
        oci_bind_by_name($fetchFinalStmt, ':wp_id', $wpId);
        
        $deliverableId = !empty($parentsData) ? (int) $parentsData['BUILD_DELIVERABLE_ID'] : 0;
        oci_bind_by_name($fetchFinalStmt, ':del_id', $deliverableId);
        oci_execute($fetchFinalStmt);
        
        $finalData = oci_fetch_assoc($fetchFinalStmt);
        closeStatement($fetchFinalStmt);
        closeConnection($conn);
        
        $wpProgress = !empty($finalData) ? (int) $finalData['WP_PROGRESS'] : $progressPct;
        $delProgress = !empty($finalData) ? (int) $finalData['DELIVERABLE_PROGRESS'] : $progressPct;
        
        // Log API call
        logApiCall('updateTaskProgress', $updatedByUserId, array(
            'wp_task_id' => $wpTaskId,
            'old_progress' => $oldProgress,
            'new_progress' => $progressPct
        ));
        
        // Return success response
        http_response_code(200);
        echo json_encode(array(
            'success' => true,
            'new_progress' => $progressPct,
            'wp_progress' => $wpProgress,
            'deliverable_progress' => $delProgress
        ));
        
    } catch (Exception $e) {
        // Rollback on error
        rollbackTransaction($conn);
        closeConnection($conn);
        
        http_response_code(500);
        echo json_encode(array(
            'success' => false,
            'error' => $e->getMessage(),
            'code' => 'UPDATE_ERROR'
        ));
        error_log('Update Task Progress Error: ' . $e->getMessage());
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'error' => 'Internal server error',
        'code' => 'INTERNAL_ERROR'
    ));
    error_log('Update Task Progress Error: ' . $e->getMessage());
}

?>
