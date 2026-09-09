import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024
};

export interface StoredCredential {
  algorithm: 'scrypt';
  salt: string;
  hash: string;
  keyLength: number;
  cost: number;
  blockSize: number;
  parallelization: number;
}

export function hashPassword(password: string): StoredCredential {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);

  return {
    algorithm: 'scrypt',
    salt: salt.toString('hex'),
    hash: derivedKey.toString('hex'),
    keyLength: KEY_LENGTH,
    cost: SCRYPT_OPTIONS.N,
    blockSize: SCRYPT_OPTIONS.r,
    parallelization: SCRYPT_OPTIONS.p
  };
}

export function verifyPassword(password: string, credential: StoredCredential): boolean {
  if (!credential || credential.algorithm !== 'scrypt' || !credential.salt || !credential.hash) {
    return false;
  }

  try {
    const expected = Buffer.from(credential.hash, 'hex');
    const actual = scryptSync(password, Buffer.from(credential.salt, 'hex'), credential.keyLength || KEY_LENGTH, {
      N: credential.cost || SCRYPT_OPTIONS.N,
      r: credential.blockSize || SCRYPT_OPTIONS.r,
      p: credential.parallelization || SCRYPT_OPTIONS.p,
      maxmem: SCRYPT_OPTIONS.maxmem
    });

    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function safeLegacyCompare(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
