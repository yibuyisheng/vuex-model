import { assign } from 'lodash';
import { action } from '../BaseModule';
import NetworkModule from './NetworkModule';

export default class ContinuousListModule extends NetworkModule {

  /**
   * @override
   */
  state = {
    list: [],
    pageInfo: {
      // 加载状态：QUIET -> 未加载；UP -> 向上加载；DOWN -> 向下加载
      loadingStatus: 'QUIET',
      // list 的开始标志
      startFlag: null,
      // list 的结束标志
      endFlag: null
    }
  };

  getApiName() {}

  formatResponse(response) {
    return response;
  }

  formatRequest(config) {
    return config;
  }

  @action
  async requestAppend(config) {
    try {
      this.updatePageInfo(assign({}, this.pageInfo, { loadingStatus: 'DOWN' }));
      const result = await this.apis[this.getApiName()](this.formatRequest(config, 'append'));
      const { list, pageInfo } = this.formatResponse(result, 'append');
      this.updateList([...this.state.list, ...list]);
      this.updatePageInfo(assign({}, this.pageInfo, pageInfo));
    } catch (e) {
      throw e;
    } finally {
      this.updatePageInfo(assign({}, this.pageInfo, { loadingStatus: 'QUIET' }));
    }
  }

  @action
  async requestPrepend(config) {
    try {
      this.updatePageInfo(assign({}, this.pageInfo, { loadingStatus: 'UP' }));
      const result = await this.apis[this.getApiName()](this.formatRequest(config, 'prepend'));
      const { list, pageInfo } = this.formatResponse(result, 'prepend');
      this.updateList([...list, ...this.state.list]);
      this.updatePageInfo(assign({}, this.pageInfo, pageInfo));
    } catch (e) {
      throw e;
    } finally {
      this.updatePageInfo(assign({}, this.pageInfo, { loadingStatus: 'QUIET' }));
    }
  }
}
