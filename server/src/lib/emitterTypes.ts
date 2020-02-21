import { Type } from 'io-ts';
import { TaskEither } from 'fp-ts/lib/TaskEither';

export type ErrorType =
  | { type: 'noHandler'; data: any }
  | { type: 'invalidParams'; data: any }
  | { type: 'asyncReject'; data: any };

export const noHandler = (data: any): ErrorType => ({
  type: 'noHandler',
  data,
});

export const invalidParams = (data: any): ErrorType => ({
  type: 'invalidParams',
  data,
});

export const asyncReject = (data: any): ErrorType => ({
  type: 'asyncReject',
  data,
});

export type EventMap = { [key: string]: (data: any) => any };

export type IOMap<M extends EventMap> = {
  [key in keyof M]: Type<Parameters<M[key]>[0]>;
};

export type AsyncHandler<T extends (...args: any) => any> = (
  ...args: Parameters<T>
) => TaskEither<ErrorType, ReturnType<T>>;

export type SubscriberType = 'sync' | 'async';

export type Subscriber<C extends EventMap> = {
  event: keyof C;
  callback: (data: Parameters<C[keyof C]>) => ReturnType<C[keyof C]> | TaskEither<ErrorType, ReturnType<C[keyof C]>>;
  type: SubscriberType;
};

export type EmitterArgs<C extends EventMap, E extends keyof C> = {
  event: E;
  callback: C[E] | AsyncHandler<C[E]>;
  type: SubscriberType;
};
