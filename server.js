const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Handling uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception: shutting down');
  console.log(err.name, err.message);
  // Here exiting the process is necessary to get a clean server
  process.exit(1);
});

dotenv.config({ path: './config.env' });

// Require app after dotenv to initialize env variables first before using the app
const app = require('./app');

let url = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);

url = url.replace('<dbname>', process.env.DATABASE_NAME);

mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => {
    console.log('DB connected');
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

// Handling unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled Rejection: shutting down');
  process.exit(1);
});

// Graceful shutdown in case our app is terminated abruptly
process.on('SIGTERM', () => {
  console.log('SIGTERM: Shutting down application');
  server.close(() => {
    console.log('Process terminated');
  });
});
