<?php
/**
 * TMC TimeIntel ProjectFlow Integration
 * API Authentication and Authorization Module
 * 
 * @author haseeb@tmcltd.ai
 * @version 1.0.0
 * @package webServices
 */

/**
 * Validate provided API key against primary API_KEY global
 * 
 * @param string $apiKey The API key to validate
 * @return bool True if valid, false otherwise
 */
function validateApiKey($apiKey) {
    if (empty($apiKey)) {
        return false;
    }
    
    if (!isset($GLOBALS['API_KEY'])) {
        error_log('ERROR: API_KEY not configured in GLOBALS');
        return false;
    }
    
    return hash_equals($GLOBALS['API_KEY'], $apiKey);
}

/**
 * Validate TimeIntel-specific API key (for dedicated integrations)
 * 
 * @param string $apiKey The API key to validate
 * @return bool True if valid, false otherwise
 */
function validateTimeIntelApiKey($apiKey) {
    if (empty($apiKey)) {
        return false;
    }
    
    if (!isset($GLOBALS['TIMEINTEL_API_KEY'])) {
        error_log('ERROR: TIMEINTEL_API_KEY not configured in GLOBALS');
        return false;
    }
    
    return hash_equals($GLOBALS['TIMEINTEL_API_KEY'], $apiKey);
}

/**
 * Get the requesting client's IP address
 * Handles proxied connections and X-Forwarded-For headers
 * 
 * @return string IP address of the client
 */
function getRequestingIp() {
    $ip = '';
    
    // Check for IP from shared internet
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        $ip = $_SERVER['HTTP_CLIENT_IP'];
    }
    // Check for IP passed from proxy
    elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        // Handle multiple IPs (take the first one)
        $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        $ip = trim($ips[0]);
    }
    // Check standard remote addr
    elseif (!empty($_SERVER['REMOTE_ADDR'])) {
        $ip = $_SERVER['REMOTE_ADDR'];
    }
    
    // Validate IP format
    if (filter_var($ip, FILTER_VALIDATE_IP)) {
        return $ip;
    }
    
    return 'UNKNOWN';
}

/**
 * Check if an IP address is in the allowed Cloud Run IP range
 * 
 * @param string $ip The IP address to check
 * @return bool True if IP is allowed, false otherwise
 */
function isAllowedIp($ip) {
    // Cloud Run IP ranges (configure these based on your deployment)
    $allowedRanges = array(
        '8.34.208.0/20',      // Cloud Run US
        '8.35.192.0/20',      // Cloud Run EU
        '34.16.0.0/14',       // Cloud Run global
        '34.96.0.0/13',       // Cloud Run global
        '34.104.0.0/14',      // Cloud Run global
        '34.118.0.0/15',      // Cloud Run US-central1
        '34.120.0.0/14',      // Cloud Run global
        '34.152.0.0/14',      // Cloud Run EU
        '34.160.0.0/13',      // Cloud Run global
        '35.184.0.0/15',      // Cloud Run UK
        '35.186.0.0/16',      // Cloud Run US
        '35.187.144.0/20',    // Cloud Run US
        '35.192.0.0/11',      // Cloud Run US
        '35.224.0.0/14',      // Cloud Run US-central1
        '35.228.0.0/14',      // Cloud Run US
        '35.232.0.0/15',      // Cloud Run US-central1
    );
    
    // Allow localhost for development
    if (in_array($ip, array('127.0.0.1', '::1', 'localhost'), true)) {
        return true;
    }
    
    foreach ($allowedRanges as $range) {
        if (ipInRange($ip, $range)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Check if an IP address falls within a CIDR range
 * 
 * @param string $ip IP address to check
 * @param string $range CIDR range (e.g., 8.34.208.0/20)
 * @return bool True if IP is in range
 */
function ipInRange($ip, $range) {
    if (strpos($range, '/') === false) {
        return $ip === $range;
    }
    
    list($subnet, $bits) = explode('/', $range);
    $ip = ip2long($ip);
    $subnet = ip2long($subnet);
    $mask = -1 << (32 - $bits);
    $subnet &= $mask;
    return ($ip & $mask) === $subnet;
}

/**
 * Require valid API authentication before proceeding
 * Validates both API key and IP address
 * Returns 401 Unauthorized if validation fails
 * 
 * @param bool $useTimeIntelKey If true, check TimeIntel-specific key
 * @return bool True if authentication succeeds
 */
function requireAuth($useTimeIntelKey = false) {
    // Get API key from header
    $apiKey = getApiKeyFromRequest();
    
    if (empty($apiKey)) {
        http_response_code(401);
        echo json_encode(array(
            'success' => false,
            'error' => 'Unauthorized: Missing API key',
            'code' => 'MISSING_API_KEY'
        ));
        exit;
    }
    
    // Validate API key
    $isValidKey = $useTimeIntelKey ? 
        validateTimeIntelApiKey($apiKey) : 
        validateApiKey($apiKey);
    
    if (!$isValidKey) {
        http_response_code(401);
        echo json_encode(array(
            'success' => false,
            'error' => 'Unauthorized: Invalid API key',
            'code' => 'INVALID_API_KEY'
        ));
        exit;
    }
    
    // Check IP allowlist
    $clientIp = getRequestingIp();
    if (!isAllowedIp($clientIp)) {
        http_response_code(401);
        echo json_encode(array(
            'success' => false,
            'error' => 'Unauthorized: IP address not allowed',
            'code' => 'INVALID_IP',
            'client_ip' => $clientIp
        ));
        exit;
    }
    
    return true;
}

/**
 * Extract API key from request headers
 * Looks for 'API_KEY' or 'Authorization: Bearer' headers
 * 
 * @return string API key if found, empty string otherwise
 */
function getApiKeyFromRequest() {
    // Check for direct API_KEY header
    if (!empty($_SERVER['HTTP_API_KEY'])) {
        return trim($_SERVER['HTTP_API_KEY']);
    }
    
    // Check for Authorization Bearer header
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        $auth = $_SERVER['HTTP_AUTHORIZATION'];
        if (strpos($auth, 'Bearer ') === 0) {
            return trim(substr($auth, 7));
        }
    }
    
    return '';
}

/**
 * Log API call to SYS_EVENT_LOG table
 * Uses existing eventLog() function if available
 * 
 * @param string $endpoint The endpoint being called (e.g., 'getMyTasks')
 * @param int $userId User ID making the request
 * @param array $params Request parameters (will be serialized)
 * @param string $clientIp Client IP address
 * @return bool True if logging succeeds
 */
function logApiCall($endpoint, $userId, $params, $clientIp = null) {
    if ($clientIp === null) {
        $clientIp = getRequestingIp();
    }
    
    // Prepare log details
    $logDetails = array(
        'endpoint' => $endpoint,
        'user_id' => $userId,
        'client_ip' => $clientIp,
        'params' => json_encode($params)
    );
    
    // Try to use existing eventLog() function if available
    if (function_exists('eventLog')) {
        return eventLog(
            'TIMEINTEL_API_CALL',
            'TMC TimeIntel API',
            json_encode($logDetails),
            $userId,
            'INFO'
        );
    }
    
    // Fallback: log to PHP error log
    error_log('API_CALL: ' . json_encode($logDetails));
    return true;
}

?>
