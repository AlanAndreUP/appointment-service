import swaggerJSDoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Appointment Service API',
    version: '1.0.0',
    description: `
      Microservicio de gestión de citas construido con TypeScript, Express, MongoDB y Resend.
      
      ## Endpoints principales:
      - POST   /s1/appointments: Crear nueva cita
      - GET    /s1/appointments: Listar citas con filtros y paginación
      - GET    /s1/appointments/{id}: Obtener cita por ID
      - PUT    /s1/appointments/{id}: Actualizar cita completa
      - PUT    /s1/appointments/{id}/status: Actualizar solo el estado de la cita
      - DELETE /s1/appointments/{id}: Eliminar cita (soft delete)
      - GET    /s1/health: Health check básico
      - GET    /s1/health/detailed: Health check detallado
      - GET    /s1/docs: Documentación Swagger UI
      - GET    /s1/swagger.json: Especificación OpenAPI
      
      ## Características principales:
      - CRUD completo de citas
      - Estados de cita: pendiente, confirmada, cancelada, completada, no_asistio
      - Sistema de tareas (to_do) y seguimiento (finish_to_do)
      - Notificaciones por email con Resend
      - Validación de conflictos de horario
      - Filtros avanzados y paginación
      - Arquitectura Hexagonal (Puertos y Adaptadores)
      - Middleware de autenticación JWT
      
      ## Autenticación
      Todos los endpoints (excepto health checks) requieren autenticación JWT.
      Incluye el header: \`Authorization: Bearer <token>\`
    `,
    contact: {
      name: 'Equipo de Desarrollo',
      email: 'dev@tutoria.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://api.tutoria.com/s1' 
        : `http://localhost:${process.env.PORT || 3002}/s1`,
      description: process.env.NODE_ENV === 'production' ? 'Servidor de Producción' : 'Servidor de Desarrollo'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenido del servicio de autenticación'
      }
    },
    schemas: {
      // Schema para crear cita
      CreateAppointmentRequest: {
        type: 'object',
        required: ['id_tutor', 'id_alumno', 'fecha_cita'],
        properties: {
          id_tutor: {
            type: 'string',
            description: 'ID único del tutor',
            example: 'tutor_123'
          },
          id_alumno: {
            type: 'string',
            description: 'ID único del alumno',
            example: 'alumno_456'
          },
          fecha_cita: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha y hora de la cita en formato ISO 8601',
            example: '2024-01-15T10:00:00.000Z'
          },
          to_do: {
            type: 'string',
            description: 'Tareas o temas a revisar en la cita',
            maxLength: 1000,
            example: 'Revisar álgebra básica y ecuaciones lineales'
          }
        }
      },
      
      // Schema para actualizar cita
      UpdateAppointmentRequest: {
        type: 'object',
        properties: {
          estado_cita: {
            type: 'string',
            enum: ['pendiente', 'confirmada', 'cancelada', 'completada', 'no_asistio'],
            description: 'Nuevo estado de la cita'
          },
          fecha_cita: {
            type: 'string',
            format: 'date-time',
            description: 'Nueva fecha y hora de la cita'
          },
          to_do: {
            type: 'string',
            description: 'Tareas o temas a revisar',
            maxLength: 1000
          },
          finish_to_do: {
            type: 'string',
            description: 'Tareas completadas o resultados de la cita',
            maxLength: 1000,
            example: 'Completó ejercicios de álgebra. Mejoró comprensión en ecuaciones.'
          }
        }
      },
      
      // Schema para actualizar solo el estado
      UpdateStatusRequest: {
        type: 'object',
        required: ['estado_cita'],
        properties: {
          estado_cita: {
            type: 'string',
            enum: ['pendiente', 'confirmada', 'cancelada', 'completada', 'no_asistio'],
            description: 'Nuevo estado de la cita',
            example: 'confirmada'
          }
        }
      },
      
      // Schema de respuesta de cita
      AppointmentResponse: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'ID único de la cita',
            example: 'appt_123abc'
          },
          id_tutor: {
            type: 'string',
            description: 'ID del tutor',
            example: 'tutor_123'
          },
          id_alumno: {
            type: 'string',
            description: 'ID del alumno',
            example: 'alumno_456'
          },
          estado_cita: {
            type: 'string',
            enum: ['pendiente', 'confirmada', 'cancelada', 'completada', 'no_asistio'],
            description: 'Estado actual de la cita'
          },
          fecha_cita: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha y hora de la cita'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de creación'
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de última actualización'
          },
          deleted_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Fecha de eliminación (null si no está eliminada)'
          },
          to_do: {
            type: 'string',
            nullable: true,
            description: 'Tareas o temas a revisar'
          },
          finish_to_do: {
            type: 'string',
            nullable: true,
            description: 'Tareas completadas'
          }
        }
      },
      
      // Schema de respuesta exitosa
      SuccessResponse: {
        type: 'object',
        properties: {
          data: {
            description: 'Datos de respuesta'
          },
          message: {
            type: 'string',
            description: 'Mensaje descriptivo',
            example: 'Operación completada exitosamente'
          },
          status: {
            type: 'string',
            enum: ['success'],
            example: 'success'
          },
          pagination: {
            $ref: '#/components/schemas/PaginationMeta'
          }
        }
      },
      
      // Schema de respuesta de error
      ErrorResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'null',
            example: null
          },
          message: {
            type: 'string',
            description: 'Mensaje de error',
            example: 'Error en la operación'
          },
          status: {
            type: 'string',
            enum: ['error'],
            example: 'error'
          },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'Código de error',
                example: 'VALIDATION_ERROR'
              },
              details: {
                description: 'Detalles adicionales del error'
              }
            }
          }
        }
      },
      
      // Schema de paginación
      PaginationMeta: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            description: 'Página actual',
            example: 1
          },
          limit: {
            type: 'integer',
            description: 'Elementos por página',
            example: 10
          },
          total: {
            type: 'integer',
            description: 'Total de elementos',
            example: 25
          },
          totalPages: {
            type: 'integer',
            description: 'Total de páginas',
            example: 3
          },
          hasNext: {
            type: 'boolean',
            description: 'Si hay página siguiente',
            example: true
          },
          hasPrev: {
            type: 'boolean',
            description: 'Si hay página anterior',
            example: false
          }
        }
      },
      
      // Schema de health check
      HealthResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'OK'
          },
          timestamp: {
            type: 'string',
            format: 'date-time'
          },
          uptime: {
            type: 'number',
            description: 'Tiempo de actividad en segundos'
          },
          version: {
            type: 'string',
            example: '1.0.0'
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/infrastructure/routes/*.ts', './src/infrastructure/controllers/*.ts']
};

export const swaggerSpec = swaggerJSDoc(options); 