exports.createResponse = (result = null, error = null, message = "") => {
  const response = {
    success: error ? false : true,
    result,
    message: error ? error.message : message,
  };

  return response;
};