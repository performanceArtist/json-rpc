import * as t from 'io-ts';
import { taskEither } from 'fp-ts';
import { array } from 'fp-ts/lib/Array';

import { Emitter, ErrorType } from '../lib';
import { EventMap, Todo } from './types';

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

emitter.sync('test', (data) => data.a + 1);

const getTodo = (id: string) =>
  taskEither.rightTask<ErrorType, Todo>(
    () =>
      new Promise((resolve) =>
        setTimeout(
          () => resolve({ title: `${id}`, content: 'todo' }),
          1000,
        ),
      ),
  );

emitter.async('asyncOne', ({ id }) => getTodo(id));

emitter.async('asyncMany', ({ ids }) =>
  array.traverse(taskEither.taskEither)(ids, getTodo),
);
