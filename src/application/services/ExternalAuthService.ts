import { UserInfo } from '@domain/value-objects/UserInfo';
import { UserId } from '@domain/value-objects/UserId';
import { EmailAddress } from '@domain/value-objects/EmailAddress';

interface AuthUserProfile {
  id: string;
  correo:string
  userId: string;
  email: string;
  userType: 'tutor' | 'alumno';
  nombre?: string;
  tipo_usuario: 'tutor' | 'alumno';
}

interface AuthApiResponse {
  data: {
    user: AuthUserProfile;
  };
  message: string;
  status: 'success' | 'error';
}

export class ExternalAuthService {
  private baseURL: string;

  constructor(baseURL: string = 'https://api.psicodemy.com') {
    this.baseURL = baseURL;
  }

  /**
   * Obtiene el perfil de usuario usando el token de autorización
   */
  async getUserProfile(token: string,userId:string): Promise<UserInfo> {
    try {

      const response = await fetch(`${this.baseURL}/auth/profile/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
   

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token de autorización inválido o expirado');
        }
        if (response.status === 403) {
          throw new Error('No tienes permisos para acceder a este recurso');
        }
        throw new Error(`Error del servicio de auth: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as AuthApiResponse;

      if (data.status !== 'success') {
        throw new Error(`Error del servicio de auth: ${data.message}`);
      }

      const userProfile = data.data.user;
      
      // Transformar la respuesta a nuestro value object
      return UserInfo.create(
        userProfile.id,
        userProfile.correo,
        userProfile.nombre || this.generateNameFromEmail(userProfile.email),
        userProfile.tipo_usuario
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error de conexión con el servicio de auth: ${errorMessage}`);
    }
  }

  /**
   * Valida si un token es válido verificando el perfil
   */
  async validateToken(token: string, userId: string): Promise<boolean> {
    try {
      console.log(userId);
      await this.getUserProfile(token, userId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Genera un nombre a partir del email si no se proporciona
   */
  private generateNameFromEmail(email: string): string {
    const localPart = email.split('@')[0];
    // Capitalizar primera letra y reemplazar puntos/guiones por espacios
    return localPart
      .replace(/[._-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Obtiene múltiples usuarios por sus tokens y userIds (si se tiene acceso a ellos)
   * Nota: Este método es una extensión para casos donde se necesiten múltiples usuarios
   */
  async getUsersByTokens(tokens: string[], userIds: string[]): Promise<UserInfo[]> {
    const users: UserInfo[] = [];
    
    if (tokens.length !== userIds.length) {
      throw new Error('El número de tokens debe coincidir con el número de userIds');
    }
    
    for (let i = 0; i < tokens.length; i++) {
      try {
        const user = await this.getUserProfile(tokens[i], userIds[i]);
        users.push(user);
             } catch (error) {
         const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
         console.warn(`Error obteniendo usuario con token: ${errorMessage}`);
       }
    }
    
    return users;
  }

  /**
   * Configurar el baseURL del servicio
   */
  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL;
  }

  /**
   * Obtener la URL base configurada
   */
  getBaseURL(): string {
    return this.baseURL;
  }
} 