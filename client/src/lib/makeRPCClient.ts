import axios from 'axios';
import jsonRPC from 'jsonrpc-lite';

export const makeRPCClient = <
  EventMap extends { [key: string]: (data: any) => any }
>(
  url: string,
) => {
  type Return<T extends keyof EventMap> = ReturnType<EventMap[T]>;

  const call = <E extends keyof EventMap>(
    method: E,
    data: Parameters<EventMap[E]>[0],
  ): Promise<Return<E>> => {
    const requestData = jsonRPC.request(
      Math.random().toString(),
      method as string,
      data,
    );

    return axios.post(url, requestData).then(({ data }) => {
      if (data.result) {
        return data.result;
      } else {
        throw data.error;
      }
    });
  };

  type Call<E extends keyof EventMap> = {
    method: E;
    data: Parameters<EventMap[E]>[0];
  };

  type BatchCall = {
    <A extends keyof EventMap>(a: Call<A>): Promise<[Return<A>]>;
    <A extends keyof EventMap, B extends keyof EventMap>(
      a: Call<A>,
      b: Call<B>,
    ): Promise<[Return<A>, Return<B>]>;
    <
      A extends keyof EventMap,
      B extends keyof EventMap,
      C extends keyof EventMap
    >(
      a: Call<A>,
      b: Call<B>,
      c: Call<C>
    ): Promise<[Return<A>, Return<B>, Return<C>]>;
  }

  const batch: BatchCall = <E extends keyof EventMap>(
    ...actions: { method: E; data: Parameters<EventMap[E]>[0] }[]
  ): Promise<any> => {
    const requestData = actions.map(({ method, data }) =>
      jsonRPC.request(Math.random().toString(), method as string, data),
    );

    return axios.post(url, requestData).then(({ data }) => {
      if (data.error || !Array.isArray(data)) {
        throw data.error;
      } else {
        return data;
      }
    });
  };

  return {
    call,
    batch,
  };
};
