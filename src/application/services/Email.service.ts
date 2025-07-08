import { Resend } from 'resend';
import { Appointment } from '@domain/entities/Appointment.entity';

export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendAppointmentCreated(appointment: Appointment): Promise<void> {
    const emailData = {
      from: process.env.FROM_EMAIL || 'noreply@tutoria.com',
      to: [process.env.TUTOR_EMAIL || 'tutor@example.com'], // En producción obtener del usuario
      subject: 'Nueva Cita Programada',
      html: this.getAppointmentCreatedTemplate(appointment)
    };

    await this.resend.emails.send(emailData);
  }

  async sendAppointmentUpdated(appointment: Appointment): Promise<void> {
    const emailData = {
      from: process.env.FROM_EMAIL || 'noreply@tutoria.com',
      to: [process.env.TUTOR_EMAIL || 'tutor@example.com'],
      subject: 'Cita Actualizada',
      html: this.getAppointmentUpdatedTemplate(appointment)
    };

    await this.resend.emails.send(emailData);
  }

  async sendAppointmentCancelled(appointment: Appointment): Promise<void> {
    const emailData = {
      from: process.env.FROM_EMAIL || 'noreply@tutoria.com',
      to: [process.env.TUTOR_EMAIL || 'tutor@example.com'],
      subject: 'Cita Cancelada',
      html: this.getAppointmentCancelledTemplate(appointment)
    };

    await this.resend.emails.send(emailData);
  }

  private getAppointmentCreatedTemplate(appointment: Appointment): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Nueva Cita Programada</h2>
        <p>Se ha creado una nueva cita con los siguientes detalles:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
          <p><strong>ID de Cita:</strong> ${appointment.id}</p>
          <p><strong>Tutor:</strong> ${appointment.id_tutor}</p>
          <p><strong>Alumno:</strong> ${appointment.id_alumno}</p>
          <p><strong>Fecha:</strong> ${appointment.fecha_cita.toLocaleString('es-ES')}</p>
          <p><strong>Estado:</strong> ${appointment.estado_cita}</p>
          ${appointment.to_do ? `<p><strong>Tareas:</strong> ${appointment.to_do}</p>` : ''}
        </div>
        
        <p style="margin-top: 20px;">
          Por favor, confirma tu disponibilidad para esta cita.
        </p>
        
        <p style="color: #6b7280; font-size: 14px;">
          Este es un mensaje automático del sistema de citas.
        </p>
      </div>
    `;
  }

  private getAppointmentUpdatedTemplate(appointment: Appointment): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Cita Actualizada</h2>
        <p>Se ha actualizado una cita con los siguientes detalles:</p>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px;">
          <p><strong>ID de Cita:</strong> ${appointment.id}</p>
          <p><strong>Tutor:</strong> ${appointment.id_tutor}</p>
          <p><strong>Alumno:</strong> ${appointment.id_alumno}</p>
          <p><strong>Fecha:</strong> ${appointment.fecha_cita.toLocaleString('es-ES')}</p>
          <p><strong>Estado:</strong> ${appointment.estado_cita}</p>
          ${appointment.to_do ? `<p><strong>Tareas:</strong> ${appointment.to_do}</p>` : ''}
          ${appointment.finish_to_do ? `<p><strong>Tareas Completadas:</strong> ${appointment.finish_to_do}</p>` : ''}
        </div>
        
        <p style="margin-top: 20px;">
          Revisa los cambios realizados en tu cita.
        </p>
        
        <p style="color: #6b7280; font-size: 14px;">
          Este es un mensaje automático del sistema de citas.
        </p>
      </div>
    `;
  }

  private getAppointmentCancelledTemplate(appointment: Appointment): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Cita Cancelada</h2>
        <p>Se ha cancelado la siguiente cita:</p>
        
        <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px;">
          <p><strong>ID de Cita:</strong> ${appointment.id}</p>
          <p><strong>Tutor:</strong> ${appointment.id_tutor}</p>
          <p><strong>Alumno:</strong> ${appointment.id_alumno}</p>
          <p><strong>Fecha:</strong> ${appointment.fecha_cita.toLocaleString('es-ES')}</p>
          <p><strong>Estado:</strong> ${appointment.estado_cita}</p>
        </div>
        
        <p style="margin-top: 20px;">
          Si necesitas reagendar, por favor contacta al sistema.
        </p>
        
        <p style="color: #6b7280; font-size: 14px;">
          Este es un mensaje automático del sistema de citas.
        </p>
      </div>
    `;
  }
} 