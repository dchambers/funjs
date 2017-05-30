const ES6CompatibleIterable = require('./iterable');

const list = (f) =>
  (...args) =>
    new ES6CompatibleIterable([
      () => f(...args)
    ]);

function* _evolve(f, init) {
  let acc = init;
  while (true) {
    yield acc;
    acc = f(acc);
  }
};
const evolve = list(_evolve);

const range = (_start, _stop, step = 1) => {
  const [start, stop] = (_stop !== undefined) ? [_start, _stop] : [0, _start];
  return evolve(n => n + step, start).while(n => n < stop);
};

function* __forAll(items, lists) {
  const [head, ...tail] = lists;
  for (item of head) {
    if (tail.length > 0) {
      yield* __forAll([...items, item], tail);
    }
    else {
      yield [...items, item];
    }
  }
}
function* _forAll(...lists) {
  yield* __forAll([], lists);
}
const forAll = list(_forAll);

const flatten = (list) =>
  list.reduce((acc, val) => [...acc, ...val], []);

const flattenEntries = (entries) =>
  entries.reduce(
    (acc, entry) => Object.assign(acc, {[entry[0]]: entry[1]}), {}
  );

const sort = (list, comparator) => {
  const sortedList = Array.from(list);
  sortedList.sort(comparator);
  return sortedList;
};

module.exports = {list, evolve, range, forAll, flatten, flattenEntries, sort};
