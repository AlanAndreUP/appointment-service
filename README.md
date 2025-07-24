# 📅 Appointment Service - Microservicio de Citas

Microservicio de gestión de citas construido con **TypeScript**, **Express**, **MongoDB**, **Resend** y arquitectura **Hexagonal** siguiendo principios de **DDD**.

## 🚀 Características

- ✅ CRUD completo de citas (Crear, Leer, Actualizar, Eliminar)
- ✅ Estados de cita: pendiente, confirmada, cancelada, completada, no_asistio
- ✅ Sistema de tareas (to_do) y seguimiento (finish_to_do)
- ✅ Notificaciones por email con Resend
- ✅ Validación de conflictos de horario
- ✅ Filtros avanzados y paginación
- ✅ Arquitectura Hexagonal (Puertos y Adaptadores)
- ✅ Domain-Driven Design (DDD)
- ✅ Middleware de autenticación JWT

## 📋 Estructura del Proyecto

```
src/
├── domain/                 # Capa de dominio
│   ├── entities/          # Entidades del dominio
│   └── repositories/      # Interfaces de repositorios
├── application/           # Capa de aplicación
│   ├── use-cases/        # Casos de uso
│   └── services/         # Servicios de aplicación
├── infrastructure/        # Capa de infraestructura
│   ├── controllers/      # Controladores HTTP
│   ├── repositories/     # Implementaciones de repositorios
│   ├── database/         # Modelos y conexión DB
│   ├── middlewares/      # Middlewares
│   ├── email/           # Configuración de email
│   └── routes/          # Definición de rutas
└── shared/               # Tipos y utilidades compartidas
    └── types/           # Definiciones de tipos
```

## 🔧 Instalación y Uso

### Prerrequisitos
- Node.js 18+
- MongoDB
- Cuenta de Resend (para emails)
- npm o yarn

### Instalación
```bash
npm install
```

### Variables de Entorno
Crear archivo `.env`:

```env
NODE_ENV=development
PORT=3002
MONGODB_URI=mongodb://localhost:27017/appointment_service
JWT_SECRET=tu-jwt-secreto-super-seguro-aqui
RESEND_API_KEY=tu-resend-api-key
FROM_EMAIL=noreply@tutoria.com
TUTOR_EMAIL=tutor@example.com
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
LOG_LEVEL=info
```

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm run build
npm start
```

## 📡 API Endpoints

### POST `/appointments`
Crear nueva cita.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "id_tutor": "tutor_id",
  "id_alumno": "alumno_id", 
  "fecha_cita": "2024-01-15T10:00:00.000Z",
  "to_do": "Revisar álgebra básica"
}
```

### GET `/appointments`
Obtener citas con filtros y paginación.

**Query Parameters:**
- `id_tutor` - Filtrar por tutor
- `id_alumno` - Filtrar por alumno  
- `estado_cita` - Filtrar por estado
- `fecha_desde` - Fecha inicio (ISO string)
- `fecha_hasta` - Fecha fin (ISO string)
- `page` - Número de página (default: 1)
- `limit` - Elementos por página (default: 10)

### GET `/appointments/:id`
Obtener cita por ID.

### PUT `/appointments/:id`
Actualizar cita existente.

**Request Body:**
```json
{
  "estado_cita": "confirmada",
  "fecha_cita": "2024-01-15T11:00:00.000Z",
  "to_do": "Revisar álgebra avanzada",
  "finish_to_do": "Completó ejercicios básicos"
}
```

### DELETE `/appointments/:id`
Eliminar cita (soft delete).

### PUT `/appointments/:id/status`
Cambiar solo el estado de la cita.

**Request Body:**
```json
{
  "estado_cita": "confirmada"
}
```

## 📧 Notificaciones por Email

El servicio envía automáticamente emails en los siguientes eventos:

- **Creación de cita**: Notifica al tutor sobre nueva cita
- **Actualización de cita**: Informa cambios en fecha, estado o tareas
- **Cancelación de cita**: Notifica la cancelación

### Plantillas de Email

Todas las plantillas son responsive y incluyen:
- Información completa de la cita
- Colores temáticos según el tipo de evento
- Formato profesional y fácil de leer

## 🗄️ Base de Datos

### Modelo de Cita
```typescript
{
  _id: string;
  id_tutor: string;
  id_alumno: string;
  estado_cita: 'pendiente' | 'confirmada' | 'cancelada' | 'completada' | 'no_asistio';
  fecha_cita: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  checklist?: { description: string; completed: boolean }[];
  reason?: string | null;
}
```

### Índices
- `id_tutor`
- `id_alumno`
- `fecha_cita`
- `estado_cita`
- `deleted_at`

## 🔐 Autenticación

Todos los endpoints requieren autenticación JWT válida. El token debe incluir:
- `userId`: ID del usuario
- `userType`: 'tutor' | 'alumno'

## 🚀 Casos de Uso Principales

1. **CreateAppointmentUseCase**: Crear nuevas citas con validación de conflictos
2. **UpdateAppointmentUseCase**: Actualizar citas existentes
3. **GetAppointmentsUseCase**: Listar citas con filtros
4. **DeleteAppointmentUseCase**: Eliminación suave de citas

## 🧪 Validaciones

- **Fecha futura**: Las citas solo pueden crearse para fechas futuras
- **Conflictos de horario**: Validación automática de solapamientos
- **Estados válidos**: Solo transiciones de estado permitidas
- **Autenticación**: Verificación de tokens JWT

## 📝 Notas de Integración

- Requiere validación JWT del microservicio de autenticación
- Se integra con Kong API Gateway
- Los emails son opcionales (no fallan el proceso si no se envían)
- Diseñado para alta disponibilidad en AWS # appointment-service
