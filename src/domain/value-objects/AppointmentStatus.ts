export type EstadoCita = 'pendiente' | 'confirmada' | 'cancelada' | 'completada' | 'no_asistio';

export class AppointmentStatus {
  private readonly _value: EstadoCita;

  constructor(value: EstadoCita) {
    this.validate(value);
    this._value = value;
  }

  private validate(value: EstadoCita): void {
    const validStatuses: EstadoCita[] = ['pendiente', 'confirmada', 'cancelada', 'completada', 'no_asistio'];
    
    if (!validStatuses.includes(value)) {
      throw new Error(`Estado de cita inválido: ${value}. Estados válidos: ${validStatuses.join(', ')}`);
    }
  }

  static pending(): AppointmentStatus {
    return new AppointmentStatus('pendiente');
  }

  static confirmed(): AppointmentStatus {
    return new AppointmentStatus('confirmada');
  }

  static cancelled(): AppointmentStatus {
    return new AppointmentStatus('cancelada');
  }

  static completed(): AppointmentStatus {
    return new AppointmentStatus('completada');
  }

  static noShow(): AppointmentStatus {
    return new AppointmentStatus('no_asistio');
  }

  static fromString(value: string): AppointmentStatus {
    return new AppointmentStatus(value as EstadoCita);
  }

  get value(): EstadoCita {
    return this._value;
  }

  isPending(): boolean {
    return this._value === 'pendiente';
  }

  isConfirmed(): boolean {
    return this._value === 'confirmada';
  }

  isCancelled(): boolean {
    return this._value === 'cancelada';
  }

  isCompleted(): boolean {
    return this._value === 'completada';
  }

  isNoShow(): boolean {
    return this._value === 'no_asistio';
  }

  canTransitionTo(newStatus: AppointmentStatus): boolean {
    const currentStatus = this._value;
    const targetStatus = newStatus._value;

    // Definir las transiciones válidas
    const validTransitions: Record<EstadoCita, EstadoCita[]> = {
      'pendiente': ['confirmada', 'cancelada'],
      'confirmada': ['completada', 'cancelada', 'no_asistio'],
      'cancelada': ['pendiente'], // Puede ser reprogramada
      'completada': [], // Estado final
      'no_asistio': ['pendiente'] // Puede ser reprogramada
    };

    return validTransitions[currentStatus].includes(targetStatus);
  }

  canBeModified(): boolean {
    return this.isPending() || this.isConfirmed();
  }

  equals(other: AppointmentStatus): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
} 