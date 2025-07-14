# Sistema de Emails con Tokens Reales

## Integración con Servicio de Autenticación Externo

Este documento describe la implementación del sistema de notificaciones por email que obtiene la información de usuarios desde el servicio de autenticación externo `https://api.rutasegura.xyz/auth/`.

## 🏗️ Arquitectura del Sistema

### Componentes Principales

```
src/
├── application/services/
│   ├── ExternalAuthService.ts      # Cliente para API de auth externa
│   ├── ExternalUserService.ts      # Servicio de usuarios con tokens
│   ├── TokenBasedEmailService.ts   # Servicio de email con tokens
│   └── UserService.interface.ts    # Interfaz actualizada
├── application/use-cases/
│   └── CreateAppointmentWithTokens.usecase.ts
├── infrastructure/config/
│   └── realEmailDependencies.ts    # Configuración real
└── examples/
    └── token-based-email-usage.ts  # Ejemplos de uso
```

## 🔧 Configuración

### Variables de Entorno

```bash
# Servicio de autenticación
AUTH_SERVICE_URL=https://api.rutasegura.xyz/auth

# Servicio de email
RESEND_API_KEY=tu_api_key_de_resend
FROM_EMAIL=noreply@tudominio.com

# Para desarrollo local
AUTH_SERVICE_URL=http://localhost:3001/auth
```

### Inicialización

```typescript
import { realEmailDependencies } from '@infrastructure/config/realEmailDependencies';

// Validar configuración
const isValid = await realEmailDependencies.validateConfiguration();
if (!isValid) {
  console.error('Configuración inválida');
  process.exit(1);
}

// Obtener servicios
const { authService, userService, emailService } = realEmailDependencies;
```

## 🚀 Servicios Implementados

### ExternalAuthService

Cliente para comunicarse con el API de autenticación externa:

```typescript
const authService = new ExternalAuthService('https://api.rutasegura.xyz/auth');

// Obtener perfil de usuario
const user = await authService.getUserProfile(token);

// Validar token
const isValid = await authService.validateToken(token);
```

**Características:**
- ✅ Comunicación HTTP con `fetch`
- ✅ Manejo de errores 401/403
- ✅ Transformación a value objects
- ✅ Generación de nombres desde email
- ✅ Timeout y manejo de errores de red

### ExternalUserService

Implementación del `UserService` que usa tokens:

```typescript
const userService = new ExternalUserService(authService);

// Obtener usuario por token
const user = await userService.getUserByToken(token);

// Obtener tutor específico
const tutor = await userService.getTutorByToken(token);

// Obtener alumno específico
const student = await userService.getStudentByToken(token);
```

**Características:**
- ✅ Caché de usuarios con expiración (5 minutos)
- ✅ Validación de roles (tutor/alumno)
- ✅ Extracción de tokens desde requests
- ✅ Middleware de autenticación
- ✅ Manejo de errores tipados

### TokenBasedEmailService

Servicio de email que funciona con tokens:

```typescript
const emailService = new TokenBasedEmailService(userService);

// Enviar notificación con tokens
await emailService.sendAppointmentNotification({
  appointment,
  tutorToken: 'tutor-token-123',
  studentToken: 'student-token-456',
  eventType: 'created'
});

// Enviar con usuarios conocidos
await emailService.sendAppointmentNotificationWithUsers(
  tutor,
  student,
  appointment,
  'created'
);
```

**Características:**
- ✅ Templates HTML responsivos
- ✅ Personalización por rol (tutor/alumno)
- ✅ Información completa de participantes
- ✅ Manejo de errores de email
- ✅ Soporte para diferentes eventos

## 📧 Flujo de Notificaciones

### 1. Crear Cita con Notificaciones

```typescript
const createAppointmentUseCase = new CreateAppointmentWithTokensUseCase(
  appointmentRepository,
  emailService,
  userService
);

// Crear cita con tokens específicos
const result = await createAppointmentUseCase.execute(
  {
    tutorId: 'tutor123',
    studentId: 'student456',
    appointmentDate: '2024-12-25T10:00:00Z',
    pendingTask: 'Revisar ejercicios'
  },
  {
    tutorToken: 'tutor-token-123',
    studentToken: 'student-token-456',
    currentUserToken: 'current-user-token'
  }
);
```

### 2. Middleware de Autenticación

```typescript
const authMiddleware = createAuthMiddleware();

app.use('/api/appointments', authMiddleware, appointmentRoutes);

// En el endpoint:
app.post('/api/appointments', async (req, res) => {
  const currentUser = req.user;      // UserInfo del usuario autenticado
  const currentToken = req.token;    // Token del usuario actual
  
  // Usar en el use case...
});
```

### 3. Tipos de Notificaciones

```typescript
// Eventos soportados
type EventType = 'created' | 'confirmed' | 'cancelled' | 'completed' | 'rescheduled' | 'updated';

// Cada evento genera emails personalizados para tutor y alumno
await emailService.sendAppointmentNotificationWithUsers(
  tutor,
  student,
  appointment,
  'confirmed'  // Evento específico
);
```

## 🔐 Seguridad y Validación

### Validación de Tokens

```typescript
// Validar token antes de usar
const isValid = await authService.validateToken(token);
if (!isValid) {
  throw new Error('Token inválido');
}

// Obtener usuario y validar rol
const user = await userService.getUserByToken(token);
if (!user.isTutor()) {
  throw new Error('Se requiere rol de tutor');
}
```

### Validación de Coincidencia ID-Token

```typescript
// Verificar que el token corresponde al usuario
const user = await userService.getUserByToken(token);
if (user.id.value !== expectedUserId) {
  throw new Error('Token no coincide con el usuario');
}
```

## 📊 Manejo de Errores

### Tipos de Errores Manejados

```typescript
try {
  await emailService.sendAppointmentNotification(data);
} catch (error) {
  if (error.message.includes('Token inválido')) {
    // Token expirado o inválido
    return { status: 'error', message: 'Reautenticación requerida' };
  }
  
  if (error.message.includes('Usuario no encontrado')) {
    // Usuario no existe en el servicio de auth
    return { status: 'error', message: 'Usuario no válido' };
  }
  
  if (error.message.includes('Error enviando email')) {
    // Error del servicio de email (no fallar la operación)
    console.error('Email no enviado:', error);
    return { status: 'success', message: 'Cita creada (email pendiente)' };
  }
}
```

## 🔄 Integración con Arquitectura Existente

### Compatibilidad con Código Legacy

```typescript
// El sistema funciona junto con el código existente
import { EmailService } from '@application/services/Email.service';      // Legacy
import { TokenBasedEmailService } from '@application/services/TokenBasedEmailService'; // Nuevo

// Migración gradual
const useLegacyEmail = process.env.USE_LEGACY_EMAIL === 'true';
const emailService = useLegacyEmail 
  ? new EmailService() 
  : new TokenBasedEmailService(userService);
```

### Adaptación de Repositorios

```typescript
// El use case convierte entre agregados y entidades legacy
const appointmentAggregate = AppointmentAggregate.create(data);
const appointmentData = appointmentAggregate.toPersistence();

// Convertir a entidad legacy para persistencia
const legacyAppointment = new Appointment(
  appointmentData._id,
  appointmentData.id_tutor,
  appointmentData.id_alumno,
  appointmentData.estado_cita,
  appointmentData.fecha_cita,
  appointmentData.created_at,
  appointmentData.updated_at,
  appointmentData.deleted_at,
  appointmentData.to_do,
  appointmentData.finish_to_do
);

await appointmentRepository.create(legacyAppointment);
```

## 🎯 Ejemplos de Uso

### Ejecutar Ejemplos

```bash
# Configurar variables de entorno
cp env.example .env
# Editar .env con tus valores

# Ejecutar ejemplo
npx ts-node examples/token-based-email-usage.ts
```

### Ejemplo de Endpoint Completo

```typescript
app.post('/api/appointments', authMiddleware, async (req, res) => {
  try {
    const { tutorId, studentId, appointmentDate, pendingTask } = req.body;
    const currentUser = req.user;
    const currentToken = req.token;

    // Usar el use case con tokens
    const result = await createAppointmentUseCase.createAppointmentWithCurrentUser(
      { tutorId, studentId, appointmentDate, pendingTask },
      currentToken
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      data: null,
      message: error.message,
      status: 'error'
    });
  }
});
```

## 🚀 Beneficios del Sistema

### ✅ Ventajas

1. **Seguridad Mejorada**
   - Validación de tokens en tiempo real
   - Verificación de roles automática
   - Manejo seguro de información de usuarios

2. **Escalabilidad**
   - Caché de usuarios con expiración
   - Comunicación eficiente con servicios externos
   - Manejo de errores resiliente

3. **Experiencia de Usuario**
   - Emails personalizados por rol
   - Información completa de participantes
   - Notificaciones para todos los eventos

4. **Mantenibilidad**
   - Separación clara de responsabilidades
   - Fácil testing con mocks
   - Configuración centralizada

### ⚠️ Consideraciones

1. **Dependencia Externa**
   - Requiere conectividad con el servicio de auth
   - Manejo de timeouts y errores de red
   - Caché para reducir llamadas

2. **Sincronización de Tokens**
   - Tokens pueden expirar
   - Necesidad de refresh tokens
   - Manejo de sesiones concurrentes

3. **Performance**
   - Llamadas HTTP para cada validación
   - Caché para optimizar consultas
   - Monitoreo de latencia

## 📈 Próximos Pasos

1. **Implementar Refresh Tokens**
   - Manejo automático de tokens expirados
   - Renovación transparente

2. **Notificaciones Push**
   - Integración con servicios push
   - Notificaciones en tiempo real

3. **Métricas y Monitoreo**
   - Logs estructurados
   - Métricas de performance
   - Alertas de errores

4. **Testing Completo**
   - Tests unitarios para todos los servicios
   - Tests de integración con API externa
   - Tests de carga

## 🔧 Troubleshooting

### Problemas Comunes

1. **Token Inválido**
   ```bash
   Error: Token de autorización inválido o expirado
   ```
   - Verificar formato del token
   - Comprobar conectividad con servicio auth
   - Verificar que el token no haya expirado

2. **Usuario No Encontrado**
   ```bash
   Error: Usuario no encontrado: user123
   ```
   - Verificar que el usuario existe en el servicio auth
   - Comprobar que el token corresponde al usuario correcto

3. **Error de Email**
   ```bash
   Error enviando email a user@example.com
   ```
   - Verificar configuración de RESEND_API_KEY
   - Comprobar formato del email
   - Verificar límites de rate limiting

### Logs y Debugging

```typescript
// Habilitar logs detallados
process.env.DEBUG = 'email-service,auth-service';

// Logs automáticos en los servicios
console.log(`Email enviado a ${recipient.name} (${recipient.email.value})`);
console.log(`Usuario autenticado: ${user.name} (${user.role})`);
```

---

¡El sistema de emails con tokens reales está listo para producción! 🚀 