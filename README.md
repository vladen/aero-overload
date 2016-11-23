# aero-overload
ECMAScript function/method overloading with support of several approaches: decorator, fluent builder, neat factory.

__Contents:__
* [Installation](#installation)
* [Examples](#examples)
* [Dependencies](#dependencies)
* [API documentation](https://github.com/vladen/aero-overload/tree/master/documentation)
* [Test specifications](https://github.com/vladen/aero-overload/tree/master/specifications)
* [License](#license)

## Installation

```
$ npm install aero-overload
```

## Examples

### Decorator syntax

```js
overload.alias(Number, _.isNumber).alias(String, _.isString);

class Test {
  method() {
    return 'default';
  }

  @overload('method' /* name of the oveloaded method */, value => typeof value === 'number' && value > 0 /* predicate list to test arguments array */)
  methodForPositiveNumber(positiveNumber) {
    return `positive number: ${positiveNumber}`;
  }

  @overload('method', Number)
  methodForNumber(number) {
    return 'number';
  }

  @overload('method', String)
  methodForArray(string) {
    return `string: ${string}`;
  }

  @overload('test', value => typeof value === 'number' && value > 0, String)
  methodForPositiveNumberAndString(positiveNumber, string) {
    return `positive number: ${positiveNumber}, string: ${string}`;
  }

  @overload('test', Number, String)
  methodForNumberAndString(number, string) {
    return `number: ${number}, string: ${string}`;
  }
}

var test = new Test;
test.method();
// <- "default"
test.method([]);
// <- "array: []"
test.method(1);
// <- "positive number: 1"
test.method(0);
// <- "number: 0"
test.method('abc');
// <- "string: abc"
test.method(1, 'abc');
// <- "positive number: 1, string: abc"
test.method(0, 'abc');
// <- "number: 0, string: abc"
test.method(0, 1, 2);
// <- error
```

### Fluent builder syntax

```js
var test = overload
  .alias(Window, value => value instanceof Window)
  .build(() => 'fallback')
  .match([], () => 'default')
  .match([Number], () => 'number')
  .match([Window], () => 'window')
  .match([Number, Window], () => 'number, window')
  .match([Window, Number], () => 'window, number');

test();             // default
test(1);            // number
test(window);       // window
test(1, window);    // number, window
test(window, 1);    // window, number
test({});           // fallback
```

### Neat factory syntax

```js
var test = overload
  .alias('number', _.isNumber)
  .alias('string', _.isString)
  .build(
    /* fallback overload always does first */
    () => 'fallback',
    [] /* predicate list */, () => 'default' /* function overload */,
    ['number'], () => 'number',
    ['string'], () => 'string',
    ['number', 'string'], () => 'number, string',
    ['string', 'number'], () => 'string, number'
  );

test();             // default
test(1);            // number
test('abc');        // string
test(1, 'abc');     // number, string
test('abc', 1);     // string, number
test({});           // fallback
```

## Dependencies

Since aerobus heavily uses ES6 features (Maps, Symbols, iterators, arrow functions, rest parameters, etc.), it depends on [core-js](https://github.com/zloirock/core-js) standard library when hosted in legacy environment and relies on [babeljs](babeljs.io) to transpile ES6 code into ES5.

The build folder of this repository contains ready to use both modern (ES6) and legacy (ES5) verions of library and tests.

The source folder of this repository contains original, ES6 version of library and tests.

Npm package description file (package.json) supports both ES6 and ES5 environments trying to load modern version of library first and falling back to legacy version in case of error. 
For aerobus to work in any legacy environment it's necessary to polyfill global namespace via [core-js](https://github.com/zloirock/core-js) library.

# License

[The MIT License (MIT)](https://github.com/vladen/aero-overload/blob/master/LICENSE)