class WhatsappLaunchCoordinator {
  constructor() {
    this.tail = Promise.resolve();
  }

  run(task) {
    const next = this.tail.catch(() => {}).then(task);
    this.tail = next.catch(() => {});
    return next;
  }
}

module.exports = new WhatsappLaunchCoordinator();
