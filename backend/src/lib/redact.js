/** Masks `token=` query values so JWTs never reach the access log. */
function redactToken(url) {
  return String(url).replace(/([?&]token=)[^&#]*/gi, '$1[redacted]');
}

module.exports = { redactToken };
