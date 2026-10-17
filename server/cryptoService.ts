import crypto from 'crypto';

// Master encryption salt & secret derivation
const MASTER_SECRET = process.env.APP_SECRET || 'HALPBOT_SECURE_VAULT_KEY_2026_@#$998';
const SALT = 'HALP_BOT_MILITARY_GRADE_SALT_2026';

// Derive 256-bit key using PBKDF2 with 10,000 iterations of SHA-512
const KEY = crypto.pbkdf2Sync(MASTER_SECRET, SALT, 10000, 32, 'sha512');

/**
 * Encrypt sensitive plain text using AES-256-GCM authenticated encryption.
 * Format: enc:v1:<iv_hex>:<authTag_hex>:<cipher_hex>
 */
export function encryptSecret(plainText: string): string {
  if (!plainText) return '';
  if (plainText.startsWith('enc:v1:')) return plainText; // Already encrypted

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `enc:v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt AES-256-GCM authenticated cipher text.
 */
export function decryptSecret(cipherText: string): string {
  if (!cipherText) return '';
  if (!cipherText.startsWith('enc:v1:')) return cipherText; // Not encrypted, return as is

  try {
    const parts = cipherText.split(':');
    if (parts.length !== 5) return '';

    const ivHex = parts[2];
    const authTagHex = parts[3];
    const encryptedHex = parts[4];

    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[CryptoService] Failed to decrypt secret:', err);
    return '';
  }
}

/**
 * Mask secret for safe UI display (e.g. 833322••••••••••••••••••••••••WBYc)
 */
export function maskSecret(val?: string, keepStart = 6, keepEnd = 4): string {
  if (!val || val === 'PROTECTED_IN_SERVER_ENV') return '';
  
  // If encrypted, decrypt first to get start and end characters for human recognition
  let raw = val;
  if (val.startsWith('enc:v1:')) {
    raw = decryptSecret(val);
  }

  const clean = raw.trim();
  if (clean.length <= keepStart + keepEnd) return '••••••••••••••••';
  const start = clean.substring(0, keepStart);
  const end = clean.substring(clean.length - keepEnd);
  return `${start}${'•'.repeat(22)}${end}`;
}
