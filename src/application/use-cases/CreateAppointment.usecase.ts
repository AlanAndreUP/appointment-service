import { Appointment } from '@domain/entities/Appointment.entity';
import { AppointmentRepository } from '@domain/repositories/AppointmentRepository.interface';
import { EnhancedEmailService } from '@application/services/EnhancedEmailService';
import { ApiResponse } from '@shared/types/response.types';
import { BaseUseCase, BaseContext } from './BaseUseCase';
import { ChecklistItem } from '@shared/types/Checklist.type';

export interface CreateAppointmentRequest {
  id_tutor: string;
  id_alumno: string;
  fecha_cita: string; // ISO string
  checklist?: ChecklistItem[];
  reason?: string | null;
}

export interface CreateAppointmentContext extends BaseContext {
  tutorUserId: string; // userId del tutor
  studentUserId: string; // userId del alumno
}

export class CreateAppointmentUseCase extends BaseUseCase {
  constructor(
    private appointmentRepository: AppointmentRepository,
    private emailService: EnhancedEmailService
  ) {
    super();
  }

  async execute(
    request: CreateAppointmentRequest, 
    context?: CreateAppointmentContext
  ): Promise<ApiResponse> {
    try {
      // Crear la cita
      const appointment = Appointment.create(
        request.id_tutor,
        request.id_alumno,
        new Date(request.fecha_cita),
        request.checklist,
        request.reason
      );

      // Guardar en base de datos
      const savedAppointment = await this.appointmentRepository.save(appointment);

      // Enviar notificaciones por email
      try {
        if (!context?.userToken) {
          throw new Error('Se requiere token de usuario para enviar notificaciones');
        }

        console.log('📧 Enviando notificaciones a tutor y alumno');
        await this.emailService.sendAppointmentCreatedToMultipleUsers(savedAppointment, {
          userToken: context.userToken,
          tutorUserId: context.tutorUserId,
          studentUserId: context.studentUserId
        });
        
        console.log('✅ Notificaciones de email enviadas exitosamente');
      } catch (emailError) {
        console.error('❌ Error enviando notificaciones de email:', emailError);
        // No fallar toda la operación si el email falla
      }

      return {
        data: savedAppointment.toJSON(),
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

  // Método de conveniencia para usar con tokens extraídos del request
  async executeWithTokens(
    request: CreateAppointmentRequest,
    req: any // Express request object
  ): Promise<ApiResponse> {
    const { token, userId } = this.extractAuthFromRequest(req);
    
    // Verificar que el usuario autenticado sea el alumno
    this.validateStudentCreation(userId, request.id_alumno);
    
    // Usar los IDs del request como userIds para los emails
    const tutorUserId = request.id_tutor;
    const studentUserId = request.id_alumno;
    
    return this.execute(request, {
      userToken: token,
      userId,
      tutorUserId,
      studentUserId
    });
  }




} 