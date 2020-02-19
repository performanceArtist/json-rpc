import { Type } from 'io-ts';

export type ErrorType =
  | { type: 'noHandler'; data: any }
  | { type: 'invalidParams'; data: any };

export const noHandler = (data: any): ErrorType => ({
  type: 'noHandler',
  data,
});

export const invalidParams = (data: any): ErrorType => ({
  type: 'invalidParams',
  data,
});

export type EventMap = { [key: string]: (data: any) => any };

export type Subscriber<C extends EventMap> = {
  event: keyof C;
  callback: (data: Parameters<C[keyof C]>) => any;
  schema: Type<Parameters<C[keyof C]>>;
};
