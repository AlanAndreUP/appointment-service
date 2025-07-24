import {
  AppointmentAggregate,
  AppointmentId,
  UserId,
  AppointmentStatus,
  AppointmentDate,
  TodoList,
  TimeStamps
} from '../src/domain';

// Ejemplo de creación de una cita usando el agregado
function createAppointmentExample() {
  console.log('=== Creando una nueva cita ===');
  
  try {
    // Crear una nueva cita
    const appointment = AppointmentAggregate.create({
      tutorId: 'tutor123',
      studentId: 'student456',
      appointmentDate: new Date('2024-12-25T10:00:00Z'),
      todoList: TodoList.create('Revisar ejercicios de matemáticas')
    });

    console.log('Cita creada:', appointment.toJSON());
    
    // Confirmar la cita
    const confirmedAppointment = appointment.confirmAppointment();
    console.log('Cita confirmada:', confirmedAppointment.status.value);
    
    // Reagendar la cita
    const rescheduledAppointment = confirmedAppointment.reschedule(
      new Date('2024-12-26T14:00:00Z')
    );
    console.log('Cita reagendada:', rescheduledAppointment.appointmentDate.toLocaleString());
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Ejemplo de uso de value objects individuales
function valueObjectsExample() {
  console.log('\n=== Usando Value Objects ===');
  
  try {
    // Crear IDs
    const appointmentId = AppointmentId.generate();
    const tutorId = UserId.fromString('tutor123');
    const studentId = UserId.fromString('student456');
    
    console.log('IDs creados:', {
      appointment: appointmentId.value,
      tutor: tutorId.value,
      student: studentId.value
    });
    
    // Crear fecha de cita
    const appointmentDate = AppointmentDate.fromString('2024-12-25T10:00:00Z');
    console.log('Fecha de cita:', appointmentDate.toLocaleString());
    console.log('Días hasta la cita:', appointmentDate.getDaysUntilAppointment());
    
    // Crear estado
    const status = AppointmentStatus.pending();
    console.log('Estado inicial:', status.value);
    
    // Verificar transiciones válidas
    const confirmedStatus = AppointmentStatus.confirmed();
    console.log('¿Puede cambiar a confirmada?', status.canTransitionTo(confirmedStatus));
    
    // Crear lista de tareas
    const todoList = TodoList.create(
      'Preparar ejercicios de álgebra',
      'Completar tarea de geometría'
    );
    console.log('Lista de tareas:', todoList.toJSON());
    
    // Crear timestamps
    const timeStamps = TimeStamps.create();
    console.log('Timestamps:', timeStamps.toJSON());
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Ejemplo de validaciones de negocio
function businessValidationExample() {
  console.log('\n=== Validaciones de Negocio ===');
  
  try {
    // Intentar crear una cita en el pasado (debería fallar)
    const pastDate = new Date('2023-01-01T10:00:00Z');
    AppointmentAggregate.create({
      tutorId: 'tutor123',
      studentId: 'student456',
      appointmentDate: pastDate
    });
    
  } catch (error) {
    console.log('Error esperado (fecha en el pasado):', error.message);
  }
  
  try {
    // Intentar crear una cita en domingo (debería fallar)
    const sundayDate = new Date('2024-12-29T10:00:00Z'); // Domingo
    AppointmentAggregate.create({
      tutorId: 'tutor123',
      studentId: 'student456',
      appointmentDate: sundayDate
    });
    
  } catch (error) {
    console.log('Error esperado (domingo):', error.message);
  }
  
  try {
    // Intentar crear una cita fuera de horario laboral (debería fallar)
    const lateDate = new Date('2024-12-25T22:00:00Z'); // 10 PM
    AppointmentAggregate.create({
      tutorId: 'tutor123',
      studentId: 'student456',
      appointmentDate: lateDate
    });
    
  } catch (error) {
    console.log('Error esperado (fuera de horario):', error.message);
  }
}

// Ejemplo de flujo completo de una cita
function completeAppointmentFlowExample() {
  console.log('\n=== Flujo Completo de Cita ===');
  
  try {
    // 1. Crear cita
    let appointment = AppointmentAggregate.create({
      tutorId: 'tutor123',
      studentId: 'student456',
      appointmentDate: new Date('2024-12-25T10:00:00Z'),
      todoList: TodoList.create('Revisar tarea de matemáticas')
    });
    
    console.log('1. Cita creada:', appointment.status.value);
    
    // 2. Confirmar cita
    appointment = appointment.confirmAppointment();
    console.log('2. Cita confirmada:', appointment.status.value);
    
    // 3. Actualizar tarea
    appointment = appointment.update({
      todoList: TodoList.create('Revisar tarea de matemáticas y resolver dudas')
    });
    console.log('3. Tarea actualizada:', appointment.todoList.pendingTask?.value);
    
    // 4. Simular que la cita ya ocurrió (para poder completarla)
    // En un escenario real, esto sería manejado por el tiempo del sistema
    const pastAppointment = AppointmentAggregate.fromPersistence(
      appointment.id.value,
      appointment.tutorId.value,
      appointment.studentId.value,
      'confirmada',
      new Date('2024-12-20T10:00:00Z'), // Fecha en el pasado
      appointment.timeStamps.createdAt,
      appointment.timeStamps.updatedAt,
      undefined,
      appointment.todoList
    );
    
    // 5. Completar cita
    const completedAppointment = pastAppointment.update({
      todoList: TodoList.create('Dudas resueltas exitosamente')
    });
    console.log('4. Cita completada:', completedAppointment.status.value);
    console.log('   Tarea completada:', completedAppointment.todoList.completedTask?.value);
    
    // 6. Mostrar estado final
    console.log('5. Estado final:', completedAppointment.toJSON());
    
  } catch (error) {
    console.error('Error en flujo completo:', error.message);
  }
}

// Ejecutar todos los ejemplos
if (require.main === module) {
  createAppointmentExample();
  valueObjectsExample();
  businessValidationExample();
  completeAppointmentFlowExample();
} 