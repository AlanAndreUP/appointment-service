import { Router } from 'express';
import { createAppointmentRoutes } from './appointment.routes';
import { createHealthRoutes } from './health.routes';
import { createSwaggerRoutes } from './swagger.routes';
import { AppointmentController } from '@infrastructure/controllers/AppointmentController';

export const createRoutes = (appointmentController: AppointmentController): Router => {
  const router = Router();

  // Rutas de documentación Swagger
  router.use('/', createSwaggerRoutes());

  // Rutas de health check (sin prefijo para facilitar acceso)
  router.use('/', createHealthRoutes());

  // Rutas de citas
  router.use('/appointments', createAppointmentRoutes(appointmentController));

  return router;
}; 