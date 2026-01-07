const crypto = require('crypto');

const ALGO = 'aes-256-gcm';

let KEY = null;
if (process.env.DB_ENCRYPTION_KEY) {
  try {
    const buf = Buffer.from(process.env.DB_ENCRYPTION_KEY, 'base64');
    if (buf.length === 32) {
      KEY = buf;
    } else {
      KEY = crypto.createHash('sha256').update(process.env.DB_ENCRYPTION_KEY).digest();
    }
  } catch (e) {
    KEY = crypto.createHash('sha256').update(process.env.DB_ENCRYPTION_KEY).digest();
  }
} else {
  console.warn('DB_ENCRYPTION_KEY non défini — le chiffrement est désactivé.');
}

function encrypt(plain) {
  if (!KEY) return plain;
  if (plain === null || plain === undefined) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, ciphertext]).toString('base64');
  return 'enc:' + payload;
}

function decrypt(ciphertext) {
  if (!KEY) return ciphertext;
  if (ciphertext === null || ciphertext === undefined) return null;
  if (typeof ciphertext !== 'string') return ciphertext;
  if (!ciphertext.startsWith('enc:')) return ciphertext;
  try {
    const data = Buffer.from(ciphertext.slice(4), 'base64');
    const iv = data.slice(0, 12);
    const tag = data.slice(12, 28);
    const ct = data.slice(28);
    const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
    return plain;
  } catch (e) {
    // Si déchiffrement échoue, renvoyer la valeur d'origine pour compatibilité
    return ciphertext;
  }
}

module.exports = { encrypt, decrypt };
