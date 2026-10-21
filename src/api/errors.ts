/** The search quota is used up; `resetAt` (epoch ms) is when it is safe to try again. */
export class RateLimitError extends Error {
  readonly resetAt: number;

  constructor(resetAt: number, message = 'API rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
    this.resetAt = resetAt;
  }
}

/** GitHub rejected the query itself (HTTP 422). Retrying the same request will not help. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** The request never got a response (offline, DNS, CORS...). */
export class NetworkError extends Error {
  constructor(message = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

/** Any other non-2xx response. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
