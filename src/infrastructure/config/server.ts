import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createRoutes } from '@infrastructure/routes';
import { createRateLimit } from '@infrastructure/middlewares/rateLimit.middleware';
import { errorHandler, notFoundHandler } from '@infrastructure/middlewares/error.middleware';
import { DependencyContainer } from './dependencies';

export class AppServer {
  private app: Application;
  private port: number;
  private dependencies: DependencyContainer;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3002');
    this.dependencies = DependencyContainer.getInstance();
    
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddlewares(): void {

      this.app.set('trust proxy', true);
      console.log('🔧 Trust proxy habilitado para producción');


    // Seguridad
    this.app.use(helmet());

    // CORS
    this.app.use(cors({
      origin: '*', // Permitir cualquier origen
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Rate limiting global
    this.app.use(createRateLimit);

    // Parsing de JSON
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging de requests en desarrollo
    if (process.env.NODE_ENV === 'development') {
      this.app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
        next();
      });
    }
  }

  private setupRoutes(): void {
    // Rutas principales
    this.app.use('/s1', createRoutes(this.dependencies.appointmentController));
  }

  private setupErrorHandling(): void {
    // Middleware para rutas no encontradas
    this.app.use(notFoundHandler);

    // Middleware de manejo de errores global
    this.app.use(errorHandler);
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log('');
      console.log('🚀 ================================');
      console.log('📅 Appointment Service iniciado');
      console.log(`🌐 Puerto: ${this.port}`);
      console.log(`🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📧 Email configurado: ${process.env.RESEND_API_KEY ? '✅' : '❌'}`);
      console.log('================================');
      console.log('');
      console.log('📡 Endpoints disponibles:');
      console.log(`  GET    http://localhost:${this.port}/s1/health`);
      console.log(`  GET    http://localhost:${this.port}/s1/health/detailed`);
      console.log(`  GET    http://localhost:${this.port}/s1/docs              - 📚 Documentación Swagger UI`);
      console.log(`  GET    http://localhost:${this.port}/s1/swagger.json      - 📄 Especificación OpenAPI`);
      console.log(`  POST   http://localhost:${this.port}/s1/appointments`);
      console.log(`  GET    http://localhost:${this.port}/s1/appointments`);
      console.log(`  GET    http://localhost:${this.port}/s1/appointments/:id`);
      console.log(`  PUT    http://localhost:${this.port}/s1/appointments/:id`);
      console.log(`  PUT    http://localhost:${this.port}/s1/appointments/:id/status`);
      console.log(`  DELETE http://localhost:${this.port}/s1/appointments/:id`);
      console.log('');
      console.log('📚 Documentación interactiva disponible en:');
      console.log(`   http://localhost:${this.port}/docs`);
      console.log('');
    });

    // Manejo de señales de terminación
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGINT', this.gracefulShutdown.bind(this));
  }

  private gracefulShutdown(signal: string): void {
    console.log(`\n🔄 Recibida señal ${signal}. Cerrando servidor...`);
    
    // Aquí podrías agregar lógica para cerrar conexiones de base de datos, etc.
    process.exit(0);
  }

  public getApp(): Application {
    return this.app;
  }
} 
