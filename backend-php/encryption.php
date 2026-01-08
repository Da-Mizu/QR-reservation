<?php
// encryption.php - AES-256-GCM compatible avec le format Node (enc:base64(iv|tag|cipher))

define('ENC_ALGO', 'aes-256-gcm');

$rawKey = getenv('DB_ENCRYPTION_KEY');
if ($rawKey) {
    $bin = base64_decode($rawKey, true);
    if ($bin !== false && strlen($bin) === 32) {
        $ENC_KEY = $bin;
    } else {
        $ENC_KEY = hash('sha256', $rawKey, true);
    }
} else {
    $ENC_KEY = null;
}

function encrypt_value($plain) {
    global $ENC_KEY;
    if (!$ENC_KEY) return $plain;
    if ($plain === null) return null;
    $iv = random_bytes(12);
    $tag = '';
    $cipher = openssl_encrypt((string)$plain, ENC_ALGO, $ENC_KEY, OPENSSL_RAW_DATA, $iv, $tag, '', 16);
    $payload = base64_encode($iv . $tag . $cipher);
    return 'enc:' . $payload;
}

function decrypt_value($ciphertext) {
    global $ENC_KEY;
    if (!$ENC_KEY) return $ciphertext;
    if ($ciphertext === null) return null;
    if (!is_string($ciphertext) || strpos($ciphertext, 'enc:') !== 0) return $ciphertext;
    $raw = base64_decode(substr($ciphertext, 4), true);
    if ($raw === false || strlen($raw) < 29) return $ciphertext;
    $iv = substr($raw, 0, 12);
    $tag = substr($raw, 12, 16);
    $ct = substr($raw, 28);
    $plain = openssl_decrypt($ct, ENC_ALGO, $ENC_KEY, OPENSSL_RAW_DATA, $iv, $tag, '', 16);
    return $plain === false ? $ciphertext : $plain;
}
