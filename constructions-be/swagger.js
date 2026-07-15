// swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0', // OpenAPI 3.0 specification
    info: {
      title: 'Partner Fox API', // Your API title
      version: '1.0.0', // Version of your API
      description: 'API documentation for Node.js with MySQL',
    },
    servers: [
      {
         url: 'http://localhost:9000/api/', // The base URL for your API (update if needed)
        //url: 'http://192.168.0.114:3000/api/',
       // url: 'https://cspl.canaanspace.com/api/', // The base URL for your API (update if needed)
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to your route files for Swagger to generate docs from
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
