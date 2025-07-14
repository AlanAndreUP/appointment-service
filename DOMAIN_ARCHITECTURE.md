# Arquitectura del Dominio - Microservicio de Citas

## Implementación de Domain-Driven Design (DDD)

Este microservicio ha sido refactorizado para implementar patrones de Domain-Driven Design (DDD), incluyendo **Value Objects**, **Aggregates** y **Domain Events**.

## 🏗️ Estructura del Dominio

```
src/domain/
├── value-objects/          # Value Objects - Conceptos sin identidad
│   ├── AppointmentId.ts    # ID único de cita
│   ├── UserId.ts          # ID de usuario (tutor/alumno)
│   ├── AppointmentStatus.ts # Estado de la cita con transiciones
│   ├── AppointmentDate.ts  # Fecha con validaciones de negocio
│   ├── TodoTask.ts        # Tareas pendientes y completadas
│   ├── TimeStamps.ts      # Timestamps del sistema
│   └── index.ts           # Exportaciones
├── aggregates/            # Aggregates - Raíces de agregado
│   ├── AppointmentAggregate.ts # Agregado principal de citas
│   └── index.ts           # Exportaciones
├── events/               # Domain Events - Eventos del dominio
│   ├── DomainEvent.ts    # Interfaz base para eventos
│   ├── AppointmentEvents.ts # Eventos específicos de citas
│   └── index.ts          # Exportaciones
├── entities/             # Entities (legacy - mantener compatibilidad)
├── repositories/         # Interfaces de repositorio
└── index.ts             # Exportaciones generales
```

## 📦 Value Objects

Los Value Objects son objetos que representan conceptos del dominio sin identidad propia. Son inmutables y se comparan por valor.

### 🆔 AppointmentId
```typescript
const appointmentId = AppointmentId.generate();
const fromString = AppointmentId.fromString('abc123');
```
- Generación automática de IDs únicos
- Validaciones de formato y longitud
- Inmutabilidad garantizada

### 👤 UserId
```typescript
const tutorId = UserId.fromString('tutor123');
const studentId = UserId.fromString('student456');
```
- Representación tipada de IDs de usuario
- Validaciones de formato
- Métodos de comparación

### 📅 AppointmentDate
```typescript
const appointmentDate = AppointmentDate.fromString('2024-12-25T10:00:00Z');
console.log(appointmentDate.getDaysUntilAppointment()); // 5
console.log(appointmentDate.canBeRescheduled()); // true/false
```
- **Validaciones de negocio integradas:**
  - Fecha mínima: 30 minutos en el futuro
  - Fecha máxima: 1 año en el futuro
  - Horario laboral: 8:00 AM - 8:00 PM
  - No se permiten domingos
- Métodos de consulta útiles
- Formateo localizado

### 🎯 AppointmentStatus
```typescript
const status = AppointmentStatus.pending();
const confirmed = AppointmentStatus.confirmed();
console.log(status.canTransitionTo(confirmed)); // true
```
- **Estados válidos:** `pendiente`, `confirmada`, `cancelada`, `completada`, `no_asistio`
- **Transiciones controladas:**
  - `pendiente` → `confirmada`, `cancelada`
  - `confirmada` → `completada`, `cancelada`, `no_asistio`
  - `cancelada` → `pendiente` (reprogramación)
  - `no_asistio` → `pendiente` (reprogramación)
- Métodos de consulta del estado

### 📋 TodoTask & TodoList
```typescript
const todoList = TodoList.create(
  'Preparar ejercicios de álgebra',
  'Completar tarea de geometría'
);
const updated = todoList.updatePendingTask('Nueva tarea');
```
- Manejo de tareas pendientes y completadas
- Validaciones de longitud y formato
- Métodos de actualización inmutables

### ⏰ TimeStamps
```typescript
const timeStamps = TimeStamps.create();
const updated = timeStamps.markAsUpdated();
const deleted = timeStamps.markAsDeleted();
```
- Manejo de `created_at`, `updated_at`, `deleted_at`
- Validaciones de consistencia temporal
- Métodos de consulta de tiempo

## 🧩 Aggregates

Los Aggregates son las raíces de agregado que encapsulan la lógica de negocio y mantienen la consistencia.

### 🎯 AppointmentAggregate

```typescript
// Crear nueva cita
const appointment = AppointmentAggregate.create({
  tutorId: 'tutor123',
  studentId: 'student456',
  appointmentDate: new Date('2024-12-25T10:00:00Z'),
  pendingTask: 'Revisar ejercicios de matemáticas'
});

// Confirmar cita
const confirmed = appointment.confirmAppointment();

// Reagendar
const rescheduled = confirmed.reschedule(new Date('2024-12-26T14:00:00Z'));

// Completar
const completed = confirmed.completeAppointment('Dudas resueltas exitosamente');
```

#### 🔧 Métodos principales:
- `create()` - Factory method para crear citas
- `fromPersistence()` - Reconstruir desde datos persistidos
- `confirmAppointment()` - Confirmar cita
- `cancelAppointment()` - Cancelar cita
- `completeAppointment()` - Completar cita
- `markAsNoShow()` - Marcar como no asistida
- `reschedule()` - Reagendar cita
- `updateTodoList()` - Actualizar tareas
- `delete()` - Eliminar cita (soft delete)

#### 🔍 Métodos de consulta:
- `isDeleted()`, `isPending()`, `isConfirmed()`, etc.
- `canBeModified()`, `canBeRescheduled()`
- `isUpcoming()`, `isPastDue()`

## 🎪 Domain Events

Los Domain Events representan cosas importantes que han ocurrido en el dominio.

### 📢 Eventos disponibles:
- `AppointmentCreatedEvent` - Cita creada
- `AppointmentStatusChangedEvent` - Estado cambiado
- `AppointmentRescheduledEvent` - Cita reagendada
- `AppointmentCompletedEvent` - Cita completada
- `AppointmentDeletedEvent` - Cita eliminada
- `TodoTaskUpdatedEvent` - Tarea actualizada

```typescript
const event = new AppointmentCreatedEvent(appointmentId, {
  tutorId: 'tutor123',
  studentId: 'student456',
  appointmentDate: new Date(),
  pendingTask: 'Revisar tarea'
});
```

## 💡 Validaciones de Negocio

### ✅ Validaciones automáticas:
- **Fechas:** No en el pasado, horario laboral, no domingos
- **Estados:** Transiciones válidas entre estados
- **Reagendación:** Mínimo 2 horas de anticipación
- **Modificaciones:** Solo citas pendientes/confirmadas
- **Eliminación:** Soft delete con validaciones

### 🚫 Operaciones bloqueadas:
- Confirmar citas pasadas
- Completar citas futuras
- Modificar citas eliminadas
- Transiciones de estado inválidas

## 🔄 Migración y Compatibilidad

### 📋 Entidad legacy mantenida:
- `Appointment.entity.ts` se mantiene para compatibilidad
- Los use cases pueden migrar gradualmente
- Los controllers pueden usar cualquier implementación

### 🔄 Migración gradual:
1. **Fase 1:** Implementar nuevos componentes (✅ Completado)
2. **Fase 2:** Migrar use cases uno por uno
3. **Fase 3:** Migrar controllers y repositories
4. **Fase 4:** Remover código legacy

## 🛠️ Ejemplo de Uso

Ver el archivo `examples/domain-usage.ts` para ejemplos completos de:
- Creación de citas
- Uso de value objects
- Validaciones de negocio
- Flujo completo de una cita

```bash
# Ejecutar ejemplos
npx ts-node examples/domain-usage.ts
```

## 📈 Beneficios de la Implementación

### 🎯 **Dominio Rico**
- Lógica de negocio encapsulada en el dominio
- Validaciones automáticas y consistentes
- Operaciones autoexplicativas

### 🔒 **Inmutabilidad**
- Value objects inmutables
- Aggregates que devuelven nuevas instancias
- Consistencia garantizada

### 🧪 **Testabilidad**
- Componentes aislados y focalizados
- Lógica de negocio fácil de probar
- Mocks simples para interfaces

### 🔧 **Mantenibilidad**
- Separación clara de responsabilidades
- Código autodocumentado
- Fácil extensión y modificación

### 🔄 **Flexibilidad**
- Fácil agregar nuevas validaciones
- Nuevos estados y transiciones
- Eventos para integraciones

## 🎓 Patrones Implementados

- ✅ **Value Objects** - Objetos sin identidad
- ✅ **Aggregates** - Raíces de agregado
- ✅ **Domain Events** - Eventos del dominio
- ✅ **Factory Methods** - Creación controlada
- ✅ **Specification Pattern** - Validaciones de negocio
- ✅ **Immutability** - Objetos inmutables
- ✅ **Rich Domain Model** - Dominio rico en lógica

## 📚 Próximos Pasos

1. **Migrar Use Cases** - Actualizar para usar aggregates
2. **Implementar Event Sourcing** - Persistir eventos
3. **Agregar Specifications** - Consultas complejas
4. **Implementar CQRS** - Separar comandos y consultas
5. **Agregar Domain Services** - Lógica que cruza agregados 