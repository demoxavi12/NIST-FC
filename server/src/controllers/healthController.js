import { sendSuccess } from '../utils/apiResponse.js'

/** GET /api/health (docs/API.md §41). */
export function getHealth(req, res) {
  sendSuccess(res, { message: 'NIST FC API is running' })
}
