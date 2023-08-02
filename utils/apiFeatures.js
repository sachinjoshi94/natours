class APIFeatures {
  constructor(dbQuery, queryRequestObj) {
    this.dbQuery = dbQuery;
    this.queryRequestObj = queryRequestObj;
  }

  filter() {
    // Simple filtering
    const queryObj = { ...this.queryRequestObj }; // make a copy of req.query object
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach((el) => delete queryObj[el]);

    /* Advanced filtering
     * Express converts duration[gte]=5 in request url to { gte: 5 },
     * we just need to add $ sign */
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.dbQuery = this.dbQuery.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryRequestObj.sort) {
      const sortBy = this.queryRequestObj.sort.split(',').join(' ');
      this.dbQuery = this.dbQuery.sort(sortBy);
    } else {
      // This is creating unexpected duplcate results in pagination since createdAt is same for all docs
      // Use _id instead as it is unique
      // this.dbQuery = this.dbQuery.sort('-createdAt');
      this.dbQuery = this.dbQuery.sort('_id');
    }
    return this;
  }

  limit() {
    if (this.queryRequestObj.fields) {
      const fields = this.queryRequestObj.fields.split(',');
      this.dbQuery = this.dbQuery.select(fields);
    } else {
      this.dbQuery = this.dbQuery.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.queryRequestObj.page * 1 || 1;
    const limit = this.queryRequestObj.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.dbQuery = this.dbQuery.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
