import crypto from 'crypto';

export function hashKey(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function generateKey() {
  const raw = crypto.randomBytes(24).toString('hex');
  const prefix = `udx_${raw.slice(0, 8)}`;
  const key = `${prefix}_${raw.slice(8)}`;
  return { key, prefix };
}

export function validateKey(rawKey: string) {
  return rawKey.startsWith('udx_') && rawKey.includes('_');
}

export function createKeyRecord() {
  const { key, prefix } = generateKey();
  const keyHash = hashKey(key);
  return { key, prefix, keyHash };
}
