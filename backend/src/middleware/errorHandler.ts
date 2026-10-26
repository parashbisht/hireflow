import { Prisma } from '@prisma/client';
import { ErrorRequestHandler } from 'express';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  let statusCode = 500;
  let message = 'Internal server error';

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      statusCode = 409;
      message = 'A record with this value already exists';
    } else if (error.code === 'P2000') {
      statusCode = 400;
      message = 'A submitted value exceeds the allowed length';
    } else if (error.code === 'P2003' || error.code === 'P2023') {
      statusCode = 400;
      message = 'Request contains an invalid reference';
    } else if (error.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
    }
  } else if (isRecord(error) && error.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Request body contains invalid JSON';
  } else if (isRecord(error) && error.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body is too large';
  } else if (isRecord(error)) {
    const candidateStatus = error.statusCode ?? error.status;
    if (typeof candidateStatus === 'number' && Number.isInteger(candidateStatus) && candidateStatus >= 400 && candidateStatus < 500) {
      statusCode = candidateStatus;
      message = typeof error.message === 'string' && error.message.length > 0
        ? error.message
        : 'Request failed';
    }
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({ success: false, message });
};
