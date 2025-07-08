import { EstadoCita } from '@shared/types/response.types';

export class Appointment {
  constructor(
    public readonly id: string,
    public readonly id_tutor: string,
    public readonly id_alumno: string,
    public readonly estado_cita: EstadoCita,
    public readonly fecha_cita: Date,
    public readonly created_at: Date = new Date(),
    public readonly updated_at: Date = new Date(),
    public readonly deleted_at?: Date,
    public readonly to_do?: string,
    public readonly finish_to_do?: string
  ) {}

  static create(
    id_tutor: string,
    id_alumno: string,
    fecha_cita: Date,
    to_do?: string,
    id?: string
  ): Appointment {
    return new Appointment(
      id || this.generateId(),
      id_tutor,
      id_alumno,
      'pendiente', // Estado inicial
      fecha_cita,
      new Date(),
      new Date(),
      undefined,
      to_do
    );
  }

  static generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  updateStatus(newStatus: EstadoCita): Appointment {
    return new Appointment(
      this.id,
      this.id_tutor,
      this.id_alumno,
      newStatus,
      this.fecha_cita,
      this.created_at,
      new Date(), // updated_at
      this.deleted_at,
      this.to_do,
      this.finish_to_do
    );
  }

  updateTodo(to_do?: string, finish_to_do?: string): Appointment {
    return new Appointment(
      this.id,
      this.id_tutor,
      this.id_alumno,
      this.estado_cita,
      this.fecha_cita,
      this.created_at,
      new Date(), // updated_at
      this.deleted_at,
      to_do ?? this.to_do,
      finish_to_do ?? this.finish_to_do
    );
  }

  reschedule(newDate: Date): Appointment {
    return new Appointment(
      this.id,
      this.id_tutor,
      this.id_alumno,
      'pendiente', // Volver a estado pendiente
      newDate,
      this.created_at,
      new Date(), // updated_at
      this.deleted_at,
      this.to_do,
      this.finish_to_do
    );
  }

  markAsDeleted(): Appointment {
    return new Appointment(
      this.id,
      this.id_tutor,
      this.id_alumno,
      this.estado_cita,
      this.fecha_cita,
      this.created_at,
      new Date(),
      new Date(), // deleted_at
      this.to_do,
      this.finish_to_do
    );
  }

  isDeleted(): boolean {
    return this.deleted_at !== undefined;
  }

  isPending(): boolean {
    return this.estado_cita === 'pendiente';
  }

  isConfirmed(): boolean {
    return this.estado_cita === 'confirmada';
  }

  isCancelled(): boolean {
    return this.estado_cita === 'cancelada';
  }

  isCompleted(): boolean {
    return this.estado_cita === 'completada';
  }

  canBeModified(): boolean {
    return !this.isDeleted() && (this.isPending() || this.isConfirmed());
  }

  toJSON() {
    return {
      id: this.id,
      id_tutor: this.id_tutor,
      id_alumno: this.id_alumno,
      estado_cita: this.estado_cita,
      fecha_cita: this.fecha_cita,
      created_at: this.created_at,
      updated_at: this.updated_at,
      deleted_at: this.deleted_at,
      to_do: this.to_do,
      finish_to_do: this.finish_to_do
    };
  }
} 