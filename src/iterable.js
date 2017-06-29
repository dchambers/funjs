/* @flow */
type IteratorFactory<T> = (iter: Iterator<T>) => Iterator<T>;

type FilterResult = {
  skip: boolean;
  done: boolean;
};
type TerminatingFilter<T> = (val: T, i: number) => FilterResult;

type Filter<T> = (val: T, i: number) => boolean;
type Mapper<T> = (val: T, i: number) => T;
type Reducer<T, A> = (acc: A, val: T, i: number) => A;

type Finder<T> = {
  value?: T,
  index: number
};

const UNKNOWN_INDEX = 0;

const isIterable = <T> (object: T | Iterable<T>): boolean =>
  typeof (object: any)[Symbol.iterator] === 'function';

const es6Filter = <T> (filter: Filter<T>): TerminatingFilter<T> =>
  (item, n) =>
    ({
      skip: !filter(item, n),
      done: false
    });

const sliceFilter = <T> (begin: number, end: number): TerminatingFilter<T> => {
  if (end === undefined) {
    end = begin;
    begin = 0;
  }

  return (item, n) =>
    ({
      skip: n < begin,
      done: n >= end
    });
};

const whileFilter = <T> (filter: Filter<T>): TerminatingFilter<T> =>
  (item, n) =>
    ({
      skip: false,
      done: !filter(item, n)
    });

const iterReducer = <T, A> (iter: Iterator<T>, reducer: Reducer<T, A>, init: A): A => {
  let i = 0;
  let acc = init;

  let result = null;
  while (!result) {
    const item = iter.next();
    if (!item.done) {
      acc = reducer(acc, item.value, i++);
    }
    else {
      result = acc;
    }
  }

  return result;
};

const iterFinder = <T> (iter: Iterator<T>, filter: Filter<T>): Finder<T> => {
  let i = 0;
  let item = iter.next();
  while (!item.done) {
    if (filter(item.value, i) === true) {
      return {
        value: item.value,
        index: i
      };
    }
    item = iter.next();
    ++i;
  }

  return {
    value: undefined,
    index: -1
  };
};

class EmptyIterator<T> {
  constructor(iter: Iterable<T>) {
  }

  next() {
    return {
      done: true
    };
  }

  // NOTE: FlowType insists that all iterators are iterables even though this is optional
  /*::
  @@iterator(): Iterator<T> {
    throw new Error();
  }
  */
}

class FilteredES6CompatibleIterator<T> {
  iterator: Iterator<T>;
  filter: TerminatingFilter<T>;
  i: number;

  constructor(iterator, filter) {
    this.iterator = iterator;
    this.filter = filter;
    this.i = 0;
  }

  next(): IteratorResult<T, void> {
    let nextItem = null;

    while (!nextItem) {
      const item = this.iterator.next();
      if (item.done) {
        nextItem = {
          done: true
        };
      }
      else {
        const filterResult = this.filter(item.value, this.i++);
        if (filterResult.done) {
          nextItem = {
            done: true
          };
        }
        else if (!filterResult.skip) {
          nextItem = item;
        }
      }
    }

    return nextItem;
  }

  // NOTE: FlowType insists that all iterators are iterables even though this is optional
  /*::
  @@iterator(): Iterator<T> {
    throw new Error();
  }
  */
}

class MappedES6CompatibleIterator<T> {
  iterator: Iterator<T>;
  mapper: Mapper<T>;
  i: number;

  constructor(iterator, mapper) {
    this.iterator = iterator;
    this.mapper = mapper;
    this.i = 0;
  }

  next(): IteratorResult<T, void> {
    const item = this.iterator.next();
    return (item.done) ? {
      done: true
    } : {
      value: this.mapper(item.value, this.i++),
      done: false
    };
  }

  // NOTE: FlowType insists that all iterators are iterables even though this is optional
  /*::
  @@iterator(): Iterator<T> {
    throw new Error();
  }
  */
}

class ES6CompatibleIterable<T> {
  iteratorFactories: Array<IteratorFactory<T>>;

  constructor(iteratorFactories: Array<IteratorFactory<T>>) {
    // NOTE: craziness as per <https://github.com/facebook/flow/issues/2286>
    (this: any)[Symbol.iterator] = (this: any)._iterator;
    this.iteratorFactories = iteratorFactories;
  }

  slice(begin: number, end: number): Iterable<T> {
    return new ES6CompatibleIterable([
      ...this.iteratorFactories,
      (iterator) => new FilteredES6CompatibleIterator(iterator, sliceFilter(begin, end))
    ]);
  }

  while(filter: Filter<T>): Iterable<T> {
    return new ES6CompatibleIterable([
      ...this.iteratorFactories,
      (iterator) => new FilteredES6CompatibleIterator(iterator, whileFilter(filter))
    ]);
  }

  filter(filter: Filter<T>): Iterable<T> {
    return new ES6CompatibleIterable([
      ...this.iteratorFactories,
      (iterator) => new FilteredES6CompatibleIterator(iterator, es6Filter(filter))
    ]);
  }

  map(mapper: Mapper<T>): Iterable<T> {
    return new ES6CompatibleIterable([
      ...this.iteratorFactories,
      (iterator) => new MappedES6CompatibleIterator(iterator, mapper)
    ]);
  }

  reduce<A>(reducer: Reducer<T, A>, init: A): A {
    return iterReducer(this._iterator(), reducer, init);
  }

  find(filter: Filter<T>): ?T {
    return iterFinder(this._iterator(), filter).value;
  }

  findIndex(filter: Filter<T>): number {
    return iterFinder(this._iterator(), filter).index;
  }

  some(filter: Filter<T>): boolean {
    return this.findIndex(filter) !== -1;
  }

  every(filter: Filter<T>): boolean {
    return this.findIndex(i => !filter(i, UNKNOWN_INDEX)) === -1;
  }

  includes(item: T): boolean {
    return this.some(i => i === item);
  }

  join(delimiter: string): string {
    // TODO: see if concatenating to a string is faster in any browsers
    return Array.from(this).join(delimiter);
  }

  forEach(f: (val: T) => void): void {
    for (const item of this) {
      f(item);
    }
  }

  * concat(...items: Array<T | Iterable<T>>): Iterable<T> {
    yield* this;
    for (const item of items) {
      if (isIterable(item)) {
        const iterable: Iterable<T> = (item: any); // workaround for <https://github.com/facebook/flow/issues/2286>
        yield* iterable;
      }
      else {
        const singleItem: T = (item: any); // workaround for <https://github.com/facebook/flow/issues/2286>
        yield singleItem;
      }
    }
  }

  _iterator(): Iterator<T> {
    const iterator = this.iteratorFactories.reduce(
      (prevIterator, iteratorFactory) =>
        iteratorFactory(prevIterator), new EmptyIterator(this));
    return iterator;
  }

  // NOTE: craziness as per <https://github.com/facebook/flow/issues/2286>
  /*::
  @@iterator(): Iterator<T> {
    throw new Error();
  }
  */
}
module.exports = ES6CompatibleIterable;
