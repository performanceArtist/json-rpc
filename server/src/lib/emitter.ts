import { Type } from 'io-ts';
import { fold } from 'fp-ts/lib/Option';
import { Either, bimap, chain, fromOption } from 'fp-ts/lib/Either';
import { findFirst } from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/pipeable';

import {
  EventMap,
  Subscriber,
  ErrorType,
  noHandler,
  invalidParams,
} from './emitterTypes';

class Emitter<C extends EventMap> {
  private subscribers: Subscriber<C>[] = [];

  public on<E extends keyof C>(
    event: E,
    callback: C[E],
    schema: Type<Parameters<C[E]>[0]>,
  ) {
    const oldSubscriber = findFirst(
      (subscriber: Subscriber<C>) => subscriber.event === event,
    )(this.subscribers);
    const newSubscriber = { event, callback, schema };

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

  public off<E extends keyof C>(event: E) {
    this.subscribers = this.subscribers.filter(
      subscriber => subscriber.event !== event,
    );
  }

  public emit<E extends keyof C>(
    event: E,
    data: Parameters<C[E]>[0],
  ): Either<ErrorType, any> {
    const subscriber = findFirst<Subscriber<C>>(
      subscriber => subscriber.event === event,
    )(this.subscribers);

    return pipe(
      subscriber,
      fromOption(() => noHandler(event)),
      chain(subscriber => {
        const { schema, callback } = subscriber;

        return pipe(
          schema.decode(data),
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
