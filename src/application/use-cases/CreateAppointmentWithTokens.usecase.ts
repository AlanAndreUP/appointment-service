import { AppointmentAggregate, AppointmentCreationData } from '@domain/aggregates/AppointmentAggregate';
import { AppointmentRepository } from '@domain/repositories/AppointmentRepository.interface';
import { TokenBasedEmailService } from '@application/services/TokenBasedEmailService';
import { ExternalUserService } from '@application/services/ExternalUserService';
import { ApiResponse } from '@shared/types/response.types';
import { UserId } from '@domain/value-objects/UserId';

export interface CreateAppointmentWithTokensRequest {
  tutorId: string;
  studentId: string;
  appointmentDate: string; // ISO string
  pendingTask?: string;
  // Los tokens se obtendrán del contexto del request
}

export class CreateAppointmentWithTokensUseCase {
  constructor(
    private appointmentRepository: AppointmentRepository,
    private emailService: TokenBasedEmailService,
    private userService: ExternalUserService
  ) {}

  async execute(
    request: CreateAppointmentWithTokensRequest,
    context: {
      tutorToken: string;
      studentToken: string;
      currentUserToken: string;
    }
  ): Promise<ApiResponse> {
    try {
      // Validar que el tutor y alumno existan usando sus tokens
      const [tutor, student] = await Promise.all([
        this.userService.getUserByToken(context.tutorToken),
        this.userService.getUserByToken(context.studentToken)
      ]);

      // Validar que los IDs coincidan
      if (tutor.id.value !== request.tutorId) {
        throw new Error('El token del tutor no coincide con el ID proporcionado');
      }

      if (student.id.value !== request.studentId) {
        throw new Error('El token del alumno no coincide con el ID proporcionado');
      }

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

      // Guardar en base de datos usando el repositorio existente
      // Convertir el agregado de vuelta a la entidad legacy para persistencia
      const legacyAppointment = new (await import('@domain/entities/Appointment.entity')).Appointment(
        appointmentData._id,
        appointmentData.id_tutor,
        appointmentData.id_alumno,
        appointmentData.estado_cita,
        appointmentData.fecha_cita,
        appointmentData.created_at,
        appointmentData.updated_at,
        appointmentData.deleted_at,
        appointmentData.checklist,
        appointmentData.reason
      );

      const savedAppointment = await this.appointmentRepository.save(legacyAppointment);

      // Enviar notificaciones por email usando los tokens
      try {
        await this.emailService.sendAppointmentNotificationWithUsers(
          tutor,
          student,
          appointmentAggregate,
          'created'
        );
        console.log('Notificaciones de email enviadas exitosamente');
      } catch (emailError) {
        console.error('Error enviando notificaciones de email:', emailError);
        // No fallar toda la operación si el email falla
      }

      return {
        data: {
          ...appointmentAggregate.toJSON(),
          participants: {
            tutor: tutor.toJSON(),
            student: student.toJSON()
          }
        },
        message: 'Cita creada exitosamente y notificaciones enviadas',
        status: 'success'
      };

    } catch (error) {
      console.error('Error creating appointment:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la cita';
      return {
        data: null,
        message: errorMessage,
        status: 'error'
      };
    }
  }

  /**
   * Método simplificado que solo requiere un token (del usuario actual)
   * y obtiene el token del otro usuario de alguna manera
   */
  async createAppointmentWithCurrentUser(
    request: CreateAppointmentWithTokensRequest,
    currentUserToken: string
  ): Promise<ApiResponse> {
    try {
      // Obtener información del usuario actual
      const currentUser = await this.userService.getUserByToken(currentUserToken);
      
      // Determinar quién es el tutor y quién es el alumno
      let tutorToken: string;
      let studentToken: string;
      
      if (currentUser.isTutor() && currentUser.id.value === request.tutorId) {
        tutorToken = currentUserToken;
        // En un escenario real, necesitarías obtener el token del alumno
        // Por ahora, asumimos que se puede obtener de alguna manera
        studentToken = await this.getStudentToken(request.studentId);
      } else if (currentUser.isStudent() && currentUser.id.value === request.studentId) {
        studentToken = currentUserToken;
        // En un escenario real, necesitarías obtener el token del tutor
        tutorToken = await this.getTutorToken(request.tutorId);
      } else {
        throw new Error('El usuario actual no coincide con los participantes de la cita');
      }

      return await this.execute(request, {
        tutorToken,
        studentToken,
        currentUserToken
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la cita';
      return {
        data: null,
        message: errorMessage,
        status: 'error'
      };
    }
  }

  /**
   * Método placeholder para obtener token del alumno
   * En un escenario real, esto podría:
   * - Consultar una base de datos de sesiones activas
   * - Usar un servicio de notificaciones push
   * - Requerir que el alumno esté online
   */
  private async getStudentToken(studentId: string): Promise<string> {
    // Por ahora, lanzamos un error explicativo
    throw new Error(`Se requiere que el alumno ${studentId} proporcione autorización para crear la cita`);
  }

  /**
   * Método placeholder para obtener token del tutor
   */
  private async getTutorToken(tutorId: string): Promise<string> {
    // Por ahora, lanzamos un error explicativo
    throw new Error(`Se requiere que el tutor ${tutorId} proporcione autorización para crear la cita`);
  }
} 