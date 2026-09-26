/**
 * Logs `METHOD /path STATUS DURATIONms` when each response finishes
 * (docs/AUTH.md §44).
 *
 * Logs the path only: never query strings, headers, cookies or bodies.
 */
function requestLogger(req, res, next) {
  const start = process.hrtime.bigint()
  // Capture now: mounted routers rewrite req.url while handling the request.
  const { method, path } = req

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6
    console.info(`${method} ${path} ${res.statusCode} ${durationMs.toFixed(1)}ms`)
  })

  next()
}

export default requestLogger
