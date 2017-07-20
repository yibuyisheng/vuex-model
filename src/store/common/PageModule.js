import BaseModule, { action } from '../BaseModule';

export default class PageModule extends BaseModule {
  // 在 pageview beforeDestroy 的时候调用，主要用于清理数据
  @action
  leave() {}
}
