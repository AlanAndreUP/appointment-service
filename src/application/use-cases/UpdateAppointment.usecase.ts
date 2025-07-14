import { AppointmentRepository } from '@domain/repositories/AppointmentRepository.interface';
import { Appointment } from '@domain/entities/Appointment.entity';
import { UpdateAppointmentRequest, AppointmentResponse } from '@shared/types/response.types';
import { EnhancedEmailService } from '@application/services/EnhancedEmailService';
import { BaseUseCase, BaseContext } from './BaseUseCase';

export interface UpdateAppointmentContext extends BaseContext {}

export class UpdateAppointmentUseCase extends BaseUseCase {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly emailService: EnhancedEmailService
  ) {
    super();
  }

  async execute(
    id: string, 
    request: UpdateAppointmentRequest, 
    context?: UpdateAppointmentContext
  ): Promise<AppointmentResponse> {
    // Buscar la cita existente
    const existingAppointment = await this.appointmentRepository.findById(id);
    if (!existingAppointment) {
      throw new Error('Cita no encontrada');
    }


    if (!existingAppointment.canBeModified()) {
      throw new Error('La cita no puede ser modificada en su estado actual');
    }

    let updatedAppointment = existingAppointment;

    // Actualizar fecha si se proporciona
    if (request.fecha_cita) {
      const newDate = new Date(request.fecha_cita);
      if (newDate <= new Date()) {
        throw new Error('La fecha de la cita debe ser futura');
      }

      // Verificar conflictos si se cambia la fecha
      const conflicts = await this.appointmentRepository.findConflictingAppointments(
        existingAppointment.id_tutor,
        existingAppointment.id_alumno,
        newDate,
        id // Excluir la cita actual
      );

      if (conflicts.length > 0) {
        throw new Error('Ya existe una cita programada para este horario');
      }

      updatedAppointment = updatedAppointment.reschedule(newDate);
    }

    // Actualizar estado si se proporciona
    if (request.estado_cita) {
      updatedAppointment = updatedAppointment.updateStatus(request.estado_cita);
    }

    // Actualizar tareas si se proporcionan
    if (request.to_do !== undefined || request.finish_to_do !== undefined) {
      updatedAppointment = updatedAppointment.updateTodo(
        request.to_do,
        request.finish_to_do
      );
    }

    // Guardar cambios
    const savedAppointment = await this.appointmentRepository.update(id, {
      estado_cita: updatedAppointment.estado_cita,
      fecha_cita: updatedAppointment.fecha_cita,
      to_do: updatedAppointment.to_do,
      finish_to_do: updatedAppointment.finish_to_do,
      updated_at: new Date()
    });

    if (!savedAppointment) {
      throw new Error('Error al actualizar la cita');
    }

    // Enviar notificación por email
    try {
      if (!context?.userToken) {
        throw new Error('Se requiere token de usuario para enviar notificaciones');
      }

      if (request.estado_cita === 'cancelada') {
        await this.emailService.sendAppointmentCancelled(savedAppointment, {
          userToken: context.userToken,
          userId: context.userId
        });
      } else {
        await this.emailService.sendAppointmentUpdated(savedAppointment, {
          userToken: context.userToken,
          userId: context.userId
        });
      }
    } catch (emailError) {
      console.error('Error enviando email de actualización de cita:', emailError);
      // No fallar si el email falla, pero loggear el error
    }

    return {
      id: savedAppointment.id,
      id_tutor: savedAppointment.id_tutor,
      id_alumno: savedAppointment.id_alumno,
      estado_cita: savedAppointment.estado_cita,
      fecha_cita: savedAppointment.fecha_cita,
      created_at: savedAppointment.created_at,
      updated_at: savedAppointment.updated_at,
      deleted_at: savedAppointment.deleted_at,
      to_do: savedAppointment.to_do,
      finish_to_do: savedAppointment.finish_to_do
    };
  }

  // Método de conveniencia para usar con tokens extraídos del request
  async executeWithTokens(
    id: string,
    request: UpdateAppointmentRequest,
    req: any // Express request object
  ): Promise<AppointmentResponse> {
    const { token, userId } = this.extractAuthFromRequest(req);
    
    return this.execute(id, request, {
      userToken: token,
      userId
    });
  }


} 