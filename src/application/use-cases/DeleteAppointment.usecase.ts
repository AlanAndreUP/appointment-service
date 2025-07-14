import { AppointmentRepository } from '@domain/repositories/AppointmentRepository.interface';
import { EnhancedEmailService } from '@application/services/EnhancedEmailService';
import { BaseUseCase, BaseContext } from './BaseUseCase';

export interface DeleteAppointmentContext extends BaseContext {}

export class DeleteAppointmentUseCase extends BaseUseCase {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly emailService: EnhancedEmailService
  ) {
    super();
  }

  async execute(id: string, context?: DeleteAppointmentContext): Promise<void> {
    // Verificar que la cita existe
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) {
      throw new Error('Cita no encontrada');
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
    const { token, userId } = this.extractAuthFromRequest(req);
    
    return this.execute(id, {
      userToken: token,
      userId
    });
  }


} 