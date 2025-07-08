import { Router } from 'express';
import { AppointmentController } from '@infrastructure/controllers/AppointmentController';
import { authMiddleware } from '@infrastructure/middlewares/auth.middleware';
import { 
  validateCreateAppointment,
  validateUpdateAppointment,
  validateUpdateStatus,
  validateGetById,
  validateDeleteAppointment,
  validateGetAppointments
} from '@infrastructure/middlewares/validation.middleware';
import { strictRateLimit } from '@infrastructure/middlewares/rateLimit.middleware';

export const createAppointmentRoutes = (appointmentController: AppointmentController): Router => {
  const router = Router();

  // Aplicar autenticación a todas las rutas
  router.use(authMiddleware);

  /**
   * @swagger
   * /appointments:
   *   post:
   *     summary: Crear nueva cita
   *     description: Crea una nueva cita entre un tutor y un alumno con validación de conflictos de horario
   *     tags: [Citas]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateAppointmentRequest'
   *           example:
   *             id_tutor: "tutor_123"
   *             id_alumno: "alumno_456"
   *             fecha_cita: "2024-01-15T10:00:00.000Z"
   *             to_do: "Revisar álgebra básica y ecuaciones lineales"
   *     responses:
   *       201:
   *         description: Cita creada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/AppointmentResponse'
   *       400:
   *         description: Error de validación o fecha inválida
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: No autorizado - Token inválido o faltante
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Conflicto de horario - Ya existe una cita en ese horario
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       429:
   *         description: Demasiadas peticiones
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post(
    '/',
    strictRateLimit, // Limite estricto para creación
    validateCreateAppointment,
    appointmentController.createAppointment
  );

  /**
   * @swagger
   * /appointments:
   *   get:
   *     summary: Obtener citas con filtros y paginación
   *     description: Lista todas las citas con filtros opcionales por tutor, alumno, estado, fechas y paginación
   *     tags: [Citas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: id_tutor
   *         schema:
   *           type: string
   *         description: Filtrar por ID del tutor
   *         example: "tutor_123"
   *       - in: query
   *         name: id_alumno
   *         schema:
   *           type: string
   *         description: Filtrar por ID del alumno
   *         example: "alumno_456"
   *       - in: query
   *         name: estado_cita
   *         schema:
   *           type: string
   *           enum: [pendiente, confirmada, cancelada, completada, no_asistio]
   *         description: Filtrar por estado de la cita
   *         example: "confirmada"
   *       - in: query
   *         name: fecha_desde
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Filtrar citas desde esta fecha
   *         example: "2024-01-01T00:00:00.000Z"
   *       - in: query
   *         name: fecha_hasta
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Filtrar citas hasta esta fecha
   *         example: "2024-01-31T23:59:59.999Z"
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Número de página
   *         example: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: Número de elementos por página
   *         example: 10
   *     responses:
   *       200:
   *         description: Lista de citas obtenida exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/AppointmentResponse'
   *                     pagination:
   *                       $ref: '#/components/schemas/PaginationMeta'
   *       400:
   *         description: Error de validación en parámetros
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: No autorizado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get(
    '/',
    validateGetAppointments,
    appointmentController.getAppointments
  );

  /**
   * @swagger
   * /appointments/{id}:
   *   get:
   *     summary: Obtener cita por ID
   *     description: Obtiene los detalles de una cita específica por su ID único
   *     tags: [Citas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID único de la cita
   *         example: "appt_123abc"
   *     responses:
   *       200:
   *         description: Cita obtenida exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/AppointmentResponse'
   *       400:
   *         description: ID inválido
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: No autorizado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Cita no encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get(
    '/:id',
    validateGetById,
    appointmentController.getAppointmentById
  );

  /**
   * @swagger
   * /appointments/{id}:
   *   put:
   *     summary: Actualizar cita completa
   *     description: Actualiza una cita existente incluyendo fecha, estado, tareas pendientes y completadas
   *     tags: [Citas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID único de la cita
   *         example: "appt_123abc"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateAppointmentRequest'
   *           example:
   *             estado_cita: "confirmada"
   *             fecha_cita: "2024-01-15T11:00:00.000Z"
   *             to_do: "Revisar álgebra avanzada"
   *             finish_to_do: "Completó ejercicios básicos"
   *     responses:
   *       200:
   *         description: Cita actualizada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/AppointmentResponse'
   *       400:
   *         description: Error de validación o cita no modificable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: No autorizado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Cita no encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Conflicto de horario
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       429:
   *         description: Demasiadas peticiones
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.put(
    '/:id',
    strictRateLimit, // Limite estricto para actualizaciones
    validateUpdateAppointment,
    appointmentController.updateAppointment
  );

  /**
   * @swagger
   * /appointments/{id}/status:
   *   put:
   *     summary: Actualizar solo el estado de una cita
   *     description: Cambia únicamente el estado de una cita existente
   *     tags: [Citas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID único de la cita
   *         example: "appt_123abc"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateStatusRequest'
   *           example:
   *             estado_cita: "confirmada"
   *     responses:
   *       200:
   *         description: Estado de cita actualizado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/AppointmentResponse'
   *       400:
   *         description: Error de validación o estado inválido
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: No autorizado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Cita no encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       429:
   *         description: Demasiadas peticiones
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.put(
    '/:id/status',
    strictRateLimit,
    validateUpdateStatus,
    appointmentController.updateAppointmentStatus
  );

  /**
   * @swagger
   * /appointments/{id}:
   *   delete:
   *     summary: Eliminar cita (soft delete)
   *     description: Marca una cita como eliminada sin borrarla físicamente de la base de datos
   *     tags: [Citas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID único de la cita
   *         example: "appt_123abc"
   *     responses:
   *       200:
   *         description: Cita eliminada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: null
   *                       example: null
   *       400:
   *         description: Error de validación o cita ya eliminada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: No autorizado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Cita no encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       429:
   *         description: Demasiadas peticiones
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.delete(
    '/:id',
    strictRateLimit, // Limite estricto para eliminaciones
    validateDeleteAppointment,
    appointmentController.deleteAppointment
  );

  return router;
}; 