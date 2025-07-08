import { AppointmentRepository } from '@domain/repositories/AppointmentRepository.interface';
import { AppointmentResponse } from '@shared/types/response.types';

export class GetAppointmentByIdUseCase {
  constructor(
    private readonly appointmentRepository: AppointmentRepository
  ) {}

  async execute(id: string): Promise<AppointmentResponse> {
    const appointment = await this.appointmentRepository.findById(id);
    
    if (!appointment) {
      throw new Error('Cita no encontrada');
    }

    return {
      id: appointment.id,
      id_tutor: appointment.id_tutor,
      id_alumno: appointment.id_alumno,
      estado_cita: appointment.estado_cita,
      fecha_cita: appointment.fecha_cita,
      created_at: appointment.created_at,
      updated_at: appointment.updated_at,
      deleted_at: appointment.deleted_at,
      to_do: appointment.to_do,
      finish_to_do: appointment.finish_to_do
    };
  }
} 