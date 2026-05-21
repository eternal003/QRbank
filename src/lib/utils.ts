const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

/**
 * Generate a random ID using rejection sampling to avoid modulo bias.
 * Characters that would cause bias (remainder positions) are re-rolled.
 */
export function generateId(length = 8): string {
  let result = '';
  const charsLen = CHARS.length; // 55
  // Largest multiple of charsLen that fits in a byte (256)
  const maxValid = Math.floor(256 / charsLen) * charsLen; // 220

  while (result.length < length) {
    const array = new Uint8Array(length - result.length);
    crypto.getRandomValues(array);
    for (let i = 0; i < array.length && result.length < length; i++) {
      // Reject values >= maxValid to eliminate modulo bias
      if (array[i] < maxValid) {
        result += CHARS[array[i] % charsLen];
      }
    }
  }
  return result;
}

/**
 * Copy text to clipboard with fallback for older browsers.
 * Can be used on both client components.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers or insecure contexts
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'absolute';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      textarea.setAttribute('readonly', 'readonly');
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Sanitize user input: trim whitespace and limit length.
 */
export function sanitizeInput(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

/**
 * Strip non-numeric characters from account number (allow hyphens).
 */
export function cleanAccountNumber(value: string): string {
  return value.replace(/[^0-9-]/g, '');
}

