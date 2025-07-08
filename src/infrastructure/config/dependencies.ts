import { MongoAppointmentRepository } from '@infrastructure/repositories/MongoAppointmentRepository';
import { EmailService } from '@application/services/Email.service';
import { CreateAppointmentUseCase } from '@application/use-cases/CreateAppointment.usecase';
import { UpdateAppointmentUseCase } from '@application/use-cases/UpdateAppointment.usecase';
import { GetAppointmentsUseCase } from '@application/use-cases/GetAppointments.usecase';
import { GetAppointmentByIdUseCase } from '@application/use-cases/GetAppointmentById.usecase';
import { DeleteAppointmentUseCase } from '@application/use-cases/DeleteAppointment.usecase';
import { UpdateAppointmentStatusUseCase } from '@application/use-cases/UpdateAppointmentStatus.usecase';
import { AppointmentController } from '@infrastructure/controllers/AppointmentController';

export class DependencyContainer {
  private static instance: DependencyContainer;
  
  private _appointmentRepository!: MongoAppointmentRepository;
  private _emailService!: EmailService;
  private _createAppointmentUseCase!: CreateAppointmentUseCase;
  private _updateAppointmentUseCase!: UpdateAppointmentUseCase;
  private _getAppointmentsUseCase!: GetAppointmentsUseCase;
  private _getAppointmentByIdUseCase!: GetAppointmentByIdUseCase;
  private _deleteAppointmentUseCase!: DeleteAppointmentUseCase;
  private _updateAppointmentStatusUseCase!: UpdateAppointmentStatusUseCase;
  private _appointmentController!: AppointmentController;

  private constructor() {
    this.initializeDependencies();
  }

  static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  private initializeDependencies(): void {
    // Infraestructura
    this._appointmentRepository = new MongoAppointmentRepository();
    this._emailService = new EmailService();

    // Casos de uso
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

    // Controladores
    this._appointmentController = new AppointmentController(
      this._createAppointmentUseCase,
      this._updateAppointmentUseCase,
      this._getAppointmentsUseCase,
      this._getAppointmentByIdUseCase,
      this._deleteAppointmentUseCase,
      this._updateAppointmentStatusUseCase
    );
  }

  // Getters para acceder a las dependencias
  get appointmentRepository(): MongoAppointmentRepository {
    return this._appointmentRepository;
  }

  get emailService(): EmailService {
    return this._emailService;
  }

  get appointmentController(): AppointmentController {
    return this._appointmentController;
  }
} 