/**
 * Validation middleware for API routes
 */

/**
 * Validate API version
 */
export const validateAPIVersion = (req, res, next) => {
  const version = req.params.version;

  if (!version) {
    return res.status(400).json({
      error: 'API version required',
      code: 'VERSION_REQUIRED',
    });
  }

  // Check if version is supported
  const supportedVersions = ['v1', 'v2'];
  if (!supportedVersions.includes(version)) {
    return res.status(400).json({
      error: `Unsupported API version: ${version}`,
      code: 'VERSION_UNSUPPORTED',
      supported: supportedVersions,
    });
  }

  req.apiVersion = version;
  next();
};

/**
 * Validate input data
 */
export const validateInput = (schema) => {
  return (req, res, next) => {
    // Simple validation based on schema definition
    const errors = [];

    if (schema.body) {
      for (const [field, rules] of Object.entries(schema.body)) {
        const value = req.body[field];

        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push({
            field,
            message: `${field} is required`,
            code: 'FIELD_REQUIRED',
          });
        }

        if (value !== undefined && rules.type) {
          if (rules.type === 'string' && typeof value !== 'string') {
            errors.push({
              field,
              message: `${field} must be a string`,
              code: 'INVALID_TYPE',
            });
          } else if (rules.type === 'number' && typeof value !== 'number') {
            errors.push({
              field,
              message: `${field} must be a number`,
              code: 'INVALID_TYPE',
            });
          } else if (rules.type === 'object' && typeof value !== 'object') {
            errors.push({
              field,
              message: `${field} must be an object`,
              code: 'INVALID_TYPE',
            });
          } else if (rules.type === 'array' && !Array.isArray(value)) {
            errors.push({
              field,
              message: `${field} must be an array`,
              code: 'INVALID_TYPE',
            });
          }
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      });
    }

    next();
  };
};

/**
 * Generic validation result handler
 */
export const handleValidationErrors = (req, res, next) => {
  // This middleware is kept for compatibility with existing routes
  next();
};
