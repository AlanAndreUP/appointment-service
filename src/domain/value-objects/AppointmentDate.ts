export class AppointmentDate {
  private readonly _value: Date;

  constructor(value: Date) {
    this.validate(value);
    this._value = new Date(value);
  }

  private validate(value: Date): void {
    if (!value || isNaN(value.getTime())) {
      throw new Error('La fecha de la cita no es válida');
    }

    const now = new Date();
    const minDate = new Date(now.getTime() + (30 * 60 * 1000)); // 30 minutos desde ahora
    
    if (value < minDate) {
      throw new Error('La fecha de la cita debe ser al menos 30 minutos en el futuro');
    }

    const maxDate = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 año desde ahora
    
    if (value > maxDate) {
      throw new Error('La fecha de la cita no puede ser más de un año en el futuro');
    }

    // Validar que sea en horario laboral (8:00 AM - 8:00 PM)
    const hours = value.getHours();
    if (hours < 8 || hours >= 20) {
      throw new Error('La cita debe ser programada entre las 8:00 AM y 8:00 PM');
    }

    // Validar que no sea domingo
    if (value.getDay() === 0) {
      throw new Error('No se pueden programar citas los domingos');
    }
  }

  static fromDate(value: Date): AppointmentDate {
    return new AppointmentDate(value);
  }

  static fromString(value: string): AppointmentDate {
    return new AppointmentDate(new Date(value));
  }

  get value(): Date {
    return new Date(this._value);
  }

  isInPast(): boolean {
    return this._value < new Date();
  }

  isInFuture(): boolean {
    return this._value > new Date();
  }

  isToday(): boolean {
    const today = new Date();
    return this._value.toDateString() === today.toDateString();
  }

  isPastDue(): boolean {
    const now = new Date();
    return this._value < now;
  }

  getDaysUntilAppointment(): number {
    const now = new Date();
    const diffTime = this._value.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getHoursUntilAppointment(): number {
    const now = new Date();
    const diffTime = this._value.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60));
  }

  canBeRescheduled(): boolean {
    const hoursUntilAppointment = this.getHoursUntilAppointment();
    return hoursUntilAppointment > 2; // Debe tener al menos 2 horas de anticipación
  }

  equals(other: AppointmentDate): boolean {
    return this._value.getTime() === other._value.getTime();
  }

  toString(): string {
    return this._value.toISOString();
  }

  toLocaleString(): string {
    return this._value.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
} 