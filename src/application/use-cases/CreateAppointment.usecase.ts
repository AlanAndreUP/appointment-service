import { Appointment } from '@domain/entities/Appointment.entity';
import { AppointmentRepository } from '@domain/repositories/AppointmentRepository.interface';
import { EnhancedEmailService } from '@application/services/EnhancedEmailService';
import { ApiResponse } from '@shared/types/response.types';

export interface CreateAppointmentRequest {
  id_tutor: string;
  id_alumno: string;
  fecha_cita: string; // ISO string
  to_do?: string;
}

export interface CreateAppointmentContext {
  userToken: string;
  userId: string; // userId del usuario autenticado (alumno)
  tutorUserId: string; // userId del tutor
  studentUserId: string; // userId del alumno
}

export class CreateAppointmentUseCase {
  constructor(
    private appointmentRepository: AppointmentRepository,
    private emailService: EnhancedEmailService
  ) {}

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
        request.to_do
      );

      // Guardar en base de datos
      const savedAppointment = await this.appointmentRepository.save(appointment);

      // Enviar notificaciones por email
      try {
        if (!context?.userToken) {
          throw new Error('Se requiere token de usuario para enviar notificaciones');
        }

        console.log('📧 Enviando notificaciones a tutor y alumno');
        console.log(context);
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
    const userToken = this.extractTokenFromRequest(req);
    const authenticatedUserId = this.extractUserIdFromRequest(req);
    
    if (!userToken) {
      throw new Error('Token de autorización requerido');
    }
    
    if (!authenticatedUserId) {
      throw new Error('UserId requerido');
    }
    
    // Verificar que el usuario autenticado sea el alumno
    if (authenticatedUserId !== request.id_alumno) {
      throw new Error('Solo el alumno puede crear citas');
    }
    
    // Usar los IDs del request como userIds para los emails
    const tutorUserId = request.id_tutor;
    const studentUserId = request.id_alumno;
    
    return this.execute(request, {
      userToken,
      userId: authenticatedUserId, // userId del usuario autenticado (alumno)
      tutorUserId,
      studentUserId
    });
  }



  private extractTokenFromRequest(req: any): string | undefined {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return undefined;
    }
    return authHeader.substring(7);
  }

  private extractUserIdFromRequest(req: any): string | undefined {
    // Usar la información del middleware de autenticación
    if (req.body.id_alumno) {
      return req.body.id_alumno;
    }
    
    // Fallback: buscar en diferentes lugares donde puede estar el userId
    return req.headers?.['user-id'] || 
           req.query?.userId || 
           req.body?.userId || 
           req.params?.userId || 
           undefined;
  }
} 