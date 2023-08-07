const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsyncErrors');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createAndSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (req.secure || req.get('X-Forwarded-Proto') === 'https') {
    cookieOptions.secure = true;
  }

  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm, passwordChangedAt, role } =
    req.body;
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    passwordChangedAt,
    role,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  createAndSendToken(newUser.toObject(), 200, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  createAndSendToken(user.toObject(), 200, req, res);
});

exports.logout = catchAsync(async (req, res, next) => {
  res.clearCookie('jwt', { httpOnly: true }).redirect('/');
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in for access', 401)
    );
  }

  // Verifying the token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  //Check if user has been deleted
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new AppError('The user does no longer exist', 401));
  }

  // Check if user has changed password
  if (user.hasChangedPassword(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please login again'),
      401
    );
  }

  req.user = user;
  res.locals.user = user;
  next();
});

// Only for rendered pages, no errors
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt) {
    // Verifying the token
    const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);

    //Check if user has been deleted
    const user = await User.findById(decoded.id);
    if (!user) {
      return next();
    }

    // Check if user has changed password
    if (user.hasChangedPassword(decoded.iat)) {
      return next();
    }

    // there is a logged in user, pass it to pug template
    res.locals.user = user;
    // If user is already logged in and tries to go to login page, redirect the user
    if (req.method === 'GET' && req.path.split('/').includes('login')) {
      return res.redirect('/');
    }
    return next();
  }
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next(0);
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email address', 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Wrap in try catch to send general error in email sending
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    console.log(err);
    user.createPasswordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error while sending email'), 500);
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user from token
  const hashedPassword = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedPassword,
    passwordResetExpires: {
      $gt: Date.now(),
    },
  });

  // Check token expiration and user, then set new password
  if (!user) {
    return next(new AppError('Token is invalid or expired.', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // update the passwordChangedAt property
  // log the user in, send JWT
  createAndSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  if (
    !req.body.oldPassword ||
    !req.body.newPassword ||
    !req.body.confirmPassword
  ) {
    return next(
      new AppError(
        'Invalid data. Please provide the oldPassword, newPassword and confirmPassword fields',
        400
      )
    );
  }
  const user = await User.findOne({ email: req.user.email }).select(
    '+password'
  );
  if (!(await user.correctPassword(req.body.oldPassword, user.password))) {
    return next(new AppError('Incorrect password. Unable to update'), 401);
  }
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.confirmPassword;
  await user.save();

  createAndSendToken(user.toObject(), 200, req, res);
});
