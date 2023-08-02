const catchAsync = require('../utils/catchAsyncErrors');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id).select('-_id');
    if (!doc) {
      return next(new AppError('No docuent found with the id', 404));
    }
    res.status(204).json({
      status: 'success',
    });
  });
};

exports.updateOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const doc = Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true, // IMPORTANT: the required validation works only if the field is present in req body, otherwise it is skipped
    });
    if (!doc) {
      return next(new AppError('No document found with the id', 404));
    }
    const updatedDoc = await doc;
    res.status(200).json({
      status: 'success',
      data: {
        data: updatedDoc,
      },
    });
  });
};

exports.createOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });
};

exports.getOne = (Model, populateOptions) => {
  return catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    const doc = await query;
    if (!doc) {
      return next(new AppError('No document found with the id', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });
};

exports.getAll = (Model) => {
  return catchAsync(async (req, res, next) => {
    // To handle the nested tours/review route
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // Executing our query
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limit()
      .paginate();
    const doc = await features.dbQuery;
    // const doc = await features.dbQuery.explain();

    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: { data: doc },
    });
  });
};
