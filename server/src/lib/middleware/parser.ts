import { Request, Response, NextFunction } from 'express';
import jsonRPC, { JsonRpcError } from 'jsonrpc-lite';
import { option } from 'fp-ts';
import { isValidRequest } from '../rpc-helpers';

export const parseRPC = (req: Request, res: Response, next: NextFunction) => {
  const rpc = jsonRPC.parseJsonRpcObject(req.body);

  if (isValidRequest(rpc)) {
    req.rpc = option.some(rpc);
    next();
  } else {
    res.json(
      JsonRpcError.invalidRequest(
        `Invalid request: ${JSON.stringify(req.body)}`,
      ),
    );
  }
};
