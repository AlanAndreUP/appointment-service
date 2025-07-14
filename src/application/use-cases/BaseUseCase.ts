import { RequestUtils } from '@shared/utils/RequestUtils';

export interface BaseContext {
  userToken: string;
  userId: string;
}

export abstract class BaseUseCase {
  /**
   * Extrae y valida la autenticación del request
   */
  protected extractAuthFromRequest(req: any): { token: string; userId: string } {
    return RequestUtils.extractAndValidateAuth(req);
  }

  /**
   * Verifica que el usuario autenticado sea el alumno de la cita
   */
  protected validateStudentOwnership(authenticatedUserId: string, appointmentStudentId: string): void {
    RequestUtils.validateStudentOwnership(authenticatedUserId, appointmentStudentId);
  }

  /**
   * Verifica que el usuario autenticado sea el alumno del request
   */
  protected validateStudentCreation(authenticatedUserId: string, requestStudentId: string): void {
    RequestUtils.validateStudentCreation(authenticatedUserId, requestStudentId);
  }

  /**
   * Crea el contexto de autenticación para los casos de uso
   */
  protected createAuthContext(req: any): BaseContext {
    const { token, userId } = this.extractAuthFromRequest(req);
    return { userToken: token, userId };
  }
} 