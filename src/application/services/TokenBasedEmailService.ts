import { Resend } from 'resend';
import { ExternalUserService } from './ExternalUserService';
import { AppointmentAggregate } from '@domain/aggregates/AppointmentAggregate';
import { EmailAddress } from '@domain/value-objects/EmailAddress';
import { UserInfo } from '@domain/value-objects/UserInfo';
import { EstadoCita } from '@domain/value-objects/AppointmentStatus';

export interface TokenBasedEmailNotificationData {
  appointment: AppointmentAggregate;
  tutorToken: string;
  studentToken: string;
  tutorUserId: string;
  studentUserId: string;
  eventType: 'created' | 'confirmed' | 'cancelled' | 'completed' | 'rescheduled' | 'updated';
  previousData?: {
    status?: EstadoCita;
    date?: Date;
    todoTask?: string;
  };
}

export class TokenBasedEmailService {
  private resend: Resend;
  private userService: ExternalUserService;
  private fromEmail: EmailAddress;

  constructor(userService: ExternalUserService) {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.userService = userService;
    this.fromEmail = EmailAddress.fromString(process.env.FROM_EMAIL || 'noreply@tutoria.com');
  }

  /**
   * Envía notificación de cita usando los tokens de los usuarios
   */
  async sendAppointmentNotification(data: TokenBasedEmailNotificationData): Promise<void> {
    try {
      // Obtener información de usuarios usando sus tokens
      const [tutor, student] = await Promise.all([
        this.userService.getUserByToken(data.tutorToken, data.tutorUserId),
        this.userService.getUserByToken(data.studentToken, data.studentUserId)
      ]);

      // Enviar email al tutor
      await this.sendEmailToUser(tutor, data.eventType, data.appointment, student, data.previousData);

      // Enviar email al alumno
      await this.sendEmailToUser(student, data.eventType, data.appointment, tutor, data.previousData);

    } catch (error) {
      console.error('Error enviando notificaciones:', error);
      throw new Error(`Error enviando notificaciones: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Envía notificación usando UserInfo conocido y token del otro usuario
   */
  async sendAppointmentNotificationWithUser(
    currentUser: UserInfo,
    currentUserToken: string,
    otherUserToken: string,
    otherUserId: string,
    appointment: AppointmentAggregate,
    eventType: string,
    previousData?: any
  ): Promise<void> {
    try {
      // Obtener información del otro usuario
      const otherUser = await this.userService.getUserByToken(otherUserToken, otherUserId);

      // Enviar email al usuario actual
      await this.sendEmailToUser(currentUser, eventType, appointment, otherUser, previousData);

      // Enviar email al otro usuario
      await this.sendEmailToUser(otherUser, eventType, appointment, currentUser, previousData);

    } catch (error) {
      console.error('Error enviando notificaciones:', error);
      throw new Error(`Error enviando notificaciones: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Envía notificación cuando conocemos a ambos usuarios
   */
  async sendAppointmentNotificationWithUsers(
    tutor: UserInfo,
    student: UserInfo,
    appointment: AppointmentAggregate,
    eventType: string,
    previousData?: any
  ): Promise<void> {
    // Enviar email al tutor
    await this.sendEmailToUser(tutor, eventType, appointment, student, previousData);

    // Enviar email al alumno
    await this.sendEmailToUser(student, eventType, appointment, tutor, previousData);
  }

  private async sendEmailToUser(
    recipient: UserInfo,
    eventType: string,
    appointment: AppointmentAggregate,
    otherUser: UserInfo,
    previousData?: any
  ): Promise<void> {
    const subject = this.getSubject(eventType, recipient.role);
    const template = this.getTemplate(eventType, recipient, appointment, otherUser, previousData);

    const emailData = {
      from: this.fromEmail.value,
      to: [recipient.email.value],
      subject,
      html: template
    };

    try {
      await this.resend.emails.send(emailData);
      console.log(`Email enviado a ${recipient.name} (${recipient.email.value}) - Evento: ${eventType}`);
    } catch (error) {
      console.error(`Error enviando email a ${recipient.email.value}:`, error);
      throw error;
    }
  }

  private getSubject(eventType: string, role: 'tutor' | 'alumno'): string {
    const roleText = role === 'tutor' ? 'Tutor' : 'Alumno';
    
    switch (eventType) {
      case 'created':
        return `Nueva Cita Programada - ${roleText}`;
      case 'confirmed':
        return `Cita Confirmada - ${roleText}`;
      case 'cancelled':
        return `Cita Cancelada - ${roleText}`;
      case 'completed':
        return `Cita Completada - ${roleText}`;
      case 'rescheduled':
        return `Cita Reagendada - ${roleText}`;
      case 'updated':
        return `Cita Actualizada - ${roleText}`;
      default:
        return `Notificación de Cita - ${roleText}`;
    }
  }

  private getTemplate(
    eventType: string,
    recipient: UserInfo,
    appointment: AppointmentAggregate,
    otherUser: UserInfo,
    previousData?: any
  ): string {
    const recipientRole = recipient.role === 'tutor' ? 'tutor' : 'alumno';
    const otherRole = otherUser.role === 'tutor' ? 'tutor' : 'alumno';
    
    const baseInfo = this.getBaseInfoHtml(appointment, recipient, otherUser);
    
    switch (eventType) {
      case 'created':
        return `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nueva Cita Programada</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #28a745;">¡Nueva Cita Programada!</h1>
            <p>Estimado/a <strong>${recipient.name}</strong>,</p>
            <p>Se ha programado una nueva cita de tutoría:</p>
            <p><strong>${recipientRole === 'tutor' ? 'Alumno' : 'Tutor'}:</strong> ${otherUser.name}</p>
            <p>Por favor, confirma tu disponibilidad para esta cita.</p>
            ${baseInfo}
            ${this.getFooter()}
          </body>
          </html>
        `;
        
      case 'confirmed':
        return `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cita Confirmada</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #007bff;">¡Cita Confirmada!</h1>
            <p>Estimado/a <strong>${recipient.name}</strong>,</p>
            <p>Tu cita de tutoría ha sido confirmada:</p>
            <p><strong>${recipientRole === 'tutor' ? 'Alumno' : 'Tutor'}:</strong> ${otherUser.name}</p>
            <p>Te esperamos en la fecha y hora programadas.</p>
            ${baseInfo}
            ${this.getFooter()}
          </body>
          </html>
        `;
        
      case 'cancelled':
        return `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cita Cancelada</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #dc3545;">Cita Cancelada</h1>
            <p>Estimado/a <strong>${recipient.name}</strong>,</p>
            <p>Lamentamos informarte que la siguiente cita ha sido cancelada:</p>
            <p><strong>${recipientRole === 'tutor' ? 'Alumno' : 'Tutor'}:</strong> ${otherUser.name}</p>
            <p>Si necesitas reagendar, por favor contacta al ${otherRole}.</p>
            ${baseInfo}
            ${this.getFooter()}
          </body>
          </html>
        `;
        
      case 'completed':
        return `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cita Completada</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #28a745;">¡Cita Completada!</h1>
            <p>Estimado/a <strong>${recipient.name}</strong>,</p>
            <p>La cita de tutoría ha sido marcada como completada:</p>
            <p><strong>${recipientRole === 'tutor' ? 'Alumno' : 'Tutor'}:</strong> ${otherUser.name}</p>
            <p>Gracias por participar en el programa de tutorías.</p>
            ${baseInfo}
            ${this.getFooter()}
          </body>
          </html>
        `;
        
      case 'rescheduled':
        return `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cita Reagendada</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #ffc107;">Cita Reagendada</h1>
            <p>Estimado/a <strong>${recipient.name}</strong>,</p>
            <p>La cita de tutoría ha sido reagendada:</p>
            <p><strong>${recipientRole === 'tutor' ? 'Alumno' : 'Tutor'}:</strong> ${otherUser.name}</p>
            ${previousData?.date ? `<p><strong>Fecha anterior:</strong> ${previousData.date.toLocaleString('es-ES')}</p>` : ''}
            <p><strong>Nueva fecha:</strong> ${appointment.appointmentDate.toLocaleString()}</p>
            ${baseInfo}
            ${this.getFooter()}
          </body>
          </html>
        `;
        
      default:
        return `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Notificación de Cita</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #6c757d;">Notificación de Cita</h1>
            <p>Estimado/a <strong>${recipient.name}</strong>,</p>
            <p>Ha habido una actualización en tu cita de tutoría:</p>
            <p><strong>${recipientRole === 'tutor' ? 'Alumno' : 'Tutor'}:</strong> ${otherUser.name}</p>
            ${baseInfo}
            ${this.getFooter()}
          </body>
          </html>
        `;
    }
  }

  private getBaseInfoHtml(appointment: AppointmentAggregate, recipient: UserInfo, otherUser: UserInfo): string {
    const tasksInfo = this.getTasksInfoHtml(appointment);
    
    return `
      <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #007bff;">
        <h3 style="color: #007bff; margin-top: 0;">Información de la Cita</h3>
        <p><strong>ID:</strong> ${appointment.id.value}</p>
        <p><strong>Fecha:</strong> ${appointment.appointmentDate.toLocaleString()}</p>
        <p><strong>Estado:</strong> ${appointment.status.value}</p>
        <p><strong>${recipient.role === 'tutor' ? 'Alumno' : 'Tutor'}:</strong> ${otherUser.name} (${otherUser.email.value})</p>
        ${tasksInfo}
      </div>
    `;
  }

  private getTasksInfoHtml(appointment: AppointmentAggregate): string {
    const todoList = appointment.todoList;
    let tasksHtml = '';
    
    if (todoList.hasPendingTask()) {
      tasksHtml += `<p><strong>Tarea Pendiente:</strong> ${todoList.pendingTask!.value}</p>`;
    }
    
    if (todoList.hasCompletedTask()) {
      tasksHtml += `<p><strong>Tarea Completada:</strong> ${todoList.completedTask!.value}</p>`;
    }
    
    return tasksHtml;
  }

  private getFooter(): string {
    return `
      <div style="margin-top: 30px; padding: 15px; background-color: #e9ecef; border-radius: 5px; font-size: 14px; color: #6c757d;">
        <p style="margin: 0;">
          Este es un mensaje automático del Sistema de Citas Académicas.
          <br>
          Si tienes alguna pregunta, contacta al administrador del sistema.
        </p>
      </div>
    `;
  }
} 