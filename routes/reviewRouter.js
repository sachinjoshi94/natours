const express = require('express');
const { protect, restrictTo } = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

// Use mergeParams to get the route parameters passed from tour router
const router = express.Router({
  mergeParams: true,
});

router.use(protect);

router
  .route('/')
  .get(reviewController.getReviews)
  .post(
    restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(restrictTo('user', 'admin'), reviewController.updateReview)
  .delete(restrictTo('admin', 'user'), reviewController.deleteReview);

module.exports = router;
