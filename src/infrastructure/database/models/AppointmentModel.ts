import mongoose, { Schema, Document } from 'mongoose';
import { EstadoCita } from '@shared/types/response.types';
import { ChecklistItem } from '@shared/types/Checklist.type';

export interface IAppointmentDocument extends Document {
  _id: string;
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

const ChecklistItemSchema = new Schema<ChecklistItem>({
  description: { type: String, required: true },
  completed: { type: Boolean, required: true }
});

const AppointmentSchema = new Schema<IAppointmentDocument>({
  _id: {
    type: String,
    required: true
  },
  id_tutor: {
    type: String,
    required: true,
    index: true
  },
  id_alumno: {
    type: String,
    required: true,
    index: true
  },
  estado_cita: {
    type: String,
    enum: ['pendiente', 'confirmada', 'cancelada', 'completada', 'no_asistio'],
    default: 'pendiente',
    index: true
  },
  fecha_cita: {
    type: Date,
    required: true,
    index: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  deleted_at: {
    type: Date,
    default: null,
    index: true
  },
  checklist: {
    type: [ChecklistItemSchema],
    default: []
  },
  reason: {
    type: String,
    default: null
  }
}, {
  collection: 'appointments',
  versionKey: false,
  _id: false // Usamos nuestro propio _id
});

// Índices compuestos para consultas complejas
AppointmentSchema.index({ id_tutor: 1, fecha_cita: 1 });
AppointmentSchema.index({ id_alumno: 1, fecha_cita: 1 });
AppointmentSchema.index({ estado_cita: 1, fecha_cita: 1 });
AppointmentSchema.index({ deleted_at: 1, fecha_cita: 1 });

// Middleware para actualizar updated_at automáticamente
AppointmentSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

AppointmentSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updated_at: new Date() });
  next();
});

export const AppointmentModel = mongoose.model<IAppointmentDocument>('Appointment', AppointmentSchema); 