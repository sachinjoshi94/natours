const mongoose = require('mongoose');
const Tour = require('./tourModel');
const AppError = require('../utils/appError');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Please provide some details in your review'],
      maxLength: [1000, 'A review must be under 1000 characters'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Please provide a rating for this tour'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.pre(/^find/, function (next) {
  //   this.populate({
  //     path: 'tour',
  //     select: 'name',
  //   }).populate({
  //     path: 'user',
  //     select: 'name',
  //   });
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        averageRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRatings,
      ratingsAverage: stats[0].averageRating.toFixed(2),
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  // Passing the review document from pre to post middleware
  this.reviewDoc = await this.findOne();

  /* If the review does not exist then reviewDoc is null and the post
    middleware below throws error even before the checks in factory handler
    functions are run. So we have to handle the error here.
  */
  if (!this.reviewDoc) {
    return next(
      new AppError('The review that you requested for does not exist', 404)
    );
  }
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  this.reviewDoc.constructor.calcAverageRatings(this.reviewDoc.tour);
});

const reviewModel = mongoose.model('Review', reviewSchema);

module.exports = reviewModel;
