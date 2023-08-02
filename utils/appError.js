class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // All of our errors are operational error, not programming errors

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
