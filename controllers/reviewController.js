const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

/* Instead of using methods we will use compound unique index on tour and user fields
 * 
const isDuplicateReview = async (userId, tourId) => {
  const review = await Review.findOne({ user: userId, tour: tourId });
  if (!review) return false;
  return true;
}; */

exports.setTourUserIds = async (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};

exports.getReviews = factory.getAll(Review);

exports.getReview = factory.getOne(Review);

exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);
