import { EnhancedEmailService } from '@application/services/EnhancedEmailService';
import { MockUserService } from '@application/services/MockUserService';
import { UserService } from '@application/services/UserService.interface';

// Configuración de dependencias para el sistema de emails
export class EmailDependencies {
  private static instance: EmailDependencies;
  private _userService: UserService;
  private _emailService: EnhancedEmailService;

  private constructor() {
    this._userService = new MockUserService();
    this._emailService = new EnhancedEmailService(this._userService);
  }

  static getInstance(): EmailDependencies {
    if (!EmailDependencies.instance) {
      EmailDependencies.instance = new EmailDependencies();
    }
    return EmailDependencies.instance;
  }

  get userService(): UserService {
    return this._userService;
  }

  get emailService(): EnhancedEmailService {
    return this._emailService;
  }

  // Método para reconfigurar con un servicio de usuario diferente
  setUserService(userService: UserService): void {
    this._userService = userService;
    this._emailService = new EnhancedEmailService(this._userService);
  }
}

// Exportar instancia singleton
export const emailDependencies = EmailDependencies.getInstance(); 