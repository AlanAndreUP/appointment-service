import { EnhancedEmailService } from '@application/services/EnhancedEmailService';
import { ExternalUserService } from '@application/services/ExternalUserService';
import { ExternalAuthService } from '@application/services/ExternalAuthService';
import { MongoAppointmentRepository } from '@infrastructure/repositories/MongoAppointmentRepository';
import { AppointmentController } from '@infrastructure/controllers/AppointmentController';

// Use Cases
import { CreateAppointmentUseCase } from '@application/use-cases/CreateAppointment.usecase';
import { UpdateAppointmentUseCase } from '@application/use-cases/UpdateAppointment.usecase';
import { GetAppointmentsUseCase } from '@application/use-cases/GetAppointments.usecase';
import { GetAppointmentByIdUseCase } from '@application/use-cases/GetAppointmentById.usecase';
import { DeleteAppointmentUseCase } from '@application/use-cases/DeleteAppointment.usecase';
import { UpdateAppointmentStatusUseCase } from '@application/use-cases/UpdateAppointmentStatus.usecase';

// Configuración de dependencias del sistema
export class DependencyContainer {
  private static instance: DependencyContainer;
  private _authService: ExternalAuthService;
  private _userService: ExternalUserService;
  private _emailService: EnhancedEmailService;
  private _appointmentRepository: MongoAppointmentRepository;
  
  // Use Cases
  private _createAppointmentUseCase: CreateAppointmentUseCase;
  private _updateAppointmentUseCase: UpdateAppointmentUseCase;
  private _getAppointmentsUseCase: GetAppointmentsUseCase;
  private _getAppointmentByIdUseCase: GetAppointmentByIdUseCase;
  private _deleteAppointmentUseCase: DeleteAppointmentUseCase;
  private _updateAppointmentStatusUseCase: UpdateAppointmentStatusUseCase;
  
  // Controller
  private _appointmentController: AppointmentController;

  private constructor() {
    // Configurar servicios de autenticación
    const authBaseURL = process.env.AUTH_SERVICE_URL || 'https://api.rutasegura.xyz/auth';
    this._authService = new ExternalAuthService(authBaseURL);
    this._userService = new ExternalUserService(this._authService);
    
    // Configurar servicio de email mejorado
    this._emailService = new EnhancedEmailService(this._userService);
    
    // Configurar repositorio
    this._appointmentRepository = new MongoAppointmentRepository();
    
    // Configurar Use Cases
    this._createAppointmentUseCase = new CreateAppointmentUseCase(
      this._appointmentRepository,
      this._emailService
    );
    
    this._updateAppointmentUseCase = new UpdateAppointmentUseCase(
      this._appointmentRepository,
      this._emailService
    );
    
    this._getAppointmentsUseCase = new GetAppointmentsUseCase(
      this._appointmentRepository
    );
    
    this._getAppointmentByIdUseCase = new GetAppointmentByIdUseCase(
      this._appointmentRepository
    );
    
    this._deleteAppointmentUseCase = new DeleteAppointmentUseCase(
      this._appointmentRepository,
      this._emailService
    );
    
    this._updateAppointmentStatusUseCase = new UpdateAppointmentStatusUseCase(
      this._appointmentRepository,
      this._emailService
    );
    
    // Configurar Controller
    this._appointmentController = new AppointmentController(
      this._createAppointmentUseCase,
      this._updateAppointmentUseCase,
      this._getAppointmentsUseCase,
      this._getAppointmentByIdUseCase,
      this._deleteAppointmentUseCase,
      this._updateAppointmentStatusUseCase
    );
  }

  static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  get authService(): ExternalAuthService {
    return this._authService;
  }

  get userService(): ExternalUserService {
    return this._userService;
  }

  get emailService(): EnhancedEmailService {
    return this._emailService;
  }

  get appointmentRepository(): MongoAppointmentRepository {
    return this._appointmentRepository;
  }

  get appointmentController(): AppointmentController {
    return this._appointmentController;
  }

  // Use Cases getters
  get createAppointmentUseCase(): CreateAppointmentUseCase {
    return this._createAppointmentUseCase;
  }

  get updateAppointmentUseCase(): UpdateAppointmentUseCase {
    return this._updateAppointmentUseCase;
  }

  get getAppointmentsUseCase(): GetAppointmentsUseCase {
    return this._getAppointmentsUseCase;
  }

  get getAppointmentByIdUseCase(): GetAppointmentByIdUseCase {
    return this._getAppointmentByIdUseCase;
  }

  get deleteAppointmentUseCase(): DeleteAppointmentUseCase {
    return this._deleteAppointmentUseCase;
  }

  get updateAppointmentStatusUseCase(): UpdateAppointmentStatusUseCase {
    return this._updateAppointmentStatusUseCase;
  }



  // Método para configurar el modo de producción (con tokens)
  enableTokenMode(): void {
    console.log('🚀 Modo con tokens habilitado - usando servicio de auth externo');
    this._emailService = new EnhancedEmailService(this._userService);
    this._recreateUseCases();
  }

  // Método privado para recrear use cases cuando cambie el emailService
  private _recreateUseCases(): void {
    // Recrear use cases que dependen del emailService
    this._createAppointmentUseCase = new CreateAppointmentUseCase(
      this._appointmentRepository,
      this._emailService
    );
    
    this._updateAppointmentUseCase = new UpdateAppointmentUseCase(
      this._appointmentRepository,
      this._emailService
    );
    
    this._deleteAppointmentUseCase = new DeleteAppointmentUseCase(
      this._appointmentRepository,
      this._emailService
    );
    
    this._updateAppointmentStatusUseCase = new UpdateAppointmentStatusUseCase(
      this._appointmentRepository,
      this._emailService
    );
    
    // Recrear controller
    this._appointmentController = new AppointmentController(
      this._createAppointmentUseCase,
      this._updateAppointmentUseCase,
      this._getAppointmentsUseCase,
      this._getAppointmentByIdUseCase,
      this._deleteAppointmentUseCase,
      this._updateAppointmentStatusUseCase
    );
  }

  // Método para validar configuración
  async validateConfiguration(): Promise<boolean> {
    try {
      // Verificar variables de entorno básicas
      if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY no está configurada');
        return false;
      }

      if (!process.env.FROM_EMAIL) {
        console.warn('⚠️  FROM_EMAIL no está configurada, usando valor por defecto');
      }

      // Verificar configuración del servicio de auth
      const authURL = process.env.AUTH_SERVICE_URL;
      if (authURL) {
        console.log(`✅ Servicio de auth configurado: ${authURL}`);
      } else {
        console.log('⚠️  AUTH_SERVICE_URL no configurada, usando valor por defecto');
      }



      return true;
    } catch (error) {
      console.error('❌ Error validando configuración:', error);
      return false;
    }
  }

  // Método para mostrar configuración actual
  showConfiguration(): void {
    console.log('\n📋 Configuración Actual del Sistema:');
    console.log('=====================================');
    console.log(`🔐 Auth Service: ${process.env.AUTH_SERVICE_URL || 'Default (https://api.rutasegura.xyz/auth)'}`);
    console.log(`📧 From Email: ${process.env.FROM_EMAIL || 'Default (noreply@tutoria.com)'}`);
    console.log(`🔑 Resend API Key: ${process.env.RESEND_API_KEY ? '✅ Configurada' : '❌ No configurada'}`);
    console.log('=====================================\n');
  }
}

// Exportar instancia singleton
export const dependencies = DependencyContainer.getInstance();

// Función helper para configuración automática
export function setupDependencies(): DependencyContainer {
  const deps = DependencyContainer.getInstance();
  
  // Determinar modo basado en variables de entorno
  const hasAuthConfig = !!process.env.AUTH_SERVICE_URL;
  
  if (hasAuthConfig) {
    deps.enableTokenMode();
    console.log('🚀 Sistema configurado en modo TOKEN (producción)');
  } else {
    throw new Error('⚠️  Se requiere configuración de autenticación (AUTH_BASE_URL y AUTH_TOKEN) para el funcionamiento del sistema');
  }
  
  return deps;
} 