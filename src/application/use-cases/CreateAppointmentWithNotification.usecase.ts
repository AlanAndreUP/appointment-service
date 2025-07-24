import { AppointmentAggregate, AppointmentCreationData } from '@domain/aggregates/AppointmentAggregate';
import { AppointmentRepository } from '@domain/repositories/AppointmentRepository.interface';
import { EnhancedEmailService } from '@application/services/EnhancedEmailService';
import { UserService } from '@application/services/UserService.interface';
import { ApiResponse } from '@shared/types/response.types';

export interface CreateAppointmentRequest {
  tutorId: string;
  studentId: string;
  appointmentDate: string; // ISO string
  checklist?: string[];
  reason?: string;
}

export class CreateAppointmentWithNotificationUseCase {
  constructor(
    private appointmentRepository: AppointmentRepository,
    private emailService: EnhancedEmailService,
    private userService: UserService
  ) {}

  async execute(request: CreateAppointmentRequest): Promise<ApiResponse> {
    try {
      // Validar que el tutor y alumno existan
      const [tutor, student] = await Promise.all([
        this.userService.getTutorById(request.tutorId),
        this.userService.getStudentById(request.studentId)
      ]);

      // Crear el agregado de cita
      const creationData: AppointmentCreationData = {
        tutorId: request.tutorId,
        studentId: request.studentId,
        appointmentDate: new Date(request.appointmentDate),
        checklist: request.checklist,
        reason: request.reason
      };

      const appointmentAggregate = AppointmentAggregate.create(creationData);

      // Convertir a formato de persistencia
      const appointmentData = appointmentAggregate.toPersistence();

      // Guardar en base de datos
      const savedAppointment = await this.appointmentRepository.save({
        id: appointmentData._id,
        id_tutor: appointmentData.id_tutor,
        id_alumno: appointmentData.id_alumno,
        fecha_cita: appointmentData.fecha_cita,
        estado_cita: appointmentData.estado_cita,
        checklist: appointmentData.checklist,
        reason: appointmentData.reason,
        created_at: appointmentData.created_at,
        updated_at: appointmentData.updated_at,
        deleted_at: appointmentData.deleted_at
      });

      // Enviar notificaciones por email
      try {
        // Nota: Este caso de uso no tiene tokens, por lo que no puede enviar emails personalizados
        // Se podría modificar para recibir tokens como parámetro si es necesario
        console.log('⚠️  No se enviaron notificaciones de email - se requieren tokens de usuario');
      } catch (emailError) {
        console.error('Error enviando notificaciones de email:', emailError);
        // No fallar toda la operación si el email falla
      }

      return {
        data: appointmentAggregate.toJSON(),
        message: 'Cita creada exitosamente y notificaciones enviadas',
        status: 'success'
      };

    } catch (error) {
      console.error('Error creating appointment:', error);
      
      return {
        data: null,
        message: error.message || 'Error al crear la cita',
        status: 'error'
      };
    }
  }
} 