const express = require('express');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const tourRouter = require('./routes/tourRouter');
const userRouter = require('./routes/userRouter');
const reviewRouter = require('./routes/reviewRouter');
const viewRouter = require('./routes/viewRouter');
const bookingRouter = require('./routes/bookingRouter');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use(express.json({ limit: '50kb' }));
app.use(cookieParser());

// MIDDLEWARES

// Allow app access only from trusted scripts and URLs
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'mapbox.com', '*.mapbox.com', '*.stripe.com'],
        workerSrc: ['blob:'],
        childSrc: ['blob:'],
        frameSrc: ['*.stripe.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: [
          'https://*.herokuapp.com',
          'https://*.mapbox.com',
          'https://*.tiles.mapbox.com',
          'https://api.mapbox.com',
          'https://events.mapbox.com',
          'https://d2ad6b4ur7yvpq.cloudfront.net',
          'localhost:8000',
          '127.0.0.1:8000',
        ],
      },
    },
  })
);

if (process.env.NODE_ENV.trim() === 'development') {
  app.use(morgan('dev'));
}

// Throttling maximum requests from an IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP. Please try in an hour',
});
app.use('/api', limiter);

// Data sanitization against NoSQL injections and XSS attacks
app.use(mongoSanitize());
app.use(xss());

// Parameter pollution prevention
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// HTTP response compression
app.use(compression());

// Mounting routers on application
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// Handling unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`));
});

// Regisering our global error handler
app.use(globalErrorHandler);

module.exports = app;
