const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'RBAC Task Management API',
            version: '1.0.0',
            description: 'A role-based task management system API',
        },
        servers: [
            {
                url: 'http://localhost:5000/api',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
                apiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'x-secret-key',
                }
            },
        },
        security: [
            {
                apiKeyAuth: [],
            },
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./app/routes/*.js', './app/controllers/*.js'], // files containing annotations
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log('Swagger documentation available at http://localhost:5000/api-docs');
};

module.exports = setupSwagger;
