
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  if (Number.isInteger(err.statusCode)) {
    statusCode = err.statusCode;
  }

  if (
    err?.type === "entity.parse.failed" ||
    (err instanceof SyntaxError && Object.prototype.hasOwnProperty.call(err, "body"))
  ) {
    statusCode = 400;
    err.message = "Invalid JSON payload.";
  }

  if (err.name === "CastError") {
    statusCode = 404;
    err.message = "Resource not found";
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    err.message = "Invalid token";
  }

  if (err.code === 11000) {
    statusCode = 409;
    const duplicateKey = Object.keys(err.keyPattern || {})[0] || "field";
    err.message = `Duplicate value found for ${duplicateKey}.`;
  }

  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

export default errorHandler;
