import { Appointment } from '@domain/entities/Appointment.entity';
import { AppointmentFilters, PaginationMeta } from '@shared/types/response.types';

export interface AppointmentRepository {
  save(appointment: Appointment): Promise<Appointment>;
  findById(id: string): Promise<Appointment | null>;
  findByFilters(filters: AppointmentFilters): Promise<{
    appointments: Appointment[];
    pagination: PaginationMeta;
  }>;
  update(id: string, appointment: Partial<Appointment>): Promise<Appointment | null>;
  delete(id: string): Promise<boolean>;
  findByTutorId(tutorId: string, filters?: Partial<AppointmentFilters>): Promise<Appointment[]>;
  findByAlumnoId(alumnoId: string, filters?: Partial<AppointmentFilters>): Promise<Appointment[]>;
  findConflictingAppointments(
    tutorId: string, 
    alumnoId: string, 
    fecha: Date,
    excludeId?: string
  ): Promise<Appointment[]>;
} 