import { AuthRequest } from '@infrastructure/middlewares/auth.middleware';

export class RequestUtils {
  /**
   * Extrae el token de autorización del header Authorization
   */
  static extractTokenFromRequest(req: any): string | undefined {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return undefined;
    }
    return authHeader.substring(7);
  }

  /**
   * Extrae el userId del request, priorizando el middleware de autenticación
   */
  static extractUserIdFromRequest(req: any): string | undefined {
    // Prioridad 1: Información del middleware de autenticación
    if (req.user?.userId) {
      return req.user.userId;
    }
    
    // Prioridad 2: Para CreateAppointment, usar id_alumno del body
    if (req.body?.id_alumno) {
      return req.body.id_alumno;
    }
    
    // Fallback: buscar en diferentes lugares donde puede estar el userId
    return req.headers?.['user-id'] || 
           req.query?.userId || 
           req.body?.userId || 
           req.params?.userId || 
           undefined;
  }

  /**
   * Valida que se proporcione un token de autorización
   */
  static validateToken(token: string | undefined): void {
    if (!token) {
      throw new Error('Token de autorización requerido');
    }
  }

  /**
   * Valida que se proporcione un userId
   */
  static validateUserId(userId: string | undefined): void {
    if (!userId) {
      throw new Error('UserId requerido');
    }
  }

  /**
   * Extrae y valida token y userId del request
   */
  static extractAndValidateAuth(req: any): { token: string; userId: string } {
    const token = this.extractTokenFromRequest(req);
    const userId = this.extractUserIdFromRequest(req);
    
    this.validateToken(token);
    this.validateUserId(userId);
    
    return { token: token!, userId: userId! };
  }

  /**
   * Verifica que el usuario autenticado sea el alumno de la cita
   */
  static validateStudentOwnership(authenticatedUserId: string, appointmentStudentId: string): void {
    if (authenticatedUserId !== appointmentStudentId) {
      throw new Error('Solo el alumno de la cita puede realizar esta operación');
    }
  }

  /**
   * Verifica que el usuario autenticado sea el alumno del request
   */
  static validateStudentCreation(authenticatedUserId: string, requestStudentId: string): void {
    if (authenticatedUserId !== requestStudentId) {
      throw new Error('Solo el alumno puede crear citas');
    }
  }
} 