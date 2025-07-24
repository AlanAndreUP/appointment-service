import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { EstadoCita } from '@shared/types/response.types';

// Middleware para manejar errores de validación
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      data: null,
      message: 'Errores de validación',
      status: 'error',
      error: {
        code: 'VALIDATION_ERROR',
        details: errors.array()
      }
    });
  }
  
  next();
};

// Validaciones para crear cita
export const validateCreateAppointment = [
  body('id_tutor')
    .notEmpty()
    .withMessage('El ID del tutor es requerido')
    .isString()
    .withMessage('El ID del tutor debe ser una cadena'),
  
  body('id_alumno')
    .notEmpty()
    .withMessage('El ID del alumno es requerido')
    .isString()
    .withMessage('El ID del alumno debe ser una cadena'),
  
  body('fecha_cita')
    .notEmpty()
    .withMessage('La fecha de la cita es requerida')
    .isISO8601()
    .withMessage('La fecha debe estar en formato ISO 8601')
    .custom((value) => {
      const date = new Date(value);
      if (date <= new Date()) {
        throw new Error('La fecha de la cita debe ser futura');
      }
      return true;
    }),
  
  body('to_do')
    .optional()
    .isString()
    .withMessage('Las tareas deben ser una cadena')
    .isLength({ max: 1000 })
    .withMessage('Las tareas no pueden exceder 1000 caracteres'),
  
  handleValidationErrors
];

// Validaciones para actualizar cita
export const validateUpdateAppointment = [
  param('id')
    .notEmpty()
    .withMessage('El ID de la cita es requerido')
    .isString()
    .withMessage('El ID debe ser una cadena'),
  
  body('estado_cita')
    .optional()
    .isIn(['pendiente', 'confirmada', 'cancelada', 'completada', 'no_asistio'])
    .withMessage('Estado de cita inválido'),
  
  body('fecha_cita')
    .optional()
    .isISO8601()
    .withMessage('La fecha debe estar en formato ISO 8601')
    .custom((value) => {
      if (value) {
        const date = new Date(value);
        if (date <= new Date()) {
          throw new Error('La fecha de la cita debe ser futura');
        }
      }
      return true;
    }),
  
  body('checklist')
    .optional()
    .isArray()
    .withMessage('El checklist debe ser un arreglo')
    .custom((value) => {
      if (value) {
        for (const item of value) {
          if (typeof item.description !== 'string' || typeof item.completed !== 'boolean') {
            throw new Error('Cada elemento del checklist debe tener description (string) y completed (boolean)');
          }
        }
      }
      return true;
    }),

  body('reason')
    .optional()
    .isString()
    .withMessage('El motivo debe ser una cadena de texto'),
  
  handleValidationErrors
];

// Validaciones para actualizar estado
export const validateUpdateStatus = [
  param('id')
    .notEmpty()
    .withMessage('El ID de la cita es requerido')
    .isString()
    .withMessage('El ID debe ser una cadena'),
  
  body('estado_cita')
    .notEmpty()
    .withMessage('El estado de la cita es requerido')
    .isIn(['pendiente', 'confirmada', 'cancelada', 'completada', 'no_asistio'])
    .withMessage('Estado de cita inválido'),
  
  handleValidationErrors
];

// Validaciones para obtener cita por ID
export const validateGetById = [
  param('id')
    .notEmpty()
    .withMessage('El ID de la cita es requerido')
    .isString()
    .withMessage('El ID debe ser una cadena'),
  
  handleValidationErrors
];

// Validaciones para eliminar cita
export const validateDeleteAppointment = [
  param('id')
    .notEmpty()
    .withMessage('El ID de la cita es requerido')
    .isString()
    .withMessage('El ID debe ser una cadena'),
  
  handleValidationErrors
];

// Validaciones para filtros de búsqueda
export const validateGetAppointments = [
  query('id_tutor')
    .optional()
    .isString()
    .withMessage('El ID del tutor debe ser una cadena'),
  
  query('id_alumno')
    .optional()
    .isString()
    .withMessage('El ID del alumno debe ser una cadena'),
  
  query('estado_cita')
    .optional()
    .isIn(['pendiente', 'confirmada', 'cancelada', 'completada', 'no_asistio'])
    .withMessage('Estado de cita inválido'),
  
  query('fecha_desde')
    .optional()
    .isISO8601()
    .withMessage('La fecha desde debe estar en formato ISO 8601'),
  
  query('fecha_hasta')
    .optional()
    .isISO8601()
    .withMessage('La fecha hasta debe estar en formato ISO 8601'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entero entre 1 y 100'),
  
  handleValidationErrors
]; 