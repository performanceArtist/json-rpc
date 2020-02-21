import * as t from 'io-ts';
import { tryCatch } from 'fp-ts/lib/TaskEither';

import { Emitter, ErrorType } from './lib';

type Todo = {
  title: string;
  content: string;
};

export type EventMap = {
  test: (data: { a: number }) => number;
  asyncOne: (data: { id: string }) => Todo;
};

export const emitter = new Emitter<EventMap>({
  test: t.type({
    a: t.number,
  }),
  asyncOne: t.type({
    id: t.string,
  }),
});

emitter.sync('test', data => data.a + 1);

const getTodo = (id: string) =>
  tryCatch<ErrorType, Todo>(
    () =>
      new Promise(resolve =>
        setTimeout(
          () => resolve({ title: `Test #${id}`, content: 'todo' }),
          1000,
        ),
      ),
    (error: ErrorType) => error,
  );

emitter.async('asyncOne', ({ id }) => getTodo(id));
