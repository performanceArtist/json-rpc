export type Todo = {
  title: string;
  content: string;
};

export type EventMap = {
  test: (data: { a: number }) => number;
  asyncOne: (data: { id: string }) => Todo;
  asyncMany: (data: { ids: string[] }) => Todo[];
};
