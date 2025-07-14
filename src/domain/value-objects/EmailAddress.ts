export class EmailAddress {
  private readonly _value: string;

  constructor(value: string) {
    this.validate(value);
    this._value = value.toLowerCase().trim();
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('La dirección de email no puede estar vacía');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      throw new Error('La dirección de email no tiene un formato válido');
    }

    if (value.trim().length > 254) {
      throw new Error('La dirección de email no puede exceder 254 caracteres');
    }
  }

  static fromString(value: string): EmailAddress {
    return new EmailAddress(value);
  }

  get value(): string {
    return this._value;
  }

  getDomain(): string {
    return this._value.split('@')[1];
  }

  getLocalPart(): string {
    return this._value.split('@')[0];
  }

  isInDomain(domain: string): boolean {
    return this.getDomain().toLowerCase() === domain.toLowerCase();
  }

  equals(other: EmailAddress): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
} 