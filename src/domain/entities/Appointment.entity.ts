import { EstadoCita } from '@shared/types/response.types';
import { ChecklistItem } from '@shared/types/Checklist.type';

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
    public readonly checklist: ChecklistItem[] = [],
    public readonly reason: string | null = null
  ) {}

  static create(
    id_tutor: string,
    id_alumno: string,
    fecha_cita: Date,
    checklist?: ChecklistItem[],
    reason?: string | null,
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
      checklist ?? [],
      reason ?? null
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
      this.checklist,
      this.reason
    );
  }

  updateChecklist(checklist: ChecklistItem[]): Appointment {
    return new Appointment(
      this.id,
      this.id_tutor,
      this.id_alumno,
      this.estado_cita,
      this.fecha_cita,
      this.created_at,
      new Date(), // updated_at
      this.deleted_at,
      checklist,
      this.reason
    );
  }

  updateReason(reason: string | null): Appointment {
    return new Appointment(
      this.id,
      this.id_tutor,
      this.id_alumno,
      this.estado_cita,
      this.fecha_cita,
      this.created_at,
      new Date(), // updated_at
      this.deleted_at,
      this.checklist,
      reason
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
      this.checklist,
      this.reason
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
      this.checklist,
      this.reason
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
      checklist: this.checklist,
      reason: this.reason
    };
  }
} 