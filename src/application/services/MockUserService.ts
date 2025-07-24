import { ExternalUserService } from './ExternalUserService';
import { UserInfo } from '@domain/value-objects/UserInfo';
import { UserId } from '@domain/value-objects/UserId';

export class MockUserService extends ExternalUserService {
  private users: Map<string, UserInfo> = new Map();

  constructor() {
    super();
    this.initializeDefaultUsers();
  }

  private initializeDefaultUsers(): void {
    // Usuarios de ejemplo para desarrollo
    const tutors = [
      { id: 'tutor123', email: 'tutor123@universidad.edu.mx', name: 'Dr. Juan Pérez', role: 'tutor' as const },
      { id: 'tutor456', email: 'maria.garcia@universidad.edu.mx', name: 'Dra. María García', role: 'tutor' as const },
      { id: 'tutor789', email: 'carlos.lopez@universidad.edu.mx', name: 'Dr. Carlos López', role: 'tutor' as const }
    ];

    const students = [
      { id: 'student456', email: 'alumno456@estudiante.edu.mx', name: 'Ana Martínez', role: 'alumno' as const },
      { id: 'student789', email: 'luis.rodriguez@estudiante.edu.mx', name: 'Luis Rodríguez', role: 'alumno' as const },
      { id: 'student123', email: 'sofia.hernandez@estudiante.edu.mx', name: 'Sofía Hernández', role: 'alumno' as const }
    ];

    [...tutors, ...students].forEach(user => {
      const userInfo = UserInfo.create(user.id, user.email, user.name, user.role);
      this.users.set(user.id, userInfo);
    });
  }

  async getUserById(userId: UserId): Promise<UserInfo> {
    const user = this.users.get(userId.value);
    if (!user) {
      throw new Error(`Usuario no encontrado: ${userId.value}`);
    }
    return user;
  }

  async getUsersByIds(userIds: UserId[]): Promise<UserInfo[]> {
    const users: UserInfo[] = [];
    for (const userId of userIds) {
      try {
        const user = await this.getUserById(userId);
        users.push(user);
      } catch (error) {
        console.warn(`Usuario no encontrado: ${userId.value}`);
      }
    }
    return users;
  }

  async getTutorById(tutorId: UserId): Promise<UserInfo> {
    const user = await this.getUserById(tutorId);
    if (!user.isTutor()) {
      throw new Error(`El usuario ${tutorId.value} no es un tutor`);
    }
    return user;
  }

  async getStudentById(studentId: UserId): Promise<UserInfo> {
    const user = await this.getUserById(studentId);
    if (!user.isStudent()) {
      throw new Error(`El usuario ${studentId.value} no es un alumno`);
    }
    return user;
  }

  // Métodos adicionales para testing
  addUser(user: UserInfo): void {
    this.users.set(user.id.value, user);
  }

  removeUser(userId: UserId): void {
    this.users.delete(userId.value);
  }

  getAllUsers(): UserInfo[] {
    return Array.from(this.users.values());
  }

  clear(): void {
    this.users.clear();
    this.initializeDefaultUsers();
  }
} 