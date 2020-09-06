import {
  IParsedObjectRequest,
  IParsedObject,
  RpcStatusType,
  JsonRpcError,
} from 'jsonrpc-lite';

import { ErrorType } from '../emitter';

export type ValidRPC = IParsedObjectRequest;
export type ValidRPCRequest = ValidRPC | ValidRPC[];

export const isValidRPC = (type: RpcStatusType) => type === 'request';

export const isValidRequest = (
  rpc: IParsedObject | IParsedObject[],
): rpc is ValidRPCRequest => {
  if (Array.isArray(rpc)) {
    return rpc.every((item) => isValidRPC(item.type));
  } else {
    return isValidRPC(rpc.type);
  }
};

export const getRPCError = ({ type, data }: ErrorType) => {
  switch (type) {
    case 'invalidParams':
      return JsonRpcError.invalidParams(data);
    case 'noHandler':
      return JsonRpcError.methodNotFound(data);
    case 'asyncReject':
      return JsonRpcError.internalError(data);
  }
};
