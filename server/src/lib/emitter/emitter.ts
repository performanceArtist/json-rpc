import { Either } from 'fp-ts/lib/Either';
import { either, array, option } from 'fp-ts';
import { pipe } from 'fp-ts/lib/pipeable';
import { TaskEither } from 'fp-ts/lib/TaskEither';

import {
  EmitterArgs,
  AsyncHandler,
  EventMap,
  IOMap,
  Subscriber,
  ErrorType,
  noHandler,
  invalidParams,
} from './types';

class Emitter<C extends EventMap> {
  private subscribers: Subscriber<C>[] = [];

  constructor(private schemas: IOMap<C>) {}

  private getSubscriberByEvent(event: keyof C) {
    return pipe(
      this.subscribers,
      array.findFirst((subscriber) => subscriber.event === event),
    );
  }

  private on<E extends keyof C>(subscriber: EmitterArgs<C, E>) {
    const { event } = subscriber;
    const oldSubscriber = this.getSubscriberByEvent(event);
    const newSubscriber = subscriber as Subscriber<C>;

    this.subscribers = pipe(
      oldSubscriber,
      option.fold(
        () => this.subscribers.concat(newSubscriber),
        () =>
          this.subscribers.map((subscriber) =>
            subscriber.event === event ? newSubscriber : subscriber,
          ),
      ),
    );

    return () => {
      this.off(event);
    };
  }

  public sync<E extends keyof C>(event: E, callback: C[E]) {
    this.on({ event, callback, type: 'async' });
  }

  public async<E extends keyof C>(event: E, callback: AsyncHandler<C[E]>) {
    this.on({ event, callback, type: 'async' });
  }

  public off<E extends keyof C>(event: E) {
    this.subscribers = this.subscribers.filter(
      (subscriber) => subscriber.event !== event,
    );
  }

  public emit<E extends keyof C>(
    event: E,
    data: Parameters<C[E]>[0],
  ): Either<
    ErrorType,
    ReturnType<C[E]> | TaskEither<ErrorType, ReturnType<C[E]>>
  > {
    const subscriber = this.getSubscriberByEvent(event);

    return pipe(
      subscriber,
      either.fromOption(() => noHandler(event)),
      either.chain((subscriber) => {
        const { callback } = subscriber;

        return pipe(
          this.schemas[event].decode(data),
          either.bimap(
            () => invalidParams(data),
            (data) => callback(data),
          ),
        );
      }),
    );
  }
}

export { Emitter };
