// Real, from-scratch sorting implementations — no Array.prototype.sort.
// Each algorithm is a generator that yields a snapshot after every
// meaningful operation (comparison / swap / write) so the UI can render
// each step without the algorithm knowing anything about rendering.

export type SortStep = {
  array: number[];
  comparing: number[]; // indices currently being compared
  swapping: number[]; // indices currently being swapped/written
  sorted: number[]; // indices confirmed in final position
};

export type SortGenerator = Generator<SortStep, SortStep, void>;

function snapshot(
  array: number[],
  comparing: number[],
  swapping: number[],
  sorted: number[],
): SortStep {
  return { array: [...array], comparing, swapping, sorted: [...sorted] };
}

// O(n^2) time, O(1) space. Adjacent swaps bubble the largest unsorted
// value to the end on every pass.
export function* bubbleSort(input: number[]): SortGenerator {
  const array = [...input];
  const sorted: number[] = [];
  const n = array.length;
  for (let i = 0; i < n; i++) {
    let swappedThisPass = false;
    for (let j = 0; j < n - i - 1; j++) {
      yield snapshot(array, [j, j + 1], [], sorted);
      if (array[j] > array[j + 1]) {
        [array[j], array[j + 1]] = [array[j + 1], array[j]];
        swappedThisPass = true;
        yield snapshot(array, [], [j, j + 1], sorted);
      }
    }
    sorted.unshift(n - i - 1);
    if (!swappedThisPass) {
      for (let k = 0; k < n - i - 1; k++) sorted.unshift(k);
      break;
    }
  }
  return snapshot(array, [], [], Array.from({ length: n }, (_, i) => i));
}

// O(n^2) time, O(1) space. Grows a sorted prefix by inserting each new
// element where it belongs among the elements already placed.
export function* insertionSort(input: number[]): SortGenerator {
  const array = [...input];
  const n = array.length;
  for (let i = 1; i < n; i++) {
    const key = array[i];
    let j = i - 1;
    yield snapshot(array, [i, j], [], Array.from({ length: i }, (_, k) => k));
    while (j >= 0 && array[j] > key) {
      array[j + 1] = array[j];
      yield snapshot(array, [], [j, j + 1], Array.from({ length: i }, (_, k) => k));
      j--;
    }
    array[j + 1] = key;
  }
  return snapshot(array, [], [], Array.from({ length: n }, (_, i) => i));
}

// O(n^2) time, O(1) space. Repeatedly selects the minimum of the
// remaining unsorted region and swaps it into place.
export function* selectionSort(input: number[]): SortGenerator {
  const array = [...input];
  const n = array.length;
  const sorted: number[] = [];
  for (let i = 0; i < n; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      yield snapshot(array, [minIdx, j], [], sorted);
      if (array[j] < array[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      [array[i], array[minIdx]] = [array[minIdx], array[i]];
      yield snapshot(array, [], [i, minIdx], sorted);
    }
    sorted.push(i);
  }
  return snapshot(array, [], [], Array.from({ length: n }, (_, i) => i));
}

// O(n log n) time, O(n) space. Recursively splits the array in half,
// sorts each half, then merges the two sorted halves.
export function* mergeSort(input: number[]): SortGenerator {
  const array = [...input];

  function* mergeRange(lo: number, hi: number): Generator<SortStep, void, void> {
    if (hi - lo <= 1) return;
    const mid = Math.floor((lo + hi) / 2);
    yield* mergeRange(lo, mid);
    yield* mergeRange(mid, hi);

    const left = array.slice(lo, mid);
    const right = array.slice(mid, hi);
    let i = 0;
    let j = 0;
    let k = lo;
    while (i < left.length && j < right.length) {
      yield snapshot(array, [lo + i, mid + j], [], []);
      if (left[i] <= right[j]) {
        array[k] = left[i++];
      } else {
        array[k] = right[j++];
      }
      yield snapshot(array, [], [k], []);
      k++;
    }
    while (i < left.length) {
      array[k] = left[i++];
      yield snapshot(array, [], [k], []);
      k++;
    }
    while (j < right.length) {
      array[k] = right[j++];
      yield snapshot(array, [], [k], []);
      k++;
    }
  }

  yield* mergeRange(0, array.length);
  return snapshot(array, [], [], Array.from({ length: array.length }, (_, i) => i));
}

// O(n log n) average, O(n^2) worst case, O(log n) space. Lomuto partition
// around a pivot, then recurse on the two sides.
export function* quickSort(input: number[]): SortGenerator {
  const array = [...input];
  const sorted = new Set<number>();

  function* sortRange(lo: number, hi: number): Generator<SortStep, void, void> {
    if (lo >= hi) {
      if (lo === hi) sorted.add(lo);
      return;
    }
    const pivot = array[hi];
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      yield snapshot(array, [j, hi], [], [...sorted]);
      if (array[j] < pivot) {
        i++;
        [array[i], array[j]] = [array[j], array[i]];
        yield snapshot(array, [], [i, j], [...sorted]);
      }
    }
    [array[i + 1], array[hi]] = [array[hi], array[i + 1]];
    yield snapshot(array, [], [i + 1, hi], [...sorted]);
    sorted.add(i + 1);

    yield* sortRange(lo, i);
    yield* sortRange(i + 2, hi);
  }

  yield* sortRange(0, array.length - 1);
  return snapshot(array, [], [], Array.from({ length: array.length }, (_, i) => i));
}

// O(n log n) time, O(1) space. Builds a max-heap in place, then
// repeatedly swaps the root (max) to the end and re-heapifies.
export function* heapSort(input: number[]): SortGenerator {
  const array = [...input];
  const n = array.length;
  const sorted: number[] = [];

  function* siftDown(size: number, root: number): Generator<SortStep, void, void> {
    let largest = root;
    const left = 2 * root + 1;
    const right = 2 * root + 2;
    if (left < size) {
      yield snapshot(array, [left, largest], [], sorted);
      if (array[left] > array[largest]) largest = left;
    }
    if (right < size) {
      yield snapshot(array, [right, largest], [], sorted);
      if (array[right] > array[largest]) largest = right;
    }
    if (largest !== root) {
      [array[root], array[largest]] = [array[largest], array[root]];
      yield snapshot(array, [], [root, largest], sorted);
      yield* siftDown(size, largest);
    }
  }

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    yield* siftDown(n, i);
  }
  for (let end = n - 1; end > 0; end--) {
    [array[0], array[end]] = [array[end], array[0]];
    yield snapshot(array, [], [0, end], sorted);
    sorted.unshift(end);
    yield* siftDown(end, 0);
  }
  sorted.unshift(0);

  return snapshot(array, [], [], Array.from({ length: n }, (_, i) => i));
}

export const SORT_ALGORITHMS = {
  bubble: { name: 'Bubble Sort', run: bubbleSort, time: 'O(n²)', space: 'O(1)' },
  insertion: { name: 'Insertion Sort', run: insertionSort, time: 'O(n²)', space: 'O(1)' },
  selection: { name: 'Selection Sort', run: selectionSort, time: 'O(n²)', space: 'O(1)' },
  merge: { name: 'Merge Sort', run: mergeSort, time: 'O(n log n)', space: 'O(n)' },
  quick: { name: 'Quick Sort', run: quickSort, time: 'O(n log n)*', space: 'O(log n)' },
  heap: { name: 'Heap Sort', run: heapSort, time: 'O(n log n)', space: 'O(1)' },
} as const;

export type SortKey = keyof typeof SORT_ALGORITHMS;
