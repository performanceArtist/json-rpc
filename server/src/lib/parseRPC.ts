import { Request, Response, NextFunction } from 'express';
import jsonRPC, { JsonRpcError } from 'jsonrpc-lite';

import { ValidRPCRequest, isValidRequest } from './rpc';

declare global {
  namespace Express {
    interface Request {
      rpc: ValidRPCRequest;
    }
  }
}

export const parseRPC = (req: Request, res: Response, next: NextFunction) => {
  const rpc = jsonRPC.parseJsonRpcObject(req.body);

  if (isValidRequest(rpc)) {
    req.rpc = rpc;
    next();
  } else {
    res.json(
      JsonRpcError.invalidRequest(
        `Invalid request: ${JSON.stringify(req.body)}`,
      ),
    );
  }
}
