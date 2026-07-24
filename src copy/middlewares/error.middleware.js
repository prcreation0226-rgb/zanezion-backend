import { sendResponse } from '../utils/response.js';

export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR 💥', err);
  }

  // Handle Prisma errors specifically if needed
  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      err.message = 'Duplicate field value entered';
      err.statusCode = 400;
    }
  }

  sendResponse(res, err.statusCode, err.message);
};
