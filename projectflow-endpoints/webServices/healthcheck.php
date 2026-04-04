<?php
/**
 * TMC TimeIntel ProjectFlow Integration
 * Health Check Endpoint
 * 
 * GET /webServices/healthcheck.php
 * Validates API key and checks database connectivity
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
    // Validate API key
    requireAuth();
    
    // Attempt database connection
    $conn = getOracleConnection();
    
    if ($conn === false) {
        http_response_code(503);
        echo json_encode(array(
            'status' => 'error',
            'timestamp' => date('c'),
            'database' => 'disconnected',
            'version' => '1.0.0',
            'message' => 'Database connection failed'
        ));
        exit;
    }
    
    // Test database connectivity with simple query
    $sql = "SELECT 1 FROM DUAL";
    $stmt = oci_parse($conn, $sql);
    
    if ($stmt === false || !oci_execute($stmt)) {
        http_response_code(503);
        closeConnection($conn);
        echo json_encode(array(
            'status' => 'error',
            'timestamp' => date('c'),
            'database' => 'disconnected',
            'version' => '1.0.0',
            'message' => 'Database query failed'
        ));
        exit;
    }
    
    // Query succeeded, close statement
    closeStatement($stmt);
    closeConnection($conn);
    
    // Return success status
    http_response_code(200);
    echo json_encode(array(
        'status' => 'ok',
        'timestamp' => date('c'),
        'database' => 'connected',
        'version' => '1.0.0'
    ));
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        'status' => 'error',
        'timestamp' => date('c'),
        'version' => '1.0.0',
        'message' => 'Internal server error',
        'error' => $e->getMessage()
    ));
    error_log('Health Check Error: ' . $e->getMessage());
}

?>
