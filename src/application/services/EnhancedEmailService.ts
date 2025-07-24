import { Resend } from 'resend';
import { Appointment } from '@domain/entities/Appointment.entity';
import { ExternalUserService } from './ExternalUserService';
import { UserInfo } from '@domain/value-objects/UserInfo';

export class EnhancedEmailService {
  private readonly resend: Resend;
  private readonly userService?: ExternalUserService;

  constructor(userService?: ExternalUserService) {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.userService = userService;
  }

  async sendAppointmentCreated(appointment: Appointment, tokens: { userToken: string; userId: string }): Promise<void> {
    if (!tokens.userToken) {
      throw new Error('Se requiere token de usuario para enviar notificaciones');
    }
    if (!tokens.userId) {
      throw new Error('Se requiere userId para enviar notificaciones');
    }
    await this.sendWithTokens(appointment, 'created', tokens);
  }

  /**
   * Envía notificaciones de cita creada a múltiples usuarios
   * Útil cuando se necesita enviar emails tanto al tutor como al alumno
   */
  async sendAppointmentCreatedToMultipleUsers(
    appointment: Appointment, 
    tokens: { userToken: string; tutorUserId: string; studentUserId: string }
  ): Promise<void> {
    if (!tokens.userToken) {
      throw new Error('Se requiere token de usuario para enviar notificaciones');
    }
    if (!tokens.tutorUserId || !tokens.studentUserId) {
      throw new Error('Se requieren userIds de tutor y alumno para enviar notificaciones');
    }
    
    try {
      // Obtener información de ambos usuarios usando el mismo token
      const [tutor, student] = await Promise.all([
        this.userService!.getUserByToken(tokens.userToken, tokens.tutorUserId),
        this.userService!.getUserByToken(tokens.userToken, tokens.studentUserId)
      ]);

      console.log(`📧 Enviando notificaciones a tutor: ${tutor.name} y alumno: ${student.name}`);

      // Enviar email al tutor
      const tutorEmailData = {
        from: process.env.FROM_EMAIL || 'noreply@tutoria.com',
        to: [tutor.email.value],
        subject: this.getSubjectForUser('created', tutor.role),
        html: this.getTemplateForUser(appointment, 'created', tutor, [tutor, student])
      };

      // Enviar email al alumno
      const studentEmailData = {
        from: process.env.FROM_EMAIL || 'noreply@tutoria.com',
        to: [student.email.value],
        subject: this.getSubjectForUser('created', student.role),
        html: this.getTemplateForUser(appointment, 'created', student, [tutor, student])
      };

      // Enviar ambos emails en paralelo
      await Promise.all([
        this.resend.emails.send(tutorEmailData),
        this.resend.emails.send(studentEmailData)
      ]);

      console.log(`✅ Emails enviados exitosamente a tutor y alumno`);

    } catch (error) {
      console.error('❌ Error enviando emails a múltiples usuarios:', error);
      throw error;
    }
  }

  async sendAppointmentUpdated(appointment: Appointment, tokens: { userToken: string; userId: string }): Promise<void> {
    if (!tokens.userToken) {
      throw new Error('Se requiere token de usuario para enviar notificaciones');
    }
    if (!tokens.userId) {
      throw new Error('Se requiere userId para enviar notificaciones');
    }
    await this.sendWithTokens(appointment, 'updated', tokens);
  }

  async sendAppointmentCancelled(appointment: Appointment, tokens: { userToken: string; userId: string }): Promise<void> {
    if (!tokens.userToken) {
      throw new Error('Se requiere token de usuario para enviar notificaciones');
    }
    if (!tokens.userId) {
      throw new Error('Se requiere userId para enviar notificaciones');
    }
    await this.sendWithTokens(appointment, 'cancelled', tokens);
  }

  // Nuevo método que usa tokens reales
  private async sendWithTokens(
    appointment: Appointment, 
    eventType: 'created' | 'updated' | 'cancelled',
    tokens: { userToken: string; userId: string }
  ): Promise<void> {
    try {
      // Obtener información del usuario autenticado usando su token
      const authenticatedUser = await this.userService!.getUserByToken(tokens.userToken, tokens.userId);
      
      console.log(`Usuario autenticado: ${authenticatedUser.name} (${authenticatedUser.email.value})`);

      // Solo enviar email al usuario autenticado que está creando la cita
      const users: UserInfo[] = [authenticatedUser];

      // Enviar emails a usuarios reales
      for (const user of users) {
        const emailData = {
          from: process.env.FROM_EMAIL || 'noreply@tutoria.com',
          to: [user.email.value],
          subject: this.getSubjectForUser(eventType, user.role),
          html: this.getTemplateForUser(appointment, eventType, user, users)
        };

        await this.resend.emails.send(emailData);
        console.log(`Email enviado a ${user.name} (${user.email.value}) - Evento: ${eventType}`);
      }

    } catch (error) {
      console.error('Error enviando emails con tokens:', error);
      throw error; // No hacer fallback, propagar el error
    }
  }



  private getSubjectForUser(eventType: string, role: 'tutor' | 'alumno'): string {
    const roleText = role === 'tutor' ? 'Tutor' : 'Alumno';
    
    switch (eventType) {
      case 'created':
        return `Nueva Cita Programada - ${roleText}`;
      case 'updated':
        return `Cita Actualizada - ${roleText}`;
      case 'cancelled':
        return `Cita Cancelada - ${roleText}`;
      default:
        return `Notificación de Cita - ${roleText}`;
    }
  }

  private getTemplateForUser(
    appointment: Appointment, 
    eventType: string, 
    recipient: UserInfo, 
    allUsers: UserInfo[]
  ): string {
    const otherUser = allUsers.find(u => !u.equals(recipient));
    const otherUserInfo = otherUser ? `${otherUser.name} (${otherUser.email.value})` : 'Usuario';

    switch (eventType) {
      case 'created':
        return this.getEnhancedCreatedTemplate(appointment, recipient, otherUserInfo);
      case 'updated':
        return this.getEnhancedUpdatedTemplate(appointment, recipient, otherUserInfo);
      case 'cancelled':
        return this.getEnhancedCancelledTemplate(appointment, recipient, otherUserInfo);
      default:
        return this.getEnhancedCreatedTemplate(appointment, recipient, otherUserInfo);
    }
  }

  private getEnhancedCreatedTemplate(appointment: Appointment, recipient: UserInfo, otherUserInfo: string): string {
    const otherRole = recipient.role === 'tutor' ? 'alumno' : 'tutor';

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
        <p><strong>${otherRole.charAt(0).toUpperCase() + otherRole.slice(1)}:</strong> ${otherUserInfo}</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;">
          <h3 style="color: #28a745; margin-top: 0;">Información de la Cita</h3>
          <p><strong>ID:</strong> ${appointment.id}</p>
          <p><strong>Fecha:</strong> ${appointment.fecha_cita.toLocaleString('es-ES')}</p>
          <p><strong>Estado:</strong> ${appointment.estado_cita}</p>
          ${appointment.checklist.length > 0 ? `<p><strong>Tareas:</strong> ${appointment.checklist.map(item => item.description).join(', ')}</p>` : ''}
          ${appointment.reason ? `<p><strong>Motivo:</strong> ${appointment.reason}</p>` : ''}
        </div>
        
        <p style="margin-top: 20px;">
          Por favor, confirma tu disponibilidad para esta cita.
        </p>
        
        <div style="margin-top: 30px; padding: 15px; background-color: #e9ecef; border-radius: 5px; font-size: 14px; color: #6c757d;">
          <p style="margin: 0;">
            Este es un mensaje automático del Sistema de Citas Académicas.
            <br>
            Si tienes alguna pregunta, contacta al administrador del sistema.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private getEnhancedUpdatedTemplate(appointment: Appointment, recipient: UserInfo, otherUserInfo: string): string {
    const otherRole = recipient.role === 'tutor' ? 'alumno' : 'tutor';

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cita Actualizada</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #fd7e14;">Cita Actualizada</h1>
        <p>Estimado/a <strong>${recipient.name}</strong>,</p>
        <p>Se han actualizado los detalles de tu cita de tutoría:</p>
        <p><strong>${otherRole.charAt(0).toUpperCase() + otherRole.slice(1)}:</strong> ${otherUserInfo}</p>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #fd7e14;">
          <h3 style="color: #fd7e14; margin-top: 0;">Información Actualizada</h3>
          <p><strong>ID:</strong> ${appointment.id}</p>
          <p><strong>Fecha:</strong> ${appointment.fecha_cita.toLocaleString('es-ES')}</p>
          <p><strong>Estado:</strong> ${appointment.estado_cita}</p>
          ${appointment.checklist.length > 0 ? `<p><strong>Tareas:</strong> ${appointment.checklist.map(item => item.description).join(', ')}</p>` : ''}
          ${appointment.reason ? `<p><strong>Motivo:</strong> ${appointment.reason}</p>` : ''}
        </div>
        
        <p style="margin-top: 20px;">
          Revisa los cambios realizados en tu cita.
        </p>
        
        <div style="margin-top: 30px; padding: 15px; background-color: #e9ecef; border-radius: 5px; font-size: 14px; color: #6c757d;">
          <p style="margin: 0;">
            Este es un mensaje automático del Sistema de Citas Académicas.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private getEnhancedCancelledTemplate(appointment: Appointment, recipient: UserInfo, otherUserInfo: string): string {
    const otherRole = recipient.role === 'tutor' ? 'alumno' : 'tutor';

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
        <p><strong>${otherRole.charAt(0).toUpperCase() + otherRole.slice(1)}:</strong> ${otherUserInfo}</p>
        
        <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545;">
          <h3 style="color: #dc3545; margin-top: 0;">Cita Cancelada</h3>
          <p><strong>ID:</strong> ${appointment.id}</p>
          <p><strong>Fecha Original:</strong> ${appointment.fecha_cita.toLocaleString('es-ES')}</p>
          <p><strong>Estado:</strong> ${appointment.estado_cita}</p>
          ${appointment.checklist.length > 0 ? `<p><strong>Tareas:</strong> ${appointment.checklist.map(item => item.description).join(', ')}</p>` : ''}
          ${appointment.reason ? `<p><strong>Motivo:</strong> ${appointment.reason}</p>` : ''}
        </div>
        
        <p style="margin-top: 20px;">
          Si necesitas reagendar, por favor contacta al ${otherRole}.
        </p>
        
        <div style="margin-top: 30px; padding: 15px; background-color: #e9ecef; border-radius: 5px; font-size: 14px; color: #6c757d;">
          <p style="margin: 0;">
            Este es un mensaje automático del Sistema de Citas Académicas.
          </p>
        </div>
      </body>
      </html>
    `;
  }


} 