import {
  IParsedObjectNotification,
  IParsedObjectRequest,
  IParsedObject,
  RpcStatusType,
  JsonRpcError
} from 'jsonrpc-lite';

import { ErrorType } from './emitter';

export type ValidRPC = IParsedObjectNotification | IParsedObjectRequest;
export type ValidRPCRequest = ValidRPC | ValidRPC[];

export const isValidRPC = (type: RpcStatusType) =>
  type === 'notification' || type === 'request';

export const isNotification = (
  rpc: ValidRPC,
): rpc is IParsedObjectNotification => rpc.type === 'notification';

export const isValidRequest = (
  rpc: IParsedObject | IParsedObject[],
): rpc is ValidRPCRequest => {
  if (Array.isArray(rpc)) {
    return rpc.every(item => isValidRPC(item.type));
  } else {
    return isValidRPC(rpc.type);
  }
};

export const getRPCError = ({ type, data }: ErrorType) => {
  return type === 'invalidParams'
    ? JsonRpcError.invalidParams(data)
    : JsonRpcError.methodNotFound(data);
};
