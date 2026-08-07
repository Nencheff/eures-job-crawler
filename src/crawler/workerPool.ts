/** Runs `worker` over `items` with at most `concurrency` in flight at once. */
export const runWorkerPool = async <TItem, TResult>(
  items: TItem[],
  concurrency: number,
  worker: (item: TItem, index: number) => Promise<TResult>,
): Promise<TResult[]> => {
  const results: TResult[] = new Array(items.length);
  let nextIndex = 0;

  const runNext = async (): Promise<void> => {
    const index = nextIndex;
    nextIndex += 1;
    if (index >= items.length) return;

    results[index] = await worker(items[index], index);
    await runNext();
  };

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => runNext());
  await Promise.all(workers);

  return results;
};
