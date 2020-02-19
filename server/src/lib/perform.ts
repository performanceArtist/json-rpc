import { map, Either } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';

import { Emitter } from './emitter';
import { ValidRPC, isNotification } from './rpc';

export const filterNotificationResults = <L, R>(
  result: Either<L, R> | 'notificationResult',
): result is Either<L, R> => result !== 'notificationResult';

export const makePerform = (emitter: Emitter<any>) => (rpc: ValidRPC) => {
  if (isNotification(rpc)) {
    const { method, params } = rpc.payload;
    emitter.emit(method, params);
    return 'notificationResult' as const;
  } else {
    const { id, method, params } = rpc.payload;

    return pipe(
      emitter.emit(method, params),
      map(result => ({ id, result })),
    );
  }
};
