const { errorResponse } = require('../utils/responseHelper');

// Validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.validatedData = validated;
      next();
    } catch (error) {
      return res.status(400).json(errorResponse(error.errors, 'VAL_001'));
    }
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.query);
      req.validatedQuery = validated;
      next();
    } catch (error) {
      return res.status(400).json(errorResponse(error.errors, 'VAL_001'));
    }
  };
};

module.exports = {
  validateRequest,
  validateQuery
};
