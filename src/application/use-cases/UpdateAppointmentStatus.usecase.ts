import { AppointmentRepository } from '@domain/repositories/AppointmentRepository.interface';
import { EstadoCita, AppointmentResponse } from '@shared/types/response.types';
import { EnhancedEmailService } from '@application/services/EnhancedEmailService';

export interface UpdateAppointmentStatusContext {
  userToken: string;
  userId: string;
}

export class UpdateAppointmentStatusUseCase {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly emailService: EnhancedEmailService
  ) {}

  async execute(
    id: string, 
    newStatus: EstadoCita, 
    context?: UpdateAppointmentStatusContext
  ): Promise<AppointmentResponse> {
    // Buscar la cita existente
    const existingAppointment = await this.appointmentRepository.findById(id);
    if (!existingAppointment) {
      throw new Error('Cita no encontrada');
    }

    // Verificar que el usuario autenticado sea el alumno de la cita
    if (context?.userId && context.userId !== existingAppointment.id_alumno) {
      throw new Error('Solo el alumno de la cita puede cambiar su estado');
    }

    if (existingAppointment.isDeleted()) {
      throw new Error('No se puede actualizar una cita eliminada');
    }

    // Actualizar solo el estado
    const updatedAppointment = await this.appointmentRepository.update(id, {
      estado_cita: newStatus,
      updated_at: new Date()
    });

    if (!updatedAppointment) {
      throw new Error('Error al actualizar el estado de la cita');
    }

    // Enviar notificación por email según el estado
    try {
      if (!context?.userToken) {
        throw new Error('Se requiere token de usuario para enviar notificaciones');
      }

      if (newStatus === 'cancelada') {
        await this.emailService.sendAppointmentCancelled(updatedAppointment, {
          userToken: context.userToken,
          userId: context.userId
        });
      } else {
        await this.emailService.sendAppointmentUpdated(updatedAppointment, {
          userToken: context.userToken,
          userId: context.userId
        });
      }
    } catch (emailError) {
      console.error('Error enviando email de actualización de estado:', emailError);
      // No fallar si el email falla, pero loggear el error
    }

    return {
      id: updatedAppointment.id,
      id_tutor: updatedAppointment.id_tutor,
      id_alumno: updatedAppointment.id_alumno,
      estado_cita: updatedAppointment.estado_cita,
      fecha_cita: updatedAppointment.fecha_cita,
      created_at: updatedAppointment.created_at,
      updated_at: updatedAppointment.updated_at,
      deleted_at: updatedAppointment.deleted_at,
      to_do: updatedAppointment.to_do,
      finish_to_do: updatedAppointment.finish_to_do
    };
  }

  // Método de conveniencia para usar con tokens extraídos del request
  async executeWithTokens(
    id: string,
    newStatus: EstadoCita,
    req: any // Express request object
  ): Promise<AppointmentResponse> {
    const userToken = this.extractTokenFromRequest(req);
    const userId = this.extractUserIdFromRequest(req);
    
    if (!userToken) {
      throw new Error('Token de autorización requerido');
    }
    
    if (!userId) {
      throw new Error('UserId requerido');
    }
    
    return this.execute(id, newStatus, {
      userToken,
      userId
    });
  }

  private extractTokenFromRequest(req: any): string | undefined {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return undefined;
    }
    return authHeader.substring(7);
  }

  private extractUserIdFromRequest(req: any): string | undefined {
    // Usar la información del middleware de autenticación
    if (req.user?.userId) {
      return req.user.userId;
    }
    
    // Fallback: buscar en diferentes lugares donde puede estar el userId
    return req.headers?.['user-id'] || 
           req.query?.userId || 
           req.body?.userId || 
           req.params?.userId || 
           undefined;
  }
} 