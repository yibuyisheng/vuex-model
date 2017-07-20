import BaseModule, { action, composition } from './BaseModule';
import List from './List';

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

Test.register();
