import swaggerAutogen from 'swagger-autogen';

const doc = {
    info: {
    version: "1.0.0",
    title: "Auth Service API",
    description: "API documentation for the Auth Service"
    },
    host: "localhost:6001",
    schemes: ['http'],

};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./routes/auth.router.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc);