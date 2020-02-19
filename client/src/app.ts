import { EventMap } from '../../server/src/server';

import { makeRPCClient } from './makeRPCClient';

const serverURL = 'http://localhost:5000';
const RPCClient = makeRPCClient<EventMap>(serverURL);

RPCClient.call('test', { a: '' as any }).then(data => {
  console.log(data);
}).catch(error => {
  console.error(error);
});

RPCClient.call('test', { a: 5 }).then(data => {
  console.log(data);
}).catch(error => {
  console.error(error);
});

const callA = {
  method: 'test' as const,
  data: { a: 1 }
};

const callB = {
  method: 'test' as const,
  data: { a: 2 }
};

RPCClient.batch(callA, callB).then(([a, b]) => {
  console.log(a, b);
}).catch(error => {
  console.error(error);
});
