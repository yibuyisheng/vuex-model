import axios from 'axios';
import { each, assign, isString, isObject } from 'lodash';
import BaseModule from '../BaseModule';

const apis = {};

export default class NetworkModule extends BaseModule {

  apis = apis;

  /**
   * 包一层 axios.request：
   * https://github.com/mzabriskie/axios#request-config
   *
   * @protected
   * @param {Object} config 请求配置
   * @return {Promise}
   */
  request(config) {
    return axios.request(config);
  }

  static registerApis(apiConfig) {
    each(apiConfig, (urlStr, name) => {
      if (isString(urlStr)) {
        const [type, url] = urlStr.split('|');
        switch (type) {
          case 'get':
          case 'post':
          case 'delete':
          case 'head':
          case 'options':
          case 'put':
          case 'patch':
            apis[name] = extraConfig => this.request(assign({
              method: type,
              url
            }, extraConfig));
            break;
          case 'raw':
          default:
            apis[name] = url;
            break;
        }
      } else if (isObject(urlStr)) {
        apis[name] = extraConfig => this.request(assign({}, urlStr, extraConfig));
      }
    });
  }
}
