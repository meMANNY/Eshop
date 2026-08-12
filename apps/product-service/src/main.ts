import express from 'express';
import "./jobs/product-crone.job"
import cors from 'cors';
import { errorMiddleware } from '../../../packages/error-handler/error-middleware';
import cookieParser from 'cookie-parser';
import router from './routes/product.routes';



//import swaggerUi from 'swagger-ui-express';



//const swaggerDocument = require('./swagger-output.json');
const host = process.env.HOST ?? 'localhost';



// const port = process.env.PORT ? Number(process.env.PORT) : 6001; //3000 is my nextjs project port.

const app = express();
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    allowedHeaders: ['Authorization', 'Content-Type',],
    credentials: true //if credentials true then we cannot use origin "*"
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send({ 'message': 'Hello API' });
});
//app.use('/api-docs',swaggerUi.serve, swaggerUi.setup(swaggerDocument));
//app.get("/docs-json", (req, res) => {
   // res.json(swaggerDocument);
//});
app.use("/api",router);

app.use(errorMiddleware)
const port = process.env.PORT || 6002;
const server = app.listen(port, () => {
    console.log(`[ ready ] http://${host}:${port}/api`);
    console.log(`Swagger Docs available at http://${host}:${port}/api-docs`);
});


server.on("error", (err) => {
    console.log("Server Error", err);
})

