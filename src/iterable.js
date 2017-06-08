/* TODO: enable flow */
type IteratorFactory<T> = () => Iterator<T>;
type FilterResult = {
  skip: boolean;
  done: boolean;
};
type TerminatingFilter<T> = (val: T, i: number) => FilterResult;
type Mapper<T> = (val: T, i: number) => T;

type Filter<T> = (val: T, i: number) => boolean;

const isIterable = object =>
  (object !== null) && (typeof object[Symbol.iterator] === 'function');

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

const iterReducer = (iter, reducer, init) => {
  let acc = init;
  while (true) {
    const item = iter.next();
    if (!item.done) {
      acc = reducer(acc, item.value, this.i++, null);
    }
    else {
      return acc;
    }
  }
};

const iterFinder = (iter, matcher) => {
  let i = 0;
  while (true) {
    const item = iter.next();
    if (!item.done) {
      if (matcher(item.value) === true) {
        return {
          value: item.value,
          index: i
        };
      }
    }
    else {
      return {
        value: undefined,
        index: undefined
      };
    }
    ++i;
  }
};

class FilteredES6CompatibleIterator<T: mixed> {
  iterator: Iterator<T>;
  filter: Filter<T>;
  i: number;

  constructor(iterator, filter) {
    this.iterator = iterator;
    this.filter = filter;
    this.i = 0;
  }

  next() {
    let item;
    let filterResult;

    do {
      item = this.iterator.next();
      if (item.done) {
        break;
      }

      filterResult = this.filter(item.value, this.i++);
      item = (!filterResult.done) ? item : {
        done: true
      };
    } while (!item.done && filterResult.skip);

    return item;
  }
}

class MappedES6CompatibleIterator<T: mixed> {
  iterator: Iterator<T>;
  mapper: Mapper<T>;
  i: number;

  constructor(iterator, mapper) {
    this.iterator = iterator;
    this.mapper = mapper;
    this.i = 0;
  }

  next() {
    const item = this.iterator.next();
    return {
      value: this.mapper(item.value, this.i++, null),
      done: item.done
    };
  }
}

class ES6CompatibleIterable<T: mixed> {
  iteratorFactories: Array<IteratorFactory<mixed>>;

  constructor(iteratorFactories) {
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

  reduce(reducer, init) {
    return iterReducer(this[Symbol.iterator](), reducer, init);
  }

  find(filter: Filter<T>) {
    return iterFinder(this[Symbol.iterator](), filter).value;
  }

  findIndex(filter) {
    return iterFinder(this[Symbol.iterator](), filter).index;
  }

  some(filter: Filter<T>) {
    return this.findIndex(filter) !== undefined;
  }

  every(filter: Filter<T>) {
    return this.findIndex(i => !filter(i)) === undefined;
  }

  includes(item: T) {
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

  * concat(...items) {
    yield* this;
    for (const item of items) {
      if (isIterable(item)) {
        yield* item;
      }
      else {
        yield item;
      }
    }
  }

  [Symbol.iterator]() {
    const iterator = this.iteratorFactories.reduce(
      (prevIterator, iteratorFactory) =>
        iteratorFactory(prevIterator), null);
    return iterator;
  }
}
module.exports = ES6CompatibleIterable;
