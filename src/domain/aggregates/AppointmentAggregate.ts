import { 
  AppointmentId, 
  UserId, 
  AppointmentStatus, 
  AppointmentDate, 
  TodoList, 
  TimeStamps,
  EstadoCita 
} from '../value-objects';

export interface AppointmentCreationData {
  tutorId: string;
  studentId: string;
  appointmentDate: Date;
  pendingTask?: string;
  id?: string;
}

export interface AppointmentUpdateData {
  status?: EstadoCita;
  appointmentDate?: Date;
  pendingTask?: string;
  completedTask?: string;
}

export class AppointmentAggregate {
  private constructor(
    private readonly _id: AppointmentId,
    private readonly _tutorId: UserId,
    private readonly _studentId: UserId,
    private readonly _status: AppointmentStatus,
    private readonly _appointmentDate: AppointmentDate,
    private readonly _todoList: TodoList,
    private readonly _timeStamps: TimeStamps
  ) {}

  // Factory methods
  static create(data: AppointmentCreationData): AppointmentAggregate {
    const id = data.id ? AppointmentId.fromString(data.id) : AppointmentId.generate();
    const tutorId = UserId.fromString(data.tutorId);
    const studentId = UserId.fromString(data.studentId);
    const status = AppointmentStatus.pending();
    const appointmentDate = AppointmentDate.fromDate(data.appointmentDate);
    const todoList = TodoList.create(data.pendingTask);
    const timeStamps = TimeStamps.create();

    return new AppointmentAggregate(
      id,
      tutorId,
      studentId,
      status,
      appointmentDate,
      todoList,
      timeStamps
    );
  }

  static fromPersistence(
    id: string,
    tutorId: string,
    studentId: string,
    status: EstadoCita,
    appointmentDate: Date,
    createdAt: Date,
    updatedAt: Date,
    deletedAt?: Date,
    pendingTask?: string,
    completedTask?: string
  ): AppointmentAggregate {
    return new AppointmentAggregate(
      AppointmentId.fromString(id),
      UserId.fromString(tutorId),
      UserId.fromString(studentId),
      AppointmentStatus.fromString(status),
      AppointmentDate.fromDate(appointmentDate),
      TodoList.create(pendingTask, completedTask),
      TimeStamps.fromDates(createdAt, updatedAt, deletedAt)
    );
  }

  // Getters
  get id(): AppointmentId {
    return this._id;
  }

  get tutorId(): UserId {
    return this._tutorId;
  }

  get studentId(): UserId {
    return this._studentId;
  }

  get status(): AppointmentStatus {
    return this._status;
  }

  get appointmentDate(): AppointmentDate {
    return this._appointmentDate;
  }

  get todoList(): TodoList {
    return this._todoList;
  }

  get timeStamps(): TimeStamps {
    return this._timeStamps;
  }

  // Business logic methods
  confirmAppointment(): AppointmentAggregate {
    if (!this._status.canTransitionTo(AppointmentStatus.confirmed())) {
      throw new Error(`No se puede confirmar una cita en estado ${this._status.value}`);
    }

    if (this._timeStamps.isDeleted()) {
      throw new Error('No se puede confirmar una cita eliminada');
    }

    if (this._appointmentDate.isPastDue()) {
      throw new Error('No se puede confirmar una cita que ya ha pasado');
    }

    return this.updateStatus(AppointmentStatus.confirmed());
  }

  cancelAppointment(): AppointmentAggregate {
    if (!this._status.canTransitionTo(AppointmentStatus.cancelled())) {
      throw new Error(`No se puede cancelar una cita en estado ${this._status.value}`);
    }

    if (this._timeStamps.isDeleted()) {
      throw new Error('No se puede cancelar una cita eliminada');
    }

    return this.updateStatus(AppointmentStatus.cancelled());
  }

  completeAppointment(completedTask?: string): AppointmentAggregate {
    if (!this._status.canTransitionTo(AppointmentStatus.completed())) {
      throw new Error(`No se puede completar una cita en estado ${this._status.value}`);
    }

    if (this._timeStamps.isDeleted()) {
      throw new Error('No se puede completar una cita eliminada');
    }

    if (this._appointmentDate.isInFuture()) {
      throw new Error('No se puede completar una cita que aún no ha ocurrido');
    }

    let updatedTodoList = this._todoList;
    if (completedTask) {
      updatedTodoList = this._todoList.markAsCompleted(completedTask);
    }

    return new AppointmentAggregate(
      this._id,
      this._tutorId,
      this._studentId,
      AppointmentStatus.completed(),
      this._appointmentDate,
      updatedTodoList,
      this._timeStamps.markAsUpdated()
    );
  }

  markAsNoShow(): AppointmentAggregate {
    if (!this._status.canTransitionTo(AppointmentStatus.noShow())) {
      throw new Error(`No se puede marcar como no asistida una cita en estado ${this._status.value}`);
    }

    if (this._timeStamps.isDeleted()) {
      throw new Error('No se puede marcar como no asistida una cita eliminada');
    }

    if (this._appointmentDate.isInFuture()) {
      throw new Error('No se puede marcar como no asistida una cita que aún no ha ocurrido');
    }

    return this.updateStatus(AppointmentStatus.noShow());
  }

  reschedule(newDate: Date): AppointmentAggregate {
    if (!this._status.canBeModified()) {
      throw new Error(`No se puede reprogramar una cita en estado ${this._status.value}`);
    }

    if (this._timeStamps.isDeleted()) {
      throw new Error('No se puede reprogramar una cita eliminada');
    }

    if (!this._appointmentDate.canBeRescheduled()) {
      throw new Error('No se puede reprogramar una cita con menos de 2 horas de anticipación');
    }

    const newAppointmentDate = AppointmentDate.fromDate(newDate);
    const newStatus = AppointmentStatus.pending(); // Volver a estado pendiente

    return new AppointmentAggregate(
      this._id,
      this._tutorId,
      this._studentId,
      newStatus,
      newAppointmentDate,
      this._todoList,
      this._timeStamps.markAsUpdated()
    );
  }

  updateTodoList(data: { pendingTask?: string; completedTask?: string }): AppointmentAggregate {
    if (!this._status.canBeModified()) {
      throw new Error(`No se puede actualizar las tareas de una cita en estado ${this._status.value}`);
    }

    if (this._timeStamps.isDeleted()) {
      throw new Error('No se puede actualizar las tareas de una cita eliminada');
    }

    let updatedTodoList = this._todoList;

    if (data.pendingTask !== undefined) {
      updatedTodoList = data.pendingTask 
        ? updatedTodoList.updatePendingTask(data.pendingTask)
        : updatedTodoList.clearPendingTask();
    }

    if (data.completedTask !== undefined) {
      updatedTodoList = data.completedTask 
        ? updatedTodoList.updateCompletedTask(data.completedTask)
        : updatedTodoList.clearCompletedTask();
    }

    return new AppointmentAggregate(
      this._id,
      this._tutorId,
      this._studentId,
      this._status,
      this._appointmentDate,
      updatedTodoList,
      this._timeStamps.markAsUpdated()
    );
  }

  update(data: AppointmentUpdateData): AppointmentAggregate {
    if (!this._status.canBeModified()) {
      throw new Error(`No se puede actualizar una cita en estado ${this._status.value}`);
    }

    if (this._timeStamps.isDeleted()) {
      throw new Error('No se puede actualizar una cita eliminada');
    }

    let updatedAggregate = this;

    // Actualizar estado si se proporciona
    if (data.status && data.status !== this._status.value) {
      const newStatus = AppointmentStatus.fromString(data.status);
      if (!this._status.canTransitionTo(newStatus)) {
        throw new Error(`Transición de estado inválida: ${this._status.value} -> ${data.status}`);
      }
      const statusUpdatedAggregate = updatedAggregate.updateStatus(newStatus);
      updatedAggregate = statusUpdatedAggregate;
    }

         // Actualizar fecha si se proporciona
     if (data.appointmentDate) {
       if (!this._appointmentDate.canBeRescheduled()) {
         throw new Error('No se puede reprogramar una cita con menos de 2 horas de anticipación');
       }
       const rescheduledAggregate = updatedAggregate.reschedule(data.appointmentDate);
       updatedAggregate = rescheduledAggregate;
     }

     // Actualizar tareas si se proporcionan
     if (data.pendingTask !== undefined || data.completedTask !== undefined) {
       const updatedTodoAggregate = updatedAggregate.updateTodoList({
         pendingTask: data.pendingTask,
         completedTask: data.completedTask
       });
       updatedAggregate = updatedTodoAggregate;
     }

    return updatedAggregate;
  }

  delete(): AppointmentAggregate {
    if (this._timeStamps.isDeleted()) {
      throw new Error('La cita ya está eliminada');
    }

    return new AppointmentAggregate(
      this._id,
      this._tutorId,
      this._studentId,
      this._status,
      this._appointmentDate,
      this._todoList,
      this._timeStamps.markAsDeleted()
    );
  }

  private updateStatus(newStatus: AppointmentStatus): AppointmentAggregate {
    return new AppointmentAggregate(
      this._id,
      this._tutorId,
      this._studentId,
      newStatus,
      this._appointmentDate,
      this._todoList,
      this._timeStamps.markAsUpdated()
    );
  }

  // Query methods
  isDeleted(): boolean {
    return this._timeStamps.isDeleted();
  }

  isPending(): boolean {
    return this._status.isPending();
  }

  isConfirmed(): boolean {
    return this._status.isConfirmed();
  }

  isCancelled(): boolean {
    return this._status.isCancelled();
  }

  isCompleted(): boolean {
    return this._status.isCompleted();
  }

  isNoShow(): boolean {
    return this._status.isNoShow();
  }

  canBeModified(): boolean {
    return !this._timeStamps.isDeleted() && this._status.canBeModified();
  }

  canBeRescheduled(): boolean {
    return this.canBeModified() && this._appointmentDate.canBeRescheduled();
  }

  isUpcoming(): boolean {
    return this._appointmentDate.isInFuture() && !this._timeStamps.isDeleted();
  }

  isPastDue(): boolean {
    return this._appointmentDate.isPastDue();
  }

  // Serialization
  toJSON() {
    return {
      id: this._id.value,
      id_tutor: this._tutorId.value,
      id_alumno: this._studentId.value,
      estado_cita: this._status.value,
      fecha_cita: this._appointmentDate.value,
      ...this._todoList.toJSON(),
      ...this._timeStamps.toJSON()
    };
  }

  // Persistence conversion
  toPersistence() {
    return {
      _id: this._id.value,
      id_tutor: this._tutorId.value,
      id_alumno: this._studentId.value,
      estado_cita: this._status.value,
      fecha_cita: this._appointmentDate.value,
      to_do: this._todoList.pendingTask?.value,
      finish_to_do: this._todoList.completedTask?.value,
      created_at: this._timeStamps.createdAt,
      updated_at: this._timeStamps.updatedAt,
      deleted_at: this._timeStamps.deletedAt
    };
  }

  // Equality
  equals(other: AppointmentAggregate): boolean {
    return this._id.equals(other._id);
  }
} 