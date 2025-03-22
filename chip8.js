var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/quick-format-unescaped/index.js
var require_quick_format_unescaped = __commonJS({
  "node_modules/quick-format-unescaped/index.js"(exports, module) {
    "use strict";
    function tryStringify(o) {
      try {
        return JSON.stringify(o);
      } catch (e) {
        return '"[Circular]"';
      }
    }
    module.exports = format;
    function format(f, args, opts) {
      var ss = opts && opts.stringify || tryStringify;
      var offset = 1;
      if (typeof f === "object" && f !== null) {
        var len = args.length + offset;
        if (len === 1) return f;
        var objects = new Array(len);
        objects[0] = ss(f);
        for (var index = 1; index < len; index++) {
          objects[index] = ss(args[index]);
        }
        return objects.join(" ");
      }
      if (typeof f !== "string") {
        return f;
      }
      var argLen = args.length;
      if (argLen === 0) return f;
      var str = "";
      var a = 1 - offset;
      var lastPos = -1;
      var flen = f && f.length || 0;
      for (var i = 0; i < flen; ) {
        if (f.charCodeAt(i) === 37 && i + 1 < flen) {
          lastPos = lastPos > -1 ? lastPos : 0;
          switch (f.charCodeAt(i + 1)) {
            case 100:
            // 'd'
            case 102:
              if (a >= argLen)
                break;
              if (args[a] == null) break;
              if (lastPos < i)
                str += f.slice(lastPos, i);
              str += Number(args[a]);
              lastPos = i + 2;
              i++;
              break;
            case 105:
              if (a >= argLen)
                break;
              if (args[a] == null) break;
              if (lastPos < i)
                str += f.slice(lastPos, i);
              str += Math.floor(Number(args[a]));
              lastPos = i + 2;
              i++;
              break;
            case 79:
            // 'O'
            case 111:
            // 'o'
            case 106:
              if (a >= argLen)
                break;
              if (args[a] === void 0) break;
              if (lastPos < i)
                str += f.slice(lastPos, i);
              var type = typeof args[a];
              if (type === "string") {
                str += "'" + args[a] + "'";
                lastPos = i + 2;
                i++;
                break;
              }
              if (type === "function") {
                str += args[a].name || "<anonymous>";
                lastPos = i + 2;
                i++;
                break;
              }
              str += ss(args[a]);
              lastPos = i + 2;
              i++;
              break;
            case 115:
              if (a >= argLen)
                break;
              if (lastPos < i)
                str += f.slice(lastPos, i);
              str += String(args[a]);
              lastPos = i + 2;
              i++;
              break;
            case 37:
              if (lastPos < i)
                str += f.slice(lastPos, i);
              str += "%";
              lastPos = i + 2;
              i++;
              a--;
              break;
          }
          ++a;
        }
        ++i;
      }
      if (lastPos === -1)
        return f;
      else if (lastPos < flen) {
        str += f.slice(lastPos);
      }
      return str;
    }
  }
});

// node_modules/pino/browser.js
var require_browser = __commonJS({
  "node_modules/pino/browser.js"(exports, module) {
    "use strict";
    var format = require_quick_format_unescaped();
    module.exports = pino2;
    var _console = pfGlobalThisOrFallback().console || {};
    var stdSerializers = {
      mapHttpRequest: mock,
      mapHttpResponse: mock,
      wrapRequestSerializer: passthrough,
      wrapResponseSerializer: passthrough,
      wrapErrorSerializer: passthrough,
      req: mock,
      res: mock,
      err: asErrValue,
      errWithCause: asErrValue
    };
    function levelToValue(level, logger) {
      return level === "silent" ? Infinity : logger.levels.values[level];
    }
    var baseLogFunctionSymbol = Symbol("pino.logFuncs");
    var hierarchySymbol = Symbol("pino.hierarchy");
    var logFallbackMap = {
      error: "log",
      fatal: "error",
      warn: "error",
      info: "log",
      debug: "log",
      trace: "log"
    };
    function appendChildLogger(parentLogger, childLogger) {
      const newEntry = {
        logger: childLogger,
        parent: parentLogger[hierarchySymbol]
      };
      childLogger[hierarchySymbol] = newEntry;
    }
    function setupBaseLogFunctions(logger, levels, proto) {
      const logFunctions = {};
      levels.forEach((level) => {
        logFunctions[level] = proto[level] ? proto[level] : _console[level] || _console[logFallbackMap[level] || "log"] || noop;
      });
      logger[baseLogFunctionSymbol] = logFunctions;
    }
    function shouldSerialize(serialize, serializers) {
      if (Array.isArray(serialize)) {
        const hasToFilter = serialize.filter(function(k) {
          return k !== "!stdSerializers.err";
        });
        return hasToFilter;
      } else if (serialize === true) {
        return Object.keys(serializers);
      }
      return false;
    }
    function pino2(opts) {
      opts = opts || {};
      opts.browser = opts.browser || {};
      const transmit2 = opts.browser.transmit;
      if (transmit2 && typeof transmit2.send !== "function") {
        throw Error("pino: transmit option must have a send function");
      }
      const proto = opts.browser.write || _console;
      if (opts.browser.write) opts.browser.asObject = true;
      const serializers = opts.serializers || {};
      const serialize = shouldSerialize(opts.browser.serialize, serializers);
      let stdErrSerialize = opts.browser.serialize;
      if (Array.isArray(opts.browser.serialize) && opts.browser.serialize.indexOf("!stdSerializers.err") > -1) stdErrSerialize = false;
      const customLevels = Object.keys(opts.customLevels || {});
      const levels = ["error", "fatal", "warn", "info", "debug", "trace"].concat(customLevels);
      if (typeof proto === "function") {
        levels.forEach(function(level2) {
          proto[level2] = proto;
        });
      }
      if (opts.enabled === false || opts.browser.disabled) opts.level = "silent";
      const level = opts.level || "info";
      const logger = Object.create(proto);
      if (!logger.log) logger.log = noop;
      setupBaseLogFunctions(logger, levels, proto);
      appendChildLogger({}, logger);
      Object.defineProperty(logger, "levelVal", {
        get: getLevelVal
      });
      Object.defineProperty(logger, "level", {
        get: getLevel,
        set: setLevel
      });
      const setOpts = {
        transmit: transmit2,
        serialize,
        asObject: opts.browser.asObject,
        formatters: opts.browser.formatters,
        levels,
        timestamp: getTimeFunction(opts),
        messageKey: opts.messageKey || "msg",
        onChild: opts.onChild || noop
      };
      logger.levels = getLevels(opts);
      logger.level = level;
      logger.setMaxListeners = logger.getMaxListeners = logger.emit = logger.addListener = logger.on = logger.prependListener = logger.once = logger.prependOnceListener = logger.removeListener = logger.removeAllListeners = logger.listeners = logger.listenerCount = logger.eventNames = logger.write = logger.flush = noop;
      logger.serializers = serializers;
      logger._serialize = serialize;
      logger._stdErrSerialize = stdErrSerialize;
      logger.child = function(...args) {
        return child.call(this, setOpts, ...args);
      };
      if (transmit2) logger._logEvent = createLogEventShape();
      function getLevelVal() {
        return levelToValue(this.level, this);
      }
      function getLevel() {
        return this._level;
      }
      function setLevel(level2) {
        if (level2 !== "silent" && !this.levels.values[level2]) {
          throw Error("unknown level " + level2);
        }
        this._level = level2;
        set(this, setOpts, logger, "error");
        set(this, setOpts, logger, "fatal");
        set(this, setOpts, logger, "warn");
        set(this, setOpts, logger, "info");
        set(this, setOpts, logger, "debug");
        set(this, setOpts, logger, "trace");
        customLevels.forEach((level3) => {
          set(this, setOpts, logger, level3);
        });
      }
      function child(setOpts2, bindings, childOptions) {
        if (!bindings) {
          throw new Error("missing bindings for child Pino");
        }
        childOptions = childOptions || {};
        if (serialize && bindings.serializers) {
          childOptions.serializers = bindings.serializers;
        }
        const childOptionsSerializers = childOptions.serializers;
        if (serialize && childOptionsSerializers) {
          var childSerializers = Object.assign({}, serializers, childOptionsSerializers);
          var childSerialize = opts.browser.serialize === true ? Object.keys(childSerializers) : serialize;
          delete bindings.serializers;
          applySerializers([bindings], childSerialize, childSerializers, this._stdErrSerialize);
        }
        function Child(parent) {
          this._childLevel = (parent._childLevel | 0) + 1;
          this.bindings = bindings;
          if (childSerializers) {
            this.serializers = childSerializers;
            this._serialize = childSerialize;
          }
          if (transmit2) {
            this._logEvent = createLogEventShape(
              [].concat(parent._logEvent.bindings, bindings)
            );
          }
        }
        Child.prototype = this;
        const newLogger = new Child(this);
        appendChildLogger(this, newLogger);
        newLogger.child = function(...args) {
          return child.call(this, setOpts2, ...args);
        };
        newLogger.level = childOptions.level || this.level;
        setOpts2.onChild(newLogger);
        return newLogger;
      }
      return logger;
    }
    function getLevels(opts) {
      const customLevels = opts.customLevels || {};
      const values = Object.assign({}, pino2.levels.values, customLevels);
      const labels = Object.assign({}, pino2.levels.labels, invertObject(customLevels));
      return {
        values,
        labels
      };
    }
    function invertObject(obj) {
      const inverted = {};
      Object.keys(obj).forEach(function(key) {
        inverted[obj[key]] = key;
      });
      return inverted;
    }
    pino2.levels = {
      values: {
        fatal: 60,
        error: 50,
        warn: 40,
        info: 30,
        debug: 20,
        trace: 10
      },
      labels: {
        10: "trace",
        20: "debug",
        30: "info",
        40: "warn",
        50: "error",
        60: "fatal"
      }
    };
    pino2.stdSerializers = stdSerializers;
    pino2.stdTimeFunctions = Object.assign({}, { nullTime, epochTime, unixTime, isoTime });
    function getBindingChain(logger) {
      const bindings = [];
      if (logger.bindings) {
        bindings.push(logger.bindings);
      }
      let hierarchy = logger[hierarchySymbol];
      while (hierarchy.parent) {
        hierarchy = hierarchy.parent;
        if (hierarchy.logger.bindings) {
          bindings.push(hierarchy.logger.bindings);
        }
      }
      return bindings.reverse();
    }
    function set(self2, opts, rootLogger, level) {
      Object.defineProperty(self2, level, {
        value: levelToValue(self2.level, rootLogger) > levelToValue(level, rootLogger) ? noop : rootLogger[baseLogFunctionSymbol][level],
        writable: true,
        enumerable: true,
        configurable: true
      });
      if (self2[level] === noop) {
        if (!opts.transmit) return;
        const transmitLevel = opts.transmit.level || self2.level;
        const transmitValue = levelToValue(transmitLevel, rootLogger);
        const methodValue = levelToValue(level, rootLogger);
        if (methodValue < transmitValue) return;
      }
      self2[level] = createWrap(self2, opts, rootLogger, level);
      const bindings = getBindingChain(self2);
      if (bindings.length === 0) {
        return;
      }
      self2[level] = prependBindingsInArguments(bindings, self2[level]);
    }
    function prependBindingsInArguments(bindings, logFunc) {
      return function() {
        return logFunc.apply(this, [...bindings, ...arguments]);
      };
    }
    function createWrap(self2, opts, rootLogger, level) {
      return /* @__PURE__ */ function(write) {
        return function LOG() {
          const ts = opts.timestamp();
          const args = new Array(arguments.length);
          const proto = Object.getPrototypeOf && Object.getPrototypeOf(this) === _console ? _console : this;
          for (var i = 0; i < args.length; i++) args[i] = arguments[i];
          var argsIsSerialized = false;
          if (opts.serialize) {
            applySerializers(args, this._serialize, this.serializers, this._stdErrSerialize);
            argsIsSerialized = true;
          }
          if (opts.asObject || opts.formatters) {
            write.call(proto, asObject(this, level, args, ts, opts));
          } else write.apply(proto, args);
          if (opts.transmit) {
            const transmitLevel = opts.transmit.level || self2._level;
            const transmitValue = levelToValue(transmitLevel, rootLogger);
            const methodValue = levelToValue(level, rootLogger);
            if (methodValue < transmitValue) return;
            transmit(this, {
              ts,
              methodLevel: level,
              methodValue,
              transmitLevel,
              transmitValue: rootLogger.levels.values[opts.transmit.level || self2._level],
              send: opts.transmit.send,
              val: levelToValue(self2._level, rootLogger)
            }, args, argsIsSerialized);
          }
        };
      }(self2[baseLogFunctionSymbol][level]);
    }
    function asObject(logger, level, args, ts, opts) {
      const {
        level: levelFormatter,
        log: logObjectFormatter = (obj) => obj
      } = opts.formatters || {};
      const argsCloned = args.slice();
      let msg = argsCloned[0];
      const logObject = {};
      if (ts) {
        logObject.time = ts;
      }
      if (levelFormatter) {
        const formattedLevel = levelFormatter(level, logger.levels.values[level]);
        Object.assign(logObject, formattedLevel);
      } else {
        logObject.level = logger.levels.values[level];
      }
      let lvl = (logger._childLevel | 0) + 1;
      if (lvl < 1) lvl = 1;
      if (msg !== null && typeof msg === "object") {
        while (lvl-- && typeof argsCloned[0] === "object") {
          Object.assign(logObject, argsCloned.shift());
        }
        msg = argsCloned.length ? format(argsCloned.shift(), argsCloned) : void 0;
      } else if (typeof msg === "string") msg = format(argsCloned.shift(), argsCloned);
      if (msg !== void 0) logObject[opts.messageKey] = msg;
      const formattedLogObject = logObjectFormatter(logObject);
      return formattedLogObject;
    }
    function applySerializers(args, serialize, serializers, stdErrSerialize) {
      for (const i in args) {
        if (stdErrSerialize && args[i] instanceof Error) {
          args[i] = pino2.stdSerializers.err(args[i]);
        } else if (typeof args[i] === "object" && !Array.isArray(args[i]) && serialize) {
          for (const k in args[i]) {
            if (serialize.indexOf(k) > -1 && k in serializers) {
              args[i][k] = serializers[k](args[i][k]);
            }
          }
        }
      }
    }
    function transmit(logger, opts, args, argsIsSerialized = false) {
      const send = opts.send;
      const ts = opts.ts;
      const methodLevel = opts.methodLevel;
      const methodValue = opts.methodValue;
      const val = opts.val;
      const bindings = logger._logEvent.bindings;
      if (!argsIsSerialized) {
        applySerializers(
          args,
          logger._serialize || Object.keys(logger.serializers),
          logger.serializers,
          logger._stdErrSerialize === void 0 ? true : logger._stdErrSerialize
        );
      }
      logger._logEvent.ts = ts;
      logger._logEvent.messages = args.filter(function(arg) {
        return bindings.indexOf(arg) === -1;
      });
      logger._logEvent.level.label = methodLevel;
      logger._logEvent.level.value = methodValue;
      send(methodLevel, logger._logEvent, val);
      logger._logEvent = createLogEventShape(bindings);
    }
    function createLogEventShape(bindings) {
      return {
        ts: 0,
        messages: [],
        bindings: bindings || [],
        level: { label: "", value: 0 }
      };
    }
    function asErrValue(err) {
      const obj = {
        type: err.constructor.name,
        msg: err.message,
        stack: err.stack
      };
      for (const key in err) {
        if (obj[key] === void 0) {
          obj[key] = err[key];
        }
      }
      return obj;
    }
    function getTimeFunction(opts) {
      if (typeof opts.timestamp === "function") {
        return opts.timestamp;
      }
      if (opts.timestamp === false) {
        return nullTime;
      }
      return epochTime;
    }
    function mock() {
      return {};
    }
    function passthrough(a) {
      return a;
    }
    function noop() {
    }
    function nullTime() {
      return false;
    }
    function epochTime() {
      return Date.now();
    }
    function unixTime() {
      return Math.round(Date.now() / 1e3);
    }
    function isoTime() {
      return new Date(Date.now()).toISOString();
    }
    function pfGlobalThisOrFallback() {
      function defd(o) {
        return typeof o !== "undefined" && o;
      }
      try {
        if (typeof globalThis !== "undefined") return globalThis;
        Object.defineProperty(Object.prototype, "globalThis", {
          get: function() {
            delete Object.prototype.globalThis;
            return this.globalThis = this;
          },
          configurable: true
        });
        return globalThis;
      } catch (e) {
        return defd(self) || defd(window) || defd(this) || {};
      }
    }
    module.exports.default = pino2;
    module.exports.pino = pino2;
  }
});

// src/cpu.ts
var import_pino = __toESM(require_browser(), 1);

// src/common.ts
var DISPLAY_WIDTH = 64;
var DISPLAY_HEIGHT = 32;
var FOREGROUND_COLOR = "#32CD32";
var BACKGROUND_COLOR = "black";
function u8(value) {
  return new Uint8Array([value])[0];
}
function u16(value) {
  return new Uint16Array([value])[0];
}
function assertUndefined(args) {
  if (args === void 0) throw new Error("undefined assertion");
}

// src/cpu.ts
var Cpu = class {
  // レジスタ定義
  memory;
  registerV;
  indexRegisterI;
  programCounter;
  stack;
  stackPointer;
  delayTimer;
  soundTimer;
  #fontset;
  // ディスプレイ
  display;
  keyboard;
  #debug = false;
  #logger;
  constructor(display2, keyboard2) {
    this.memory = new Uint8Array(4096);
    this.registerV = new Uint8Array(16);
    this.indexRegisterI = u16(0);
    this.programCounter = u16(512);
    this.stack = new Uint16Array(16);
    this.stackPointer = u8(0);
    this.delayTimer = u8(0);
    this.soundTimer = u8(0);
    this.#fontset = new Uint8Array([
      240,
      144,
      144,
      144,
      240,
      // 0
      32,
      96,
      32,
      32,
      112,
      // 1
      240,
      16,
      240,
      128,
      240,
      // 2
      240,
      16,
      240,
      16,
      240,
      // 3
      144,
      144,
      240,
      16,
      16,
      // 4
      240,
      128,
      240,
      16,
      240,
      // 5
      240,
      128,
      240,
      144,
      240,
      // 6
      240,
      16,
      32,
      64,
      64,
      // 7
      240,
      144,
      240,
      144,
      240,
      // 8
      240,
      144,
      240,
      16,
      240,
      // 9
      240,
      144,
      240,
      144,
      144,
      // A
      224,
      144,
      224,
      144,
      224,
      // B
      240,
      128,
      128,
      128,
      240,
      // C
      224,
      144,
      144,
      144,
      224,
      // D
      240,
      128,
      240,
      128,
      240,
      // E
      240,
      128,
      240,
      128,
      128
      // F
    ]);
    this.keyboard = keyboard2;
    this.display = display2;
    if (this.#debug) {
      this.#logger = (0, import_pino.default)({
        level: "trace",
        transport: {
          target: "pino/file",
          options: {
            destination: "logs/debug.log",
            mkdir: true
          }
        }
      });
    }
  }
  // ROMを読み込む
  readRom(romBuffer) {
    let fontset;
    for (let i = 0; i < this.#fontset.length; i++) {
      fontset = this.#fontset[i];
      assertUndefined(fontset);
      this.memory[i] = fontset;
    }
    let romBuf;
    for (let i = 0; i < romBuffer.length; i++) {
      romBuf = romBuffer[i];
      assertUndefined(romBuf);
      this.memory[512 + i] = romBuf;
    }
  }
  decrementTimers() {
    if (this.delayTimer > 0) this.delayTimer--;
    if (this.soundTimer > 0) this.soundTimer--;
  }
  // 命令コード実行
  update() {
    this.display.renderDisplay();
    const opcode = this._readOpCode();
    this.programCounter = u16(this.programCounter + 2);
    const c = (opcode & 61440) >> 12;
    const x = (opcode & 3840) >> 8;
    const y = (opcode & 240) >> 4;
    const d = (opcode & 15) >> 0;
    const nnn = opcode & 4095;
    const kk = opcode & 255;
    const hexOrder = [c.toString(16), x.toString(16), y.toString(16), d.toString(16)].join("-");
    this.#debugDump(hexOrder);
    try {
      switch (opcode & 61440) {
        case 0:
          return this._handle0(opcode);
        case 4096:
          return this._jpAddr(nnn);
        case 8192:
          return this._callAddr(nnn);
        case 12288:
          return this._seVxByte({ x, kk });
        case 16384:
          return this._sneVxByte({ x, kk });
        case 20480:
          return this._seVxVy({ x, y });
        case 24576:
          return this._ldVxByte({ x, kk });
        case 28672:
          return this._addVxByte({ x, kk });
        case 32768:
          return this._handle8({ x, y, opcode });
        case 36864:
          return this._sneVxVy({ x, y });
        case 40960:
          return this._ldIAddr(nnn);
        case 45056:
          return this._jpV0Addr(nnn);
        case 49152:
          return this._rndVxByte({ x, kk });
        case 53248:
          return this._drwVxVyNibble({ x, y, n: d });
        case 57344:
          return this._handleE({ x, opcode });
        case 61440:
          return this._handleF({ x, opcode });
        default:
          throw new Error();
      }
    } catch (e) {
      console.log(e);
      throw new Error(`invalid opcode ${hexOrder}`);
    }
  }
  _handle0(opcode) {
    switch (opcode & 255) {
      case 224:
        return this._cls();
      case 238:
        return this._ret();
      default:
        throw new Error();
    }
    ;
  }
  _handle8(args) {
    const { x, y, opcode } = args;
    switch (opcode & 15) {
      case 0:
        return this._ldVxVy({ x, y });
      case 1:
        return this._orVxVy({ x, y });
      case 2:
        return this._andVxVy({ x, y });
      case 3:
        return this._xorVxVy({ x, y });
      case 4:
        return this._addVxVy({ x, y });
      case 5:
        return this._subVxVy({ x, y });
      case 6:
        return this._shrVx(x);
      case 7:
        return this._subnVxVy({ x, y });
      case 14:
        return this._shlVx(x);
      default:
        throw new Error();
    }
    ;
  }
  _handleE(args) {
    const { x, opcode } = args;
    switch (opcode & 255) {
      case 158:
        return this._skpVx(x);
      case 161:
        return this._sknpVx(x);
      default:
        throw new Error();
    }
    ;
  }
  _handleF(args) {
    const { x, opcode } = args;
    switch (opcode & 255) {
      case 7:
        return this._ldVxDt(x);
      case 10:
        return this._ldVxK(x);
      case 21:
        return this._ldDtVx(x);
      case 24:
        return this._ldStVx(x);
      case 30:
        return this._addIVx(x);
      case 41:
        return this._ldFVx(x);
      case 51:
        return this._ldBVx(x);
      case 85:
        return this._ldIVx(x);
      case 101:
        return this._ldVxI(x);
      default:
        throw new Error();
    }
    ;
  }
  // プログラムカウンタから2バイト読む
  _readOpCode() {
    const ahead = this.memory[this.programCounter];
    const back = this.memory[this.programCounter + 1];
    assertUndefined(ahead);
    assertUndefined(back);
    return ahead << 8 | back;
  }
  _cls() {
    this.display.clearDisplay();
  }
  _ret() {
    const stack = this.stack[this.stackPointer];
    assertUndefined(stack);
    this.programCounter = u16(stack);
    this.stackPointer--;
  }
  _jpAddr(nnn) {
    this.programCounter = u16(nnn);
  }
  _callAddr(nnn) {
    this.stackPointer++;
    this.stack[this.stackPointer] = this.programCounter;
    this.programCounter = u16(nnn);
  }
  _seVxByte(args) {
    const { x, kk } = args;
    if (this.registerV[x] === kk) this.programCounter = u16(this.programCounter + 2);
  }
  _sneVxByte(args) {
    const { x, kk } = args;
    if (this.registerV[x] !== kk) this.programCounter = u16(this.programCounter + 2);
  }
  _seVxVy(args) {
    const { x, y } = args;
    if (this.registerV[x] === this.registerV[y]) this.programCounter = u16(this.programCounter + 2);
  }
  _ldVxByte(args) {
    const { x, kk } = args;
    this.registerV[x] = kk;
  }
  _addVxByte(args) {
    const { x, kk } = args;
    assertUndefined(this.registerV[x]);
    this.registerV[x] += kk;
  }
  _ldVxVy(args) {
    const { x, y } = args;
    assertUndefined(this.registerV[y]);
    this.registerV[x] = this.registerV[y];
  }
  _orVxVy(args) {
    const { x, y } = args;
    assertUndefined(this.registerV[x]);
    assertUndefined(this.registerV[y]);
    this.registerV[x] |= this.registerV[y];
  }
  _andVxVy(args) {
    const { x, y } = args;
    assertUndefined(this.registerV[x]);
    assertUndefined(this.registerV[y]);
    this.registerV[x] &= this.registerV[y];
  }
  _xorVxVy(args) {
    const { x, y } = args;
    assertUndefined(this.registerV[x]);
    assertUndefined(this.registerV[y]);
    this.registerV[x] ^= this.registerV[y];
  }
  _addVxVy(args) {
    const { x, y } = args;
    assertUndefined(this.registerV[x]);
    assertUndefined(this.registerV[y]);
    this.registerV[15] = this.registerV[x] + this.registerV[y] > 255 ? 1 : 0;
    this.registerV[x] += this.registerV[y];
  }
  _subVxVy(args) {
    const { x, y } = args;
    assertUndefined(this.registerV[x]);
    assertUndefined(this.registerV[y]);
    this.registerV[15] = this.registerV[x] > this.registerV[y] ? 1 : 0;
    this.registerV[x] -= this.registerV[y];
  }
  _shrVx(x) {
    assertUndefined(this.registerV[x]);
    this.registerV[15] = this.registerV[x] & 1 ? 1 : 0;
    this.registerV[x] >>= 1;
  }
  _subnVxVy(args) {
    const { x, y } = args;
    assertUndefined(this.registerV[x]);
    assertUndefined(this.registerV[y]);
    this.registerV[15] = this.registerV[y] > this.registerV[x] ? 1 : 0;
    this.registerV[x] = this.registerV[y] - this.registerV[x];
  }
  _shlVx(x) {
    assertUndefined(this.registerV[x]);
    this.registerV[15] = this.registerV[x] & 128 ? 1 : 0;
    this.registerV[x] <<= 1;
  }
  _sneVxVy(args) {
    const { x, y } = args;
    if (this.registerV[x] !== this.registerV[y]) this.programCounter = u16(this.programCounter + 2);
  }
  _ldIAddr(nnn) {
    this.indexRegisterI = u16(nnn);
  }
  _jpV0Addr(nnn) {
    assertUndefined(this.registerV[0]);
    this.programCounter = u16(nnn + this.registerV[0]);
  }
  _rndVxByte(args) {
    const { x, kk } = args;
    this.registerV[x] = Math.floor(Math.random() * 255) & kk;
  }
  // dもnも一緒に扱ってOK
  _drwVxVyNibble(args) {
    const { x, y, n } = args;
    this.registerV[15] = 0;
    assertUndefined(this.registerV[x]);
    assertUndefined(this.registerV[y]);
    for (let byteOffset = 0; byteOffset < n; byteOffset++) {
      const byte = this.memory[this.indexRegisterI + byteOffset];
      assertUndefined(byte);
      for (let bitOffset = 0; bitOffset < 8; bitOffset++) {
        if ((byte & 128 >> bitOffset) === 0) continue;
        const currX = (this.registerV[x] + bitOffset) % DISPLAY_WIDTH;
        const currY = (this.registerV[y] + byteOffset) % DISPLAY_HEIGHT;
        const pixel = this.display.getDisplayPixel({ currY, currX });
        const xor = pixel ^ 1;
        this.display.setDisplayPixel({ currY, currX, value: xor });
        if (pixel === 1) this.registerV[15] = 1;
        this.display.renderDisplay();
      }
    }
  }
  _skpVx(x) {
    if (this.keyboard.getKey() === this.registerV[x]) this.programCounter = u16(this.programCounter + 2);
  }
  _sknpVx(x) {
    if (this.keyboard.getKey() !== this.registerV[x]) this.programCounter = u16(this.programCounter + 2);
  }
  _ldVxDt(x) {
    this.registerV[x] = this.delayTimer;
  }
  _ldVxK(x) {
    const key = this.keyboard.getKey();
    if (key !== null) {
      this.registerV[x] = key;
    } else {
      this.programCounter = u16(this.programCounter - 2);
    }
  }
  _ldDtVx(x) {
    assertUndefined(this.registerV[x]);
    this.delayTimer = u8(this.registerV[x]);
  }
  _ldStVx(x) {
    assertUndefined(this.registerV[x]);
    this.soundTimer = u8(this.registerV[x]);
  }
  _addIVx(x) {
    assertUndefined(this.registerV[x]);
    this.indexRegisterI = u16(this.indexRegisterI + this.registerV[x]);
  }
  _ldFVx(x) {
    assertUndefined(this.registerV[x]);
    this.indexRegisterI = u16(this.registerV[x] * 5);
  }
  _ldBVx(x) {
    assertUndefined(this.registerV[x]);
    let v = this.registerV[x];
    const B = Math.floor(v / 100);
    v = v - B * 100;
    const C = Math.floor(v / 10);
    v = v - C * 10;
    const D = Math.floor(v);
    this.memory[this.indexRegisterI] = B;
    this.memory[this.indexRegisterI + 1] = C;
    this.memory[this.indexRegisterI + 2] = D;
  }
  _ldIVx(x) {
    for (let i = 0; i <= x; i++) {
      this.memory[this.indexRegisterI + i] = this.registerV[i];
    }
  }
  _ldVxI(x) {
    for (let i = 0; i <= x; i++) {
      this.registerV[i] = this.memory[this.indexRegisterI + i];
    }
  }
  #debugDump(hexOrder) {
    if (!this.#debug) return;
    if (!this.#logger) return;
    const dump = {
      "Order": hexOrder,
      "V": this.registerV,
      "I": this.indexRegisterI,
      "PG": this.programCounter,
      "Stack": this.stack,
      "SP": this.stackPointer,
      "DT": this.delayTimer,
      "ST": this.soundTimer,
      "Display": this.display.getDisplay()
    };
    this.#logger.trace(dump);
  }
};

// src/display/abstractDisplay.ts
var Display = class {
};

// src/display/webDisplay.ts
var WebDisplay = class extends Display {
  #displayBuffer;
  #canvas;
  #ctx;
  #zoom = 10;
  constructor(keyboard2) {
    super();
    this.#displayBuffer = this.initDisplay();
    this.#canvas = document.querySelector("canvas");
    this.#ctx = this.#canvas.getContext("2d");
    this.#ctx.fillStyle = BACKGROUND_COLOR;
    this.#ctx.fillRect(0, 0, DISPLAY_WIDTH * this.#zoom, DISPLAY_HEIGHT * this.#zoom);
    document.addEventListener("keydown", (event) => {
      keyboard2.setKey(event.key);
    });
    document.addEventListener("keyup", (_) => {
      keyboard2.initKey();
    });
  }
  getDisplay() {
    return this.#displayBuffer;
  }
  getDisplayPixel(args) {
    const { currY, currX } = args;
    assertUndefined(this.#displayBuffer[currY]?.[currX]);
    return this.#displayBuffer[currY]?.[currX];
  }
  setDisplayPixel(args) {
    const { currY, currX, value } = args;
    assertUndefined(this.#displayBuffer[currY]?.[currX]);
    this.#displayBuffer[currY][currX] = value;
  }
  initDisplay() {
    const displayBuffer = [];
    for (let i = 0; i < DISPLAY_HEIGHT; i++) {
      displayBuffer[i] = [];
      for (let j = 0; j < DISPLAY_WIDTH; j++) {
        displayBuffer[i].push(0);
      }
    }
    return displayBuffer;
  }
  renderDisplay() {
    for (let y = 0; y < DISPLAY_HEIGHT; y++) {
      for (let x = 0; x < DISPLAY_WIDTH; x++) {
        if (this.#displayBuffer[y]?.[x]) {
          this.#ctx.fillStyle = FOREGROUND_COLOR;
        } else {
          this.#ctx.fillStyle = BACKGROUND_COLOR;
        }
        this.#ctx.fillRect(x * this.#zoom, y * this.#zoom, this.#zoom, this.#zoom);
      }
    }
  }
  clearDisplay() {
    this.#displayBuffer = this.initDisplay();
    this.renderDisplay();
  }
};

// src/keyboard.ts
var KeyBoard = class {
  #keyInput = null;
  #keyboardMapper = /* @__PURE__ */ new Map([
    ["1", 1],
    ["2", 2],
    ["3", 3],
    ["4", 12],
    ["q", 4],
    ["w", 5],
    ["e", 6],
    ["r", 13],
    ["a", 7],
    ["s", 8],
    ["d", 9],
    ["f", 14],
    ["z", 10],
    ["x", 0],
    ["c", 11],
    ["v", 15]
  ]);
  initKey() {
    this.#keyInput = null;
  }
  getKey() {
    return this.#keyInput;
  }
  setKey(keyName) {
    if (!this.#keyboardMapper.has(keyName)) return;
    this.#keyInput = this.#keyboardMapper.get(keyName) ?? null;
  }
};

// src/main/web.ts
var keyboard = new KeyBoard();
var display = new WebDisplay(keyboard);
var cpu = new Cpu(display, keyboard);
var halt = false;
var sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));
document.getElementById("roms").addEventListener("change", async (event) => {
  const target = event.currentTarget;
  const rom = target.value;
  let romBuffer;
  try {
    const response = await fetch(rom);
    if (!response.ok) throw new Error();
    const arrayBuffer = await response.arrayBuffer();
    romBuffer = new Uint8Array(arrayBuffer);
  } catch {
    console.log("rom\u304C\u8AAD\u307F\u8FBC\u3081\u307E\u305B\u3093\u3067\u3057\u305F");
    return;
  }
  halt = true;
  await sleep(100);
  keyboard = new KeyBoard();
  display = new WebDisplay(keyboard);
  cpu = new Cpu(display, keyboard);
  cpu.readRom(romBuffer);
  halt = false;
  changeInstruction(rom);
  loop();
});
document.getElementById("pause").addEventListener("click", () => {
  halt = !halt;
  loop();
});
function loop() {
  if (halt) return;
  cpu.update();
  cpu.decrementTimers();
  setTimeout(loop, 5);
}
function changeInstruction(rom) {
  const instructionMap = /* @__PURE__ */ new Map([
    ["BRIX", "Q\u3067\u5DE6\u79FB\u52D5\u3001E\u3067\u53F3\u79FB\u52D5"],
    ["TETRIS", "Q\u3067\u56DE\u8EE2\u3001W\u3067\u5DE6\u79FB\u52D5\u3001E\u3067\u53F3\u79FB\u52D5\u3001A\u30DB\u30FC\u30EB\u30C9\u3067\u901F\u304F\u843D\u4E0B"],
    ["INVADERS", "W\u3067\u958B\u59CB\u3001W\u3067\u7403\u767A\u5C04\u3001Q\u3067\u5DE6\u79FB\u52D5\u3001E\u3067\u53F3\u79FB\u52D5"],
    ["LANDING", "S\u3067\u843D\u4E0B"]
  ]);
  document.getElementById("instruction").textContent = instructionMap.get(rom) || "";
}
