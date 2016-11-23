'use strict';

const $overloaded = Symbol('overloaded');

const aliases = new Map;

const isFunction = value => typeof value === 'function';
const isOverloaded = value => isFunction(value) && value[$overloaded];

const matchers = [
  () => () => true,
  ([predicate]) => function(binding, parameters) {
    return predicate.call(binding, parameters[0]);
  },
  ([predicate1, predicate2]) => function(binding, parameters) {
    return predicate1.call(binding, parameters[0])
        && predicate2.call(binding, parameters[1]);
  },
  ([predicate1, predicate2, predicate3]) => function(binding, parameters) {
    return predicate1.call(binding, parameters[0])
        && predicate2.call(binding, parameters[1])
        && predicate3.call(binding, parameters[2])
  }
];

matchers.default = (predicates) => function(binding, parameters) {
  const arity = predicates.length;
  for (let i = -1; ++i < arity;)
    if (!predicates[i].call(binding, parameters[i]))
      return false;
  return true;
};

const validators = {
  instance: (value) => {
    if (!isFunction(value)) fail('overload function', value);
  },
  name: (value) => {
    if (typeof value !== 'string') fail('name string', value);
  },
  predicate: (value) => {
    if (!isFunction(value)) fail('predicate function', value);
  },
  predicates: (value) => {
    if (!Array.isArray(value)) fail('array of predicate functions', value);
  }
}

function alias(name, predicate) {
  validators.predicate(predicate);
  aliases.set(name, predicate);
  return overload;
}

function build(name, ...branches) {
  if (isFunction(name)) {
    branches.unshift(name);
    name = '';
  }
  else if (name == null) name = '';
  else validators.name(name);

  const context = {
    miss: null,
    partitions: []
  };

  const overloaded = Function('context', 'execute', `
return function ${name}() {
  return execute(this, context, arguments);
}
    `)(context, execute);

  function match(predicates, instance) {
    validators.instance(instance);
    validators.predicates(predicates);
    predicates = predicates.map(predicate => aliases.get(predicate) || predicate);
    predicates.forEach(validators.predicate);
    const arity = predicates.length;
    const matcher = (matchers[arity] || matchers.default)(predicates);
    const partition = context.partitions[arity] || (context.partitions[arity] = []);
    partition.push({ matcher, instance });
    return overloaded;
  }

  let i = branches.length;
  while (i) {
    const instance = branches[--i];
    if (i) {
      const predicates = branches[--i];
      match(predicates, instance);
    }
    else {
      validators.instance(instance);
      context.miss = instance;
    }
  }

  return Object.defineProperties(overloaded, {
    [$overloaded]: { value: true },
    match: { value: match }
  });
}

function execute(binding, context, parameters) {
  const partition = context.partitions[parameters.length];
  if (partition) {
    const length = partition.length;
    for (let i = -1; ++i < length;) {
      const branch = partition[i];
      if (branch.matcher(binding, parameters))
        return branch.instance.apply(binding, parameters);
    }
  }
  if (context.miss)
    return context.miss.apply(binding, parameters);    
  throw new TypeError('The passed arguments do not match any overload');
}

function fail(type, value) {
  throw new TypeError(`Expected ${type} but found ${typeof value}`);
}

function overload(name, ...predicates) {
  return (target, $, descriptor) => {
    let overloaded;
    if (name in target) {
      const declaration = Object.getOwnPropertyDescriptor(target, name);
      overloaded = declaration.value;
      if (!isOverloaded(overloaded)) {
        if (!declaration.configurable)
          throw new TypeError('The method being overloaded is not configurable');
        overloaded = declaration.value = build(name, overloaded);
        Object.defineProperty(target, name, declaration);
      }
    }
    else {
      overloaded = build(name);
      Object.defineProperty(target, name, { value: overloaded });
    }
    overloaded.match(predicates, descriptor.value);
    return descriptor;
  };
}

Object.defineProperties(overload, {
  alias: { value: alias },
  build: { value: build }
});

export default overload;
