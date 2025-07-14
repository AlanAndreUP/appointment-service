import { UserService } from './UserService.interface';
import { ExternalAuthService } from './ExternalAuthService';
import { UserInfo } from '@domain/value-objects/UserInfo';
import { UserId } from '@domain/value-objects/UserId';

export class ExternalUserService implements UserService {
  private authService: ExternalAuthService;
  private userCache: Map<string, { user: UserInfo; token: string; expiry: number }> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutos

  constructor(authService?: ExternalAuthService) {
    this.authService = authService || new ExternalAuthService();
  }

  /**
   * Obtiene información de un usuario por su ID
   * Nota: Para usar este método, necesitas tener el token del usuario
   * En un escenario real, podrías tener una tabla de mapeo userId -> token
   * o usar un servicio administrativo para obtener usuarios
   */
  async getUserById(userId: UserId): Promise<UserInfo> {
    // Buscar en caché primero
    const cached = this.userCache.get(userId.value);
    if (cached && cached.expiry > Date.now()) {
      return cached.user;
    }

    // Si no está en caché, necesitamos el token del usuario
    // En un escenario real, esto podría venir de:
    // 1. Un servicio administrativo
    // 2. Una base de datos de mapeo userId -> token
    // 3. Un contexto de request que contenga el token
    
    throw new Error(`No se puede obtener información del usuario ${userId.value} sin su token de autorización`);
  }

  /**
   * Obtiene información de un usuario usando su token
   */
  async getUserByToken(token: string,userId:string): Promise<UserInfo> {
    console.log(token,userId);
    const user = await this.authService.getUserProfile(token,userId);
    
    // Guardar en caché
    this.userCache.set(user.id.value, {
      user,
      token,
      expiry: Date.now() + this.cacheExpiry
    });

    return user;
  }

  /**
   * Obtiene información de múltiples usuarios por sus IDs
   */
  async getUsersByIds(userIds: UserId[]): Promise<UserInfo[]> {
    const users: UserInfo[] = [];
    
    for (const userId of userIds) {
      try {
        const user = await this.getUserById(userId);
        users.push(user);
      } catch (error) {
        console.warn(`Usuario no encontrado en caché: ${userId.value}`);
      }
    }
    
    return users;
  }

  /**
   * Obtiene información de múltiples usuarios usando sus tokens
   */
  async getUsersByTokens(tokens: string[], userIds: string[]): Promise<UserInfo[]> {
    const users: UserInfo[] = [];
    
    if (tokens.length !== userIds.length) {
      throw new Error('El número de tokens debe coincidir con el número de userIds');
    }
    
    for (let i = 0; i < tokens.length; i++) {
      try {
        const user = await this.getUserByToken(tokens[i], userIds[i]);
        users.push(user);
             } catch (error) {
         const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
         console.warn(`Error obteniendo usuario con token: ${errorMessage}`);
       }
    }
    
    return users;
  }

  /**
   * Obtiene información de un tutor por su ID
   */
  async getTutorById(tutorId: UserId): Promise<UserInfo> {
    const user = await this.getUserById(tutorId);
    if (!user.isTutor()) {
      throw new Error(`El usuario ${tutorId.value} no es un tutor`);
    }
    return user;
  }

  /**
   * Obtiene información de un tutor usando su token
   */
  async getTutorByToken(token: string, userId: string): Promise<UserInfo> {
    const user = await this.getUserByToken(token, userId);
    if (!user.isTutor()) {
      throw new Error(`El usuario no es un tutor`);
    }
    return user;
  }

  /**
   * Obtiene información de un alumno por su ID
   */
  async getStudentById(studentId: UserId): Promise<UserInfo> {
    const user = await this.getUserById(studentId);
    if (!user.isStudent()) {
      throw new Error(`El usuario ${studentId.value} no es un alumno`);
    }
    return user;
  }

  /**
   * Obtiene información de un alumno usando su token
   */
  async getStudentByToken(token: string, userId: string): Promise<UserInfo> {
    const user = await this.getUserByToken(token, userId);
    if (!user.isStudent()) {
      throw new Error(`El usuario no es un alumno`);
    }
    return user;
  }

  /**
   * Valida si un token es válido
   */
  async validateToken(token: string, userId: string): Promise<boolean> {
    return await this.authService.validateToken(token, userId);
  }

  /**
   * Limpia el caché de usuarios
   */
  clearCache(): void {
    this.userCache.clear();
  }

  /**
   * Limpia entradas expiradas del caché
   */
  cleanExpiredCache(): void {
    const now = Date.now();
    for (const [userId, cached] of this.userCache.entries()) {
      if (cached.expiry <= now) {
        this.userCache.delete(userId);
      }
    }
  }

  /**
   * Obtiene el tamaño actual del caché
   */
  getCacheSize(): number {
    return this.userCache.size;
  }

  /**
   * Métodos adicionales para trabajar con tokens en el contexto de request
   */

  /**
   * Obtiene usuario desde el contexto de request (donde está el token)
   */
  async getUserFromRequest(req: any): Promise<UserInfo> {
    const token = this.extractTokenFromRequest(req);
    const userId = this.extractUserIdFromRequest(req);
    if (!token) {
      throw new Error('Token de autorización requerido');
    }
    if (!userId) {
      throw new Error('UserId requerido');
    }
    return await this.getUserByToken(token, userId);
  }

  /**
   * Extrae el token del header Authorization
   */
  private extractTokenFromRequest(req: any): string | null {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Extrae el userId del request (puede venir en headers, query params, o body)
   */
  private extractUserIdFromRequest(req: any): string | null {
    // Buscar en diferentes lugares donde puede estar el userId
    return req.headers?.['user-id'] || 
           req.query?.userId || 
           req.body?.userId || 
           req.params?.userId || 
           null;
  }

  /**
   * Middleware para obtener usuario del request
   */
  createUserMiddleware() {
    return async (req: any, res: any, next: any) => {
      try {
        const user = await this.getUserFromRequest(req);
        req.user = user;
        next();
             } catch (error) {
         const errorMessage = error instanceof Error ? error.message : 'Token de autorización inválido';
         res.status(401).json({
           data: null,
           message: errorMessage,
           status: 'error',
           error: {
             code: 'INVALID_TOKEN'
           }
         });
       }
    };
  }
} 