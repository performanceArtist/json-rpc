import { map } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';

import { Emitter } from './emitter';
import { ValidRPC } from './rpc';
import { EventMap } from './emitterTypes';

export const makePerform = <T extends EventMap>(emitter: Emitter<T>) => (
  rpc: ValidRPC,
) => {
  const { id, method, params } = rpc.payload;

  return pipe(
    emitter.emit(method, params),
    map(result => ({ id, result })),
  );
};
