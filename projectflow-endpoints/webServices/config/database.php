<?php
/**
 * TMC TimeIntel ProjectFlow Integration
 * Oracle Database Connection Manager
 * 
 * @author haseeb@tmcltd.ai
 * @version 1.0.0
 * @package webServices
 */

/**
 * Get Oracle database connection using OCI8
 * Follows existing ProjectFlow connection patterns
 * 
 * @return resource|false OCI8 connection resource or false on failure
 */
function getOracleConnection() {
    // Get connection parameters from globals or environment
    $dbUser = isset($GLOBALS['DB_USER']) ? $GLOBALS['DB_USER'] : getenv('DB_USER');
    $dbPass = isset($GLOBALS['DB_PASS']) ? $GLOBALS['DB_PASS'] : getenv('DB_PASS');
    $dbName = isset($GLOBALS['DB_NAME']) ? $GLOBALS['DB_NAME'] : getenv('DB_NAME');
    
    // Validate required connection parameters
    if (empty($dbUser) || empty($dbPass) || empty($dbName)) {
        error_log('ERROR: Missing Oracle database connection parameters');
        return false;
    }
    
    // Attempt connection
    $conn = @oci_connect($dbUser, $dbPass, $dbName);
    
    if ($conn === false) {
        $e = oci_error();
        error_log('Oracle Connection Error: ' . $e['message']);
        return false;
    }
    
    // Set session parameters for consistency
    oci_execute(oci_parse($conn, "ALTER SESSION SET NLS_DATE_FORMAT='YYYY-MM-DD HH24:MI:SS'"));
    
    return $conn;
}

/**
 * Begin a database transaction in manual commit mode
 * 
 * OCI8 uses auto-commit mode by default. To ensure transactions work correctly,
 * use the OCI_NO_AUTO_COMMIT flag when executing statements within a transaction:
 *   oci_execute($stmt, OCI_NO_AUTO_COMMIT);
 * 
 * This ensures multiple statements are treated as an atomic transaction that can
 * be committed or rolled back as a unit.
 * 
 * @param resource $conn OCI8 connection resource
 * @return bool True on success, false on failure
 */
function beginTransaction($conn) {
    if (!is_resource($conn)) {
        error_log('ERROR: Invalid connection resource in beginTransaction');
        return false;
    }
    
    // OCI8 is in auto-commit mode by default. For explicit transaction control,
    // use OCI_NO_AUTO_COMMIT flag on oci_execute calls to defer commits until
    // commitTransaction() is explicitly called.
    return true;
}

/**
 * Commit a transaction to the database
 * 
 * @param resource $conn OCI8 connection resource
 * @return bool True on success, false on failure
 */
function commitTransaction($conn) {
    if (!is_resource($conn)) {
        error_log('ERROR: Invalid connection resource in commitTransaction');
        return false;
    }
    
    if (!oci_commit($conn)) {
        $e = oci_error($conn);
        error_log('Commit Error: ' . $e['message']);
        return false;
    }
    
    return true;
}

/**
 * Rollback a transaction
 * 
 * @param resource $conn OCI8 connection resource
 * @return bool True on success, false on failure
 */
function rollbackTransaction($conn) {
    if (!is_resource($conn)) {
        error_log('ERROR: Invalid connection resource in rollbackTransaction');
        return false;
    }
    
    if (!oci_rollback($conn)) {
        $e = oci_error($conn);
        error_log('Rollback Error: ' . $e['message']);
        return false;
    }
    
    return true;
}

/**
 * Execute a prepared statement with bind variables
 * 
 * @param resource $conn OCI8 connection resource
 * @param string $sql SQL statement with placeholders
 * @param array $binds Associative array of bind variables
 * @return resource|false Parsed and executed statement resource, or false on failure
 */
function executePreparedStatement($conn, $sql, $binds = array()) {
    if (!is_resource($conn)) {
        error_log('ERROR: Invalid connection resource in executePreparedStatement');
        return false;
    }
    
    // Parse SQL statement
    $stmt = oci_parse($conn, $sql);
    
    if ($stmt === false) {
        $e = oci_error($conn);
        error_log('Parse Error: ' . $e['message']);
        return false;
    }
    
    // Bind variables
    foreach ($binds as $key => $value) {
        oci_bind_by_name($stmt, $key, $binds[$key]);
    }
    
    // Execute statement
    if (!oci_execute($stmt)) {
        $e = oci_error($stmt);
        error_log('Execute Error: ' . $e['message']);
        return false;
    }
    
    return $stmt;
}

/**
 * Fetch all rows from a executed statement as associative array
 * 
 * @param resource $stmt Executed OCI8 statement
 * @return array Array of rows, each row is an associative array
 */
function fetchAllAssoc($stmt) {
    $rows = array();
    
    while ($row = oci_fetch_assoc($stmt)) {
        $rows[] = $row;
    }
    
    return $rows;
}

/**
 * Fetch single row from executed statement as associative array
 * 
 * @param resource $stmt Executed OCI8 statement
 * @return array|false Associative array of row data or false if no row
 */
function fetchOneAssoc($stmt) {
    return oci_fetch_assoc($stmt);
}

/**
 * Get number of rows affected by INSERT, UPDATE, or DELETE
 * 
 * @param resource $stmt Executed OCI8 statement
 * @return int Number of rows affected
 */
function getAffectedRowCount($stmt) {
    if (!is_resource($stmt)) {
        return 0;
    }
    
    return oci_num_rows($stmt);
}

/**
 * Close a statement resource
 * 
 * @param resource $stmt OCI8 statement resource
 * @return bool True on success
 */
function closeStatement($stmt) {
    if (!is_resource($stmt)) {
        return true;
    }
    
    return oci_free_statement($stmt);
}

/**
 * Close database connection
 * 
 * @param resource $conn OCI8 connection resource
 * @return bool True on success
 */
function closeConnection($conn) {
    if (!is_resource($conn)) {
        return true;
    }
    
    return oci_close($conn);
}

?>
