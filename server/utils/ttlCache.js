class TtlCache {
  constructor(ttlMs) {
    this.ttlMs = ttlMs;
    this.entries = new Map();
  }

  async wrap(key, producer) {
    const hit = this.entries.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.value;

    const value = await producer();
    this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    return value;
  }

  clear() {
    this.entries.clear();
  }
}

module.exports = TtlCache;
