import { Option } from 'fp-ts/lib/Option';
import { ValidRPCRequest } from '../rpc-helpers';

export * from './handler';
export * from './parser';

declare global {
  namespace Express {
    interface Request {
      rpc: Option<ValidRPCRequest>;
    }
  }
}
