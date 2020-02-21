import { Request, Response } from 'express';
import jsonRPC, { IParsedObjectRequest } from 'jsonrpc-lite';
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

export const makeRPCHandler = (emitter: Emitter<any>) => (
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

const handleRPCCall = (rpc: ValidRPC, emitter: Emitter<any>, res: Response) => {
  const perform = makePerform(emitter);
  const result = perform(rpc);

  const requestID = (rpc as IParsedObjectRequest).payload.id;
  const sendRPCError = (error: any) => {
    res.json(jsonRPC.error(requestID, getRPCError(error)));
  };
  const sendRPCData = (data: any) => res.json(jsonRPC.success(requestID, data));

  pipe(
    result,
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

const handleBatchedRPCCalls = (
  rpc: ValidRPC[],
  emitter: Emitter<any>,
  res: Response,
) => {
  const perform = makePerform(emitter);
  const eitherResults = rpc.map(perform);

  pipe(
    array.sequence(either)(eitherResults),
    bimap(
      () => res.sendStatus(400),
      rawResults => {
        const results = array.traverse(taskEither)(
          rawResults,
          liftToTaskEither,
        );

        pipe(
          results,
          taskBimap(
            () => res.sendStatus(400),
            results => res.json(results),
          ),
        )();
      },
    ),
  );
};
