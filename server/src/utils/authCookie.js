/**
 * The HTTP-only authentication cookie (docs/AUTH.md §9–§11).
 * Setting and clearing use identical attributes so browsers match the cookie.
 */

function cookieOptions(cookieConfig) {
  return {
    httpOnly: true,
    secure: cookieConfig.secure,
    sameSite: cookieConfig.sameSite,
    path: '/',
  }
}

export function setAuthCookie(res, token, config) {
  res.cookie(config.cookie.name, token, {
    ...cookieOptions(config.cookie),
    maxAge: config.jwt.expiresInMs,
  })
}

export function clearAuthCookie(res, config) {
  res.clearCookie(config.cookie.name, cookieOptions(config.cookie))
}
