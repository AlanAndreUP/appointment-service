import { AppointmentRepository } from '@domain/repositories/AppointmentRepository.interface';
import { EstadoCita, AppointmentResponse } from '@shared/types/response.types';
import { EmailService } from '@application/services/Email.service';

export class UpdateAppointmentStatusUseCase {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly emailService: EmailService
  ) {}

  async execute(id: string, newStatus: EstadoCita): Promise<AppointmentResponse> {
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
      if (newStatus === 'cancelada') {
        await this.emailService.sendAppointmentCancelled(updatedAppointment);
      } else {
        await this.emailService.sendAppointmentUpdated(updatedAppointment);
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
} 