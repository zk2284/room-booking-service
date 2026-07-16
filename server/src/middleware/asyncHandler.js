// Express 4 does not forward rejected promises from async handlers to the
// error middleware on its own — wrap any handler that uses await with this.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
