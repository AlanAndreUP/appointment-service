import { AppointmentRepository } from '@domain/repositories/AppointmentRepository.interface';
import { EnhancedEmailService } from '@application/services/EnhancedEmailService';

export interface DeleteAppointmentContext {
  userToken: string;
  userId: string;
}

export class DeleteAppointmentUseCase {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly emailService: EnhancedEmailService
  ) {}

  async execute(id: string, context?: DeleteAppointmentContext): Promise<void> {
    // Verificar que la cita existe
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) {
      throw new Error('Cita no encontrada');
    }

    // Verificar que el usuario autenticado sea el alumno de la cita
    if (context?.userId && context.userId !== appointment.id_alumno) {
      throw new Error('Solo el alumno de la cita puede eliminarla');
    }

    if (appointment.isDeleted()) {
      throw new Error('La cita ya ha sido eliminada');
    }

    // Realizar soft delete
    const success = await this.appointmentRepository.delete(id);
    if (!success) {
      throw new Error('Error al eliminar la cita');
    }

    // Enviar notificación de cancelación
    try {
      if (!context?.userToken) {
        throw new Error('Se requiere token de usuario para enviar notificaciones');
      }

      const cancelledAppointment = appointment.updateStatus('cancelada');
      await this.emailService.sendAppointmentCancelled(cancelledAppointment, {
        userToken: context.userToken,
        userId: context.userId
      });
    } catch (emailError) {
      console.error('Error enviando email de cancelación de cita:', emailError);
      // No fallar si el email falla, pero loggear el error
    }
  }

  // Método de conveniencia para usar con tokens extraídos del request
  async executeWithTokens(id: string, req: any): Promise<void> {
    const userToken = this.extractTokenFromRequest(req);
    const userId = this.extractUserIdFromRequest(req);
    
    if (!userToken) {
      throw new Error('Token de autorización requerido');
    }
    
    if (!userId) {
      throw new Error('UserId requerido');
    }
    
    return this.execute(id, {
      userToken,
      userId
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
    if (req.user?.userId) {
      return req.user.userId;
    }
    
    // Fallback: buscar en diferentes lugares donde puede estar el userId
    return req.headers?.['user-id'] || 
           req.query?.userId || 
           req.body?.userId || 
           req.params?.userId || 
           undefined;
  }
} 