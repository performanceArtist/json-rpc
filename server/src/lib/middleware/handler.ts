import { Request, Response, NextFunction } from 'express';

import { Emitter, EventMap } from '../emitter';
import { handleRPCCall, handleBatchedRPCCalls } from '../handler';
import { option } from 'fp-ts';

export const makeRPCHandler = <T extends EventMap>(emitter: Emitter<T>) => (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { rpc } = req;

  if (!option.isSome(rpc)) {
    console.error('No rpc request');
    return next();
  }

  if (Array.isArray(rpc.value)) {
    handleBatchedRPCCalls(rpc.value, emitter, res);
  } else {
    handleRPCCall(rpc.value, emitter, res);
  }
};
