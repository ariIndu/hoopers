/**
 * Cryptographic utility functions for Beeswax Tamper-Evident Audit Chain.
 * Utilizes standard Web Crypto API (crypto.subtle) - zero external dependencies.
 */

export async function sha256Browser(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Recomputes and verifies the complete hash chain from genesis to head.
 * In a real incident or forensic trial, this allows independent, mathematically
 * irrefutable validation that no record has been altered, injected, or removed.
 */
export async function verifyHashChain(timeline, genesisHash = GENESIS_HASH) {
  if (!timeline || timeline.length === 0) {
    return {
      valid: true,
      errorIndex: null,
      totalEntries: 0,
      details: 'Timeline empty'
    };
  }

  let prev = genesisHash;

  for (let i = 0; i < timeline.length; i++) {
    const entry = timeline[i];

    // Check link integrity (prevHash pointer)
    if (entry.prevHash !== prev) {
      return {
        valid: false,
        errorIndex: i,
        failedSeq: entry.seq,
        actor: entry.actor,
        timestamp: entry.ts,
        text: entry.text,
        reason: `Broken chain link at Block #${entry.seq}: prevHash pointer does not match previous block hash.`,
        expectedPrev: prev,
        actualPrev: entry.prevHash,
        totalEntries: timeline.length
      };
    }

    // Recompute SHA-256 payload: seq|ts|actor|text|prevHash
    const payload = `${entry.seq}|${entry.ts}|${entry.actor}|${entry.text}|${entry.prevHash}`;
    const computedHash = await sha256Browser(payload);

    // Verify hash matches recorded hash
    if (computedHash !== entry.hash) {
      return {
        valid: false,
        errorIndex: i,
        failedSeq: entry.seq,
        actor: entry.actor,
        timestamp: entry.ts,
        text: entry.text,
        reason: `Cryptographic hash mismatch at Block #${entry.seq}! Content was altered after signing.`,
        expectedHash: computedHash,
        recordedHash: entry.hash,
        totalEntries: timeline.length
      };
    }

    prev = entry.hash;
  }

  return {
    valid: true,
    errorIndex: null,
    totalEntries: timeline.length,
    headHash: prev
  };
}
