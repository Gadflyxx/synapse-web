/**
 * Token-bucket rate limiter for outbound Soroban RPC calls.
 *
 * Wraps all RPC invocations so that no matter how many features trigger reads
 * concurrently, the total request rate never exceeds `tokensPerInterval`
 * requests per `intervalMs`.
 *
 * When the bucket is empty, new requests are queued and drained as tokens
 * become available. A console.warn is emitted the first time a request is
 * queued in each throttle window so that the telemetry signal is clear without
 * being spammy.
 */

/** Deferred promise helpers — kept local to avoid external dependencies. */
interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: Deferred<T>["resolve"];
  let reject!: Deferred<T>["reject"];
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// ---------------------------------------------------------------------------
// RpcRateLimiter
// ---------------------------------------------------------------------------

export class RpcRateLimiter {
  /** Tokens currently available in the bucket. */
  private tokens: number;
  /** Maximum tokens (= tokensPerInterval after each refill). */
  private readonly capacity: number;
  /** Milliseconds between refills. */
  private readonly intervalMs: number;
  /** Timer handle for the periodic refill. */
  private refillTimer: ReturnType<typeof setInterval> | null = null;

  /** Total requests accepted since construction. */
  private totalRequests = 0;
  /** Total requests that were throttled (had to wait in the queue). */
  private throttledRequests = 0;

  /**
   * Queue of deferred resolve-functions waiting for a token.
   * Each entry corresponds to one waiting `acquire()` call.
   */
  private readonly queue: Array<Deferred<void>> = [];

  /**
   * Whether at least one warn has been emitted in the current refill window.
   * Resets each time the bucket is refilled so the signal stays visible across
   * windows without repeating for every queued call in one burst.
   */
  private warnedThisWindow = false;

  constructor(tokensPerInterval: number, intervalMs: number) {
    if (tokensPerInterval < 1) {
      throw new RangeError("tokensPerInterval must be ≥ 1");
    }
    if (intervalMs < 1) {
      throw new RangeError("intervalMs must be ≥ 1");
    }

    this.capacity = tokensPerInterval;
    this.tokens = tokensPerInterval;
    this.intervalMs = intervalMs;

    this.startRefillLoop();
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Acquire a token, waiting in the queue if none are available.
   *
   * Resolves immediately when a token is available; otherwise queues the
   * caller and resolves once the next refill grants it a token.
   */
  acquire(): Promise<void> {
    this.totalRequests++;

    if (this.tokens > 0) {
      this.tokens--;
      return Promise.resolve();
    }

    // No tokens — queue the request and warn.
    this.throttledRequests++;

    if (!this.warnedThisWindow) {
      this.warnedThisWindow = true;
      console.warn(
        `[RPC Rate Limiter] Throttling RPC requests — bucket exhausted. ` +
          `Queue depth: ${this.queue.length + 1}. ` +
          `Stats: ${this.totalRequests} total, ${this.throttledRequests} throttled ` +
          `(${this.capacityLabel()}).`
      );
    }

    const deferred = createDeferred<void>();
    this.queue.push(deferred);
    return deferred.promise;
  }

  /**
   * Returns current telemetry snapshot without side effects.
   */
  stats(): { tokens: number; queued: number; total: number; throttled: number } {
    return {
      tokens: this.tokens,
      queued: this.queue.length,
      total: this.totalRequests,
      throttled: this.throttledRequests,
    };
  }

  /**
   * Stop the background refill loop.
   * Call this in tests or when tearing down to avoid leaked timers.
   */
  destroy(): void {
    if (this.refillTimer !== null) {
      clearInterval(this.refillTimer);
      this.refillTimer = null;
    }
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  private startRefillLoop(): void {
    this.refillTimer = setInterval(() => this.refill(), this.intervalMs);
  }

  /**
   * Refill the bucket to capacity and drain as many queued requests as
   * possible. Called on each interval tick.
   */
  private refill(): void {
    this.tokens = this.capacity;
    this.warnedThisWindow = false;

    const drained = Math.min(this.queue.length, this.tokens);

    if (drained > 0) {
      console.warn(
        `[RPC Rate Limiter] Refilled — draining ${drained} queued request(s). ` +
          `Stats: ${this.totalRequests} total, ${this.throttledRequests} throttled ` +
          `(${this.capacityLabel()}).`
      );
    }

    for (let i = 0; i < drained; i++) {
      const deferred = this.queue.shift()!;
      this.tokens--;
      deferred.resolve();
    }
  }

  private capacityLabel(): string {
    return `capacity ${this.capacity} req/${this.intervalMs}ms`;
  }
}

// ---------------------------------------------------------------------------
// Singleton — 30 requests per 10 s (matches Horizon / Soroban RPC guidance)
// ---------------------------------------------------------------------------

export const rpcRateLimiter = new RpcRateLimiter(30, 10_000);

// ---------------------------------------------------------------------------
// withRateLimit helper
// ---------------------------------------------------------------------------

/**
 * Wraps an async `fn` with the singleton rate limiter.
 *
 * Usage:
 *
 * ```ts
 * const result = await withRateLimit(() => rpc.getTransaction(hash));
 * ```
 *
 * The call will block until a token is available, then invoke `fn` and return
 * its resolved value (or rethrow its rejection).
 */
export async function withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  await rpcRateLimiter.acquire();
  return fn();
}
