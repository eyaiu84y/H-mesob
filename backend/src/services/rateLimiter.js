/**
 * rateLimiter.js
 * Token-Bucket Rate Limiter for Provider Sending Quota Protection
 * Hawassa MESOB Public Service Management System
 */

export class TokenBucketRateLimiter {
  constructor({ ratePerSecond = 10, burstCapacity = null } = {}) {
    this.ratePerSecond = Math.max(1, parseInt(ratePerSecond, 10) || 10);
    this.capacity = burstCapacity || this.ratePerSecond * 2;
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
    this.waitingQueue = [];
    this.refillTimer = null;
  }

  _refill() {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSeconds * this.ratePerSecond);
    this.lastRefill = now;
  }

  /**
   * Acquire 1 sending token. Returns Promise that resolves when allowed to proceed.
   */
  async acquire() {
    this._refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    // Need to wait for token refill
    return new Promise((resolve) => {
      this.waitingQueue.push(resolve);
      this._scheduleNextDrain();
    });
  }

  _scheduleNextDrain() {
    if (this.refillTimer || this.waitingQueue.length === 0) return;

    const delayMs = Math.ceil((1 / this.ratePerSecond) * 1000);
    this.refillTimer = setTimeout(() => {
      this.refillTimer = null;
      this._refill();

      while (this.waitingQueue.length > 0 && this.tokens >= 1) {
        this.tokens -= 1;
        const nextWaiter = this.waitingQueue.shift();
        if (nextWaiter) nextWaiter(true);
      }

      if (this.waitingQueue.length > 0) {
        this._scheduleNextDrain();
      }
    }, delayMs);
  }

  /**
   * Update rate dynamically
   */
  setRate(newRatePerSecond) {
    this.ratePerSecond = Math.max(1, parseInt(newRatePerSecond, 10) || 10);
    this.capacity = this.ratePerSecond * 2;
    this.tokens = Math.min(this.tokens, this.capacity);
  }

  /**
   * Get current state
   */
  getStatus() {
    this._refill();
    return {
      ratePerSecond: this.ratePerSecond,
      availableTokens: Math.floor(this.tokens),
      capacity: this.capacity,
      waitingQueueDepth: this.waitingQueue.length,
    };
  }

  /**
   * Clean up timer on shutdown
   */
  destroy() {
    if (this.refillTimer) {
      clearTimeout(this.refillTimer);
      this.refillTimer = null;
    }
    while (this.waitingQueue.length > 0) {
      const waiter = this.waitingQueue.shift();
      if (waiter) waiter(false);
    }
  }
}

// Global default limiter instance configured via environment variable
const defaultRate = parseInt(process.env.EMAIL_RATE_LIMIT_PER_SEC, 10) || 15;
export const globalEmailRateLimiter = new TokenBucketRateLimiter({
  ratePerSecond: defaultRate,
});
