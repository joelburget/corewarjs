var Warrior;

(function() {
    
    
    var MicroEvent = require("./microevent.js").MicroEvent;
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

    Warrior = function (name, offset, instructions) {

      this.name = name;
      this.reset();
      
      this.offset = offset || 0;
      if (instructions && typeof(instructions) === 'string') {
        this.code = instructions;
        this.parsed = parse(instructions);
        instructions = this.parsed.instructions;
        this.offset = this.parsed.start;
      }
      this.instructions = instructions || [];
  
      
    };

    MicroEvent.mixin(Warrior);


    Warrior.prototype.reset = function () {
        
        this.processes = [];
        this.curProcess = null;
        
        // Links for warrior list
        this.next = null;
        this.prev = null;
    };

    /**
     * Return the process that should execute now
     */
    Warrior.prototype.start = function () {
      return this.processes[this.curProcess];
    };
    Warrior.prototype.end = function () {
        
      if (this.processes.length==0) {
        return;
      } else if (this.processes.length>1) {
          this.curProcess = (this.curProcess+1)%this.processes.length;
      }
      
    };
    Warrior.prototype.kill = function () {
      
      var process = this.processes[this.curProcess];
      this.processes = this.processes.slice(0,this.curProcess).concat(this.processes.slice(this.curProcess+1));
      
      
      //reindex
      if (this.processes.length>1) {
          this.curProcess-=1;
      } else {
          this.curProcess = 0;
      }
            
      
      //console.log("killed",this.processes.concat(),this.curProcess);
      
      this.publish('kill', process);
    };
    Warrior.prototype.split = function (newPosition) {
/*        if (newPosition>8000) {
              throw "splitting too far!";
          }
*/
      //insert the new process
      this.processes = this.processes.slice(0,this.curProcess+1).concat([newPosition],this.processes.slice(this.curProcess+1));
      
      this.publish('split', {process: this.processes[this.curProcess], newProcess:newPosition});
      
      //make sure we don't skip to the next process right away at the next iteration
      this.curProcess += 1;
      //console.log("splat",this.curProcess);
      
    };
    Warrior.prototype.spawn = function (position) {
      if (this.processes.length > 0) {
        throw "Attempting to spawn a new process when a process is already running";
      }
/*      if (position>8000) {
          throw "spawning too far!";
      }
*/
      this.processes = [position];
      this.curProcess = 0;
      this.publish('spawn', this.processes[this.curProcess]);
    }
    Warrior.prototype.seek = function (position) {
/*        if (position>8000) {
            throw "seeking too far!";
        }
*/
      this.processes[this.curProcess] = position;
      this.publish('seek', position);
    };


    // export in common js
    if( typeof module !== "undefined" && ('exports' in module)){
    	module.exports.Warrior = Warrior;
    }



})();
