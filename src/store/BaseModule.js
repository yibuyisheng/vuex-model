/**
 * @file BaseModule
 * @author yibuyisheng(yibuyisheng@163.com)
 */

import { each, get, assign, isObject, cloneDeep, camelCase, snakeCase } from 'lodash';
import Vue from 'vue';
import store from './store';

function getActions(model, cstObj) {
  const $$action = {};
  each(model.$$action, (fnName) => {
    if (isObject(fnName)) {
      assign($$action, fnName);
      return;
    }

    const name = get(model.$nameMap, [fnName], fnName);
    const fn = model[fnName].bind(model);
    const actionName = `${model.$namespace}${name}`;
    $$action[actionName] = (context, params) => fn(params);
    assign(model, {
      [fnName]: params => model.dispatch(actionName, params)
    });

    // 生成常量
    assign(cstObj, {
      [name.replace(/[A-Z]{1}/g, match => (`_${match}`)).toUpperCase()]: actionName
    });
  });
  return $$action;
}

function getMutations(model) {
  const $$mutation = {};
  each(model.$$mutation, (fnName) => {
    if (isObject(fnName)) {
      assign($$mutation, fnName);
      return;
    }

    const name = get(model.$nameMap, [fnName], fnName);
    const fn = model[fnName].bind(model);
    const mutationName = `${model.$namespace}${name}`;
    $$mutation[mutationName] = (state, params) => fn(params);

    assign(model, {
      [fnName]: params => store.commit(mutationName, params)
    });
  });

  // 默认给所有 state 第一层属性都生成一个 update mutation
  each(model.state, (value, key) => {
    const stateFnName = `update${key[0].toUpperCase()}${key.slice(1)}`;
    const stateMutationName = `${model.$namespace}${get(model.$nameMap, [stateFnName], stateFnName)}`;
    if (
      !(stateFnName in model)
      && !Object.prototype.hasOwnProperty.call($$mutation, stateMutationName)
    ) {
      $$mutation[stateMutationName] = (state, data) => Vue.set(model.state, key, data);
      assign(model, {
        [stateFnName](data) {
          return store.commit(stateMutationName, data);
        }
      });
    }
  });

  return $$mutation;
}

function getGetters(model, constants) {
  const $$getter = {};
  each(model.$$getter, (fnName) => {
    if (isObject(fnName)) {
      assign($$getter, fnName);
      return;
    }

    const name = get(model.$nameMap, [fnName], fnName);
    const getterName = `${model.$namespace}${name}`;
    $$getter[getterName] = () => model[fnName]();

    assign(constants, {
      [name.replace(/[A-Z]{1}/g, match => (`_${match}`)).toUpperCase()]: getterName
    });
  });

  // 默认给所有 state 都生成 getter
  each(model.state, (value, key) => {
    const name = get(model.$nameMap, [key], key);
    const getterName = `${model.$namespace}${name}`;

    if (
      !(key in model)
      && !Object.prototype.hasOwnProperty.call($$getter, getterName)
    ) {
      $$getter[getterName] = () => model.state[key];
      assign(model, {
        [key]: store.getters[getterName]
      });

      assign(constants, {
        [snakeCase(name).toUpperCase()]: getterName
      });
    }
  });

  return $$getter;
}

function getState(model) {
  return model.state;
}

function createInstance(ModuleClass) {
  return new ModuleClass();
}

function createModule(m) {
  const constants = {};
  const state = getState(m);
  const $$mutation = getMutations(m);
  const $$action = getActions(m, constants);
  const $$getter = getGetters(m, constants);

  return {
    state,
    mutations: $$mutation,
    actions: $$action,
    getters: $$getter,
    namespace: m.$namespace.replace(/:$/, ''),
    constants
  };
}

export default class BaseModule {

  /**
   * 在store中的命名空间
   *
   * @type {string}
   */
  $namespace = '';

  /**
   * 名字映射转换
   *
   * @type {Object}
   */
  $nameMap = {};

  /**
   * 全局 store
   *
   * @type {Store}
   */
  $store = store;

  /**
   * state
   *
   * @type {Object}
   */
  state = {};

  /**
   * dispatch action 。
   * 优先看这个action name是不是在当前类成员里面。
   *
   * @protected
   * @param {string} name action名字
   * @param {Object} params 参数
   * @param {Function} dispatch dispatch函数
   * @return {*}
   */
  dispatch(name, params) {
    const realName = get(this.$nameMap, [name], name);
    return this[realName] || this[name]
      ? this.$store.dispatch(`${this.$namespace}${realName}`, params)
      : this.$store.dispatch(name, params);
  }

  /**
   * commit mutation
   * 优先看name是不是在当前类成员里面。
   *
   * @param {string} name mutation名字
   * @param {Object} params 参数
   * @return {*}
   */
  commit(name, params) {
    const realName = get(this.$nameMap, [name], name);
    return this[realName] || this[name]
      ? this.$store.commit(`${this.$namespace}${realName}`, params)
      : this.$store.commit(name, params);
  }

  /**
   * getter
   * 优先看name是不是在当前类成员里面。
   *
   * @param {string} name getter名字
   * @return {*}
   */
  getter(name) {
    const realName = get(this.$nameMap, [name], name);
    return this[realName] || this[name]
      ? this.$store.getters[`${this.$namespace}${realName}`]
      : this.$store.getters[realName];
  }

  /**
   * 封装一下Vue.set
   *
   * @static
   * @param {Object} target 目标对象
   * @param {string} key key
   * @param {*} value value
   */
  static set(target, key, value) {
    Vue.set(target, key, value);
  }

  // 主要根据 ModelClass 创建 Model 实例。
  static create() {
    const m = createInstance(this);
    return createModule(m);
  }

  static register() {
    const m = this.create();
    store.registerModule(m.$namespace, m);
    return m.constants;
  }
}

function getObj(target, key, dft = []) {
  return (
    Object.prototype.hasOwnProperty.call(target, key)
      ? target[key] : cloneDeep(target[key])
  ) || dft;
}

export function action(target, key) {
  assign(target, { $$action: getObj(target, '$$action') });
  target.$$action.push(key);
}

export function mutation(target, key) {
  assign(target, { $$mutation: getObj(target, '$$mutation') });
  target.$$mutation.push(key);
}

export function getter(target, key) {
  assign(target, { $$getter: getObj(target, '$$getter') });
  target.$$getter.push(key);
}

/* eslint-disable */
export function composition(Class, fieldName) {
  const pureFieldName = fieldName || camelCase(Class.name);
  const realFieldName = `$${pureFieldName}`;
  return function mix(Target) {
    class Model extends Target {
      constructor() {
        super();

        if (realFieldName in this) {
          throw new Error(`There is already a field name: ${realFieldName} in class: ${Target.name}`);
        }

        const m = createInstance(Class);
        // 强制覆盖掉 namespace
        m.$namespace = `${this.$namespace}${pureFieldName}:`;
        this[realFieldName] = createModule(m);
        store.registerModule(this.$namespace + pureFieldName, this[realFieldName]);
      }
    };
    return Model;
  };
}
