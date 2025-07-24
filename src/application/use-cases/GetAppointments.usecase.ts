import { AppointmentRepository } from '@domain/repositories/AppointmentRepository.interface';
import { AppointmentFilters, AppointmentResponse, PaginationMeta } from '@shared/types/response.types';

export class GetAppointmentsUseCase {
  constructor(
    private readonly appointmentRepository: AppointmentRepository
  ) {}

  async execute(filters: AppointmentFilters): Promise<{
    data: AppointmentResponse[];
    pagination: PaginationMeta;
  }> {
    const result = await this.appointmentRepository.findByFilters(filters);

    const appointments = result.appointments.map(appointment => ({
      id: appointment.id,
      id_tutor: appointment.id_tutor,
      id_alumno: appointment.id_alumno,
      estado_cita: appointment.estado_cita,
      fecha_cita: appointment.fecha_cita,
      created_at: appointment.created_at,
      updated_at: appointment.updated_at,
      deleted_at: appointment.deleted_at,
      checklist: appointment.checklist,
      reason: appointment.reason
    }));  

    return {
      data: appointments,
      pagination: result.pagination
    };
  }
} 