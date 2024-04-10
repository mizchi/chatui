export function createAsyncQueue<T>(process: (input: T) => Promise<void>) {
  let queue: T[] = [];
  let isProcessing = false;
  let drainResolve: (() => void) | null = null;

  const processNext = async () => {
    if (isProcessing || queue.length === 0) {
      if (queue.length === 0 && drainResolve) {
        const resolve = drainResolve;
        drainResolve = null;
        resolve();
      }
      return;
    }
    isProcessing = true;
    const item = queue.shift()!;

    try {
      await process(item);
    } catch (e) {
      console.error("Error processing item:", e);
    } finally {
      isProcessing = false;
      // `await`を使って次のタスクの処理がこの処理が完全に終了してからになるようにする
      await processNext();
    }
  };

  const enqueue = async (item: T) => {
    queue.push(item);
    if (!isProcessing) {
      await processNext();
    }
  };

  const drain = () => {
    if (queue.length === 0 && !isProcessing) {
      return Promise.resolve();
    } else {
      return new Promise<void>((resolve) => {
        drainResolve = resolve;
      });
    }
  };

  return { enqueue, drain };
}
export function createAsyncQueue2<T>(process: (input: T) => Promise<void>) {
  let queue: T[] = [];
  let isProcessing = false;
  let drainResolve: (() => void) | null = null;

  const processNext = async () => {
    // if (isProcessing || queue.length === 0) {
    //   if (queue.length === 0 && drainResolve) {
    //     drainResolve();
    //     drainResolve = null;
    //   }
    //   return;
    // }
    // isProcessing = true;
    // const item = queue.shift()!;
    // await process(item).catch(e => console.error("Error processing item:", e));
    // isProcessing = false;
    // processNext();
    if (isProcessing || queue.length === 0) {
      if (queue.length === 0 && drainResolve) {
        const resolve = drainResolve;
        drainResolve = null;
        resolve();
      }
      return;
    }
    isProcessing = true;
    const item = queue.shift()!;

    try {
      await process(item);
    } catch (e) {
      console.error("Error processing item:", e);
    } finally {
      isProcessing = false;
      // `await`を使って次のタスクの処理がこの処理が完全に終了してからになるようにする
      await processNext();
    }
  };

  const enqueue = async (item: T) => {
    queue.push(item);
    if (!isProcessing) {
      processNext();
    }
  };

  const drain = () => {
    if (queue.length === 0 && !isProcessing) {
      return Promise.resolve();
    } else {
      return new Promise<void>((resolve) => {
        drainResolve = resolve;
      });
    }
  };

  return { enqueue, drain };
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  test("with async counter", async () => {
    let counter = 0;
    let doneCount = 0;

    const processFunction = async (input: string) => {
      await wait(16);
      counter++;
    };

    const asyncQueue = createAsyncQueue<string>(processFunction);
    asyncQueue.drain().then(() => doneCount++);
    await wait(0);
    expect(doneCount).toBe(1);

    expect(counter).toBe(0);
    asyncQueue.enqueue("task1");
    asyncQueue.drain().then(() => doneCount++);
    expect(doneCount).toBe(1);
    expect(counter).toBe(0);
    await wait(32);
    expect(counter).toBe(1);
    expect(doneCount).toBe(2);
    asyncQueue.enqueue("task2");
    asyncQueue.enqueue("task3");
    expect(counter).toBe(1);
    await wait(20);
    expect(counter).toBe(2);
    await wait(20);
    asyncQueue.drain().then(() => doneCount++);
    expect(counter).toBe(3);
    await wait(0);
    expect(doneCount).toBe(3);

    await asyncQueue.drain();
    expect(counter).toBe(3);
    asyncQueue.drain().then(() => doneCount++);
    await wait(0);
    expect(doneCount).toBe(4);
  });
  test('asyncQueue test', async () => {
    const log: string[] = [];
    const processFunction = async (input: string) => {
      log.push(input);
    };
    const asyncQueue = createAsyncQueue<string>(processFunction);
    asyncQueue.enqueue("task1");
    asyncQueue.enqueue("task2");
    await asyncQueue.drain();
    expect(log).toStrictEqual(["task1", "task2"]);
  });

  test('drain test', async () => {
    const log: string[] = [];
    const processFunction = async (input: string) => {
      log.push(input);
    };
    const asyncQueue = createAsyncQueue<string>(processFunction);
    asyncQueue.enqueue("task1");
    asyncQueue.enqueue("task2");
    await asyncQueue.drain();
    expect(log).toStrictEqual(["task1", "task2"]);
  });

  test("overrap enqueue and drain", async () => {
    const TICK = 16;

    const log: string[] = [];
    let started = 0;
    let ended = 0;
    const processFunction = async (input: string) => {
      started++;
      await wait(TICK * 2);
      log.push(input);
      ended++
    };
    const asyncQueue = createAsyncQueue<string>(processFunction);
    asyncQueue.enqueue("task1"); // expect 2 ticks
    asyncQueue.enqueue("task2"); // expect 4 ticks
    asyncQueue.enqueue("task3"); // expect 6 ticks
    expect(started).toBe(1);
    expect(ended).toBe(0);
    await wait(TICK * 1); // 1 ticks
    expect(started).toBe(1);
    expect(ended).toBe(0);
    await wait(TICK * 2); // 3 ticks
    expect(started).toBe(2);
    expect(ended).toBe(1);
    await wait(TICK * 2); // 5 ticks
    expect(started).toBe(3);
    expect(ended).toBe(2);
    asyncQueue.enqueue("task4"); // expect 8 ticks
    await wait(TICK * 2); // 7 ticks
    expect(started).toBe(4);
    expect(ended).toBe(3);
    await wait(TICK * 2); // 9 ticks
    expect(ended).toBe(4);
  });
}

export function createTextSplitter(initial: string, matcher: RegExp) {
  let accumulatedText = initial;

  function update(text: string) {
    const results = [];
    accumulatedText += text;
    let match;

    while ((match = matcher.exec(accumulatedText)) !== null) {
      const matchIndex = match.index + match[0].length;
      const segment = accumulatedText.slice(0, matchIndex);
      results.push(segment);
      accumulatedText = accumulatedText.slice(matchIndex);
      matcher.lastIndex = 0; // マッチの位置をリセット
    }

    return results;
  }

  function drain() {
    const remainingText = accumulatedText;
    accumulatedText = ''; // 蓄積されたテキストをクリア
    return remainingText ? [remainingText] : [];
  }

  return { update, drain };
}
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  let results: string[] = [];
  test("text splitter", () => {
    const i0 = 'こ';
    const i1 = 'んにち';
    const i2 = 'は。今日はいい天気';
    const i3 = 'ですね。ああ。こんな日は';
    const i4 = 'どこかに遊びに行きたいです';

    const textSplitter = createTextSplitter('', /(。|？|\?)/);
    results = textSplitter.update(i0);
    expect(results).toEqual([]);
    results = textSplitter.update(i1);
    expect(results).toEqual([]);

    results = textSplitter.update(i2);
    expect(results).toEqual(['こんにちは。']);
    results = textSplitter.update(i3);
    expect(results).toEqual(['今日はいい天気ですね。', 'ああ。']);
    results = textSplitter.update(i4);
    expect(textSplitter.drain()).toEqual(['こんな日はどこかに遊びに行きたいです']);
  });
}