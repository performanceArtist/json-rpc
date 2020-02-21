import { EventMap } from '../../server/src/tasks';

import { makeRPCClient } from './makeRPCClient';

const serverURL = 'http://localhost:5000';
const RPCClient = makeRPCClient<EventMap>(serverURL);

RPCClient.call('test', { a: 5 })
  .then(result => console.log(result))
  .catch(console.error);

RPCClient.call('test', { a: '' as any })
  .then(result => console.log(result))
  .catch(console.error);

RPCClient.call('asyncOne', { id: 'TEST' })
  .then(result => console.log(result))
  .catch(console.error);

const callA = {
  method: 'test' as const,
  data: { a: 1 },
};

const callB = {
  method: 'test' as const,
  data: { a: 2 },
};

const asyncCall = {
  method: 'asyncOne' as const,
  data: { id: 'TEST' },
};

RPCClient.batch(callA, callB, asyncCall)
  .then(([a, b, c]) => console.log(a, b, c))
  .catch(console.error);
