/**
 * Normalize `lastInsertRowid` (D12). The driver may return a bigint; values
 * outside the safe-integer range are rejected rather than silently truncated.
 */
export function toSafeId(value: number | bigint): number {
  if (typeof value === 'bigint') {
    if (value < BigInt(Number.MIN_SAFE_INTEGER) || value > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new RangeError('lastInsertRowid is outside the safe integer range');
    }
    return Number(value);
  }

  if (!Number.isSafeInteger(value)) {
    throw new RangeError('lastInsertRowid is outside the safe integer range');
  }
  return value;
}
