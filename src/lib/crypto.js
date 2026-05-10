/**
 * Hashes a password using SHA-256 via the browser's built-in Web Crypto API.
 * Returns a lowercase hex string (64 chars).
 */
export async function hashPassword(plain) {
  const encoded = new TextEncoder().encode(plain);
  const buffer  = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}
