import crypto from "crypto";

const SECRET = process.env.DEMO_AUTH_SECRET || "dev_demo_secret_change_me";
const DEFAULT_EXP_SEC = 60 * 60 * 24; // 24 hours

function base64UrlEncode(buf) {
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

export function signToken(payload, expiresInSec = DEFAULT_EXP_SEC) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSec;
  const full = { ...payload, iat, exp };
  const headerB = Buffer.from(JSON.stringify(header));
  const payloadB = Buffer.from(JSON.stringify(full));
  const toSign = `${base64UrlEncode(headerB)}.${base64UrlEncode(payloadB)}`;
  const sig = crypto.createHmac('sha256', SECRET).update(toSign).digest();
  return `${toSign}.${base64UrlEncode(sig)}`;
}

export function verifyToken(token) {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const toSign = `${headerB64}.${payloadB64}`;
    const expectedSig = crypto.createHmac('sha256', SECRET).update(toSign).digest();
    const sig = base64UrlDecode(sigB64);
    if (!crypto.timingSafeEqual(expectedSig, sig)) return null;
    const payloadBuf = base64UrlDecode(payloadB64);
    const payload = JSON.parse(payloadBuf.toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;
    return payload;
  } catch (e) {
    return null;
  }
}
