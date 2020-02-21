import { fold } from 'fp-ts/lib/Option';
import { Either, bimap, chain, fromOption } from 'fp-ts/lib/Either';
import { findFirst } from 'fp-ts/lib/Array';
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
} from './emitterTypes';

class Emitter<C extends EventMap> {
  private subscribers: Subscriber<C>[] = [];

  constructor(private schemas: IOMap<C>) {}

  private on<E extends keyof C>(args: EmitterArgs<C, E>) {
    const { event, callback, type } = args;
    const oldSubscriber = findFirst(
      (subscriber: Subscriber<C>) => subscriber.event === event,
    )(this.subscribers);
    const newSubscriber = { event, callback, type };

    this.subscribers = pipe(
      oldSubscriber,
      fold(
        () => this.subscribers.concat(newSubscriber),
        () =>
          this.subscribers.map(subscriber =>
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
      subscriber => subscriber.event !== event,
    );
  }

  public emit<E extends keyof C>(
    event: E,
    data: Parameters<C[E]>[0],
  ): Either<ErrorType, ReturnType<C[E]>> | Either<ErrorType, TaskEither<ErrorType, ReturnType<C[E]>>> {
    const subscriber = findFirst<Subscriber<C>>(
      subscriber => subscriber.event === event,
    )(this.subscribers);

    return pipe(
      subscriber,
      fromOption(() => noHandler(event)),
      chain(subscriber => {
        const { callback } = subscriber;

        return pipe(
          this.schemas[event].decode(data),
          bimap(
            () => invalidParams(data),
            data => callback(data),
          ),
        );
      }),
    );
  }
}

export { Emitter };
