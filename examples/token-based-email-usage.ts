import { realEmailDependencies } from '../src/infrastructure/config/realEmailDependencies';
import { AppointmentAggregate } from '../src/domain/aggregates/AppointmentAggregate';
import { CreateAppointmentWithTokensUseCase } from '../src/application/use-cases/CreateAppointmentWithTokens.usecase';

// Ejemplo de uso del sistema de emails con tokens reales
async function tokenBasedEmailExample() {
  console.log('=== Sistema de Emails con Tokens Reales ===');
  
  try {
    // Validar configuración
    const isConfigValid = await realEmailDependencies.validateConfiguration();
    if (!isConfigValid) {
      console.error('Configuración inválida, abortando ejemplo');
      return;
    }

    // Obtener servicios
    const { authService, userService, emailService } = realEmailDependencies;

    // Ejemplo 1: Validar un token (simulado)
    console.log('\n1. Validando token de usuario...');
    const testToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2NzAyN...'; // Token de ejemplo
    
    try {
      const isTokenValid = await authService.validateToken(testToken);
      console.log(`Token válido: ${isTokenValid}`);
    } catch (error) {
      console.log(`Token inválido: ${error.message}`);
    }

    // Ejemplo 2: Obtener información de usuario con token
    console.log('\n2. Obteniendo información de usuario...');
    try {
      const user = await userService.getUserByToken(testToken);
      console.log('Usuario obtenido:', user.toJSON());
    } catch (error) {
      console.log(`Error obteniendo usuario: ${error.message}`);
    }

    // Ejemplo 3: Crear una cita con notificaciones (simulado)
    console.log('\n3. Creando cita con notificaciones...');
    
    // Simular tokens válidos (en un escenario real, estos vendrían del request)
    const tutorToken = 'tutor-token-123';
    const studentToken = 'student-token-456';
    
    try {
      // Crear usuarios de ejemplo para la demostración
      const tutor = await createMockUser('tutor123', 'tutor@universidad.edu.mx', 'Dr. Juan Pérez', 'tutor');
      const student = await createMockUser('student456', 'alumno@estudiante.edu.mx', 'Ana Martínez', 'alumno');

      // Crear cita de ejemplo
      const appointment = AppointmentAggregate.create({
        tutorId: tutor.id.value,
        studentId: student.id.value,
        appointmentDate: new Date('2024-12-25T10:00:00Z'),
        pendingTask: 'Revisar ejercicios de matemáticas'
      });

      // Enviar notificaciones
      await emailService.sendAppointmentNotificationWithUsers(
        tutor,
        student,
        appointment,
        'created'
      );

      console.log('Cita creada y notificaciones enviadas exitosamente');
      
    } catch (error) {
      console.log(`Error en la demostración: ${error.message}`);
    }

  } catch (error) {
    console.error('Error en el ejemplo:', error);
  }
}

// Función helper para crear usuarios mock
async function createMockUser(id: string, email: string, name: string, role: 'tutor' | 'alumno') {
  const { UserInfo } = await import('../src/domain/value-objects/UserInfo');
  return UserInfo.create(id, email, name, role);
}

// Ejemplo de integración con middleware de Express
function createAuthMiddleware() {
  const { userService } = realEmailDependencies;
  
  return async (req: any, res: any, next: any) => {
    try {
      // Extraer token del header Authorization
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          data: null,
          message: 'Token de autorización requerido',
          status: 'error',
          error: { code: 'AUTHORIZATION_REQUIRED' }
        });
      }

      const token = authHeader.substring(7);
      
      // Obtener información del usuario
      const user = await userService.getUserByToken(token);
      
      // Agregar usuario al request
      req.user = user;
      req.token = token;
      
      next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token inválido';
      res.status(401).json({
        data: null,
        message: errorMessage,
        status: 'error',
        error: { code: 'INVALID_TOKEN' }
      });
    }
  };
}

// Ejemplo de endpoint que usa el middleware
function createAppointmentEndpoint() {
  const authMiddleware = createAuthMiddleware();
  
  // Simulación de endpoint Express
  const endpoint = {
    middleware: authMiddleware,
    handler: async (req: any, res: any) => {
      try {
        const { userService } = realEmailDependencies;
        const currentUser = req.user;
        const currentToken = req.token;

        console.log(`Usuario autenticado: ${currentUser.name} (${currentUser.role})`);
        
        // Aquí podrías usar CreateAppointmentWithTokensUseCase
        // con el token del usuario actual
        
        res.json({
          data: { 
            message: 'Endpoint funcionando correctamente',
            user: currentUser.toJSON()
          },
          message: 'Autenticación exitosa',
          status: 'success'
        });
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error interno';
        res.status(500).json({
          data: null,
          message: errorMessage,
          status: 'error',
          error: { code: 'INTERNAL_ERROR' }
        });
      }
    }
  };

  return endpoint;
}

// Ejemplo de configuración de variables de entorno
function showEnvironmentSetup() {
  console.log('\n=== Configuración de Variables de Entorno ===');
  console.log('Para usar el sistema de emails con tokens reales, configura:');
  console.log('');
  console.log('# Servicio de autenticación');
  console.log('AUTH_SERVICE_URL=https://api.rutasegura.xyz/auth');
  console.log('');
  console.log('# Servicio de email');
  console.log('RESEND_API_KEY=tu_api_key_de_resend');
  console.log('FROM_EMAIL=noreply@tudominio.com');
  console.log('');
  console.log('# Opcional: Para desarrollo local');
  console.log('AUTH_SERVICE_URL=http://localhost:3001/auth');
  console.log('');
}

// Ejecutar ejemplos
if (require.main === module) {
  console.log('🚀 Ejemplos del Sistema de Emails con Tokens');
  
  showEnvironmentSetup();
  
  tokenBasedEmailExample()
    .then(() => console.log('\n✅ Ejemplos completados'))
    .catch(error => console.error('\n❌ Error en los ejemplos:', error));
}

// Exportar para uso en otros módulos
export {
  tokenBasedEmailExample,
  createAuthMiddleware,
  createAppointmentEndpoint,
  showEnvironmentSetup
}; 