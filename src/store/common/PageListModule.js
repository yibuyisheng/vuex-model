import { assign } from 'lodash';
import { action } from '../BaseModule';
import NetworkModule from './NetworkModule';

export default class PageListModule extends NetworkModule {

  state = {
    list: [],
    pageInfo: {
      pageNo: 1,
      pageSize: 30,
      pageSizes: [30, 50, 100],
      totalCount: 0,
      isLoading: false
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
  async requestList(config) {
    try {
      this.updatePageInfo(assign({}, this.state.pageInfo, { isLoading: true }));
      const result = await this.apis[this.getApiName()](this.formatRequest(config));
      const { pageInfo, list } = this.formatResponse(result);
      this.updatePageInfo(assign({}, this.state.pageInfo, pageInfo));
      this.updateList(list);
    } catch (e) {
      throw e;
    } finally {
      this.updatePageInfo(assign({}, this.state.pageInfo, { isLoading: false }));
    }
  }

  // 在 PageView beforeDestroy 的时候调用，主要用于清理数据
  @action
  leave() {}
}
