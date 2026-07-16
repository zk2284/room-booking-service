export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Last-resort safety net: malformed or missing input must never crash the
// service. Anything thrown in a route handler lands here as a clean JSON error.
export function errorHandler(err, req, res, _next) {
  const status = err instanceof HttpError ? err.status : err.status === 400 ? 400 : 500;
  const message = err instanceof HttpError ? err.message : err.message || "Could not process request";
  res.status(status).json({ error: message });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: "Not found" });
}
