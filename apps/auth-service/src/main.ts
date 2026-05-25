import express from 'express';
import cors from 'cors';
import { errorMiddleware } from '../../../packages/error-handler/error-middleware';
const host = process.env.HOST ?? 'localhost';
// const port = process.env.PORT ? Number(process.env.PORT) : 6001; //3000 is my nextjs project port.

const app = express();
app.use(cors({
    origin: ['http://localhost:3000'],
    allowedHeaders: ['Authorization', 'Content-Type',],
    credentials: true //if credentials true then we cannot use origin "*"
}));


app.get('/', (req, res) => {
    res.send({ 'message': 'Hello API' });
});
app.use(errorMiddleware)
const port = process.env.PORT || 6001;
const server = app.listen(port, () => {
    console.log(`[ ready ] http://${host}:${port}/api`);
});


server.on("error", (err) => {
    console.log("Server Error", err);
})

