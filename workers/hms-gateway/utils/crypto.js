/**
 * Helper: Convert Base64 string to Uint8Array/ArrayBuffer
 * Includes robust cleaning for malformed strings or whitespace
 */
export function base64ToBuffer(base64) {
  try {
    // Remove all whitespace, line breaks, and tabs
    const cleanBase64 = base64.replace(/\s/g, '');
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (e) {
    console.error("[Crypto] base64ToBuffer failed:", e.message);
    throw new Error('Invalid base64 format');
  }
}

/**
 * Helper: Convert PEM to DER format for Web Crypto API
 * Handles both raw base64 and PEM with headers
 */
export function pemToDer(pem) {
  if (!pem) return new ArrayBuffer(0);

  let base64 = pem;
  const pemHeader = '-----BEGIN PUBLIC KEY-----';
  const pemFooter = '-----END PUBLIC KEY-----';

  if (pem.includes(pemHeader)) {
    base64 = pem.substring(
      pem.indexOf(pemHeader) + pemHeader.length,
      pem.indexOf(pemFooter)
    );
  }

  // Also handle Private Key headers
  const privateHeader = '-----BEGIN PRIVATE KEY-----';
  const privateFooter = '-----END PRIVATE KEY-----';
  if (pem.includes(privateHeader)) {
    base64 = pem.substring(
      pem.indexOf(privateHeader) + privateHeader.length,
      pem.indexOf(privateFooter)
    );
  }

  return base64ToBuffer(base64);
}

/**
 * Helper: Sign a JWT using ECDSA (ES256) for Huawei IAP
 */
export async function signHmsJwt(payload, privateKeyPem, keyId) {
  const header = {
    alg: 'ES256',
    typ: 'JWT',
    kid: keyId
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(privateKeyPem),
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    key,
    new TextEncoder().encode(dataToSign)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  return `${dataToSign}.${encodedSignature}`;
}

/**
 * Helper: Convert base64url to Uint8Array
 */
export function base64UrlToBuffer(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  return base64ToBuffer(base64 + padding);
}
