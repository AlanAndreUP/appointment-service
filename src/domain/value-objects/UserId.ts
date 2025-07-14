export class UserId {
  private readonly _value: string;

  constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('El ID del usuario no puede estar vacío');
    }
    
    if (value.length < 3) {
      throw new Error('El ID del usuario debe tener al menos 3 caracteres');
    }
  }

  static fromString(value: string): UserId {
    return new UserId(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: UserId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
} 