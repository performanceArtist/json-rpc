import { Request, Response } from 'express';
import jsonRPC, { IParsedObjectRequest } from 'jsonrpc-lite';
import { bimap, either } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { array } from 'fp-ts/lib/Array';

import { getRPCError } from './rpc';
import { makePerform, filterNotificationResults } from './perform';
import { Emitter } from './emitter';

export const makeRPCHandler = (emitter: Emitter<any>) => {
  const perform = makePerform(emitter);

  return (req: Request, res: Response) => {
    const { rpc } = req;

    if (Array.isArray(rpc)) {
      const eitherResults = rpc.map(perform).filter(filterNotificationResults);
      const results = array.sequence(either)(eitherResults);

      pipe(
        results,
        bimap(
          () => res.sendStatus(400),
          results => res.json(results),
        ),
      );
    } else {
      const result = perform(rpc);

      if (result === 'notificationResult') {
        return res.sendStatus(200);
      }

      pipe(
        result,
        bimap(
          error =>
            res.json(
              jsonRPC.error((rpc as IParsedObjectRequest).payload.id, getRPCError(error)),
            ),
          ({ id, result }) => res.json(jsonRPC.success(id, result)),
        ),
      );
    }
  };
};
