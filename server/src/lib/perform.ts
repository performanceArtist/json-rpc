import { map, Either } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';

import { Emitter } from './emitter';
import { ValidRPC } from './rpc';
import { ErrorType } from './emitterTypes';

export const makePerform = (emitter: Emitter<any>) => (rpc: ValidRPC): Either<ErrorType, any> => {
  const { id, method, params } = rpc.payload;
  return pipe(
    emitter.emit(method, params),
    map(result => ({ id, result })),
  );
};
