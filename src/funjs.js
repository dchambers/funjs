/* @flow */
const ES6CompatibleIterable = require('./iterable');

// NOTE: using `mixed` doesn't work because it reduces type information out of `list`
// const list = (f: (...args: Array<mixed>) => Iterable<mixed>) =>
//   (...args: Array<mixed>) =>
//     new ES6CompatibleIterable([
//       () => f(...args)
//     ]);

// NOTE: if all args are of type `T` then we can't pass functions that take arguments of different types
// const list = <T: mixed> (f: (...args: Array<T>) => Iterable<mixed>) =>
//   (...args: Array<T>) =>
//     new ES6CompatibleIterable([
//       () => f(...args)
//     ]);

// NOTE: the hack of only using a fixed number of parameters should resolve this issue, yet for some reason doesn't!
// const list = <T1: mixed, T2: mixed> (f: (arg1: T1, arg2: T2) => Iterable<mixed>) =>
//   (arg1: T1, arg2: T2) =>
//     new ES6CompatibleIterable([
//       () => f(arg1, arg2)
//     ]);

// NOTE: using `any` doesn't work because all array items must still be of the same type
// const list = <T: any> (f: (...args: Array<T>) => Iterable<mixed>) =>
//   (...args: Array<T>) =>
//     new ES6CompatibleIterable([
//       () => f(...args)
//     ]);

const list = (f: (...args: Array<any>) => Iterable<mixed>) =>
  (...args: Array<mixed>) =>
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
