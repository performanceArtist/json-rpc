import { Response } from 'express';
import jsonRPC from 'jsonrpc-lite';
import { Either } from 'fp-ts/lib/Either';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';
import { array } from 'fp-ts/lib/Array';
import { either, taskEither } from 'fp-ts';

import { getRPCError, ValidRPC } from '../rpc-helpers';
import { Emitter, ErrorType, EventMap } from '../emitter';

const isTaskEither = <L, R>(
  task: Either<L, R> | TaskEither<L, R>,
): task is TaskEither<L, R> => {
  return task instanceof Function;
};

export const handleRPCCall = <T extends EventMap>(
  rpc: ValidRPC,
  emitter: Emitter<T>,
  res: Response,
) => {
  const {
    payload: { method, params, id: requestID },
  } = rpc;
  const sendRPCError = (error: ErrorType) => {
    res.json(jsonRPC.error(requestID, getRPCError(error)));
  };
  const sendRPCData = (data: T) => res.json(jsonRPC.success(requestID, data));

  pipe(
    emitter.emit(method, params),
    either.bimap(sendRPCError, (result) => {
      if (isTaskEither(result)) {
        pipe(result, taskEither.bimap(sendRPCError, sendRPCData))();
      } else {
        sendRPCData(result);
      }
    }),
  );
};

const liftToTaskEither = (data: any): TaskEither<any, any> =>
  isTaskEither(data) ? data : taskEither.right(data);

export const handleBatchedRPCCalls = <T extends EventMap>(
  rpc: ValidRPC[],
  emitter: Emitter<T>,
  res: Response,
) =>
  pipe(
    array.traverse(either.either)(rpc, ({ payload: { method, params } }) =>
      emitter.emit(method, params),
    ),
    either.bimap(
      () => res.sendStatus(400),
      (results) =>
        pipe(
          array.traverse(taskEither.taskEither)(results, liftToTaskEither),
          taskEither.bimap(
            () => res.sendStatus(400),
            (results) => res.json(results),
          ),
        )(),
    ),
  );
