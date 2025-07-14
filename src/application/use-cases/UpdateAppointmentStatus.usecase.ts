import { AppointmentRepository } from '@domain/repositories/AppointmentRepository.interface';
import { EstadoCita, AppointmentResponse } from '@shared/types/response.types';
import { EnhancedEmailService } from '@application/services/EnhancedEmailService';
import { BaseUseCase, BaseContext } from './BaseUseCase';

export interface UpdateAppointmentStatusContext extends BaseContext {}

export class UpdateAppointmentStatusUseCase extends BaseUseCase {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly emailService: EnhancedEmailService
  ) {
    super();
  }

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
    const { token, userId } = this.extractAuthFromRequest(req);
    
    return this.execute(id, newStatus, {
      userToken: token,
      userId
    });
  }


} 