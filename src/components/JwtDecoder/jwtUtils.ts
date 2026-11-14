// JWT Utility functions for client-side decoding, verification, and signing using Web Crypto API

export interface DecodedJwt {
  raw: string;
  header: Record<string, any>;
  payload: Record<string, any>;
  signature: string;
  headerRaw: string;
  payloadRaw: string;
  isValidStructure: boolean;
  error?: string;
  parts: [string, string, string];
}

export interface ClaimInfo {
  key: string;
  value: any;
  description: string;
  isStandard: boolean;
  humanReadable?: string;
}

export interface SecurityAuditResult {
  severity: 'safe' | 'warning' | 'danger';
  title: string;
  description: string;
  recommendation: string;
}

// RFC 7519 and common JWT claim descriptions
export const STANDARD_CLAIMS: Record<string, string> = {
  iss: 'Issuer - Identifies principal that issued the JWT',
  sub: 'Subject - Identifies the subject/user principal of the JWT',
  aud: 'Audience - Identifies the recipients/service the JWT is intended for',
  exp: 'Expiration Time - Unix epoch timestamp after which token must not be accepted',
  nbf: 'Not Before - Unix epoch timestamp before which token must not be accepted',
  iat: 'Issued At - Unix epoch timestamp when the JWT was issued',
  jti: 'JWT ID - Unique identifier for the token (used for replay prevention)',
  // Common identity claims
  name: 'User Full Name',
  given_name: 'Given / First Name',
  family_name: 'Family / Last Name',
  email: 'User Email Address',
  email_verified: 'Email Verification Status',
  phone_number: 'User Phone Number',
  phone_number_verified: 'Phone Verification Status',
  preferred_username: 'Username',
  roles: 'Assigned User Roles',
  role: 'User Role',
  groups: 'User Group Memberships',
  permissions: 'Security Permissions / Scopes',
  scope: 'OAuth 2.0 Granted Scopes',
  scp: 'OAuth 2.0 Scopes (Microsoft)',
  azp: 'Authorized Party - Client ID of OAuth app',
  nonce: 'Session Nonce (OpenID Connect)',
  auth_time: 'Authentication Timestamp',
  tid: 'Tenant ID (Microsoft Entra ID)',
  oid: 'Object ID (Microsoft Entra ID)',
  upn: 'User Principal Name (Microsoft Entra ID)',
  app_displayname: 'Application Display Name',
  user_id: 'User Identifier',
  firebase: 'Firebase Auth Identity Metadata',
};

// Base64Url decode helper
export function base64UrlDecode(str: string): string {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    // Decode UTF-8 string properly
    const raw = atob(base64);
    const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (err) {
    throw new Error('Invalid Base64Url encoding');
  }
}

// Base64Url encode helper
export function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlEncodeBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Parse a JWT string
export function parseJwt(token: string): DecodedJwt {
  const trimmed = token.trim();
  if (!trimmed) {
    return {
      raw: '',
      header: {},
      payload: {},
      signature: '',
      headerRaw: '',
      payloadRaw: '',
      isValidStructure: false,
      error: 'Token is empty',
      parts: ['', '', ''],
    };
  }

  const parts = trimmed.split('.');
  if (parts.length !== 3) {
    return {
      raw: trimmed,
      header: {},
      payload: {},
      signature: '',
      headerRaw: parts[0] || '',
      payloadRaw: parts[1] || '',
      isValidStructure: false,
      error: `Invalid JWT structure: Expected 3 period-separated segments, got ${parts.length}`,
      parts: [parts[0] || '', parts[1] || '', parts[2] || ''],
    };
  }

  let header: Record<string, any> = {};
  let payload: Record<string, any> = {};
  let headerRaw = '';
  let payloadRaw = '';

  try {
    headerRaw = base64UrlDecode(parts[0]);
    header = JSON.parse(headerRaw);
  } catch (err: any) {
    return {
      raw: trimmed,
      header: {},
      payload: {},
      signature: parts[2],
      headerRaw,
      payloadRaw,
      isValidStructure: false,
      error: `Failed to decode JWT Header: ${err.message || 'Malformed JSON/Base64'}`,
      parts: [parts[0], parts[1], parts[2]],
    };
  }

  try {
    payloadRaw = base64UrlDecode(parts[1]);
    payload = JSON.parse(payloadRaw);
  } catch (err: any) {
    return {
      raw: trimmed,
      header,
      payload: {},
      signature: parts[2],
      headerRaw,
      payloadRaw,
      isValidStructure: false,
      error: `Failed to decode JWT Payload: ${err.message || 'Malformed JSON/Base64'}`,
      parts: [parts[0], parts[1], parts[2]],
    };
  }

  return {
    raw: trimmed,
    header,
    payload,
    signature: parts[2],
    headerRaw,
    payloadRaw,
    isValidStructure: true,
    parts: [parts[0], parts[1], parts[2]],
  };
}

// Convert Unix epoch timestamp to formatted Date and relative text
export function formatTimestamp(seconds: number): {
  utc: string;
  local: string;
  relative: string;
  isPast: boolean;
  dateObj: Date;
} {
  const ms = seconds > 1e11 ? seconds : seconds * 1000;
  const date = new Date(ms);
  const now = Date.now();
  const diffMs = ms - now;
  const isPast = diffMs < 0;
  const absDiffSec = Math.abs(Math.round(diffMs / 1000));

  let relative = '';
  if (absDiffSec < 60) {
    relative = isPast ? `${absDiffSec}s ago` : `in ${absDiffSec}s`;
  } else if (absDiffSec < 3600) {
    const mins = Math.round(absDiffSec / 60);
    relative = isPast ? `${mins}m ago` : `in ${mins}m`;
  } else if (absDiffSec < 86400) {
    const hours = Math.round(absDiffSec / 3600);
    relative = isPast ? `${hours}h ago` : `in ${hours}h`;
  } else {
    const days = Math.round(absDiffSec / 86400);
    relative = isPast ? `${days}d ago` : `in ${days}d`;
  }

  return {
    utc: date.toUTCString(),
    local: date.toLocaleString(),
    relative,
    isPast,
    dateObj: date,
  };
}

// Extract and categorize claims
export function extractClaims(payload: Record<string, any>): ClaimInfo[] {
  const claims: ClaimInfo[] = [];

  for (const [key, value] of Object.entries(payload)) {
    const isStandard = key in STANDARD_CLAIMS;
    const description = STANDARD_CLAIMS[key] || 'Custom application claim';
    let humanReadable: string | undefined;

    if (['exp', 'iat', 'nbf', 'auth_time'].includes(key) && typeof value === 'number') {
      const formatted = formatTimestamp(value);
      humanReadable = `${formatted.local} (${formatted.relative})`;
    } else if (typeof value === 'object' && value !== null) {
      humanReadable = JSON.stringify(value);
    } else if (typeof value === 'boolean') {
      humanReadable = value ? 'True' : 'False';
    } else {
      humanReadable = String(value);
    }

    claims.push({
      key,
      value,
      description,
      isStandard,
      humanReadable,
    });
  }

  // Sort standard claims first (exp, iat, sub, iss, aud), then alphabetize
  const priority = ['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti', 'roles', 'scope'];
  claims.sort((a, b) => {
    const aIdx = priority.indexOf(a.key);
    const bIdx = priority.indexOf(b.key);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.key.localeCompare(b.key);
  });

  return claims;
}

// Perform Security Audit on Decoded Token
export function auditJwt(jwt: DecodedJwt, secret: string = ''): SecurityAuditResult[] {
  const results: SecurityAuditResult[] = [];

  if (!jwt.isValidStructure) {
    results.push({
      severity: 'danger',
      title: 'Malformed JWT Structure',
      description: jwt.error || 'The token does not adhere to RFC 7519 standards.',
      recommendation: 'Ensure token follows the [header].[payload].[signature] format.',
    });
    return results;
  }

  const alg = (jwt.header.alg || '').toUpperCase();

  // 1. Alg "none" check
  if (!alg || alg === 'NONE') {
    results.push({
      severity: 'danger',
      title: 'Critical Vulnerability: Algorithm is "none"',
      description: 'The token specifies no cryptographic signing algorithm (alg: "none"). Anyone can forge or modify claims without detection.',
      recommendation: 'Never accept alg: "none" in production. Require strong algorithms like HS256, RS256, or ES256.',
    });
  }

  // 2. Expiration Checks
  const nowSec = Math.floor(Date.now() / 1000);
  if (jwt.payload.exp === undefined) {
    results.push({
      severity: 'warning',
      title: 'Missing Expiration Claim (exp)',
      description: 'Token does not contain an "exp" timestamp and may live indefinitely if not revoked via a blocklist.',
      recommendation: 'Always set a reasonable expiration duration (e.g. 15 minutes to 24 hours).',
    });
  } else if (typeof jwt.payload.exp === 'number') {
    if (jwt.payload.exp < nowSec) {
      const formatted = formatTimestamp(jwt.payload.exp);
      results.push({
        severity: 'danger',
        title: 'Token is Expired',
        description: `Expired on ${formatted.local} (${formatted.relative}). Requests using this token should be rejected.`,
        recommendation: 'Request a fresh token from the authorization server using a refresh token or login flow.',
      });
    } else {
      const formatted = formatTimestamp(jwt.payload.exp);
      results.push({
        severity: 'safe',
        title: 'Token is Active & Valid',
        description: `Token is valid and will expire on ${formatted.local} (${formatted.relative}).`,
        recommendation: 'Token expiration adheres to RFC 7519 standards.',
      });
    }
  }

  // 3. Not Before (nbf) check
  if (typeof jwt.payload.nbf === 'number' && jwt.payload.nbf > nowSec) {
    const formatted = formatTimestamp(jwt.payload.nbf);
    results.push({
      severity: 'warning',
      title: 'Token Not Yet Valid (nbf)',
      description: `Token cannot be accepted before ${formatted.local} (${formatted.relative}).`,
      recommendation: 'Check clock synchronization between issuer and client systems.',
    });
  }

  // 4. Algorithm Strength
  if (['HS256', 'HS384', 'HS512'].includes(alg)) {
    if (secret && secret.length < 32) {
      results.push({
        severity: 'warning',
        title: 'Weak HMAC Secret Key',
        description: `The secret key is only ${secret.length} characters (${secret.length * 8} bits). NIST recommends at least 256 bits (32 bytes).`,
        recommendation: 'Use a cryptographically secure random string with at least 32 characters for HMAC secrets.',
      });
    }
    results.push({
      severity: 'safe',
      title: `Symmetric Signing (${alg})`,
      description: 'Signed with symmetric HMAC key. The same secret must be protected on the server.',
      recommendation: 'Keep the HMAC secret safe in environment variables or key vaults; never expose it on client devices.',
    });
  } else if (['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512', 'PS256'].includes(alg)) {
    results.push({
      severity: 'safe',
      title: `Asymmetric Public-Key Signing (${alg})`,
      description: 'Signed with a private key and verifiable via a public key (JWKS / PEM).',
      recommendation: 'Verify against public certificates or OpenID Connect JWKS endpoint.',
    });
  }

  // 5. Sensitive data in payload check
  const payloadStr = JSON.stringify(jwt.payload).toLowerCase();
  const sensitiveKeywords = ['password', 'passwd', 'secret', 'credit_card', 'ssn', 'private_key', 'cvv'];
  const foundKeywords = sensitiveKeywords.filter((k) => payloadStr.includes(`"${k}"`));

  if (foundKeywords.length > 0) {
    results.push({
      severity: 'danger',
      title: 'Potential Sensitive Data Exposed in Payload',
      description: `Found suspicious claim names: ${foundKeywords.join(', ')}. JWT payloads are merely Base64-encoded and can be read by anyone!`,
      recommendation: 'Do NOT store secrets, passwords, or PII in standard JWTs. Use JWE (encrypted JWT) if encryption is required.',
    });
  }

  return results;
}

// Verify HMAC-SHA256 / HS384 / HS512 using Web Crypto API
export async function verifyHmacSignature(
  token: string,
  secret: string,
  isBase64Secret: boolean = false
): Promise<{ isValid: boolean; message: string }> {
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) {
      return { isValid: false, message: 'Invalid JWT structure' };
    }

    if (!secret) {
      return { isValid: false, message: 'Secret key is required for verification' };
    }

    let header: any;
    try {
      header = JSON.parse(base64UrlDecode(parts[0]));
    } catch {
      return { isValid: false, message: 'Invalid Header' };
    }

    const alg = (header.alg || '').toUpperCase();
    let hashAlgorithm = 'SHA-256';
    if (alg === 'HS384') hashAlgorithm = 'SHA-384';
    else if (alg === 'HS512') hashAlgorithm = 'SHA-512';
    else if (alg !== 'HS256') {
      return { isValid: false, message: `Only HMAC algorithms (HS256, HS384, HS512) are supported for local secret verification. Token algorithm: ${alg || 'unknown'}` };
    }

    // Prepare secret bytes
    let keyBytes: Uint8Array;
    if (isBase64Secret) {
      try {
        const raw = atob(secret);
        keyBytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
      } catch {
        return { isValid: false, message: 'Provided secret is not valid Base64' };
      }
    } else {
      keyBytes = new TextEncoder().encode(secret);
    }

    // Import Key into Web Crypto
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: { name: hashAlgorithm } },
      false,
      ['verify', 'sign']
    );

    // Data to verify: header.payload
    const dataBytes = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);

    // Decode signature
    const sigBase64 = parts[2].replace(/-/g, '+').replace(/_/g, '/');
    let paddedSig = sigBase64;
    while (paddedSig.length % 4 !== 0) paddedSig += '=';
    const sigRaw = atob(paddedSig);
    const sigBytes = Uint8Array.from(sigRaw, (c) => c.charCodeAt(0));

    const isValid = await crypto.subtle.verify(
      'HMAC',
      cryptoKey,
      sigBytes,
      dataBytes
    );

    return {
      isValid,
      message: isValid
        ? `Signature Verified Successfully (${alg}) ✓`
        : `Invalid Signature: Secret does not match signature (${alg}) ✗`,
    };
  } catch (err: any) {
    return { isValid: false, message: `Verification error: ${err.message || err}` };
  }
}

// Sign a JWT using Web Crypto API
export async function signHmacJwt(
  headerObj: Record<string, any>,
  payloadObj: Record<string, any>,
  secret: string,
  isBase64Secret: boolean = false
): Promise<string> {
  const headerStr = JSON.stringify(headerObj);
  const payloadStr = JSON.stringify(payloadObj);

  const headerB64 = base64UrlEncode(headerStr);
  const payloadB64 = base64UrlEncode(payloadStr);
  const data = `${headerB64}.${payloadB64}`;

  const alg = (headerObj.alg || 'HS256').toUpperCase();
  if (alg === 'NONE') {
    return `${data}.`;
  }

  let hashAlgorithm = 'SHA-256';
  if (alg === 'HS384') hashAlgorithm = 'SHA-384';
  else if (alg === 'HS512') hashAlgorithm = 'SHA-512';

  let keyBytes: Uint8Array;
  if (isBase64Secret) {
    const raw = atob(secret);
    keyBytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
  } else {
    keyBytes = new TextEncoder().encode(secret);
  }

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: { name: hashAlgorithm } },
    false,
    ['sign']
  );

  const dataBytes = new TextEncoder().encode(data);
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, dataBytes);
  const signatureB64 = base64UrlEncodeBuffer(signatureBuffer);

  return `${data}.${signatureB64}`;
}
