const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A user must have a name'],
    },
    email: {
      type: String,
      required: [true, 'Please enter an email'],
      unique: [
        true,
        'This email is already taken. Please use a different email',
      ],
      lowercase: true,
      validate: [validator.isEmail, 'Please enter a valid email'],
    },
    photo: {
      type: String,
      default: 'default.jpg',
    },
    role: {
      type: String,
      enum: ['admin', 'user', 'guide', 'lead-guide'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minLength: [8, 'The password must be at least 8 characters'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [
        true,
        'The passwordConfirm field is required. Please confirm the password',
      ],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords do not match',
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    toObject: {
      transform: function (doc, res, options) {
        delete res.password;
        return res;
      },
    },
  }
);

/* We can also confirm password through middleware 
userSchema.pre('save', function (next) {
  if (this.password !== this.passwordConfirm) {
    return next(
      new AppError('The password and password confirm fields do not match')
    );
  }
  next();
}); */

// Hash password before save. Disable this when bulk importing from import-dev-data.js file
userSchema.pre('save', async function (next) {
  // only run if password is modified
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }

  /* Sometimes the passwordChangedAt token may get created after the 
    JWT due to slower DB operations. In that case the user will not be
    able to login since we have put checks. So subtract 1 sec from */
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({
    active: { $ne: false },
  });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  // Since 'select' for password is set to false, we cannot do this.password here
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.hasChangedPassword = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000);
    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
