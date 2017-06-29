/* @flow */
const ES6CompatibleIterable = require('./iterable');

const list = <T> (f: (...args: Array<any>) => Iterable<T>) =>
  (...args: Array<any>) =>
    new ES6CompatibleIterable([
      () => f(...args)
    ]);

function* _evolve<Acc: mixed>(f: (acc: Acc) => Acc, init: Acc) {
  let acc = init;
  while (true) {
    yield acc;
    acc = f(acc);
  }
};
const evolve = list(_evolve);

const range = (_start: number, _stop: ?number, step: number = 1): Iterable<number> => {
  const [start, stop] = ((_stop !== null) && (_stop !== undefined)) ? [_start, _stop] : [0, _start];
  return evolve(n => n + step, start).while(n => n < stop);
};

function* __forAll(items: Array<mixed>, lists): Iterable<Array<mixed>> {
  const [head, ...tail] = lists;
  for (const item of head) {
    if (tail.length > 0) {
      yield* __forAll([...items, item], tail);
    }
    else {
      yield [...items, item];
    }
  }
}
function* _forAll(...lists: Array<Iterable<mixed>>) {
  yield* __forAll([], lists);
}
const forAll = list(_forAll);

console.log(forAll([1, 2], [5, 10]));

const flatten = <T: mixed> (list: Array<Array<T>>): Array<T> =>
  list.reduce((acc, val) => [...acc, ...val], []);

const flattenEntries = <T: Object> (entries: T): T =>
  entries.reduce(
    (acc, entry) => Object.assign(acc, {[entry[0]]: entry[1]}), {}
  );

const sort = <T: mixed> (list: Array<T>, comparator: (a: T, b: T) => number): Array<T> => {
  const sortedList = Array.from(list);
  sortedList.sort(comparator);
  return sortedList;
};

module.exports = {list, evolve, range, forAll, flatten, flattenEntries, sort};
