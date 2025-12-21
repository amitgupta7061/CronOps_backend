/**
 * Swagger/OpenAPI Documentation for CronOps API
 */

export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'CronOps API',
    version: '1.0.0',
    description: 'Production-ready Cron Job Scheduling Platform API',
    contact: {
      name: 'CronOps Support',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API Server',
    },
  ],
  tags: [
    { name: 'Health', description: 'Health check endpoints' },
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Jobs', description: 'Cron job management' },
    { name: 'Logs', description: 'Execution logs' },
    { name: 'Stats', description: 'Statistics and analytics' },
    { name: 'Admin', description: 'Admin-only endpoints' },
    { name: 'Users', description: 'User management' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          status: { type: 'string', example: 'fail' },
          message: { type: 'string' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['USER', 'ADMIN'] },
          plan: { type: 'string', enum: ['FREE', 'PREMIUM', 'PRO'] },
          isVerified: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CronJob: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          cronExpression: { type: 'string', example: '0 * * * *' },
          timezone: { type: 'string', example: 'UTC' },
          targetType: { type: 'string', enum: ['HTTP', 'SCRIPT'] },
          targetUrl: { type: 'string', format: 'uri' },
          httpMethod: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
          headers: { type: 'object', additionalProperties: { type: 'string' } },
          payload: { type: 'object' },
          status: { type: 'string', enum: ['ACTIVE', 'PAUSED'] },
          maxRetries: { type: 'integer' },
          timeout: { type: 'integer' },
          nextExecution: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ExecutionLog: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          jobId: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['SUCCESS', 'FAILED', 'RUNNING', 'TIMEOUT'] },
          responseCode: { type: 'integer' },
          responseBody: { type: 'string' },
          errorMessage: { type: 'string' },
          startedAt: { type: 'string', format: 'date-time' },
          finishedAt: { type: 'string', format: 'date-time' },
          duration: { type: 'integer', description: 'Duration in milliseconds' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Check API health status',
        description: 'Returns health status of API, database, Redis, and queue services',
        responses: {
          200: {
            description: 'All services healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' },
                    uptime: { type: 'number' },
                    services: {
                      type: 'object',
                      properties: {
                        database: { type: 'object' },
                        redis: { type: 'object' },
                        queue: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
          503: { description: 'One or more services unhealthy' },
        },
      },
    },
    '/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User registered, OTP sent' },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/auth/verify-otp': {
      post: {
        tags: ['Auth'],
        summary: 'Verify email with OTP',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'otp'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  otp: { type: 'string', pattern: '^\\d{6}$' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Email verified, tokens returned' },
          400: { description: 'Invalid or expired OTP' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request password reset',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Reset email sent if account exists' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password with token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password reset successful' },
          400: { description: 'Invalid or expired token' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'New tokens returned' },
          401: { description: 'Invalid refresh token' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Logged out successfully' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'User profile',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
      },
    },
    '/jobs': {
      get: {
        tags: ['Jobs'],
        summary: 'List user cron jobs',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'PAUSED'] } },
        ],
        responses: {
          200: {
            description: 'List of cron jobs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        jobs: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/CronJob' },
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Jobs'],
        summary: 'Create a new cron job',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'cronExpression', 'targetType'],
                properties: {
                  name: { type: 'string' },
                  cronExpression: { type: 'string', example: '0 * * * *' },
                  timezone: { type: 'string', default: 'UTC' },
                  targetType: { type: 'string', enum: ['HTTP', 'SCRIPT'] },
                  targetUrl: { type: 'string', format: 'uri' },
                  httpMethod: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
                  headers: { type: 'object' },
                  payload: { type: 'object' },
                  maxRetries: { type: 'integer', default: 3 },
                  timeout: { type: 'integer', default: 30000 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Job created successfully' },
          403: { description: 'Job limit reached for plan' },
        },
      },
    },
    '/jobs/{id}': {
      get: {
        tags: ['Jobs'],
        summary: 'Get a cron job by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Job details' },
          404: { description: 'Job not found' },
        },
      },
      put: {
        tags: ['Jobs'],
        summary: 'Update a cron job',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CronJob' },
            },
          },
        },
        responses: {
          200: { description: 'Job updated' },
          404: { description: 'Job not found' },
        },
      },
      delete: {
        tags: ['Jobs'],
        summary: 'Delete a cron job',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Job deleted' },
          404: { description: 'Job not found' },
        },
      },
    },
    '/jobs/{id}/pause': {
      post: {
        tags: ['Jobs'],
        summary: 'Pause a cron job',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Job paused' },
        },
      },
    },
    '/jobs/{id}/resume': {
      post: {
        tags: ['Jobs'],
        summary: 'Resume a paused cron job',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Job resumed' },
        },
      },
    },
    '/jobs/{id}/run': {
      post: {
        tags: ['Jobs'],
        summary: 'Run a cron job immediately',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Job queued for immediate execution' },
        },
      },
    },
    '/jobs/{jobId}/logs': {
      get: {
        tags: ['Logs'],
        summary: 'Get execution logs for a job',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'jobId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['SUCCESS', 'FAILED', 'RUNNING', 'TIMEOUT'] } },
        ],
        responses: {
          200: {
            description: 'Execution logs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    logs: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ExecutionLog' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/logs': {
      get: {
        tags: ['Logs'],
        summary: 'Get all execution logs for user',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'jobId', in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Execution logs' },
        },
      },
    },
    '/stats': {
      get: {
        tags: ['Stats'],
        summary: 'Get user statistics',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'User statistics' },
        },
      },
    },
    '/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Get admin dashboard stats',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Admin statistics' },
          403: { description: 'Admin access required' },
        },
      },
    },
    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List all users',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'List of users' },
          403: { description: 'Admin access required' },
        },
      },
    },
    '/admin/logs': {
      get: {
        tags: ['Admin'],
        summary: 'Get all execution logs (admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'All execution logs' },
          403: { description: 'Admin access required' },
        },
      },
    },
  },
};

export default swaggerDocument;
