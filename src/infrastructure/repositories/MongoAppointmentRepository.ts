import { AppointmentRepository } from '@domain/repositories/AppointmentRepository.interface';
import { Appointment } from '@domain/entities/Appointment.entity';
import { AppointmentFilters, PaginationMeta } from '@shared/types/response.types';
import { AppointmentModel, IAppointmentDocument } from '@infrastructure/database/models/AppointmentModel';

export class MongoAppointmentRepository implements AppointmentRepository {
  
  async save(appointment: Appointment): Promise<Appointment> {
    const appointmentDoc = new AppointmentModel({
      _id: appointment.id,
      id_tutor: appointment.id_tutor,
      id_alumno: appointment.id_alumno,
      estado_cita: appointment.estado_cita,
      fecha_cita: appointment.fecha_cita,
      created_at: appointment.created_at,
      updated_at: appointment.updated_at,
      deleted_at: appointment.deleted_at,
      checklist: appointment.checklist,
      reason: appointment.reason
    });

    const savedDoc = await appointmentDoc.save();
    return this.mapToEntity(savedDoc);
  }

  async findById(id: string): Promise<Appointment | null> {
    const doc = await AppointmentModel.findOne({ 
      _id: id, 
      deleted_at: null 
    });
    
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByFilters(filters: AppointmentFilters): Promise<{
    appointments: Appointment[];
    pagination: PaginationMeta;
  }> {
    const { page = 1, limit = 10, ...queryFilters } = filters;
    const skip = (page - 1) * limit;

    // Construir query
    const query: any = { deleted_at: null };

    if (queryFilters.id_tutor) {
      query.id_tutor = queryFilters.id_tutor;
    }

    if (queryFilters.id_alumno) {
      query.id_alumno = queryFilters.id_alumno;
    }

    if (queryFilters.estado_cita) {
      query.estado_cita = queryFilters.estado_cita;
    }

    if (queryFilters.fecha_desde || queryFilters.fecha_hasta) {
      query.fecha_cita = {};
      if (queryFilters.fecha_desde) {
        query.fecha_cita.$gte = new Date(queryFilters.fecha_desde);
      }
      if (queryFilters.fecha_hasta) {
        query.fecha_cita.$lte = new Date(queryFilters.fecha_hasta);
      }
    }

    // Ejecutar consultas en paralelo
    const [docs, total] = await Promise.all([
      AppointmentModel
        .find(query)
        .sort({ fecha_cita: -1 })
        .skip(skip)
        .limit(limit),
      AppointmentModel.countDocuments(query)
    ]);

    const appointments = docs.map(doc => this.mapToEntity(doc));
    const totalPages = Math.ceil(total / limit);

    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    return { appointments, pagination };
  }

  async update(id: string, updateData: Partial<Appointment>): Promise<Appointment | null> {
    const updatedDoc = await AppointmentModel.findByIdAndUpdate(
      id,
      {
        $set: {
          ...updateData,
          updated_at: new Date()
        }
      },
      { new: true }
    );
    return updatedDoc ? this.mapToEntity(updatedDoc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await AppointmentModel.findOneAndUpdate(
      { _id: id, deleted_at: null },
      { 
        deleted_at: new Date(),
        updated_at: new Date()
      }
    );

    return result !== null;
  }

  async findByTutorId(tutorId: string, filters?: Partial<AppointmentFilters>): Promise<Appointment[]> {
    const query: any = { 
      id_tutor: tutorId, 
      deleted_at: null 
    };

    if (filters?.estado_cita) {
      query.estado_cita = filters.estado_cita;
    }

    if (filters?.fecha_desde || filters?.fecha_hasta) {
      query.fecha_cita = {};
      if (filters.fecha_desde) {
        query.fecha_cita.$gte = new Date(filters.fecha_desde);
      }
      if (filters.fecha_hasta) {
        query.fecha_cita.$lte = new Date(filters.fecha_hasta);
      }
    }

    const docs = await AppointmentModel
      .find(query)
      .sort({ fecha_cita: -1 });

    return docs.map(doc => this.mapToEntity(doc));
  }

  async findByAlumnoId(alumnoId: string, filters?: Partial<AppointmentFilters>): Promise<Appointment[]> {
    const query: any = { 
      id_alumno: alumnoId, 
      deleted_at: null 
    };

    if (filters?.estado_cita) {
      query.estado_cita = filters.estado_cita;
    }

    if (filters?.fecha_desde || filters?.fecha_hasta) {
      query.fecha_cita = {};
      if (filters.fecha_desde) {
        query.fecha_cita.$gte = new Date(filters.fecha_desde);
      }
      if (filters.fecha_hasta) {
        query.fecha_cita.$lte = new Date(filters.fecha_hasta);
      }
    }

    const docs = await AppointmentModel
      .find(query)
      .sort({ fecha_cita: -1 });

    return docs.map(doc => this.mapToEntity(doc));
  }

  async findConflictingAppointments(
    tutorId: string, 
    alumnoId: string, 
    fecha: Date,
    excludeId?: string
  ): Promise<Appointment[]> {
    // Buscar citas que estén a 1 hora de diferencia (antes o después)
    const oneHour = 60 * 60 * 1000; // 1 hora en milisegundos
    const startTime = new Date(fecha.getTime() - oneHour);
    const endTime = new Date(fecha.getTime() + oneHour);

    const query: any = {
      deleted_at: null,
      estado_cita: { $in: ['pendiente', 'confirmada'] },
      fecha_cita: {
        $gte: startTime,
        $lte: endTime
      },
      $or: [
        { id_tutor: tutorId },
        { id_alumno: alumnoId }
      ]
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const docs = await AppointmentModel.find(query);
    return docs.map(doc => this.mapToEntity(doc));
  }

  private mapToEntity(doc: IAppointmentDocument): Appointment {
    return new Appointment(
      doc._id,
      doc.id_tutor,
      doc.id_alumno,
      doc.estado_cita,
      doc.fecha_cita,
      doc.created_at,
      doc.updated_at,
      doc.deleted_at,
      doc.checklist ?? [],
      doc.reason ?? null
    );
  }
} 