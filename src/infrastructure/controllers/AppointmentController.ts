import { Request, Response, NextFunction } from 'express';
import { CreateAppointmentUseCase } from '@application/use-cases/CreateAppointment.usecase';
import { UpdateAppointmentUseCase } from '@application/use-cases/UpdateAppointment.usecase';
import { GetAppointmentsUseCase } from '@application/use-cases/GetAppointments.usecase';
import { GetAppointmentByIdUseCase } from '@application/use-cases/GetAppointmentById.usecase';
import { DeleteAppointmentUseCase } from '@application/use-cases/DeleteAppointment.usecase';
import { UpdateAppointmentStatusUseCase } from '@application/use-cases/UpdateAppointmentStatus.usecase';
import { 
  CreateAppointmentRequest, 
  UpdateAppointmentRequest, 
  AppointmentFilters,
  ApiResponse,
  EstadoCita 
} from '@shared/types/response.types';
import { AuthRequest } from '@infrastructure/middlewares/auth.middleware';

export class AppointmentController {
  constructor(
    private readonly createAppointmentUseCase: CreateAppointmentUseCase,
    private readonly updateAppointmentUseCase: UpdateAppointmentUseCase,
    private readonly getAppointmentsUseCase: GetAppointmentsUseCase,
    private readonly getAppointmentByIdUseCase: GetAppointmentByIdUseCase,
    private readonly deleteAppointmentUseCase: DeleteAppointmentUseCase,
    private readonly updateAppointmentStatusUseCase: UpdateAppointmentStatusUseCase
  ) {}

  createAppointment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const request: CreateAppointmentRequest = req.body;
      const result = await this.createAppointmentUseCase.execute(request);

      const response: ApiResponse = {
        data: result,
        message: 'Cita creada exitosamente',
        status: 'success'
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  getAppointments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters: AppointmentFilters = {
        id_tutor: req.query.id_tutor as string,
        id_alumno: req.query.id_alumno as string,
        estado_cita: req.query.estado_cita as EstadoCita,
        fecha_desde: req.query.fecha_desde as string,
        fecha_hasta: req.query.fecha_hasta as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      };

      // Filtrar valores undefined
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof AppointmentFilters] === undefined) {
          delete filters[key as keyof AppointmentFilters];
        }
      });

      const result = await this.getAppointmentsUseCase.execute(filters);

      const response: ApiResponse = {
        data: result.appointments,
        message: 'Citas obtenidas exitosamente',
        status: 'success',
        pagination: result.pagination
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getAppointmentById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.getAppointmentByIdUseCase.execute(id);

      const response: ApiResponse = {
        data: result,
        message: 'Cita obtenida exitosamente',
        status: 'success'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  updateAppointment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const request: UpdateAppointmentRequest = req.body;
      
      const result = await this.updateAppointmentUseCase.execute(id, request);

      const response: ApiResponse = {
        data: result,
        message: 'Cita actualizada exitosamente',
        status: 'success'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  updateAppointmentStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { estado_cita } = req.body;
      
      const result = await this.updateAppointmentStatusUseCase.execute(id, estado_cita);

      const response: ApiResponse = {
        data: result,
        message: 'Estado de cita actualizado exitosamente',
        status: 'success'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  deleteAppointment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.deleteAppointmentUseCase.execute(id);

      const response: ApiResponse = {
        data: null,
        message: 'Cita eliminada exitosamente',
        status: 'success'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
} 