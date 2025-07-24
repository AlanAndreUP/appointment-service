import { Router, Request, Response } from 'express';
import { ApiResponse } from '@shared/types/response.types';
import mongoose from 'mongoose';

export const createHealthRoutes = (): Router => {
  const router = Router();

  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Health check básico
   *     description: Verifica el estado básico del servicio de citas
   *     tags: [Health Check]
   *     responses:
   *       200:
   *         description: Servicio funcionando correctamente
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/HealthResponse'
   *             example:
   *               data:
   *                 status: "OK"
   *                 timestamp: "2025-11-15T10:30:00.000Z"
   *                 uptime: 3600.5
   *                 version: "1.0.0"
   *               message: "Servicio de citas funcionando correctamente"
   *               status: "success"
   */
  router.get('/health', (req: Request, res: Response) => {
    const response: ApiResponse = {
      data: {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      },
      message: 'Servicio de citas funcionando correctamente',
      status: 'success'
    };

    res.status(200).json(response);
  });

  /**
   * @swagger
   * /health/detailed:
   *   get:
   *     summary: Health check detallado
   *     description: Verifica el estado detallado del servicio incluyendo base de datos, memoria y configuraciones
   *     tags: [Health Check]
   *     responses:
   *       200:
   *         description: Health check detallado completado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: object
   *                       properties:
   *                         status:
   *                           type: string
   *                           example: "OK"
   *                         timestamp:
   *                           type: string
   *                           format: date-time
   *                         uptime:
   *                           type: number
   *                           description: "Tiempo de actividad en segundos"
   *                         version:
   *                           type: string
   *                           example: "1.0.0"
   *                         environment:
   *                           type: string
   *                           example: "development"
   *                         database:
   *                           type: object
   *                           properties:
   *                             status:
   *                               type: string
   *                               enum: [connected, disconnected]
   *                             name:
   *                               type: string
   *                         memory:
   *                           type: object
   *                           description: "Uso de memoria del proceso"
   *                         email:
   *                           type: object
   *                           properties:
   *                             configured:
   *                               type: boolean
   *                               description: "Si el servicio de email está configurado"
   *             example:
   *               data:
   *                 status: "OK"
   *                 timestamp: "2025-11-15T10:30:00.000Z"
   *                 uptime: 3600.5
   *                 version: "1.0.0"
   *                 environment: "development"
   *                 database:
   *                   status: "connected"
   *                   name: "appointment_service"
   *                 memory:
   *                   rss: 45678592
   *                   heapTotal: 33554432
   *                   heapUsed: 18874368
   *                   external: 8232
   *                 email:
   *                   configured: true
   *               message: "Health check detallado completado"
   *               status: "success"
   *       503:
   *         description: Error en el health check
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               data:
   *                 status: "ERROR"
   *                 timestamp: "2025-11-15T10:30:00.000Z"
   *                 error: "Database connection failed"
   *               message: "Error en health check"
   *               status: "error"
   */
  router.get('/health/detailed', async (req: Request, res: Response) => {
    try {
      // Verificar conexión a MongoDB
      const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
      
      const healthData = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: {
          status: dbStatus,
          name: mongoose.connection.name || 'unknown'
        },
        memory: process.memoryUsage(),
        email: {
          configured: !!process.env.RESEND_API_KEY
        }
      };

      const response: ApiResponse = {
        data: healthData,
        message: 'Health check detallado completado',
        status: 'success'
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        data: {
          status: 'ERROR',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        message: 'Error en health check',
        status: 'error'
      };

      res.status(503).json(response);
    }
  });

  return router;
}; 