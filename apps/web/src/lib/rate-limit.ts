import { NextResponse } from "next/server";

/**
 * Simple in-memory rate limiter for API routes.
 * Each instance tracks a separate set of keys (IP, email, phone, etc).
 *
 * Not suitable for multi-instance deployments — use Redis in production
 * if running behind a load balancer with multiple server processes.
 */
export class RateLimiter {
  private store = new Map<string, { count: number; resetAt: number }>();
  private windowMs: number;
  private maxRequests: number;

  constructor(opts: { windowMs: number; maxRequests: number }) {
    this.windowMs = opts.windowMs;
    this.maxRequests = opts.maxRequests;

    // Periodic cleanup to prevent unbounded memory growth
    const cleanup = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (entry.resetAt < now) {
          this.store.delete(key);
        }
      }
    }, this.windowMs);

    // Allow Node to exit even if interval is running
    if (cleanup.unref) cleanup.unref();
  }

  check(key: string): { allowed: boolean; retryAfterMs: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetAt < now) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, retryAfterMs: 0 };
    }

    if (entry.count >= this.maxRequests) {
      return { allowed: false, retryAfterMs: entry.resetAt - now };
    }

    entry.count++;
    return { allowed: true, retryAfterMs: 0 };
  }
}

/** Pre-built response for rate-limited requests */
export function rateLimitedResponse(retryAfterMs: number): NextResponse {
  const retryAfterSec = Math.ceil(retryAfterMs / 1000);
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    }
  );
}
