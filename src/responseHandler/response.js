const handleSuccess = (res, data, message , statusCode) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      statusCode
    });
  };
  const handleFail = (res, message , statusCode) => {
    return res.status(statusCode).json({
      success: false,
      message,
      statusCode
    });
  };
  const handleError = (res, message, statusCode) => {
    return res.status(statusCode).json({
      success: false,
      message,
      statusCode
    });
  };
  
  export { handleSuccess, handleError,handleFail };
  