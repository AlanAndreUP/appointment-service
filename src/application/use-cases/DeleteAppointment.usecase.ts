import { AppointmentRepository } from '@domain/repositories/AppointmentRepository.interface';
import { EmailService } from '@application/services/Email.service';

export class DeleteAppointmentUseCase {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly emailService: EmailService
  ) {}

  async execute(id: string): Promise<void> {
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
      const cancelledAppointment = appointment.updateStatus('cancelada');
      await this.emailService.sendAppointmentCancelled(cancelledAppointment);
    } catch (emailError) {
      console.error('Error enviando email de cancelación de cita:', emailError);
      // No fallar si el email falla, pero loggear el error
    }
  }
} 