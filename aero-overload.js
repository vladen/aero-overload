'use strict';

const $overloaded = Symbol('overloaded');

const aliases = new Map;

const is = type => value => typeof value === type;
const isFunction = is('function');
const isObject = is('object');
const isOverloaded = value => isFunction(value) && value[$overloaded];
const isString = is('string');

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
  descriptor: (value) => {
    if (!isObject(value)) fail('descriptor object', value);
  },
  instance: (value) => {
    if (!isFunction(value)) fail('instance function', value);
  },
  key: (value) => {
    if (!isString(value)) fail('key string', value);
  },
  name: (value) => {
    if (!isString(value)) fail('name string', value);
  },
  predicate: (value) => {
    if (!isFunction(value)) fail('predicate function', value);
  },
  predicates: (value) => {
    if (!Array.isArray(value)) fail('array of predicate functions', value);
  },
  target: (value) => {
    if (!isObject(value)) fail('target object', value);
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
    validators.predicates(predicates);
    validators.instance(instance);
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
  validators.name(name);

  return (target, key, descriptor) => {
    validators.target(target);
    validators.key(key);
    validators.descriptor(descriptor);
    validators.instance(descriptor.value);
    let overloaded;
    if (name in target) {
      const declaration = Object.getOwnPropertyDescriptor(target, name);
      overloaded = declaration.value;
      if (!isOverloaded(overloaded)) {
        if (!declaration.configurable)
          throw new TypeError('The method being overloaded is not configurable');
        if (key === name) descriptor.value = overloaded;
        else {
          overloaded = declaration.value = build(name, overloaded);
          Object.defineProperty(target, name, declaration);          
        }
      }
    }
    else {
      overloaded = build(name);
      if (key === name) descriptor.value = overloaded;
      else Object.defineProperty(target, name, { value: overloaded });
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
