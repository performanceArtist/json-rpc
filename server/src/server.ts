import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import * as t from 'io-ts';

import { parseRPC, makeRPCHandler, Emitter } from './lib';

type Todo = {
  title: string;
  content: string;
}

export type EventMap = {
  test: (data: { a: number }) => number;
  asyncOne: (data: { id: string }) => Todo;
  asyncMany: (data: { ids: string[] }) => Todo[];
};

export const emitter = new Emitter<EventMap>();

emitter.on(
  'test',
  data => data.a + 1,
  t.type({
    a: t.number,
  }),
);

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use(parseRPC);
app.post('/', makeRPCHandler(emitter));

app.listen(5000, () => console.log('Listening on port 5000...'));
