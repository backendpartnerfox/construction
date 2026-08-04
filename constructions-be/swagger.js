// swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

// Build servers list dynamically. In prod, PUBLIC_API_URL points at the deployed
// backend (e.g. https://constructions-be.fly.dev); locally it falls back to the
// dev server. Both are listed so the same spec works everywhere.
const servers = [];
if (process.env.PUBLIC_API_URL) {
  servers.push({ url: `${process.env.PUBLIC_API_URL.replace(/\/$/, '')}/api`, description: 'Deployed' });
}
servers.push({ url: `http://localhost:${process.env.PORT || 9000}/api`, description: 'Local' });

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Partner Fox API',
      version: '1.0.0',
      description: 'Construction management backend — REST API',
    },
    servers,
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
