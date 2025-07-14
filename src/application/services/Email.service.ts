import { Resend } from 'resend';
import { Appointment } from '@domain/entities/Appointment.entity';
import { ExternalUserService } from './ExternalUserService';
import { UserInfo } from '@domain/value-objects/UserInfo';

export class EmailService {
  private resend: Resend;
  private userService?: ExternalUserService;

  constructor(userService?: ExternalUserService) {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.userService = userService;
  }

  async sendAppointmentCreated(appointment: Appointment, tokens?: { tutorToken?: string; studentToken?: string; tutorUserId?: string; studentUserId?: string }): Promise<void> {
    if (this.userService && tokens) {
      // 🚀 NUEVO: Usar información real de usuarios
      await this.sendWithRealUsers(appointment, 'created', tokens);
    } else {
      // 🔧 LEGACY: Usar configuración de variables de entorno
      await this.sendWithConfiguredEmails(appointment, 'created');
    }
  }

  async sendAppointmentUpdated(appointment: Appointment, tokens?: { tutorToken?: string; studentToken?: string; tutorUserId?: string; studentUserId?: string }): Promise<void> {
    if (this.userService && tokens) {
      await this.sendWithRealUsers(appointment, 'updated', tokens);
    } else {
      await this.sendWithConfiguredEmails(appointment, 'updated');
    }
  }

  async sendAppointmentCancelled(appointment: Appointment, tokens?: { tutorToken?: string; studentToken?: string; tutorUserId?: string; studentUserId?: string }): Promise<void> {
    if (this.userService && tokens) {
      await this.sendWithRealUsers(appointment, 'cancelled', tokens);
    } else {
      await this.sendWithConfiguredEmails(appointment, 'cancelled');
    }
  }

  // 🚀 NUEVO: Método que usa tokens reales para obtener emails
  private async sendWithRealUsers(
    appointment: Appointment, 
    eventType: 'created' | 'updated' | 'cancelled',
    tokens: { tutorToken?: string; studentToken?: string; tutorUserId?: string; studentUserId?: string }
  ): Promise<void> {
    console.log('📧 Enviando emails con información real de usuarios');
    
    try {
      const users: UserInfo[] = [];

      // Obtener información real del tutor
      if (tokens.tutorToken && tokens.tutorUserId) {
        try {
          const tutor = await this.userService!.getUserByToken(tokens.tutorToken, tokens.tutorUserId);
          users.push(tutor);
          console.log(`✅ Tutor obtenido: ${tutor.name} (${tutor.email.value})`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          console.warn(`⚠️  Error obteniendo tutor: ${errorMessage}`);
        }
      }

      // Obtener información real del estudiante
      if (tokens.studentToken && tokens.studentUserId) {
        try {
          const student = await this.userService!.getUserByToken(tokens.studentToken, tokens.studentUserId);
          users.push(student);
          console.log(`✅ Estudiante obtenido: ${student.name} (${student.email.value})`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          console.warn(`⚠️  Error obteniendo estudiante: ${errorMessage}`);
        }
      }

      // Si no pudimos obtener usuarios, hacer fallback
      if (users.length === 0) {
        console.warn('⚠️  No se pudieron obtener usuarios con tokens, usando sistema de configuración');
        await this.sendWithConfiguredEmails(appointment, eventType);
        return;
      }

      // Enviar emails a usuarios reales
      for (const user of users) {
        const otherUser = users.find(u => !u.equals(user));
        
        const emailData = {
          from: process.env.FROM_EMAIL || 'noreply@tutoria.com',
          to: [user.email.value], // 🎯 EMAIL REAL DEL USUARIO
          subject: this.getPersonalizedSubject(eventType, user.role),
          html: this.getPersonalizedTemplate(appointment, eventType, user, otherUser)
        };

        await this.resend.emails.send(emailData);
        console.log(`✅ Email enviado a ${user.name} (${user.email.value}) - ${eventType}`);
      }

    } catch (error) {
      console.error('❌ Error enviando emails con usuarios reales:', error);
      // Fallback al sistema de configuración si algo falla
      await this.sendWithConfiguredEmails(appointment, eventType);
    }
  }

  // 🔧 MEJORADO: Sistema de configuración (ya no hardcodeado)
  private async sendWithConfiguredEmails(appointment: Appointment, eventType: 'created' | 'updated' | 'cancelled'): Promise<void> {
    console.log('📧 Enviando emails con configuración de variables de entorno');
    
    const recipients = this.getConfiguredRecipients();
    
    if (recipients.length === 0) {
      console.error('❌ No hay destinatarios configurados');
      return;
    }

    const emailData = {
      from: process.env.FROM_EMAIL || 'noreply@tutoria.com',
      to: recipients, // 🎯 EMAILS DE CONFIGURACIÓN (NO HARDCODEADOS)
      subject: this.getStandardSubject(eventType),
      html: this.getStandardTemplate(appointment, eventType)
    };

    await this.resend.emails.send(emailData);
    console.log(`✅ Email enviado a destinatarios configurados: ${recipients.join(', ')}`);
  }

  // 🚀 NUEVO: Obtener destinatarios de variables de entorno
  private getConfiguredRecipients(): string[] {
    const recipients: string[] = [];
    
    // Prioridad 1: Variables de entorno específicas
    if (process.env.TUTOR_EMAIL) {
      recipients.push(process.env.TUTOR_EMAIL);
    }
    
    if (process.env.STUDENT_EMAIL) {
      recipients.push(process.env.STUDENT_EMAIL);
    }
    
    // Prioridad 2: Lista de emails de desarrollo (si están configurados)
    if (process.env.DEVELOPMENT_EMAILS) {
      const devEmails = process.env.DEVELOPMENT_EMAILS.split(',').map(email => email.trim());
      recipients.push(...devEmails);
    }
    
    // Prioridad 3: Solo si no hay nada configurado, usar emails de prueba con advertencia
    if (recipients.length === 0) {
      console.warn('⚠️  NO HAY EMAILS CONFIGURADOS - Usando emails de prueba');
      console.warn('⚠️  Configura TUTOR_EMAIL y STUDENT_EMAIL en variables de entorno');
      recipients.push('alanenmexico12@gmail.com', '223200@ids.upchiapas.edu.mx');
    }
    
    return recipients;
  }

  // 🚀 NUEVO: Asuntos personalizados por rol
  private getPersonalizedSubject(eventType: string, role: 'tutor' | 'alumno'): string {
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

  private getStandardSubject(eventType: string): string {
    switch (eventType) {
      case 'created':
        return 'Nueva Cita Programada';
      case 'updated':
        return 'Cita Actualizada';
      case 'cancelled':
        return 'Cita Cancelada';
      default:
        return 'Notificación de Cita';
    }
  }

  // 🚀 NUEVO: Templates personalizados con información real de usuarios
  private getPersonalizedTemplate(
    appointment: Appointment, 
    eventType: string, 
    recipient: UserInfo, 
    otherUser?: UserInfo
  ): string {
    const otherUserInfo = otherUser ? `${otherUser.name} (${otherUser.email.value})` : 'Usuario';
    const recipientRole = recipient.role === 'tutor' ? 'tutor' : 'alumno';
    const otherRole = recipient.role === 'tutor' ? 'alumno' : 'tutor';

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
            <p><strong>${otherRole.charAt(0).toUpperCase() + otherRole.slice(1)}:</strong> ${otherUserInfo}</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
              <h3 style="color: #28a745; margin-top: 0;">📅 Información de la Cita</h3>
              <p><strong>ID:</strong> ${appointment.id}</p>
              <p><strong>Fecha:</strong> ${appointment.fecha_cita.toLocaleString('es-ES')}</p>
              <p><strong>Estado:</strong> ${appointment.estado_cita}</p>
              ${appointment.to_do ? `<p><strong>Tarea:</strong> ${appointment.to_do}</p>` : ''}
            </div>
            
            <p>Por favor, confirma tu disponibilidad para esta cita.</p>
            
            <div style="margin-top: 30px; padding: 15px; background-color: #e9ecef; border-radius: 5px; font-size: 14px; color: #6c757d;">
              <p style="margin: 0;">📧 Email enviado automáticamente desde el Sistema de Citas con información real de usuarios</p>
            </div>
          </body>
          </html>
        `;

      default:
        return this.getAppointmentCreatedTemplate(appointment);
    }
  }

  // Templates estándar (mejorados)
  private getStandardTemplate(appointment: Appointment, eventType: string): string {
    switch (eventType) {
      case 'created':
        return this.getAppointmentCreatedTemplate(appointment);
      case 'updated':
        return this.getAppointmentUpdatedTemplate(appointment);
      case 'cancelled':
        return this.getAppointmentCancelledTemplate(appointment);
      default:
        return this.getAppointmentCreatedTemplate(appointment);
    }
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
        
        <div style="margin-top: 20px; padding: 15px; background-color: #e3f2fd; border-radius: 5px; font-size: 14px;">
          <p style="margin: 0; color: #1976d2;">
            💡 <strong>Sistema Mejorado:</strong> Este email se envía usando configuración de variables de entorno.
            <br>
            Para emails personalizados con nombres reales, configura AUTH_SERVICE_URL.
          </p>
        </div>
        
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