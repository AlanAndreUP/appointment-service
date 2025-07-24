import { ChecklistItem } from "./Checklist.type";

export interface ApiResponse<T = any> {
  data: T;
  message: string;
  status: 'success' | 'error';
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ErrorResponse {
  data: null;
  message: string;
  status: 'error';
  error?: {
    code: string;
    details?: any;
  };
}

export type EstadoCita = 'pendiente' | 'confirmada' | 'cancelada' | 'completada' | 'no_asistio';

export interface CreateAppointmentRequest {
  id_tutor: string;
  id_alumno: string;
  fecha_cita: string; // ISO string
  checklist?: ChecklistItem[];
  reason?: string | null;
}

export interface UpdateAppointmentRequest {
  estado_cita?: EstadoCita;
  fecha_cita?: string;
  checklist?: ChecklistItem[];
  reason?: string | null;
}

export interface AppointmentResponse {
  id: string;
  id_tutor: string;
  id_alumno: string;
  estado_cita: EstadoCita;
  fecha_cita: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  checklist?: ChecklistItem[];
  reason?: string | null;
}

export interface AppointmentFilters {
  id_tutor?: string;
  id_alumno?: string;
  estado_cita?: EstadoCita;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  limit?: number;
}