import { BaseDomainEvent } from './DomainEvent';
import { EstadoCita } from '../value-objects';

export class AppointmentCreatedEvent extends BaseDomainEvent {
  constructor(
    appointmentId: string,
    payload: {
      tutorId: string;
      studentId: string;
      appointmentDate: Date;
      pendingTask?: string;
    }
  ) {
    super('AppointmentCreated', appointmentId, payload);
  }
}

export class AppointmentStatusChangedEvent extends BaseDomainEvent {
  constructor(
    appointmentId: string,
    payload: {
      previousStatus: EstadoCita;
      newStatus: EstadoCita;
      changedAt: Date;
    }
  ) {
    super('AppointmentStatusChanged', appointmentId, payload);
  }
}

export class AppointmentRescheduledEvent extends BaseDomainEvent {
  constructor(
    appointmentId: string,
    payload: {
      previousDate: Date;
      newDate: Date;
      rescheduledAt: Date;
    }
  ) {
    super('AppointmentRescheduled', appointmentId, payload);
  }
}

export class AppointmentCompletedEvent extends BaseDomainEvent {
  constructor(
    appointmentId: string,
    payload: {
      completedAt: Date;
      completedTask?: string;
    }
  ) {
    super('AppointmentCompleted', appointmentId, payload);
  }
}

export class AppointmentDeletedEvent extends BaseDomainEvent {
  constructor(
    appointmentId: string,
    payload: {
      deletedAt: Date;
      reason?: string;
    }
  ) {
    super('AppointmentDeleted', appointmentId, payload);
  }
}

export class TodoTaskUpdatedEvent extends BaseDomainEvent {
  constructor(
    appointmentId: string,
    payload: {
      previousTask?: string;
      newTask?: string;
      taskType: 'pending' | 'completed';
      updatedAt: Date;
    }
  ) {
    super('TodoTaskUpdated', appointmentId, payload);
  }
} 