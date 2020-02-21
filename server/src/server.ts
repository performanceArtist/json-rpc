import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import { parseRPC, makeRPCHandler } from './lib';
import { emitter } from './tasks';

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use(parseRPC);
app.post('/', makeRPCHandler(emitter));

app.listen(5000, () => console.log('Listening on port 5000...'));
