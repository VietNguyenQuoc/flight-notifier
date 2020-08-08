const { EventEmitter } = require("events");

const workerEmitter = new EventEmitter();

module.exports = {
  workerEmitter
}