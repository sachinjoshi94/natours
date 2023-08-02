const AppError = require('../utils/appError');

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  } else {
    console.error('ERROR 💥:', err);
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  }
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const message = `Duplicate field value ${err.keyValue.name}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError('Invalid token, Please login again', 401);
};

const handleTokenExpiredError = () =>
  new AppError('Token expired. Please login again', 401);

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    // Operational error: send details to the client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // Programming error: hide details from the client
    console.error('ERROR 💥:', err); // Log the error for debugging later
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }

  // Rendered website
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went Wrong',
      msg: err.message,
    });
  }
  // Programming error: hide details from the client
  console.error('ERROR 💥:', err); // Log the error for debugging later
  return res.status(err.statusCode).render('error', {
    title: 'Something went Wrong',
    msg: 'Please try again later',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  const env = process.env.NODE_ENV.trim();
  if (env === 'development') {
    sendErrorDev(err, req, res);
  } else if (env === 'production') {
    /*
      This is done to copy the message property from the parent Error class
      Normal Object.assign and {...err} does not copy properties from object prototypes
    */
    let error = Object.create(
      Object.getPrototypeOf(err),
      Object.getOwnPropertyDescriptors(err)
    );
    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (error.code === 11000) error = handleDuplicateFieldsDB(err);
    if (error._message === 'Validation failed')
      error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError(err);
    if (err.name === 'TokenExpiredError') error = handleTokenExpiredError(err);
    sendErrorProd(error, req, res);
  }
};
