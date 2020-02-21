import { Request, Response } from 'express';
import jsonRPC from 'jsonrpc-lite';
import { bimap, either, right, Either } from 'fp-ts/lib/Either';
import {
  bimap as taskBimap,
  TaskEither,
  taskEither,
  fromEither,
} from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';
import { array } from 'fp-ts/lib/Array';

import { getRPCError, ValidRPC } from './rpc';
import { makePerform } from './perform';
import { Emitter } from './emitter';
import { ErrorType, EventMap } from './emitterTypes';

export const makeRPCHandler = <T extends EventMap>(emitter: Emitter<T>) => (
  req: Request,
  res: Response,
) => {
  const { rpc } = req;

  if (Array.isArray(rpc)) {
    handleBatchedRPCCalls(rpc, emitter, res);
  } else {
    handleRPCCall(rpc, emitter, res);
  }
};

const isTaskEither = <L, R>(
  task: Either<L, R> | TaskEither<L, R>,
): task is TaskEither<L, R> => {
  return task instanceof Function;
};

const handleRPCCall = <T extends EventMap>(
  rpc: ValidRPC,
  emitter: Emitter<T>,
  res: Response,
) => {
  const perform = makePerform(emitter);
  const requestID = rpc.payload.id;
  const sendRPCError = (error: ErrorType) => {
    res.json(jsonRPC.error(requestID, getRPCError(error)));
  };
  const sendRPCData = (data: T) => res.json(jsonRPC.success(requestID, data));

  pipe(
    perform(rpc),
    bimap(sendRPCError, ({ result }) => {
      if (isTaskEither(result)) {
        pipe(result, taskBimap(sendRPCError, sendRPCData))();
      } else {
        sendRPCData(result);
      }
    }),
  );
};

const liftToTaskEither = (data: {
  id: string;
  result: any;
}): TaskEither<any, any> =>
  isTaskEither(data.result) ? data.result : fromEither(right(data.result));

const handleBatchedRPCCalls = <T extends EventMap>(
  rpc: ValidRPC[],
  emitter: Emitter<T>,
  res: Response,
) => {
  const perform = makePerform(emitter);

  pipe(
    array.traverse(either)(rpc, perform),
    bimap(
      () => res.sendStatus(400),
      allResults => {
        pipe(
          array.traverse(taskEither)(allResults, liftToTaskEither),
          taskBimap(
            () => res.sendStatus(400),
            results => res.json(results),
          ),
        )();
      },
    ),
  );
};
