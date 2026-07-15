const { JestEnvironment } = require('jest-environment-node');
const { AllureReporter, AllureRuntime } = require('jest-allure2');

class AllureEnvironment extends JestEnvironment {
  constructor(config, context) {
    super(config, context);
    const allureRuntime = new AllureRuntime({ resultsDir: './allure-results' });
    this.allure = new AllureReporter(allureRuntime);
  }

  async setup() {
    await super.setup();
    this.global.allure = this.allure;
  }

  async teardown() {
    await super.teardown();
  }
}

module.exports = AllureEnvironment;
