export class AppointmentId {
  private readonly _value: string;

  constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('El ID de la cita no puede estar vacío');
    }
    
    if (value.length < 5) {
      throw new Error('El ID de la cita debe tener al menos 5 caracteres');
    }
  }

  static generate(): AppointmentId {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2);
    return new AppointmentId(`${randomPart}${timestamp}`);
  }

  static fromString(value: string): AppointmentId {
    return new AppointmentId(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: AppointmentId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
} 