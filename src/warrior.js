(function() {
    
    
var EventEmitter = require("./eventemitter.js").EventEmitter;
var parse = require("./redcode.js").parse;
    
/**
 *
 * Warrior interaction
 *
 * A Warrior contains possibly multiple processes and keeps track of them
 * internally.
 *
 * The flow for executing a process is:
 *
 * var process = aWarrior.start() <-- returns the curProcess
 * [ ... execute command at process.position ... ]
 * aWarrior.end() <-- sets curProcess to nextProcess
 */

var Warrior = function (name, offset, instructions) {
  EventEmitter.call(this);
  this.name = name;
  this.processes = 0;

  this.curProcess = null;
  this.nextProcess = null;

  this.offset = offset || 0;
  if (instructions && typeof(instructions) === 'string') {
    this.code = instructions;
    this.parsed = parse(instructions);
    instructions = this.parsed.instructions;
    this.offset = this.parsed.start;
  }
  this.instructions = instructions || [];
  
  // Links for warrior list
  this.next = null;
  this.prev = null;
};
Warrior.prototype = new EventEmitter();
/**
 * Return the process that should execute now
 */
Warrior.prototype.start = function () {
  return this.curProcess;
};
Warrior.prototype.end = function () {
  if (!this.nextProcess) {
    return;
  }
  this.curProcess = this.nextProcess;
  this.nextProcess = this.curProcess.next;
};
Warrior.prototype.kill = function () {
  var process = this.curProcess;
  this.curProcess = null;
  this.processes -= 1;
  if (this.processes == 0) {
    // If this is the last process set nextProcess to null, too;
    this.nextProcess = null;
  } else if (this.processes == 1) {
    // If we only have one process make sure it points to itself
    this.nextProcess.prev = this.nextProcess;
    this.nextProcess.next = this.nextProcess;
  } else {
    // Otherwise just switch the pointers
    process.prev.next = this.nextProcess;
    this.nextProcess.prev = process.prev;
  }
  this.emit('kill', process);
};
Warrior.prototype.split = function (newPosition) {
  this.processes += 1;
  var newProcess = {position: newPosition};
  newProcess.prev = this.curProcess;
  newProcess.next = this.curProcess.next;
  this.curProcess.next = newProcess;
  this.nextProcess = newProcess;
  this.emit('split', {process: this.curProcess, newProcess: newProcess});
};
Warrior.prototype.spawn = function (position) {
  if (this.processes > 0) {
    throw "Attempting to spawn a new process when a process is already running";
  }
  this.processes = 1;
  this.curProcess = {position: position};
  this.curProcess.next = this.curProcess;
  this.curProcess.prev = this.curProcess;
  this.nextProcess = this.curProcess;
  this.emit('spawn', this.curProcess);
}
Warrior.prototype.seek = function (position) {
  this.curProcess.position = position;
  this.emit('seek', this.curProcess);
};


exports.Warrior = Warrior;

})();
