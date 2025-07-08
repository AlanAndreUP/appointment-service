import { AppointmentRepository } from '@domain/repositories/AppointmentRepository.interface';
import { Appointment } from '@domain/entities/Appointment.entity';
import { CreateAppointmentRequest, AppointmentResponse } from '@shared/types/response.types';
import { EmailService } from '@application/services/Email.service';

export class CreateAppointmentUseCase {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly emailService: EmailService
  ) {}

  async execute(request: CreateAppointmentRequest): Promise<AppointmentResponse> {
    const { id_tutor, id_alumno, fecha_cita, to_do } = request;

    // Validar fecha
    const appointmentDate = new Date(fecha_cita);
    if (appointmentDate <= new Date()) {
      throw new Error('La fecha de la cita debe ser futura');
    }

    // Verificar conflictos de horario
    const conflicts = await this.appointmentRepository.findConflictingAppointments(
      id_tutor,
      id_alumno,
      appointmentDate
    );

    if (conflicts.length > 0) {
      throw new Error('Ya existe una cita programada para este horario');
    }

    // Crear nueva cita
    const newAppointment = Appointment.create(
      id_tutor,
      id_alumno,
      appointmentDate,
      to_do
    );

    // Guardar en base de datos
    const savedAppointment = await this.appointmentRepository.save(newAppointment);

    // Enviar notificación por email
    try {
      await this.emailService.sendAppointmentCreated(savedAppointment);
    } catch (emailError) {
      console.error('Error enviando email de creación de cita:', emailError);
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
} 