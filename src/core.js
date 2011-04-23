

// Command modifiers
var A = 1;  // A & B are overloaded for instruction access and operators
var B = 2;
var AB = 4;
var BA = 8;
var F = 16;
var X = 32;
var I = 64;
var ALL_MODIFIERS = A | B | AB | BA | F | X | I;
var MOD_REVERSE = {
  A: A,
  B: B,
  AB: AB,
  BA: BA,
  F: F,
  X: X,
  I: I,
};

// Commands (these share space with the modifiers)
var DAT = 128;
var MOV = 256;
var ADD = 512;
var SUB = 1024;
var MUL = 2048;
var DIV = 4096;
var MOD = 8192;
var JMP = 16384;
var JMZ = 32768;
var JMN = 65536;
var DJN = 131072;
var SPL = 262144;
var CMP = 524288;
var SEQ = 1048576;
var SNE = 2097152;
var SLT = 4194304;
var LDP = 8388608;
var STP = 16777216;
var NOP = 33554432;
var CMD_REVERSE = {
  DAT: DAT,
  MOV: MOV,
  ADD: ADD,
  SUB: SUB,
  MUL: MUL,
  DIV: DIV,
  MOD: MOD,
  JMP: JMP,
  JMZ: JMZ,
  JMN: JMN,
  DJN: DJN,
  SPL: SPL,
  CMP: CMP,
  SEQ: SEQ,
  SNE: SNE,
  SLT: SLT,
  LDP: LDP,
  STP: STP,
  NOP: NOP,
};

// Operators
var IMMEDIATE = 4;
var DIRECT = 8;
var INDIRECT = 16;
var PREDECREMENT = 32;
var POSTINCREMENT = 64;

var OP_LOOKUP = {
  '#': IMMEDIATE,
  '$': DIRECT,
  '*': INDIRECT|A,
  '@': INDIRECT|B,
  '{': PREDECREMENT|A,
  '<': PREDECREMENT|B,
  '}': POSTINCREMENT|A,
  '>': POSTINCREMENT|B
};

// Array access
var OP = 0;
var CMD = 0;
var VALUE = 1;



var dump = function (inst) {
  var out = [];
  for (var c in CMD_REVERSE) {
    if (inst[CMD] & CMD_REVERSE[c]) {
      out.push(c);
    }
  }
  var mod = false;
  for (var d in MOD_REVERSE) {
    if (inst[CMD] & MOD_REVERSE[d]) {
      out.push(d);
      mod = true;
    }
  }
  if (!mod) out.push('_');

  for (var e in OP_LOOKUP) {
    if (inst[A][OP] & OP_LOOKUP[e]) {
      out.push(e);
      out.push(inst[A][VALUE]);
    }
  }
  for (var f in OP_LOOKUP) {
    if (inst[B][OP] & OP_LOOKUP[f]) {
      out.push(f);
      out.push(inst[B][VALUE]);
    }
  }
  
  return out[0] + (out[1]!="_"?('.' + out[1]):"") + ' ' + out[2] + out[3] + ((out[5]+"")?(', ' + out[4] + out[5]):"");
}


var Core;


(function() {
    
    

    var MicroEvent = require("./microevent.js").MicroEvent;
    var preparse = require("./redcode.js").preparse;
    var parse = require("./redcode.js").parse;


    // Operators for abstraction
    var opAdd = function (a, b) { return a + b; };
    var opSub = function (a, b) { return a - b; };
    var opMul = function (a, b) { return a * b; };
    var opDiv = function (a, b) { return Math.round(a / b); };
    var opMod = function (a, b) { return a % b; };

    // Shortcut to increment and mod
    var modinc = function (num, inc, max) {
      // the + max % max is to handle negatives
      return (((num + inc) % max) + max) % max;
    };

    // Helpers to determine whether we _shouldn't_ jump/skip
    var notJmz = function (a, b) { return b !== 0; };
    var notJmn = function (a, b) { return b === 0; };
    var notSeq = function (a, b) { return a != b; };
    var notSne = function (a, b) { return a == b; };
    var notSlt = function (a, b) { return a >= b; };





    var pad = function pad(number, length) {
      var str = '' + number;
      while (str.length < length) {
        str = '0' + str;
      }
      return str;
    };






    Core = function (kw) {
      if (!kw) kw = {};
      this.coresize = kw.coresize || 8000;
      this.pspacesize = kw.pspacesize || 500;
      this.maxcycles = kw.maxcycles || 80000;
      this.maxprocesses = kw.maxprocesses || 8000;
      this.warriors = kw.warriors || 2;
      this.maxlength = kw.maxlength || 100;
      this.mindistance = kw.mindistance || 100;

      this.core = [];
      this.pspace = [];
  
      this.cycle = 0;

      this.curWarrior = null;
      this.nextWarrior = null;
    };

    MicroEvent.mixin(Core);

    Core.prototype.initialize = function () {
      for (var i = 0; i < this.coresize; i++) {
        this.core[i] = [DAT, [IMMEDIATE, 0], [IMMEDIATE, 0]];
      }
    };
    Core.prototype.loadWarriors = function (warriors) {
      // optimistically pick spots and check that they are each length + mindistance
      // apart
      var loadPoints = [];
      while (loadPoints.length < warriors.length) {
        var rnd = Math.floor(Math.random() * (this.coresize + 1));
        var viable = true;
        for (var i in loadPoints) {
          if (Math.abs(loadPoints[i] - rnd) < this.mindistance) {
            viable = false;
          }
        }
        if (viable) {
          loadPoints.push(rnd);
        }
      }

      var firstWarrior = warriors[0];
      var lastWarrior = null;
      this.warriors = warriors.length;
      for (var i in warriors) {
        var loadPoint = loadPoints[i];
        var warrior = warriors[i];
        var instructions = warrior.instructions;

        if (lastWarrior) {
          warrior.prev = lastWarrior;
          lastWarrior.next = warrior;
        }
        lastWarrior = warrior;

        for (var j in instructions) {
          this.core[(loadPoint + parseInt(j)) % this.coresize] = instructions[j];
        }

        warrior.spawn(loadPoint + warrior.offset);
      }
      lastWarrior.next = firstWarrior;
      firstWarrior.prev = lastWarrior;
      this.curWarrior = firstWarrior;
      this.nextWarrior = this.curWarrior.next;
    };
    Core.prototype.resolvePosition = function (address, current) {
      if (address[OP] == IMMEDIATE) {
        relative = 0;
      } else {
        relative = address[1];
      }
      return modinc(current, relative, this.coresize);
    };
    Core.prototype.instInc = function (position, field, inc) {
      this.core[position][field][VALUE] = modinc(
          this.core[position][field][VALUE], inc, this.coresize);
      this.instChanged(position,this.curWarrior)
    };
    Core.prototype.instChanged = function (position, warrior) {
      var inst = this.core[position];
      this.publish('change', {'position': position, 'instruction': inst, 'warrior':warrior.name});
    };
    Core.prototype.setDefaultCommandModifiers = function (inst) {
      var cmd = inst[CMD];
      // set up default modifiers if none are present
      if (!(cmd & ALL_MODIFIERS)) {
        if (cmd & (MOV|SEQ|SNE|CMP)) {
          if (inst[A][OP] & IMMEDIATE)      cmd |= AB;
          else if (inst[B][OP] & IMMEDIATE) cmd |= B;
          else                              cmd |= I;
        } else if (cmd & (ADD|SUB|MUL|DIV|MOD)) {
          if (inst[A][OP] & IMMEDIATE)      cmd |= AB;
          else if (inst[B][OP] & IMMEDIATE) cmd |= B;
          else                              cmd |= F;
        } else if (cmd & (SLT|LDP|STP)) {
          if (inst[A][OP] & IMMEDIATE)      cmd |= AB;
          else                              cmd |= B;
        }
      }
      inst[CMD] = cmd;
      return inst;
    };
    Core.prototype.handlePredecrement = function (inst, position) {
      var decrPos;
      if (inst[A] & PREDECREMENT) {
        decrPos = this.resolvePosition(inst[A], position);
        if (inst[A] & A) {
          this.instInc(decrPos, A, -1);
        } else if (inst[A] & B) {
          this.instInc(decrPos, B, -1);
        }
      }
      if (inst[B] & PREDECREMENT) {
        decrPos = this.resolvePosition(inst[B], position);
        if (inst[B] & A) {
          this.instInc(decrPos, A, -1);
        } else if (inst[B] & B) {
          this.instInc(decrPos, B, -1);
        }
      }
    };
    Core.prototype.handlePostincrement = function (inst, position) {
      var incPos;
      if (inst[A][OP] & POSTINCREMENT) {
        incPos = this.resolvePosition(inst[A], position);
        if (inst[A][OP] & A) {
          this.instInc(incPos, A, 1);
        } else if (inst[A][OP] & B) {
          this.instInc(incPos, B, 1);
        }
      }
      if (inst[B][OP] & POSTINCREMENT) {
        incPos = this.resolvePosition(inst[B], position);
        if (inst[B][OP] & A) {
          this.instInc(incPos, A, 1);
        } else if (inst[B][OP] & B) {
          this.instInc(incPos, B, 1);
        }
      }
    };
    Core.prototype.handleDAT = function (warrior, process, position, inst, cmd) {
      warrior.kill(process);
    };
    Core.prototype.handleSPL = function (warrior, process, position, inst, cmd) {
      var splitToPosition = this.resolvePosition(inst[A], position);
      var thisNewPosition = modinc(position, 1, this.coresize);

      warrior.seek(thisNewPosition);
      warrior.split(splitToPosition);
    };
    Core.prototype.handleMOV = function (warrior, process, position, inst, cmd) {
      var source = this.resolvePosition(inst[A], position);
      var target = this.resolvePosition(inst[B], position);
      //console.log('MOV source ' + source + ', target: ' + target);

      if (cmd & (A|F|I)) this.core[target][A] = this.core[source][A];
      if (cmd & (B|F|I)) this.core[target][B] = this.core[source][B];
      if (cmd & (AB|X)) this.core[target][B] = this.core[source][A];
      if (cmd & (BA|X)) this.core[target][A] = this.core[source][B];
      if (cmd & I) this.core[target][CMD] = this.core[source][CMD];
  
      this.instChanged(target,warrior);
      warrior.seek(modinc(position, 1, this.coresize));
    };
    Core.prototype.handleADD = function (warrior, process, position, inst, cmd) {
      var source = this.resolvePosition(inst[A], position);
      var target = this.resolvePosition(inst[B], position);
      var m = (cmd & SUB) ? -1 : 1;
  
      var targetA = this.core[target][A][VALUE] % this.coresize;
      var targetB = this.core[target][B][VALUE] % this.coresize;
      var sourceA = this.core[source][A][VALUE] % this.coresize; 
      var sourceB = this.core[source][B][VALUE] % this.coresize; 
  
      var op;
      if (cmd & ADD) op = opAdd;
      if (cmd & SUB) op = opSub;
      if (cmd & MUL) op = opMul;
      if (cmd & DIV) op = opDiv;
      if (cmd & MOD) op = opMod;

      if (cmd & (DIV|MOD) && cmd & (A|F|I|AB|X) && sourceA === 0) {
        // divide by zero
        warrior.kill();
      } else {
        if (cmd & (A|F|I)) this.core[target][A][VALUE] = op(targetA, sourceA); 
        if (cmd & (AB|X)) this.core[target][B][VALUE] = op(targetB, sourceA); 
      }

      if (cmd & (DIV|MOD) && cmd & (B|F|I|BA|X) && sourceB === 0) {
        // divide by zero
        warrior.kill();
      } else {
        if (cmd & (B|F|I)) this.core[target][B][VALUE] = op(targetB, sourceB);
        if (cmd & (BA|X)) this.core[target][A][VALUE] = op(targetA, sourceB);
      }
  
      this.instChanged(target,warrior);
      warrior.seek(modinc(position, 1, this.coresize));
    };
    Core.prototype.handleJMP = function (warrior, process, position, inst, cmd) {
      var newPosition = this.resolvePosition(inst[A], position);
      warrior.seek(newPosition);
    };
    Core.prototype.handleJMZ = function (warrior, process, position, inst, cmd) {
      var source = this.resolvePosition(inst[A], position);
      var target = this.resolvePosition(inst[B], position);
  
      var targetA = this.core[target][A][VALUE] % this.coresize;
      var targetB = this.core[target][B][VALUE] % this.coresize;
      var targetCMD = this.core[target][CMD];
      var sourceA = this.core[source][A][VALUE] % this.coresize; 
      var sourceB = this.core[source][B][VALUE] % this.coresize; 
      var sourceCMD = this.core[source][CMD];

      var testFunc;
      if (cmd & JMZ) testFunc = notJmz;
      if (cmd & (JMN|DJN)) testFunc = notJmn;
      if (cmd & (CMP|SEQ)) testFunc = notSeq;
      if (cmd & SNE) testFunc = notSne;
      if (cmd & SLT) testFunc = notSlt;
  
      // DJN decrements before testing
      if (cmd & DJN) {
        if (cmd & (A|F|I|BA|X)) this.instInc(target, A, -1);
        if (cmd & (B|F|I|AB|X)) this.instInc(target, B, -1);
      }

      // do the testing
      var jump = true;
      if (cmd & (A|F|I)) jump = testFunc(sourceA, targetA);
      if (cmd & (B|F|I)) jump = testFunc(sourceB, targetB);
      if (cmd & (AB|X)) jump = testFunc(sourceA, targetB);
      if (cmd & (BA|X)) jump = testFunc(sourceB, targetA);
      if (cmd & (CMP|SEQ) && cmd & I && targetCMD != sourceCMD) jump = false;
      if (cmd & (SNE) && cmd & I && targetCMD == sourceCMD) jump = false;

      // jump
      if (jump) {
        if (cmd & (CMP|SEQ|SNE|SLT)) {
          warrior.seek(modinc(position, 2, this.coresize));
        } else {
          // for jumps the resolved "source" is the destination
          warrior.seek(source);
        }
      } else {
        warrior.seek(modinc(position, 1, this.coresize));
      }
    };
    Core.prototype.handleNOP = function (warrior, process, position, inst, cmd) {
      process.position = modinc(position, 1, this.coresize);
    };
    Core.prototype.start = function () {
      return this.curWarrior;
    };
    Core.prototype.end = function () {
      this.curWarrior = this.nextWarrior;
      this.nextWarrior = this.curWarrior.next;
    };
    Core.prototype.runOnce = function (DEBUG) {
      if (this.warriors === 0) {
        // nothing to do
        return;
      }

      var warrior = this.start();
      var process = warrior.start();
      var position = process.position;
      var inst = this.core[position];
      inst = this.setDefaultCommandModifiers(inst);
      var cmd = inst[CMD];
  
      if (DEBUG) {
        console.log(pad(this.cycle, 5) +
                    ' (' + warrior.name + ':' + pad(position, 5) + ')-> '
                    + dump(inst)); 
      }
      this.publish('exec', {'cycle':this.cycle,'warrior':warrior.name,'position': position, 'instruction': inst,'instructionDump': dump(inst)});

      this.handlePredecrement(inst, position);
  
      // Handle commands
      if (cmd & DAT) {
        this.handleDAT(warrior, process, position, inst, cmd);
      } else if (cmd & SPL) {
        if (warrior.processes == this.maxprocesses) {
          this.handleNOP(warrior, process, position, inst, cmd);
        } else {
          this.handleSPL(warrior, process, position, inst, cmd);
        }
      } else if (cmd & MOV) {
        this.handleMOV(warrior, process, position, inst, cmd);
      } else if (cmd & (ADD|SUB|MUL|DIV|MOD)) {
        this.handleADD(warrior, process, position, inst, cmd);
      } else if (cmd & JMP) {
        this.handleJMP(warrior, process, position, inst, cmd);
      } else if (cmd & (JMZ|JMN|DJN|SEQ|SNE|CMP|SLT)) {
        this.handleJMZ(warrior, process, position, inst, cmd);
      } else if (cmd & NOP) {
        this.handleNOP(warrior, process, position, inst, cmd);
      }

      this.handlePostincrement(inst, position);
  
      // The warrior's process has done all it can.
      warrior.end();
  
      // So has the warrior;
      this.end();

      if (warrior.processes === 0) {
        this.defeat();
      }

      if (this.warriors === 1) {
        this.publish('victory', warrior.name);
      }
  

      this.cycle += 1;
      if (this.cycle >= this.maxcycles) {
        this.publish('stalemate');
      }
    };
    Core.prototype.defeat = function () {
      var warrior = this.curWarrior;
      this.warriors -= 1;
      this.curWarrior = null;
      if (this.warriors == 0) {
        // If this is the last warrior set nextWarrior to null, too;
        this.nextWarrior = null;
      } else if (this.warriors == 1) {
        // If we only have on warrior make sure it points to itself
        this.nextWarrior.next = this.nextWarrior;
        this.nextWarrior.prev = this.nextWarrior;
      } else {
        // Otherwise just switch the pointers
        warrior.prev.next = this.nextWarrior;
        this.nextWarrior.prev = warrior.prev;
    
      }
      this.publish('defeat', warrior.name);
    }


    // export in common js
    if( typeof module !== "undefined" && ('exports' in module)){



        exports.Core = Core;
        exports.OP_LOOKUP = OP_LOOKUP;

        // Command modifiers
        exports.A = A;
        exports.B = B;
        exports.AB = AB;
        exports.BA = BA;
        exports.F = F;
        exports.X = X;
        exports.I = I;
        exports.ALL_MODIFIERS = ALL_MODIFIERS;

        // Commands (these share space with the modifiers)
        exports.DAT = DAT;
        exports.MOV = MOV;
        exports.ADD = ADD;
        exports.SUB = SUB;
        exports.MUL = MUL;
        exports.DIV = DIV;
        exports.MOD = MOD;
        exports.JMP = JMP;
        exports.JMZ = JMZ;
        exports.JMN = JMN;
        exports.DJN = DJN;
        exports.SPL = SPL;
        exports.CMP = CMP;
        exports.SEQ = SEQ;
        exports.SNE = SNE;
        exports.SLT = SLT;
        exports.LDP = LDP;
        exports.STP = STP;
        exports.NOP = NOP;

        // Operators
        exports.IMMEDIATE = IMMEDIATE;
        exports.DIRECT = DIRECT;
        exports.INDIRECT = INDIRECT;
        exports.PREDECREMENT = PREDECREMENT;
        exports.POSTINCREMENT = POSTINCREMENT;

        // Array access
        exports.OP = OP;
        exports.CMD = CMD;
        exports.VALUE = VALUE;
        
        exports.dump = dump;

    }


})();