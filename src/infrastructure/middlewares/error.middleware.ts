import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '@shared/types/response.types';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error stack:', error.stack);
  console.error('Error message:', error.message);
  console.error('Request URL:', req.url);
  console.error('Request method:', req.method);

  const errorResponse: ErrorResponse = {
    data: null,
    message: 'Error interno del servidor',
    status: 'error',
    error: {
      code: 'INTERNAL_ERROR'
    }
  };

  // Manejar errores conocidos
  if (error.message.includes('no encontrada') || error.message.includes('not found')) {
    errorResponse.message = error.message;
    errorResponse.error!.code = 'NOT_FOUND';
    res.status(404).json(errorResponse);
    return;
  }

  if (error.message.includes('ya existe') || error.message.includes('conflicto')) {
    errorResponse.message = error.message;
    errorResponse.error!.code = 'CONFLICT';
    res.status(409).json(errorResponse);
    return;
  }

  if (error.message.includes('fecha') || error.message.includes('horario')) {
    errorResponse.message = error.message;
    errorResponse.error!.code = 'INVALID_DATE';
    res.status(400).json(errorResponse);
    return;
  }

  if (error.message.includes('modificada') || error.message.includes('eliminada')) {
    errorResponse.message = error.message;
    errorResponse.error!.code = 'INVALID_OPERATION';
    res.status(400).json(errorResponse);
    return;
  }

  // Error general
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error!.details = error.message;
  }

  res.status(500).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const errorResponse: ErrorResponse = {
    data: null,
    message: `Endpoint ${req.method} ${req.path} no encontrado`,
    status: 'error',
    error: {
      code: 'ENDPOINT_NOT_FOUND'
    }
  };

  res.status(404).json(errorResponse);
}; 