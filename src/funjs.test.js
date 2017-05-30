const {list, evolve, range, forAll, flatten, flattenEntries, sort} = require('./funjs');

function* _fib() {
  let a = 1;
  let b = 2;

  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}
const fib = list(_fib);

test('list() and iter::slice() work as expected', () => {
  expect(Array.from(fib().slice(10))).toEqual([1, 2, 3, 5, 8, 13, 21, 34, 55, 89]);
});

test('iter::slice() can be re-iterated', () => {
  const fib10 = fib().slice(10);
  expect(Array.from(fib10)).toEqual([1, 2, 3, 5, 8, 13, 21, 34, 55, 89]);
  expect(Array.from(fib10)).toEqual([1, 2, 3, 5, 8, 13, 21, 34, 55, 89]);
});

test('evolve() works as expected', () => {
  const add1 = (n) => n + 1;
  expect(Array.from(evolve(add1, 0).slice(3))).toEqual([0, 1, 2]);
});

test('iter::filter() works as expected', () => {
  const fib10 = fib().slice(10);
  expect(Array.from(fib10.filter(i => i > 20))).toEqual(
    [21, 34, 55, 89]
  );
});

test('iter::while() works as expected', () => {
  expect(Array.from(fib().while(i => i < 20))).toEqual(
    [1, 2, 3, 5, 8, 13]
  );
});

test('range() works as expected', () => {
  expect(Array.from(range(4))).toEqual([0, 1, 2, 3]);
  expect(Array.from(range(1, 4))).toEqual([1, 2, 3]);
  expect(Array.from(range(0, 4, 2))).toEqual([0, 2]);
});

test('iter::map() works as expected', () => {
  const doubleRange = (start, stop, step) =>
    range(start, stop, step).map(n => n * 2);
  expect(Array.from(doubleRange(3))).toEqual([0, 2, 4]);
  expect(Array.from(doubleRange(100).slice(5))).toEqual([0, 2, 4, 6, 8]);
});

test('iter::reduce() works as expected', () => {
  const sum = (list) =>
    list.reduce((acc, val) => acc + val, 0);
  expect(sum(fib().slice(3))).toEqual(6);
});

test('iter::find() works as expected', () => {
  expect(range(5, 10).find(n => (n % 4) === 0)).toEqual(8);
});

test('iter::findIndex() works as expected', () => {
  expect(range(5, 10).findIndex(n => (n % 4) === 0)).toEqual(3);
});

test('iter::some() works as expected', () => {
  expect(range(10).some(n => n > 5)).toBeTruthy();
  expect(range(5).some(n => n > 5)).toBeFalsy();
});

test('iter::some() short-cuts as soon as a positive value is found', () => {
  const OneBillion = 1000000000;
  expect(range(OneBillion).some(n => n >= 0)).toBeTruthy();
});

test('iter::every() works as expected', () => {
  expect(range(10).every(n => n < 10)).toBeTruthy();
  expect(range(10).every(n => n < 5)).toBeFalsy();
});

test('iter::every() short-cuts as soon as a negative value is found', () => {
  const OneBillion = 1000000000;
  expect(range(OneBillion).every(n => n < 0)).toBeFalsy();
});

test('iter::contains() works as expected', () => {
  expect(range(3).includes(2)).toBeTruthy();
  expect(range(3).includes(3)).toBeFalsy();
});

test('iter::join() works as expected', () => {
  expect(range(3).join('+')).toEqual('0+1+2');
});

test('iter::forEach() works as expected', () => {
  const list = [];
  range(1, 4).forEach(n => {
    list.push(n);
  });
  expect(list).toEqual([1, 2, 3]);
});

test('iter::concat() works as expected', () => {
  const concattedRange = range(1, 3).concat(range(3, 5), [5, 6], 7);
  expect(Array.from(concattedRange)).toEqual([1, 2, 3, 4, 5, 6, 7]);
});

test('forAll() works as expected', () => {
  expect(Array.from(forAll(['a', 'b'], ['x', 'y']))).toEqual(
    [
      ['a', 'x'],
      ['a', 'y'],
      ['b', 'x'],
      ['b', 'y']
    ]
  );
});

test('flatten() works as expected', () => {
  expect(Array.from(flatten([['a', 'b'], ['c', 'd']]))).toEqual(
    ['a', 'b', 'c', 'd']
  );
  expect(Array.from(flatten(range(3).map(n => [`a${n}`, `b${n}`])))).toEqual(
    ['a0', 'b0', 'a1', 'b1', 'a2', 'b2']
  );
});

test('flattenEntries() works as expected', () => {
  const replaceLabelHyphens = (obj) =>
    flattenEntries(Object.entries(obj).map(([key, val]) => {
      if (val instanceof Object) {
        return [key, replaceLabelHyphens(val)];
      }
      else if (key === 'label') {
        return [key, val.replace('-', '+')];
      }
      else {
        return [key, val];
      }
    }));

  expect(replaceLabelHyphens({
    label: 'A-B',
    obj: {
      label: 'C-D'
    }
  })).toEqual({
    label: 'A+B',
    obj: {
      label: 'C+D'
    }
  });
});

test('sort() works as expected', () => {
  const sub1 = n => n - 1;
  const descNums = evolve(sub1, 3).slice(3);

  expect(Array.from(descNums)).toEqual([3, 2, 1]);
  expect(Array.from(sort(descNums))).toEqual([1, 2, 3]);
});
