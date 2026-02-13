/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Log error details
  const errorId = Math.random().toString(36).substr(2, 9);
  console.error(`Error ID: ${errorId}`, {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Determine status code
  const statusCode = err.status || err.statusCode || 500;
  
  // Prepare error response
  const errorResponse = {
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    errorId,
    timestamp: new Date().toISOString()
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Not found handler
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.status = 404;
  error.code = 'ROUTE_NOT_FOUND';
  next(error);
};