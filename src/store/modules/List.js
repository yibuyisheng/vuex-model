import BaseModule, { action } from '../BaseModule';

export default class List extends BaseModule {
  state = {
    list: ['123']
  };

  @action
  testAction() {
    console.log(this.state);
  }
}
