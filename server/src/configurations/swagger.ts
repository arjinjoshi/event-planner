import swaggerJSDoc from 'swagger-jsdoc';
import { config } from '../config';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Planner REST API',
      version: '1.0.0',
      description: 'Comprehensive RESTful API documentation for the Event Planner platform.',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}/api/v1`,
        description: 'Local Development Server (v1)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token (e.g., Bearer <token>)',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error description message' },
            errors: {
              type: 'array',
              nullable: true,
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Invalid email address' },
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            phone_number: { type: 'string', example: '+1234567890' },
            avatar_url: { type: 'string', nullable: true, example: 'https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg' },
            avatar_public_id: { type: 'string', nullable: true, example: 'avatars/sample_id' },
            is_email_verified: { type: 'boolean', example: true },
            is_two_factor_enabled: { type: 'boolean', example: false },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '987e6543-e89b-12d3-a456-426614174000' },
            title: { type: 'string', example: 'Tech Conference 2026' },
            description: { type: 'string', example: 'Annual developer gathering.' },
            location: { type: 'string', example: 'Convention Center, NY' },
            start_time: { type: 'string', format: 'date-time', example: '2026-11-01T10:00:00Z' },
            end_time: { type: 'string', format: 'date-time', example: '2026-11-01T18:00:00Z' },
            capacity: { type: 'integer', example: 200 },
            is_private: { type: 'boolean', example: false },
            creator_id: { type: 'string', format: 'uuid' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        RSVP: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '456e7890-e89b-12d3-a456-426614174000' },
            event_id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['YES', 'MAYBE', 'NO'], example: 'YES' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Reads JSDoc annotations from routes in both dev (TS) and prod (dist JS)
  apis: [
    './src/routes/*.ts',
    './src/routes/**/*.ts',
    './dist/routes/*.js',
    './dist/routes/**/*.js',
  ],
};

export const swaggerSpec = swaggerJSDoc(options);