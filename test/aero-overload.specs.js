import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import overload from '../aero-overload.js';

chai.use(sinonChai);

describe('overload', () => {
  it('is a function', () =>
    expect(overload).to.be.a('function'));

  describe('.alias', () => {
    it('is a function', () =>
      expect(overload.alias).to.be.a('function'));
  });

  describe('.alias()', () => {
    it('throws TypeError because predicate function was not specified', () =>
      expect(() => overload.alias()).to.throw(TypeError));
  });

  describe('.alias(name:any, preficate:function)', () => {
    it('returns this', () =>
      expect(overload.alias('test', () => true)).to.equal(overload));
  });

  describe('.build', () => {
    it('is a function', () =>
      expect(overload.build).to.be.a('function'));
  });

  describe('.build()', () => {
    it('returns overloaded function extended with fluent builder interface', () =>
      expect(overload.build()).to.be.a('function'));

    describe('.match', () => {
      it('is a function', () =>
        expect(overload.build().match).to.be.a('function'));
    });

    describe('.match()', () => {
      it('throws TypeError because predicates array was not specified', () =>
        expect(() => overload.build().match()).to.throw(TypeError));
    });

    describe('.match(predicates:array)', () => {
      it('throws TypeError because instance function was not specified', () =>
        expect(() => overload.build().match([])).to.throw(TypeError));
    });

    describe('.match(predicates:array, instance:function)', () => {
      it('returns this', () => {
        const $this = overload.build();
        expect($this.match([], () => true)).to.equal($this);
      });
    });
  });

  describe('.build(name:string)', () => {
    it('returns function named with name', () => {
      const name = 'test';
      expect(overload.build(name)).to.be.a('function').and.contain.property('name', name);
    });
  });

  describe('.build(name:!string)', () => {
    it('throws TypeError because name is not string', () =>
      expect(() => overload.build(42)).to.throw(TypeError));
  });

  describe('.build(name:string, branches:!array)', () => {
    it('throws TypeError because branches are not array', () =>
      expect(() => overload.build('test', 42)).to.throw(TypeError));
  });
});

describe('overload()', () => {
  it('throws TypeError because name was not specified', () =>
    expect(() => overload()).to.throw(TypeError));
});

describe('overload(name:string)', () => {
  it('returns function', () =>
    expect(overload('test')).to.be.a('function'));

  describe('()', () => {
    it('throws TypeError because target object was not specified', () =>
      expect(() => overload('test')()).to.throw(TypeError));  
  });

  describe('(target:object)', () => {
    it('throws TypeError because descriptor object was not specified', () =>
      expect(() => overload('name')()).to.throw(TypeError));  
  });

  describe('(target:object, key:string, descriptor:object)', () => {
    it('returns descriptor object', () => {
      const descriptor = { value: () => true };
      expect(overload('name')({}, 'key', descriptor)).to.equal(descriptor);
    });

    it('creates method on target object named with name', () => {
      const name = 'name';
      const target = {};
      overload(name)(target, 'key', { value: () => true });
      expect(target).to.contain.property(name).that.is.a('function');
    });

    it('throws TypeError if target object contains property named with name that is not configurable', () => {
      const name = 'name';
      const target = Object.defineProperty({}, name, {
        configurable: false
      });
      expect(() => overload(name)(target, 'key', { value: () => true })).to.throw(TypeError);
    });
  });
  
});
