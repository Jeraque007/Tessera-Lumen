import { pemToDer, base64ToBuffer } from '../utils/crypto';

/**
 * Verifies the RSA signature from Huawei IAP (V2)
 * The signature is a SHA256withRSA signature of the purchaseData string.
 */
export async function verifyHmsSignature(purchaseData, signature, publicKeyPem) {
  try {
    if (!purchaseData || !signature || !publicKeyPem) {
      console.warn('[Signature] Missing required parameters. Key present:', !!publicKeyPem);
      return false;
    }

    console.log('[Signature] Attempting verification for purchaseData length:', purchaseData.length);
    console.log('[Signature] Public Key length:', publicKeyPem.length);

    // Import the public key
    const publicKey = await crypto.subtle.importKey(
      'spki',
      pemToDer(publicKeyPem),
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: { name: 'SHA-256' },
      },
      false,
      ['verify']
    );

    // Verify the signature
    // HMS IAP V2 uses SHA256withRSA on the raw purchaseData JSON string
    const isValid = await crypto.subtle.verify(
      {
        name: 'RSASSA-PKCS1-v1_5',
      },
      publicKey,
      base64ToBuffer(signature),
      new TextEncoder().encode(purchaseData)
    );

    if (isValid) {
      console.log('[Signature] Verification successful');
    } else {
      console.warn('[Signature] Verification failed - invalid signature');
    }

    return isValid;
  } catch (error) {
    console.error('[Signature] Verification error:', error.message);
    return false;
  }
}
