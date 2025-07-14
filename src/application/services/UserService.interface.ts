import { UserInfo } from '@domain/value-objects/UserInfo';
import { UserId } from '@domain/value-objects/UserId';

export interface UserService {
  /**
   * Obtiene información de un usuario por su ID
   */
  getUserById(userId: UserId): Promise<UserInfo>;

  /**
   * Obtiene información de múltiples usuarios por sus IDs
   */
  getUsersByIds(userIds: UserId[]): Promise<UserInfo[]>;

  /**
   * Obtiene información de un tutor por su ID
   */
  getTutorById(tutorId: UserId): Promise<UserInfo>;

  /**
   * Obtiene información de un alumno por su ID
   */
  getStudentById(studentId: UserId): Promise<UserInfo>;

  /**
   * Obtiene información de un usuario usando su token de autorización
   */
  getUserByToken?(token: string, userId: string): Promise<UserInfo>;

  /**
   * Obtiene información de múltiples usuarios usando sus tokens
   */
  getUsersByTokens?(tokens: string[], userIds: string[]): Promise<UserInfo[]>;

  /**
   * Obtiene información de un tutor usando su token
   */
  getTutorByToken?(token: string, userId: string): Promise<UserInfo>;

  /**
   * Obtiene información de un alumno usando su token
   */
  getStudentByToken?(token: string, userId: string): Promise<UserInfo>;

  /**
   * Valida si un token es válido
   */
  validateToken?(token: string, userId: string): Promise<boolean>;

  /**
   * Obtiene usuario desde el contexto de request
   */
  getUserFromRequest?(req: any): Promise<UserInfo>;
} 