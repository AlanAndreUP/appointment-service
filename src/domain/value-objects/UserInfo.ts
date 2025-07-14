import { EmailAddress } from './EmailAddress';
import { UserId } from './UserId';

export class UserInfo {
  private readonly _id: UserId;
  private readonly _email: EmailAddress;
  private readonly _name: string;
  private readonly _role: 'tutor' | 'alumno';

  constructor(
    id: UserId,
    email: EmailAddress,
    name: string,
    role: 'tutor' | 'alumno'
  ) {
    this.validate(name, role);
    this._id = id;
    this._email = email;
    this._name = name.trim();
    this._role = role;
  }

  private validate(name: string, role: 'tutor' | 'alumno'): void {
    if (!name || name.trim().length === 0) {
      throw new Error('El nombre del usuario no puede estar vacío');
    }

    if (name.trim().length > 100) {
      throw new Error('El nombre del usuario no puede exceder 100 caracteres');
    }

    if (!['tutor', 'alumno'].includes(role)) {
      throw new Error('El rol del usuario debe ser "tutor" o "alumno"');
    }
  }

  static create(
    id: string,
    email: string,
    name: string,
    role: 'tutor' | 'alumno'
  ): UserInfo {
    return new UserInfo(
      UserId.fromString(id),
      EmailAddress.fromString(email),
      name,
      role
    );
  }

  get id(): UserId {
    return this._id;
  }

  get email(): EmailAddress {
    return this._email;
  }

  get name(): string {
    return this._name;
  }

  get role(): 'tutor' | 'alumno' {
    return this._role;
  }

  isTutor(): boolean {
    return this._role === 'tutor';
  }

  isStudent(): boolean {
    return this._role === 'alumno';
  }

  equals(other: UserInfo): boolean {
    return this._id.equals(other._id);
  }

  toJSON() {
    return {
      id: this._id.value,
      email: this._email.value,
      name: this._name,
      role: this._role
    };
  }
} 