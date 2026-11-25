/*
 * Every API response has the same shape, so the frontend always knows where
 * to look:
 *
 *   Success:  { success: true,  data: { ... }, message?: "..." }
 *   Failure:  { success: false, message: "...", errors?: { field: "..." } }
 *
 * Controllers call sendSuccess(); failures are produced by the central
 * error handler (middleware/errorHandler.js).
 */
export function sendSuccess(res, data = {}, { status = 200, message } = {}) {
  return res.status(status).json({ success: true, data, ...(message && { message }) });
}

export function sendFailure(res, status, message, errors) {
  return res.status(status).json({ success: false, message, ...(errors && { errors }) });
}
