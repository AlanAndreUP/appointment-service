import { ExternalAuthService } from '@application/services/ExternalAuthService';
import { ExternalUserService } from '@application/services/ExternalUserService';
import { TokenBasedEmailService } from '@application/services/TokenBasedEmailService';

// Configuración para usar el servicio de email real con tokens
export class RealEmailDependencies {
  private static instance: RealEmailDependencies;
  private _authService: ExternalAuthService;
  private _userService: ExternalUserService;
  private _emailService: TokenBasedEmailService;

  private constructor() {
    // Configurar el servicio de auth externo
    const authBaseURL = process.env.AUTH_SERVICE_URL || 'https://api.rutasegura.xyz/auth';
    this._authService = new ExternalAuthService(authBaseURL);
    
    // Configurar el servicio de usuario externo
    this._userService = new ExternalUserService(this._authService);
    
    // Configurar el servicio de email con tokens
    this._emailService = new TokenBasedEmailService(this._userService);
  }

  static getInstance(): RealEmailDependencies {
    if (!RealEmailDependencies.instance) {
      RealEmailDependencies.instance = new RealEmailDependencies();
    }
    return RealEmailDependencies.instance;
  }

  get authService(): ExternalAuthService {
    return this._authService;
  }

  get userService(): ExternalUserService {
    return this._userService;
  }

  get emailService(): TokenBasedEmailService {
    return this._emailService;
  }

  // Métodos para reconfigurar servicios
  setAuthServiceURL(baseURL: string): void {
    this._authService.setBaseURL(baseURL);
  }

  // Método para limpiar caché de usuarios
  clearUserCache(): void {
    this._userService.clearCache();
  }

  // Método para validar configuración
  async validateConfiguration(): Promise<boolean> {
    try {
      // Verificar que las variables de entorno estén configuradas
      if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY no está configurada');
        return false;
      }

      if (!process.env.FROM_EMAIL) {
        console.warn('FROM_EMAIL no está configurada, usando valor por defecto');
      }

      // Verificar conectividad con el servicio de auth
      const authURL = process.env.AUTH_SERVICE_URL || 'https://api.rutasegura.xyz/auth';
      console.log(`Servicio de auth configurado en: ${authURL}`);

      return true;
    } catch (error) {
      console.error('Error validando configuración:', error);
      return false;
    }
  }
}

// Exportar instancia singleton
export const realEmailDependencies = RealEmailDependencies.getInstance();

// Función helper para obtener la configuración basada en el entorno
export function getEmailDependencies(): RealEmailDependencies {
  return realEmailDependencies;
} 