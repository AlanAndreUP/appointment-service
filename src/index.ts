import 'dotenv/config';
import 'tsconfig-paths/register';
import DatabaseConnection from '@infrastructure/database/connection';
import { AppServer } from '@infrastructure/config/server';

// Validar variables de entorno requeridas
function validateEnvironment(): void {
  const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET'
  ];

  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingVars.length > 0) {
    console.error('❌ Error: Las siguientes variables de entorno son requeridas:');
    missingVars.forEach(varName => {
      console.error(`  - ${varName}`);
    });
    process.exit(1);
  }

  // Variables opcionales con advertencias
  const optionalVars = [
    { name: 'RESEND_API_KEY', feature: 'notificaciones por email' },
    { name: 'FROM_EMAIL', feature: 'email del remitente' },
    { name: 'TUTOR_EMAIL', feature: 'email del tutor' }
  ];

  optionalVars.forEach(({ name, feature }) => {
    if (!process.env[name]) {
      console.warn(`⚠️  Advertencia: ${name} no está configurado - ${feature} no funcionarán`);
    }
  });
}

// Función principal de inicialización
async function bootstrap(): Promise<void> {
  try {
    console.log('🔄 Inicializando Appointment Service...');

    // Validar entorno
    validateEnvironment();

    // Conectar a la base de datos
    await DatabaseConnection.connect();

    // Crear e iniciar el servidor
    const server = new AppServer();
    server.start();

  } catch (error) {
    console.error('❌ Error fatal durante la inicialización:', error);
    process.exit(1);
  }
}

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar la aplicación
bootstrap(); 