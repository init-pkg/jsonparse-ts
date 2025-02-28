export function alloc(size: number): Uint8Array {
  if (typeof Buffer !== "undefined" && Buffer.alloc) {
    return Buffer.alloc(size); // Node.js
  }

  return new Uint8Array(size); // Browser-safe alternative
}
