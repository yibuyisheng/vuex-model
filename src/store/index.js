import store from './store';
import BaseModule, { action, composition } from './BaseModule';

class List extends BaseModule {
  state = {
    list: ['123']
  };

  @action
  testAction() {
    console.log(this.state);
  }
}

@composition(List)
class Test extends BaseModule {
  $namespace = 'test:';

  state = {
    name: null
  };

  @action
  updateNameAction(newName) {
    this.updateName(newName);
  }
}

export const test = Test.register();

export default store;
