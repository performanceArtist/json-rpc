import * as t from 'io-ts';
import { rightTask, taskEither } from 'fp-ts/lib/TaskEither';
import { array } from 'fp-ts/lib/Array';

import { Emitter, ErrorType } from './lib';

type Todo = {
  title: string;
  content: string;
};

export type EventMap = {
  test: (data: { a: number }) => number;
  asyncOne: (data: { id: string }) => Todo;
  asyncMany: (data: { ids: string[] }) => Todo[];
};

export const emitter = new Emitter<EventMap>({
  test: t.type({
    a: t.number,
  }),
  asyncOne: t.type({
    id: t.string,
  }),
  asyncMany: t.type({
    ids: t.array(t.string),
  }),
});

emitter.sync('test', data => data.a + 1);

const getTodo = (id: string) =>
  rightTask<ErrorType, Todo>(
    () =>
      new Promise(resolve =>
        setTimeout(
          () => resolve({ title: `Test #${id}`, content: 'todo' }),
          1000,
        ),
      ),
  );

emitter.async('asyncOne', ({ id }) => getTodo(id));

emitter.async('asyncMany', ({ ids }) =>
  array.traverse(taskEither)(ids, getTodo),
);
