import { 
  AppointmentId, 
  UserId, 
  AppointmentStatus, 
  AppointmentDate, 
  TodoList, 
  TimeStamps,
  EstadoCita 
} from '../value-objects';
import { ChecklistItem } from '@shared/types/Checklist.type';

export interface AppointmentCreationData {
  tutorId: string;
  studentId: string;
  appointmentDate: Date;
  checklist?: ChecklistItem[];
  reason?: string | null;
  id?: string;
  todoList?: TodoList;
}

export interface AppointmentUpdateData {
  status?: EstadoCita;
  appointmentDate?: Date;
  checklist?: ChecklistItem[];
  reason?: string | null;
  todoList?: TodoList;
}

export class AppointmentAggregate {
  private constructor(
    private readonly _id: AppointmentId,
    private readonly _tutorId: UserId,
    private readonly _studentId: UserId,
    private readonly _status: AppointmentStatus,
    private readonly _appointmentDate: AppointmentDate,
    private readonly _timeStamps: TimeStamps,
    private readonly _todoList: TodoList,
    private readonly _checklist: ChecklistItem[] = [],
    private readonly _reason: string | null = null
  ) {}

  // Factory methods
  static create(data: AppointmentCreationData): AppointmentAggregate {
    const id = data.id ? AppointmentId.fromString(data.id) : AppointmentId.generate();
    const tutorId = UserId.fromString(data.tutorId);
    const studentId = UserId.fromString(data.studentId);
    const status = AppointmentStatus.pending();
    const appointmentDate = AppointmentDate.fromDate(data.appointmentDate);
    const timeStamps = TimeStamps.create();
    return new AppointmentAggregate(
      id,
      tutorId,
      studentId,
      status,
      appointmentDate,
      timeStamps,
      data.todoList ?? TodoList.empty(),
      data.checklist ?? [],
      data.reason ?? null
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
    todoList?: TodoList,
    checklist?: ChecklistItem[],
    reason?: string | null
  ): AppointmentAggregate {
    return new AppointmentAggregate(
      AppointmentId.fromString(id),
      UserId.fromString(tutorId),
      UserId.fromString(studentId),
      AppointmentStatus.fromString(status),
      AppointmentDate.fromDate(appointmentDate),
      TimeStamps.fromDates(createdAt, updatedAt, deletedAt),
      todoList ?? TodoList.empty(),
      checklist ?? [],
      reason ?? null
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

  get checklist(): ChecklistItem[] {
    return this._checklist;
  }

  get reason(): string | null {
    return this._reason;
  }

  get timeStamps(): TimeStamps {
    return this._timeStamps;
  }

  // Business logic methods
  confirmAppointment(): this {
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

  cancelAppointment(): this {
    if (!this._status.canTransitionTo(AppointmentStatus.cancelled())) {
      throw new Error(`No se puede cancelar una cita en estado ${this._status.value}`);
    }

    if (this._timeStamps.isDeleted()) {
      throw new Error('No se puede cancelar una cita eliminada');
    }

    return this.updateStatus(AppointmentStatus.cancelled());
  }

  markAsNoShow(): this {
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

  reschedule(newDate: Date): this {
    if (!this._status.canBeModified()) {
      throw new Error(`No se puede reprogramar una cita en estado ${this._status.value}`);
    }

    if (this._timeStamps.isDeleted()) {
      throw new Error('No se puede reprogramar una cita eliminada');
    }

    if (!this._appointmentDate.canBeRescheduled()) {
      throw new Error('No se puede reprogramar una cita con menos de 2 horas de anticipación');
    }

    const newStatus = AppointmentStatus.pending(); // Volver a estado pendiente
    const newAppointmentDate = AppointmentDate.fromDate(newDate);

    return new AppointmentAggregate(
      this._id,
      this._tutorId,
      this._studentId,
      newStatus,
      newAppointmentDate,
      this._timeStamps.markAsUpdated(),
      this._todoList,
      this._checklist,
      this._reason
    ) as this;
  }

  updateChecklist(checklist: ChecklistItem[]): this {
    if (!this._status.canBeModified()) {
      throw new Error(`No se puede actualizar el checklist de una cita en estado ${this._status.value}`);
    }
    if (this._timeStamps.isDeleted()) {
      throw new Error('No se puede actualizar el checklist de una cita eliminada');
    }
    return new AppointmentAggregate(
      this._id,
      this._tutorId,
      this._studentId,
      this._status,
      this._appointmentDate,
      this._timeStamps.markAsUpdated(),
      this._todoList,
      checklist,
      this._reason
    ) as this;
  }

  updateReason(reason: string | null): this {
    if (!this._status.canBeModified()) {
      throw new Error(`No se puede actualizar el motivo de una cita en estado ${this._status.value}`);
    }
    if (this._timeStamps.isDeleted()) {
      throw new Error('No se puede actualizar el motivo de una cita eliminada');
    }
    return new AppointmentAggregate(
      this._id,
      this._tutorId,
      this._studentId,
      this._status,
      this._appointmentDate,
      this._timeStamps.markAsUpdated(),
      this._todoList,
      this._checklist,
      reason
    ) as this;
  }

  update(data: AppointmentUpdateData): this {
    if (!this._status.canBeModified()) {
      throw new Error(`No se puede actualizar una cita en estado ${this._status.value}`);
    }
    if (this._timeStamps.isDeleted()) {
      throw new Error('No se puede actualizar una cita eliminada');
    }
    let updatedAggregate: this = this;
    // Actualizar estado si se proporciona
    if (data.status && data.status !== this._status.value) {
      const newStatus = AppointmentStatus.fromString(data.status);
      if (!this._status.canTransitionTo(newStatus)) {
        throw new Error(`Transición de estado inválida: ${this._status.value} -> ${data.status}`);
      }
      updatedAggregate = updatedAggregate.updateStatus(newStatus);
    }
    // Actualizar fecha si se proporciona
    if (data.appointmentDate) {
      if (!this._appointmentDate.canBeRescheduled()) {
        throw new Error('No se puede reprogramar una cita con menos de 2 horas de anticipación');
      }
      updatedAggregate = updatedAggregate.reschedule(data.appointmentDate);
    }
    // Actualizar checklist si se proporciona
    if (data.checklist !== undefined) {
      updatedAggregate = updatedAggregate.updateChecklist(data.checklist);
    }
    // Actualizar reason si se proporciona
    if (data.reason !== undefined) {
      updatedAggregate = updatedAggregate.updateReason(data.reason);
    }
    return updatedAggregate;
  }

  delete(): this {
    if (this._timeStamps.isDeleted()) {
      throw new Error('La cita ya está eliminada');
    }

    return new AppointmentAggregate(
      this._id,
      this._tutorId,
      this._studentId,
      this._status,
      this._appointmentDate,
      this._timeStamps.markAsDeleted(),
      this._todoList,
      this._checklist,
      this._reason
    ) as this;
  }

  private updateStatus(newStatus: AppointmentStatus): this {
    return new AppointmentAggregate(
      this._id,
      this._tutorId,
      this._studentId,
      newStatus,
      this._appointmentDate,
      this._timeStamps.markAsUpdated(),
      this._todoList,
      this._checklist,
      this._reason
    ) as this;
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
      todoList: this._todoList.toJSON(),
      checklist: this._checklist,
      reason: this._reason,
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
      todoList: this._todoList.toJSON(),
      checklist: this._checklist,
      reason: this._reason,
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