/**
 * Standardized API response helpers
 */

function success(reply, data = null, message = 'Success', statusCode = 200) {
  return reply.status(statusCode).send({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

function created(reply, data = null, message = 'Created successfully') {
  return success(reply, data, message, 201);
}

function paginated(reply, data, pagination, message = 'Success') {
  return reply.status(200).send({
    success: true,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString(),
  });
}

function error(reply, message = 'Internal Server Error', statusCode = 500, errors = null) {
  return reply.status(statusCode).send({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
  });
}

function notFound(reply, message = 'Resource not found') {
  return error(reply, message, 404);
}

function unauthorized(reply, message = 'Unauthorized') {
  return error(reply, message, 401);
}

function forbidden(reply, message = 'Forbidden') {
  return error(reply, message, 403);
}

function badRequest(reply, message = 'Bad request', errors = null) {
  return error(reply, message, 400, errors);
}

function validationError(reply, errors) {
  return reply.status(422).send({
    success: false,
    message: 'Validation failed',
    errors,
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  success,
  created,
  paginated,
  error,
  notFound,
  unauthorized,
  forbidden,
  badRequest,
  validationError,
};
