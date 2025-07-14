import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    userType: 'tutor' | 'alumno';
  };
}

export interface JWTPayload {
  userId: string;
  userType: 'tutor' | 'alumno';
  iat?: number;
  exp?: number;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        data: null,
        message: 'Token de autenticación requerido',
        status: 'error',
        error: {
          code: 'MISSING_TOKEN'
        }
      });
    }

    const token = authHeader.split(' ')[1]; // Remover "Bearer "

    if (!token) {
      return res.status(401).json({
        data: null,
        message: 'Formato de token inválido',
        status: 'error',
        error: {
          code: 'INVALID_TOKEN_FORMAT'
        }
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET no está configurado');
      return res.status(500).json({
        data: null,
        message: 'Error de configuración del servidor',
        status: 'error',
        error: {
          code: 'MISSING_JWT_SECRET'
        }
      });
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    // Validar que el payload tenga los campos requeridos
    if (!decoded.userId || !decoded.userType) {
      return res.status(401).json({
        data: null,
        message: 'Token inválido: faltan campos requeridos',
        status: 'error',
        error: {
          code: 'INVALID_TOKEN_PAYLOAD'
        }
      });
    }

    // Validar userType
    if (!['tutor', 'alumno'].includes(decoded.userType)) {
      return res.status(401).json({
        data: null,
        message: 'Tipo de usuario inválido',
        status: 'error',
        error: {
          code: 'INVALID_USER_TYPE'
        }
      });
    }

    // Agregar información del usuario al request
    req.user = {
      userId: decoded.userId,
      userType: decoded.userType
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        data: null,
        message: 'Token inválido',
        status: 'error',
        error: {
          code: 'INVALID_TOKEN',
          details: error.message
        }
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        data: null,
        message: 'Token expirado',
        status: 'error',
        error: {
          code: 'EXPIRED_TOKEN'
        }
      });
    }

    console.error('Error en middleware de autenticación:', error);
    return res.status(500).json({
      data: null,
      message: 'Error interno del servidor',
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR'
      }
    });
  }
}; 