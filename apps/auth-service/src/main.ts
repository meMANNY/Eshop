import express from 'express';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 6001; //3000 is my nextjs project port.

const app = express();

app.get('/', (req, res) => {
    res.send({ 'message': 'Hello API' });
});

app.listen(port, host, () => {
    console.log(`[ ready ] http://${host}:${port}`);
});
