const isIterable = object =>
  (object !== null) && (typeof object[Symbol.iterator] === 'function');

const es6Filter = (filter) =>
  (item, n) =>
    ({
      skip: !filter(item, n),
      done: false
    });

const sliceFilter = (begin, end) => {
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

const whileFilter = (filter) =>
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

class FilteredES6CompatibleIterator {
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

class MappedES6CompatibleIterator {
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

class ES6CompatibleIterable {
  constructor(iteratorFactories) {
    this.iteratorFactories = iteratorFactories;
  }

  slice(begin, end) {
    return new ES6CompatibleIterable([
      ...this.iteratorFactories,
      (iterator) => new FilteredES6CompatibleIterator(iterator, sliceFilter(begin, end))
    ]);
  }

  while(filter) {
    return new ES6CompatibleIterable([
      ...this.iteratorFactories,
      (iterator) => new FilteredES6CompatibleIterator(iterator, whileFilter(filter))
    ]);
  }

  filter(filter) {
    return new ES6CompatibleIterable([
      ...this.iteratorFactories,
      (iterator) => new FilteredES6CompatibleIterator(iterator, es6Filter(filter))
    ]);
  }

  map(mapper) {
    return new ES6CompatibleIterable([
      ...this.iteratorFactories,
      (iterator) => new MappedES6CompatibleIterator(iterator, mapper)
    ]);
  }

  reduce(reducer, init) {
    return iterReducer(this[Symbol.iterator](), reducer, init);
  }

  find(filter) {
    return iterFinder(this[Symbol.iterator](), filter).value;
  }

  findIndex(filter) {
    return iterFinder(this[Symbol.iterator](), filter).index;
  }

  some(filter) {
    return this.findIndex(filter) !== undefined;
  }

  every(filter) {
    return this.findIndex(i => !filter(i)) === undefined;
  }

  includes(item) {
    return this.some(i => i === item);
  }

  join(delimiter) {
    // TODO: see if concatenating to a string is faster in any browsers
    return Array.from(this).join(delimiter);
  }

  forEach(f) {
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
