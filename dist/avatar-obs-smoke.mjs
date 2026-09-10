import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
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

// node_modules/ms/index.js
var require_ms = __commonJS({
  "node_modules/ms/index.js"(exports2, module) {
    var s = 1e3;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var w = d * 7;
    var y = d * 365.25;
    module.exports = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === "string" && val.length > 0) {
        return parse(val);
      } else if (type === "number" && isFinite(val)) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error(
        "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
      );
    };
    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || "ms").toLowerCase();
      switch (type) {
        case "years":
        case "year":
        case "yrs":
        case "yr":
        case "y":
          return n * y;
        case "weeks":
        case "week":
        case "w":
          return n * w;
        case "days":
        case "day":
        case "d":
          return n * d;
        case "hours":
        case "hour":
        case "hrs":
        case "hr":
        case "h":
          return n * h;
        case "minutes":
        case "minute":
        case "mins":
        case "min":
        case "m":
          return n * m;
        case "seconds":
        case "second":
        case "secs":
        case "sec":
        case "s":
          return n * s;
        case "milliseconds":
        case "millisecond":
        case "msecs":
        case "msec":
        case "ms":
          return n;
        default:
          return void 0;
      }
    }
    function fmtShort(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return Math.round(ms / d) + "d";
      }
      if (msAbs >= h) {
        return Math.round(ms / h) + "h";
      }
      if (msAbs >= m) {
        return Math.round(ms / m) + "m";
      }
      if (msAbs >= s) {
        return Math.round(ms / s) + "s";
      }
      return ms + "ms";
    }
    function fmtLong(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return plural(ms, msAbs, d, "day");
      }
      if (msAbs >= h) {
        return plural(ms, msAbs, h, "hour");
      }
      if (msAbs >= m) {
        return plural(ms, msAbs, m, "minute");
      }
      if (msAbs >= s) {
        return plural(ms, msAbs, s, "second");
      }
      return ms + " ms";
    }
    function plural(ms, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
    }
  }
});

// node_modules/debug/src/common.js
var require_common = __commonJS({
  "node_modules/debug/src/common.js"(exports2, module) {
    function setup(env) {
      createDebug2.debug = createDebug2;
      createDebug2.default = createDebug2;
      createDebug2.coerce = coerce;
      createDebug2.disable = disable;
      createDebug2.enable = enable;
      createDebug2.enabled = enabled;
      createDebug2.humanize = require_ms();
      createDebug2.destroy = destroy;
      Object.keys(env).forEach((key) => {
        createDebug2[key] = env[key];
      });
      createDebug2.names = [];
      createDebug2.skips = [];
      createDebug2.formatters = {};
      function selectColor(namespace) {
        let hash = 0;
        for (let i = 0; i < namespace.length; i++) {
          hash = (hash << 5) - hash + namespace.charCodeAt(i);
          hash |= 0;
        }
        return createDebug2.colors[Math.abs(hash) % createDebug2.colors.length];
      }
      createDebug2.selectColor = selectColor;
      function createDebug2(namespace) {
        let prevTime;
        let enableOverride = null;
        let namespacesCache;
        let enabledCache;
        function debug2(...args) {
          if (!debug2.enabled) {
            return;
          }
          const self2 = debug2;
          const curr = Number(/* @__PURE__ */ new Date());
          const ms = curr - (prevTime || curr);
          self2.diff = ms;
          self2.prev = prevTime;
          self2.curr = curr;
          prevTime = curr;
          args[0] = createDebug2.coerce(args[0]);
          if (typeof args[0] !== "string") {
            args.unshift("%O");
          }
          let index = 0;
          args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
            if (match === "%%") {
              return "%";
            }
            index++;
            const formatter = createDebug2.formatters[format];
            if (typeof formatter === "function") {
              const val = args[index];
              match = formatter.call(self2, val);
              args.splice(index, 1);
              index--;
            }
            return match;
          });
          createDebug2.formatArgs.call(self2, args);
          const logFn = self2.log || createDebug2.log;
          logFn.apply(self2, args);
        }
        debug2.namespace = namespace;
        debug2.useColors = createDebug2.useColors();
        debug2.color = createDebug2.selectColor(namespace);
        debug2.extend = extend;
        debug2.destroy = createDebug2.destroy;
        Object.defineProperty(debug2, "enabled", {
          enumerable: true,
          configurable: false,
          get: () => {
            if (enableOverride !== null) {
              return enableOverride;
            }
            if (namespacesCache !== createDebug2.namespaces) {
              namespacesCache = createDebug2.namespaces;
              enabledCache = createDebug2.enabled(namespace);
            }
            return enabledCache;
          },
          set: (v) => {
            enableOverride = v;
          }
        });
        if (typeof createDebug2.init === "function") {
          createDebug2.init(debug2);
        }
        return debug2;
      }
      function extend(namespace, delimiter) {
        const newDebug = createDebug2(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
        newDebug.log = this.log;
        return newDebug;
      }
      function enable(namespaces) {
        createDebug2.save(namespaces);
        createDebug2.namespaces = namespaces;
        createDebug2.names = [];
        createDebug2.skips = [];
        const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
        for (const ns of split) {
          if (ns[0] === "-") {
            createDebug2.skips.push(ns.slice(1));
          } else {
            createDebug2.names.push(ns);
          }
        }
      }
      function matchesTemplate(search, template) {
        let searchIndex = 0;
        let templateIndex = 0;
        let starIndex = -1;
        let matchIndex = 0;
        while (searchIndex < search.length) {
          if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
            if (template[templateIndex] === "*") {
              starIndex = templateIndex;
              matchIndex = searchIndex;
              templateIndex++;
            } else {
              searchIndex++;
              templateIndex++;
            }
          } else if (starIndex !== -1) {
            templateIndex = starIndex + 1;
            matchIndex++;
            searchIndex = matchIndex;
          } else {
            return false;
          }
        }
        while (templateIndex < template.length && template[templateIndex] === "*") {
          templateIndex++;
        }
        return templateIndex === template.length;
      }
      function disable() {
        const namespaces = [
          ...createDebug2.names,
          ...createDebug2.skips.map((namespace) => "-" + namespace)
        ].join(",");
        createDebug2.enable("");
        return namespaces;
      }
      function enabled(name) {
        for (const skip of createDebug2.skips) {
          if (matchesTemplate(name, skip)) {
            return false;
          }
        }
        for (const ns of createDebug2.names) {
          if (matchesTemplate(name, ns)) {
            return true;
          }
        }
        return false;
      }
      function coerce(val) {
        if (val instanceof Error) {
          return val.stack || val.message;
        }
        return val;
      }
      function destroy() {
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
      createDebug2.enable(createDebug2.load());
      return createDebug2;
    }
    module.exports = setup;
  }
});

// node_modules/debug/src/browser.js
var require_browser = __commonJS({
  "node_modules/debug/src/browser.js"(exports2, module) {
    exports2.formatArgs = formatArgs;
    exports2.save = save;
    exports2.load = load;
    exports2.useColors = useColors;
    exports2.storage = localstorage();
    exports2.destroy = /* @__PURE__ */ (() => {
      let warned = false;
      return () => {
        if (!warned) {
          warned = true;
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
      };
    })();
    exports2.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
        return true;
      }
      if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
        return false;
      }
      let m;
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function formatArgs(args) {
      args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
      if (!this.useColors) {
        return;
      }
      const c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      let index = 0;
      let lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, (match) => {
        if (match === "%%") {
          return;
        }
        index++;
        if (match === "%c") {
          lastC = index;
        }
      });
      args.splice(lastC, 0, c);
    }
    exports2.log = console.debug || console.log || (() => {
    });
    function save(namespaces) {
      try {
        if (namespaces) {
          exports2.storage.setItem("debug", namespaces);
        } else {
          exports2.storage.removeItem("debug");
        }
      } catch (error) {
      }
    }
    function load() {
      let r;
      try {
        r = exports2.storage.getItem("debug") || exports2.storage.getItem("DEBUG");
      } catch (error) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }
      return r;
    }
    function localstorage() {
      try {
        return localStorage;
      } catch (error) {
      }
    }
    module.exports = require_common()(exports2);
    var { formatters } = module.exports;
    formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (error) {
        return "[UnexpectedJSONParseError]: " + error.message;
      }
    };
  }
});

// node_modules/debug/src/node.js
var require_node = __commonJS({
  "node_modules/debug/src/node.js"(exports2, module) {
    var tty = __require("tty");
    var util = __require("util");
    exports2.init = init;
    exports2.log = log;
    exports2.formatArgs = formatArgs;
    exports2.save = save;
    exports2.load = load;
    exports2.useColors = useColors;
    exports2.destroy = util.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    );
    exports2.colors = [6, 2, 3, 4, 5, 1];
    try {
      const supportsColor = __require("supports-color");
      if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
        exports2.colors = [
          20,
          21,
          26,
          27,
          32,
          33,
          38,
          39,
          40,
          41,
          42,
          43,
          44,
          45,
          56,
          57,
          62,
          63,
          68,
          69,
          74,
          75,
          76,
          77,
          78,
          79,
          80,
          81,
          92,
          93,
          98,
          99,
          112,
          113,
          128,
          129,
          134,
          135,
          148,
          149,
          160,
          161,
          162,
          163,
          164,
          165,
          166,
          167,
          168,
          169,
          170,
          171,
          172,
          173,
          178,
          179,
          184,
          185,
          196,
          197,
          198,
          199,
          200,
          201,
          202,
          203,
          204,
          205,
          206,
          207,
          208,
          209,
          214,
          215,
          220,
          221
        ];
      }
    } catch (error) {
    }
    exports2.inspectOpts = Object.keys(process.env).filter((key) => {
      return /^debug_/i.test(key);
    }).reduce((obj, key) => {
      const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
        return k.toUpperCase();
      });
      let val = process.env[key];
      if (/^(yes|on|true|enabled)$/i.test(val)) {
        val = true;
      } else if (/^(no|off|false|disabled)$/i.test(val)) {
        val = false;
      } else if (val === "null") {
        val = null;
      } else {
        val = Number(val);
      }
      obj[prop] = val;
      return obj;
    }, {});
    function useColors() {
      return "colors" in exports2.inspectOpts ? Boolean(exports2.inspectOpts.colors) : tty.isatty(process.stderr.fd);
    }
    function formatArgs(args) {
      const { namespace: name, useColors: useColors2 } = this;
      if (useColors2) {
        const c = this.color;
        const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
        const prefix = `  ${colorCode};1m${name} \x1B[0m`;
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push(colorCode + "m+" + module.exports.humanize(this.diff) + "\x1B[0m");
      } else {
        args[0] = getDate() + name + " " + args[0];
      }
    }
    function getDate() {
      if (exports2.inspectOpts.hideDate) {
        return "";
      }
      return (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function log(...args) {
      return process.stderr.write(util.formatWithOptions(exports2.inspectOpts, ...args) + "\n");
    }
    function save(namespaces) {
      if (namespaces) {
        process.env.DEBUG = namespaces;
      } else {
        delete process.env.DEBUG;
      }
    }
    function load() {
      return process.env.DEBUG;
    }
    function init(debug2) {
      debug2.inspectOpts = {};
      const keys = Object.keys(exports2.inspectOpts);
      for (let i = 0; i < keys.length; i++) {
        debug2.inspectOpts[keys[i]] = exports2.inspectOpts[keys[i]];
      }
    }
    module.exports = require_common()(exports2);
    var { formatters } = module.exports;
    formatters.o = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts).split("\n").map((str) => str.trim()).join(" ");
    };
    formatters.O = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts);
    };
  }
});

// node_modules/debug/src/index.js
var require_src = __commonJS({
  "node_modules/debug/src/index.js"(exports2, module) {
    if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) {
      module.exports = require_browser();
    } else {
      module.exports = require_node();
    }
  }
});

// node_modules/eventemitter3/index.js
var require_eventemitter3 = __commonJS({
  "node_modules/eventemitter3/index.js"(exports2, module) {
    "use strict";
    var has = Object.prototype.hasOwnProperty;
    var prefix = "~";
    function Events() {
    }
    if (Object.create) {
      Events.prototype = /* @__PURE__ */ Object.create(null);
      if (!new Events().__proto__) prefix = false;
    }
    function EE(fn, context, once) {
      this.fn = fn;
      this.context = context;
      this.once = once || false;
    }
    function addListener(emitter, event, fn, context, once) {
      if (typeof fn !== "function") {
        throw new TypeError("The listener must be a function");
      }
      var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
      if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
      else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
      else emitter._events[evt] = [emitter._events[evt], listener];
      return emitter;
    }
    function clearEvent(emitter, evt) {
      if (--emitter._eventsCount === 0) emitter._events = new Events();
      else delete emitter._events[evt];
    }
    function EventEmitter2() {
      this._events = new Events();
      this._eventsCount = 0;
    }
    EventEmitter2.prototype.eventNames = function eventNames() {
      var names = [], events, name;
      if (this._eventsCount === 0) return names;
      for (name in events = this._events) {
        if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
      }
      if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
      }
      return names;
    };
    EventEmitter2.prototype.listeners = function listeners(event) {
      var evt = prefix ? prefix + event : event, handlers = this._events[evt];
      if (!handlers) return [];
      if (handlers.fn) return [handlers.fn];
      for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
        ee[i] = handlers[i].fn;
      }
      return ee;
    };
    EventEmitter2.prototype.listenerCount = function listenerCount(event) {
      var evt = prefix ? prefix + event : event, listeners = this._events[evt];
      if (!listeners) return 0;
      if (listeners.fn) return 1;
      return listeners.length;
    };
    EventEmitter2.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt]) return false;
      var listeners = this._events[evt], len = arguments.length, args, i;
      if (listeners.fn) {
        if (listeners.once) this.removeListener(event, listeners.fn, void 0, true);
        switch (len) {
          case 1:
            return listeners.fn.call(listeners.context), true;
          case 2:
            return listeners.fn.call(listeners.context, a1), true;
          case 3:
            return listeners.fn.call(listeners.context, a1, a2), true;
          case 4:
            return listeners.fn.call(listeners.context, a1, a2, a3), true;
          case 5:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
          case 6:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }
        for (i = 1, args = new Array(len - 1); i < len; i++) {
          args[i - 1] = arguments[i];
        }
        listeners.fn.apply(listeners.context, args);
      } else {
        var length = listeners.length, j;
        for (i = 0; i < length; i++) {
          if (listeners[i].once) this.removeListener(event, listeners[i].fn, void 0, true);
          switch (len) {
            case 1:
              listeners[i].fn.call(listeners[i].context);
              break;
            case 2:
              listeners[i].fn.call(listeners[i].context, a1);
              break;
            case 3:
              listeners[i].fn.call(listeners[i].context, a1, a2);
              break;
            case 4:
              listeners[i].fn.call(listeners[i].context, a1, a2, a3);
              break;
            default:
              if (!args) for (j = 1, args = new Array(len - 1); j < len; j++) {
                args[j - 1] = arguments[j];
              }
              listeners[i].fn.apply(listeners[i].context, args);
          }
        }
      }
      return true;
    };
    EventEmitter2.prototype.on = function on(event, fn, context) {
      return addListener(this, event, fn, context, false);
    };
    EventEmitter2.prototype.once = function once(event, fn, context) {
      return addListener(this, event, fn, context, true);
    };
    EventEmitter2.prototype.removeListener = function removeListener(event, fn, context, once) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt]) return this;
      if (!fn) {
        clearEvent(this, evt);
        return this;
      }
      var listeners = this._events[evt];
      if (listeners.fn) {
        if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
          clearEvent(this, evt);
        }
      } else {
        for (var i = 0, events = [], length = listeners.length; i < length; i++) {
          if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
            events.push(listeners[i]);
          }
        }
        if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
        else clearEvent(this, evt);
      }
      return this;
    };
    EventEmitter2.prototype.removeAllListeners = function removeAllListeners(event) {
      var evt;
      if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt]) clearEvent(this, evt);
      } else {
        this._events = new Events();
        this._eventsCount = 0;
      }
      return this;
    };
    EventEmitter2.prototype.off = EventEmitter2.prototype.removeListener;
    EventEmitter2.prototype.addListener = EventEmitter2.prototype.on;
    EventEmitter2.prefixed = prefix;
    EventEmitter2.EventEmitter = EventEmitter2;
    if ("undefined" !== typeof module) {
      module.exports = EventEmitter2;
    }
  }
});

// node_modules/ws/lib/constants.js
var require_constants = __commonJS({
  "node_modules/ws/lib/constants.js"(exports2, module) {
    "use strict";
    var BINARY_TYPES = ["nodebuffer", "arraybuffer", "fragments"];
    var hasBlob = typeof Blob !== "undefined";
    if (hasBlob) BINARY_TYPES.push("blob");
    module.exports = {
      BINARY_TYPES,
      CLOSE_TIMEOUT: 3e4,
      EMPTY_BUFFER: Buffer.alloc(0),
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      hasBlob,
      kForOnEventAttribute: Symbol("kIsForOnEventAttribute"),
      kListener: Symbol("kListener"),
      kStatusCode: Symbol("status-code"),
      kWebSocket: Symbol("websocket"),
      NOOP: () => {
      }
    };
  }
});

// node_modules/ws/lib/buffer-util.js
var require_buffer_util = __commonJS({
  "node_modules/ws/lib/buffer-util.js"(exports2, module) {
    "use strict";
    var { EMPTY_BUFFER } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    function concat(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER;
      if (list.length === 1) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset);
        offset += buf.length;
      }
      if (offset < totalLength) {
        return new FastBuffer(target.buffer, target.byteOffset, offset);
      }
      return target;
    }
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    function _unmask(buffer, mask) {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    function toArrayBuffer(buf) {
      if (buf.length === buf.buffer.byteLength) {
        return buf.buffer;
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    }
    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data)) return data;
      let buf;
      if (data instanceof ArrayBuffer) {
        buf = new FastBuffer(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }
      return buf;
    }
    module.exports = {
      concat,
      mask: _mask,
      toArrayBuffer,
      toBuffer,
      unmask: _unmask
    };
    if (!process.env.WS_NO_BUFFER_UTIL) {
      try {
        const bufferUtil = __require("bufferutil");
        module.exports.mask = function(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);
          else bufferUtil.mask(source, mask, output, offset, length);
        };
        module.exports.unmask = function(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);
          else bufferUtil.unmask(buffer, mask);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/ws/lib/limiter.js
var require_limiter = __commonJS({
  "node_modules/ws/lib/limiter.js"(exports2, module) {
    "use strict";
    var kDone = Symbol("kDone");
    var kRun = Symbol("kRun");
    var Limiter = class {
      /**
       * Creates a new `Limiter`.
       *
       * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
       *     to run concurrently
       */
      constructor(concurrency) {
        this[kDone] = () => {
          this.pending--;
          this[kRun]();
        };
        this.concurrency = concurrency || Infinity;
        this.jobs = [];
        this.pending = 0;
      }
      /**
       * Adds a job to the queue.
       *
       * @param {Function} job The job to run
       * @public
       */
      add(job) {
        this.jobs.push(job);
        this[kRun]();
      }
      /**
       * Removes a job from the queue and runs it if possible.
       *
       * @private
       */
      [kRun]() {
        if (this.pending === this.concurrency) return;
        if (this.jobs.length) {
          const job = this.jobs.shift();
          this.pending++;
          job(this[kDone]);
        }
      }
    };
    module.exports = Limiter;
  }
});

// node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = __commonJS({
  "node_modules/ws/lib/permessage-deflate.js"(exports2, module) {
    "use strict";
    var zlib = __require("zlib");
    var bufferUtil = require_buffer_util();
    var Limiter = require_limiter();
    var { kStatusCode } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    var TRAILER = Buffer.from([0, 0, 255, 255]);
    var kPerMessageDeflate = Symbol("permessage-deflate");
    var kTotalLength = Symbol("total-length");
    var kCallback = Symbol("callback");
    var kBuffers = Symbol("buffers");
    var kError = Symbol("error");
    var zlibLimiter;
    var PerMessageDeflate = class {
      /**
       * Creates a PerMessageDeflate instance.
       *
       * @param {Object} [options] Configuration options
       * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
       *     for, or request, a custom client window size
       * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
       *     acknowledge disabling of client context takeover
       * @param {Number} [options.concurrencyLimit=10] The number of concurrent
       *     calls to zlib
       * @param {Boolean} [options.isServer=false] Create the instance in either
       *     server or client mode
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
       *     use of a custom server window size
       * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
       *     disabling of server context takeover
       * @param {Number} [options.threshold=1024] Size (in bytes) below which
       *     messages should not be compressed if context takeover is disabled
       * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
       *     deflate
       * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
       *     inflate
       */
      constructor(options) {
        this._options = options || {};
        this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
        this._maxPayload = this._options.maxPayload | 0;
        this._isServer = !!this._options.isServer;
        this._deflate = null;
        this._inflate = null;
        this.params = null;
        if (!zlibLimiter) {
          const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }
      /**
       * @type {String}
       */
      static get extensionName() {
        return "permessage-deflate";
      }
      /**
       * Create an extension negotiation offer.
       *
       * @return {Object} Extension parameters
       * @public
       */
      offer() {
        const params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      }
      /**
       * Accept an extension negotiation offer/response.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Object} Accepted configuration
       * @public
       */
      accept(configurations) {
        configurations = this.normalizeParams(configurations);
        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
        return this.params;
      }
      /**
       * Releases all resources used by the extension.
       *
       * @public
       */
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }
        if (this._deflate) {
          const callback = this._deflate[kCallback];
          this._deflate.close();
          this._deflate = null;
          if (callback) {
            callback(
              new Error(
                "The deflate stream was closed while data was being processed"
              )
            );
          }
        }
      }
      /**
       *  Accept an extension negotiation offer.
       *
       * @param {Array} offers The extension negotiation offers
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find((params) => {
          if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && (typeof params.client_max_window_bits === "number" ? opts.clientMaxWindowBits > params.client_max_window_bits : !params.client_max_window_bits)) {
            return false;
          }
          return true;
        });
        if (!accepted) {
          throw new Error("None of the extension offers can be accepted");
        }
        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === "number") {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === "number") {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
          delete accepted.client_max_window_bits;
        }
        return accepted;
      }
      /**
       * Accept the extension negotiation response.
       *
       * @param {Array} response The extension negotiation response
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsClient(response) {
        const params = response[0];
        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }
        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === "number") {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }
        return params;
      }
      /**
       * Normalize parameters.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Array} The offers/response with normalized parameters
       * @private
       */
      normalizeParams(configurations) {
        configurations.forEach((params) => {
          Object.keys(params).forEach((key) => {
            let value = params[key];
            if (value.length > 1) {
              throw new Error(`Parameter "${key}" must have only a single value`);
            }
            value = value[0];
            if (key === "client_max_window_bits") {
              if (value !== true) {
                const num = +value;
                if (!Number.isInteger(num) || num < 8 || num > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
                }
                value = num;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else if (key === "server_max_window_bits") {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num;
            } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key}"`);
            }
            params[key] = value;
          });
        });
        return configurations;
      }
      /**
       * Decompress data. Concurrency limited.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      decompress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Compress data. Concurrency limited.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      compress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Decompress data.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._inflate = zlib.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits
          });
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on("error", inflateOnError);
          this._inflate.on("data", inflateOnData);
        }
        this._inflate[kCallback] = callback;
        this._inflate.write(data);
        if (fin) this._inflate.write(TRAILER);
        this._inflate.flush(() => {
          const err = this._inflate[kError];
          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }
          const data2 = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );
          if (this._inflate._readableState.endEmitted) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];
            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
              this._inflate.reset();
            }
          }
          callback(null, data2);
        });
      }
      /**
       * Compress data.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._deflate = zlib.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits
          });
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          this._deflate.on("data", deflateOnData);
        }
        this._deflate[kCallback] = callback;
        this._deflate.write(data);
        this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            return;
          }
          let data2 = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );
          if (fin) {
            data2 = new FastBuffer(data2.buffer, data2.byteOffset, data2.length - 4);
          }
          this._deflate[kCallback] = null;
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.reset();
          }
          callback(null, data2);
        });
      }
    };
    module.exports = PerMessageDeflate;
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk);
      this[kTotalLength] += chunk.length;
    }
    function inflateOnData(chunk) {
      this[kTotalLength] += chunk.length;
      if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
        this[kBuffers].push(chunk);
        return;
      }
      this[kError] = new RangeError("Max payload size exceeded");
      this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
      this[kError][kStatusCode] = 1009;
      this.removeListener("data", inflateOnData);
      this.reset();
    }
    function inflateOnError(err) {
      this[kPerMessageDeflate]._inflate = null;
      if (this[kError]) {
        this[kCallback](this[kError]);
        return;
      }
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }
  }
});

// node_modules/ws/lib/validation.js
var require_validation = __commonJS({
  "node_modules/ws/lib/validation.js"(exports2, module) {
    "use strict";
    var { isUtf8 } = __require("buffer");
    var { hasBlob } = require_constants();
    var tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 16 - 31
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      // 48 - 63
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0
      // 112 - 127
    ];
    function isValidStatusCode(code) {
      return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
    }
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
          buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
          buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    function isBlob(value) {
      return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
    }
    module.exports = {
      isBlob,
      isValidStatusCode,
      isValidUTF8: _isValidUTF8,
      tokenChars
    };
    if (isUtf8) {
      module.exports.isValidUTF8 = function(buf) {
        return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
      };
    } else if (!process.env.WS_NO_UTF_8_VALIDATE) {
      try {
        const isValidUTF8 = __require("utf-8-validate");
        module.exports.isValidUTF8 = function(buf) {
          return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/ws/lib/receiver.js
var require_receiver = __commonJS({
  "node_modules/ws/lib/receiver.js"(exports2, module) {
    "use strict";
    var { Writable } = __require("stream");
    var PerMessageDeflate = require_permessage_deflate();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      kStatusCode,
      kWebSocket
    } = require_constants();
    var { concat, toArrayBuffer, unmask } = require_buffer_util();
    var { isValidStatusCode, isValidUTF8 } = require_validation();
    var FastBuffer = Buffer[Symbol.species];
    var GET_INFO = 0;
    var GET_PAYLOAD_LENGTH_16 = 1;
    var GET_PAYLOAD_LENGTH_64 = 2;
    var GET_MASK = 3;
    var GET_DATA = 4;
    var INFLATING = 5;
    var DEFER_EVENT = 6;
    var Receiver = class extends Writable {
      /**
       * Creates a Receiver instance.
       *
       * @param {Object} [options] Options object
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {String} [options.binaryType=nodebuffer] The type for binary data
       * @param {Object} [options.extensions] An object containing the negotiated
       *     extensions
       * @param {Boolean} [options.isServer=false] Specifies whether to operate in
       *     client or server mode
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       */
      constructor(options = {}) {
        super();
        this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
        this._binaryType = options.binaryType || BINARY_TYPES[0];
        this._extensions = options.extensions || {};
        this._isServer = !!options.isServer;
        this._maxBufferedChunks = options.maxBufferedChunks | 0;
        this._maxFragments = options.maxFragments | 0;
        this._maxPayload = options.maxPayload | 0;
        this._skipUTF8Validation = !!options.skipUTF8Validation;
        this[kWebSocket] = void 0;
        this._bufferedBytes = 0;
        this._buffers = [];
        this._compressed = false;
        this._payloadLength = 0;
        this._mask = void 0;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._numFragments = 0;
        this._fragments = [];
        this._errored = false;
        this._loop = false;
        this._state = GET_INFO;
      }
      /**
       * Implements `Writable.prototype._write()`.
       *
       * @param {Buffer} chunk The chunk of data to write
       * @param {String} encoding The character encoding of `chunk`
       * @param {Function} cb Callback
       * @private
       */
      _write(chunk, encoding, cb) {
        if (this._opcode === 8 && this._state == GET_INFO) return cb();
        if (this._maxBufferedChunks > 0 && this._buffers.length >= this._maxBufferedChunks) {
          cb(
            this.createError(
              RangeError,
              "Too many buffered chunks",
              false,
              1008,
              "WS_ERR_TOO_MANY_BUFFERED_PARTS"
            )
          );
          return;
        }
        this._bufferedBytes += chunk.length;
        this._buffers.push(chunk);
        this.startLoop(cb);
      }
      /**
       * Consumes `n` bytes from the buffered data.
       *
       * @param {Number} n The number of bytes to consume
       * @return {Buffer} The consumed bytes
       * @private
       */
      consume(n) {
        this._bufferedBytes -= n;
        if (n === this._buffers[0].length) return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = new FastBuffer(
            buf.buffer,
            buf.byteOffset + n,
            buf.length - n
          );
          return new FastBuffer(buf.buffer, buf.byteOffset, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0];
          const offset = dst.length - n;
          if (n >= buf.length) {
            dst.set(this._buffers.shift(), offset);
          } else {
            dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
            this._buffers[0] = new FastBuffer(
              buf.buffer,
              buf.byteOffset + n,
              buf.length - n
            );
          }
          n -= buf.length;
        } while (n > 0);
        return dst;
      }
      /**
       * Starts the parsing loop.
       *
       * @param {Function} cb Callback
       * @private
       */
      startLoop(cb) {
        this._loop = true;
        do {
          switch (this._state) {
            case GET_INFO:
              this.getInfo(cb);
              break;
            case GET_PAYLOAD_LENGTH_16:
              this.getPayloadLength16(cb);
              break;
            case GET_PAYLOAD_LENGTH_64:
              this.getPayloadLength64(cb);
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              this.getData(cb);
              break;
            case INFLATING:
            case DEFER_EVENT:
              this._loop = false;
              return;
          }
        } while (this._loop);
        if (!this._errored) cb();
      }
      /**
       * Reads the first two bytes of a frame.
       *
       * @param {Function} cb Callback
       * @private
       */
      getInfo(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        const buf = this.consume(2);
        if ((buf[0] & 48) !== 0) {
          const error = this.createError(
            RangeError,
            "RSV2 and RSV3 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_2_3"
          );
          cb(error);
          return;
        }
        const compressed = (buf[0] & 64) === 64;
        if (compressed && !this._extensions[PerMessageDeflate.extensionName]) {
          const error = this.createError(
            RangeError,
            "RSV1 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          cb(error);
          return;
        }
        this._fin = (buf[0] & 128) === 128;
        this._opcode = buf[0] & 15;
        this._payloadLength = buf[1] & 127;
        if (this._opcode === 0) {
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (!this._fragmented) {
            const error = this.createError(
              RangeError,
              "invalid opcode 0",
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            const error = this.createError(
              RangeError,
              `invalid opcode ${this._opcode}`,
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._compressed = compressed;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            const error = this.createError(
              RangeError,
              "FIN must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_FIN"
            );
            cb(error);
            return;
          }
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
            const error = this.createError(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002,
              "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
            );
            cb(error);
            return;
          }
        } else {
          const error = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            true,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          cb(error);
          return;
        }
        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
        this._masked = (buf[1] & 128) === 128;
        if (this._isServer) {
          if (!this._masked) {
            const error = this.createError(
              RangeError,
              "MASK must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_MASK"
            );
            cb(error);
            return;
          }
        } else if (this._masked) {
          const error = this.createError(
            RangeError,
            "MASK must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_MASK"
          );
          cb(error);
          return;
        }
        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
        else this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+16).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength16(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        this._payloadLength = this.consume(2).readUInt16BE(0);
        this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+64).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength64(cb) {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }
        const buf = this.consume(8);
        const num = buf.readUInt32BE(0);
        if (num > Math.pow(2, 53 - 32) - 1) {
          const error = this.createError(
            RangeError,
            "Unsupported WebSocket frame: payload length > 2^53 - 1",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
          );
          cb(error);
          return;
        }
        this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
        this.haveLength(cb);
      }
      /**
       * Payload length has been read.
       *
       * @param {Function} cb Callback
       * @private
       */
      haveLength(cb) {
        if (this._payloadLength && this._opcode < 8) {
          this._totalPayloadLength += this._payloadLength;
          if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
            const error = this.createError(
              RangeError,
              "Max payload size exceeded",
              false,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            cb(error);
            return;
          }
        }
        if (this._masked) this._state = GET_MASK;
        else this._state = GET_DATA;
      }
      /**
       * Reads mask bytes.
       *
       * @private
       */
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }
        this._mask = this.consume(4);
        this._state = GET_DATA;
      }
      /**
       * Reads data bytes.
       *
       * @param {Function} cb Callback
       * @private
       */
      getData(cb) {
        let data = EMPTY_BUFFER;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }
          data = this.consume(this._payloadLength);
          if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
            unmask(data, this._mask);
          }
        }
        if (this._opcode > 7) {
          this.controlMessage(data, cb);
          return;
        }
        if (this._maxFragments > 0 && ++this._numFragments > this._maxFragments) {
          const error = this.createError(
            RangeError,
            "Too many message fragments",
            false,
            1008,
            "WS_ERR_TOO_MANY_BUFFERED_PARTS"
          );
          cb(error);
          return;
        }
        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }
        if (data.length) {
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }
        this.dataMessage(cb);
      }
      /**
       * Decompresses data.
       *
       * @param {Buffer} data Compressed data
       * @param {Function} cb Callback
       * @private
       */
      decompress(data, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err) return cb(err);
          if (buf.length) {
            this._messageLength += buf.length;
            if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
              const error = this.createError(
                RangeError,
                "Max payload size exceeded",
                false,
                1009,
                "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
              );
              cb(error);
              return;
            }
            this._fragments.push(buf);
          }
          this.dataMessage(cb);
          if (this._state === GET_INFO) this.startLoop(cb);
        });
      }
      /**
       * Handles a data message.
       *
       * @param {Function} cb Callback
       * @private
       */
      dataMessage(cb) {
        if (!this._fin) {
          this._state = GET_INFO;
          return;
        }
        const messageLength = this._messageLength;
        const fragments = this._fragments;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragmented = 0;
        this._numFragments = 0;
        this._fragments = [];
        if (this._opcode === 2) {
          let data;
          if (this._binaryType === "nodebuffer") {
            data = concat(fragments, messageLength);
          } else if (this._binaryType === "arraybuffer") {
            data = toArrayBuffer(concat(fragments, messageLength));
          } else if (this._binaryType === "blob") {
            data = new Blob(fragments);
          } else {
            data = fragments;
          }
          if (this._allowSynchronousEvents) {
            this.emit("message", data, true);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", data, true);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        } else {
          const buf = concat(fragments, messageLength);
          if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
            const error = this.createError(
              Error,
              "invalid UTF-8 sequence",
              true,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            cb(error);
            return;
          }
          if (this._state === INFLATING || this._allowSynchronousEvents) {
            this.emit("message", buf, false);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", buf, false);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        }
      }
      /**
       * Handles a control message.
       *
       * @param {Buffer} data Data to handle
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      controlMessage(data, cb) {
        if (this._opcode === 8) {
          if (data.length === 0) {
            this._loop = false;
            this.emit("conclude", 1005, EMPTY_BUFFER);
            this.end();
          } else {
            const code = data.readUInt16BE(0);
            if (!isValidStatusCode(code)) {
              const error = this.createError(
                RangeError,
                `invalid status code ${code}`,
                true,
                1002,
                "WS_ERR_INVALID_CLOSE_CODE"
              );
              cb(error);
              return;
            }
            const buf = new FastBuffer(
              data.buffer,
              data.byteOffset + 2,
              data.length - 2
            );
            if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
              const error = this.createError(
                Error,
                "invalid UTF-8 sequence",
                true,
                1007,
                "WS_ERR_INVALID_UTF8"
              );
              cb(error);
              return;
            }
            this._loop = false;
            this.emit("conclude", code, buf);
            this.end();
          }
          this._state = GET_INFO;
          return;
        }
        if (this._allowSynchronousEvents) {
          this.emit(this._opcode === 9 ? "ping" : "pong", data);
          this._state = GET_INFO;
        } else {
          this._state = DEFER_EVENT;
          setImmediate(() => {
            this.emit(this._opcode === 9 ? "ping" : "pong", data);
            this._state = GET_INFO;
            this.startLoop(cb);
          });
        }
      }
      /**
       * Builds an error object.
       *
       * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
       * @param {String} message The error message
       * @param {Boolean} prefix Specifies whether or not to add a default prefix to
       *     `message`
       * @param {Number} statusCode The status code
       * @param {String} errorCode The exposed error code
       * @return {(Error|RangeError)} The error
       * @private
       */
      createError(ErrorCtor, message, prefix, statusCode, errorCode) {
        this._loop = false;
        this._errored = true;
        const err = new ErrorCtor(
          prefix ? `Invalid WebSocket frame: ${message}` : message
        );
        Error.captureStackTrace(err, this.createError);
        err.code = errorCode;
        err[kStatusCode] = statusCode;
        return err;
      }
    };
    module.exports = Receiver;
  }
});

// node_modules/ws/lib/sender.js
var require_sender = __commonJS({
  "node_modules/ws/lib/sender.js"(exports2, module) {
    "use strict";
    var { Duplex } = __require("stream");
    var { randomFillSync } = __require("crypto");
    var {
      types: { isUint8Array }
    } = __require("util");
    var PerMessageDeflate = require_permessage_deflate();
    var { EMPTY_BUFFER, kWebSocket, NOOP } = require_constants();
    var { isBlob, isValidStatusCode } = require_validation();
    var { mask: applyMask, toBuffer } = require_buffer_util();
    var kByteLength = Symbol("kByteLength");
    var maskBuffer = Buffer.alloc(4);
    var RANDOM_POOL_SIZE = 8 * 1024;
    var randomPool;
    var randomPoolPointer = RANDOM_POOL_SIZE;
    var DEFAULT = 0;
    var DEFLATING = 1;
    var GET_BLOB_DATA = 2;
    var Sender = class _Sender {
      /**
       * Creates a Sender instance.
       *
       * @param {Duplex} socket The connection socket
       * @param {Object} [extensions] An object containing the negotiated extensions
       * @param {Function} [generateMask] The function used to generate the masking
       *     key
       */
      constructor(socket, extensions, generateMask) {
        this._extensions = extensions || {};
        if (generateMask) {
          this._generateMask = generateMask;
          this._maskBuffer = Buffer.alloc(4);
        }
        this._socket = socket;
        this._firstFragment = true;
        this._compress = false;
        this._bufferedBytes = 0;
        this._queue = [];
        this._state = DEFAULT;
        this.onerror = NOOP;
        this[kWebSocket] = void 0;
      }
      /**
       * Frames a piece of data according to the HyBi WebSocket protocol.
       *
       * @param {(Buffer|String)} data The data to frame
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @return {(Buffer|String)[]} The framed data
       * @public
       */
      static frame(data, options) {
        let mask;
        let merge = false;
        let offset = 2;
        let skipMasking = false;
        if (options.mask) {
          mask = options.maskBuffer || maskBuffer;
          if (options.generateMask) {
            options.generateMask(mask);
          } else {
            if (randomPoolPointer === RANDOM_POOL_SIZE) {
              if (randomPool === void 0) {
                randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
              }
              randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
              randomPoolPointer = 0;
            }
            mask[0] = randomPool[randomPoolPointer++];
            mask[1] = randomPool[randomPoolPointer++];
            mask[2] = randomPool[randomPoolPointer++];
            mask[3] = randomPool[randomPoolPointer++];
          }
          skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
          offset = 6;
        }
        let dataLength;
        if (typeof data === "string") {
          if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
            dataLength = options[kByteLength];
          } else {
            data = Buffer.from(data);
            dataLength = data.length;
          }
        } else {
          dataLength = data.length;
          merge = options.mask && options.readOnly && !skipMasking;
        }
        let payloadLength = dataLength;
        if (dataLength >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (dataLength > 125) {
          offset += 2;
          payloadLength = 126;
        }
        const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
        target[0] = options.fin ? options.opcode | 128 : options.opcode;
        if (options.rsv1) target[0] |= 64;
        target[1] = payloadLength;
        if (payloadLength === 126) {
          target.writeUInt16BE(dataLength, 2);
        } else if (payloadLength === 127) {
          target[2] = target[3] = 0;
          target.writeUIntBE(dataLength, 4, 6);
        }
        if (!options.mask) return [target, data];
        target[1] |= 128;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];
        if (skipMasking) return [target, data];
        if (merge) {
          applyMask(data, mask, target, offset, dataLength);
          return [target];
        }
        applyMask(data, mask, data, 0, dataLength);
        return [target, data];
      }
      /**
       * Sends a close message to the other peer.
       *
       * @param {Number} [code] The status code component of the body
       * @param {(String|Buffer)} [data] The message component of the body
       * @param {Boolean} [mask=false] Specifies whether or not to mask the message
       * @param {Function} [cb] Callback
       * @public
       */
      close(code, data, mask, cb) {
        let buf;
        if (code === void 0) {
          buf = EMPTY_BUFFER;
        } else if (typeof code !== "number" || !isValidStatusCode(code)) {
          throw new TypeError("First argument must be a valid error code number");
        } else if (data === void 0 || !data.length) {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          const length = Buffer.byteLength(data);
          if (length > 123) {
            throw new RangeError("The message must not be greater than 123 bytes");
          }
          buf = Buffer.allocUnsafe(2 + length);
          buf.writeUInt16BE(code, 0);
          if (typeof data === "string") {
            buf.write(data, 2);
          } else if (isUint8Array(data)) {
            buf.set(data, 2);
          } else {
            throw new TypeError("Second argument must be a string or a Uint8Array");
          }
        }
        const options = {
          [kByteLength]: buf.length,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 8,
          readOnly: false,
          rsv1: false
        };
        if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, buf, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(buf, options), cb);
        }
      }
      /**
       * Sends a ping message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      ping(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 9,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a pong message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      pong(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 10,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a data message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Object} options Options object
       * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
       *     or text
       * @param {Boolean} [options.compress=false] Specifies whether or not to
       *     compress `data`
       * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Function} [cb] Callback
       * @public
       */
      send(data, options, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        let opcode = options.binary ? 2 : 1;
        let rsv1 = options.compress;
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
            rsv1 = byteLength >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }
        if (options.fin) this._firstFragment = true;
        const opts = {
          [kByteLength]: byteLength,
          fin: options.fin,
          generateMask: this._generateMask,
          mask: options.mask,
          maskBuffer: this._maskBuffer,
          opcode,
          readOnly,
          rsv1
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
          } else {
            this.getBlobData(data, this._compress, opts, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, this._compress, opts, cb]);
        } else {
          this.dispatch(data, this._compress, opts, cb);
        }
      }
      /**
       * Gets the contents of a blob as binary data.
       *
       * @param {Blob} blob The blob
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     the data
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      getBlobData(blob, compress, options, cb) {
        this._bufferedBytes += options[kByteLength];
        this._state = GET_BLOB_DATA;
        blob.arrayBuffer().then((arrayBuffer) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while the blob was being read"
            );
            process.nextTick(callCallbacks, this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          const data = toBuffer(arrayBuffer);
          if (!compress) {
            this._state = DEFAULT;
            this.sendFrame(_Sender.frame(data, options), cb);
            this.dequeue();
          } else {
            this.dispatch(data, compress, options, cb);
          }
        }).catch((err) => {
          process.nextTick(onError, this, err, cb);
        });
      }
      /**
       * Dispatches a message.
       *
       * @param {(Buffer|String)} data The message to send
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     `data`
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(_Sender.frame(data, options), cb);
          return;
        }
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        this._bufferedBytes += options[kByteLength];
        this._state = DEFLATING;
        perMessageDeflate.compress(data, options.fin, (_, buf) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while data was being compressed"
            );
            callCallbacks(this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          this._state = DEFAULT;
          options.readOnly = false;
          this.sendFrame(_Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }
      /**
       * Executes queued send operations.
       *
       * @private
       */
      dequeue() {
        while (this._state === DEFAULT && this._queue.length) {
          const params = this._queue.shift();
          this._bufferedBytes -= params[3][kByteLength];
          Reflect.apply(params[0], this, params.slice(1));
        }
      }
      /**
       * Enqueues a send operation.
       *
       * @param {Array} params Send operation parameters.
       * @private
       */
      enqueue(params) {
        this._bufferedBytes += params[3][kByteLength];
        this._queue.push(params);
      }
      /**
       * Sends a frame.
       *
       * @param {(Buffer | String)[]} list The frame to send
       * @param {Function} [cb] Callback
       * @private
       */
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    };
    module.exports = Sender;
    function callCallbacks(sender, err, cb) {
      if (typeof cb === "function") cb(err);
      for (let i = 0; i < sender._queue.length; i++) {
        const params = sender._queue[i];
        const callback = params[params.length - 1];
        if (typeof callback === "function") callback(err);
      }
    }
    function onError(sender, err, cb) {
      callCallbacks(sender, err, cb);
      sender.onerror(err);
    }
  }
});

// node_modules/ws/lib/event-target.js
var require_event_target = __commonJS({
  "node_modules/ws/lib/event-target.js"(exports2, module) {
    "use strict";
    var { kForOnEventAttribute, kListener } = require_constants();
    var kCode = Symbol("kCode");
    var kData = Symbol("kData");
    var kError = Symbol("kError");
    var kMessage = Symbol("kMessage");
    var kReason = Symbol("kReason");
    var kTarget = Symbol("kTarget");
    var kType = Symbol("kType");
    var kWasClean = Symbol("kWasClean");
    var Event = class {
      /**
       * Create a new `Event`.
       *
       * @param {String} type The name of the event
       * @throws {TypeError} If the `type` argument is not specified
       */
      constructor(type) {
        this[kTarget] = null;
        this[kType] = type;
      }
      /**
       * @type {*}
       */
      get target() {
        return this[kTarget];
      }
      /**
       * @type {String}
       */
      get type() {
        return this[kType];
      }
    };
    Object.defineProperty(Event.prototype, "target", { enumerable: true });
    Object.defineProperty(Event.prototype, "type", { enumerable: true });
    var CloseEvent = class extends Event {
      /**
       * Create a new `CloseEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {Number} [options.code=0] The status code explaining why the
       *     connection was closed
       * @param {String} [options.reason=''] A human-readable string explaining why
       *     the connection was closed
       * @param {Boolean} [options.wasClean=false] Indicates whether or not the
       *     connection was cleanly closed
       */
      constructor(type, options = {}) {
        super(type);
        this[kCode] = options.code === void 0 ? 0 : options.code;
        this[kReason] = options.reason === void 0 ? "" : options.reason;
        this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
      }
      /**
       * @type {Number}
       */
      get code() {
        return this[kCode];
      }
      /**
       * @type {String}
       */
      get reason() {
        return this[kReason];
      }
      /**
       * @type {Boolean}
       */
      get wasClean() {
        return this[kWasClean];
      }
    };
    Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
    var ErrorEvent = class extends Event {
      /**
       * Create a new `ErrorEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.error=null] The error that generated this event
       * @param {String} [options.message=''] The error message
       */
      constructor(type, options = {}) {
        super(type);
        this[kError] = options.error === void 0 ? null : options.error;
        this[kMessage] = options.message === void 0 ? "" : options.message;
      }
      /**
       * @type {*}
       */
      get error() {
        return this[kError];
      }
      /**
       * @type {String}
       */
      get message() {
        return this[kMessage];
      }
    };
    Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
    Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
    var MessageEvent = class extends Event {
      /**
       * Create a new `MessageEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.data=null] The message content
       */
      constructor(type, options = {}) {
        super(type);
        this[kData] = options.data === void 0 ? null : options.data;
      }
      /**
       * @type {*}
       */
      get data() {
        return this[kData];
      }
    };
    Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
    var EventTarget = {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {(Function|Object)} handler The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(type, handler, options = {}) {
        for (const listener of this.listeners(type)) {
          if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            return;
          }
        }
        let wrapper;
        if (type === "message") {
          wrapper = function onMessage(data, isBinary) {
            const event = new MessageEvent("message", {
              data: isBinary ? data : data.toString()
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "close") {
          wrapper = function onClose(code, message) {
            const event = new CloseEvent("close", {
              code,
              reason: message.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "error") {
          wrapper = function onError(error) {
            const event = new ErrorEvent("error", {
              error,
              message: error.message
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "open") {
          wrapper = function onOpen() {
            const event = new Event("open");
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else {
          return;
        }
        wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
        wrapper[kListener] = handler;
        if (options.once) {
          this.once(type, wrapper);
        } else {
          this.on(type, wrapper);
        }
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {(Function|Object)} handler The listener to remove
       * @public
       */
      removeEventListener(type, handler) {
        for (const listener of this.listeners(type)) {
          if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            this.removeListener(type, listener);
            break;
          }
        }
      }
    };
    module.exports = {
      CloseEvent,
      ErrorEvent,
      Event,
      EventTarget,
      MessageEvent
    };
    function callListener(listener, thisArg, event) {
      if (typeof listener === "object" && listener.handleEvent) {
        listener.handleEvent.call(listener, event);
      } else {
        listener.call(thisArg, event);
      }
    }
  }
});

// node_modules/ws/lib/extension.js
var require_extension = __commonJS({
  "node_modules/ws/lib/extension.js"(exports2, module) {
    "use strict";
    var { tokenChars } = require_validation();
    function push(dest, name, elem) {
      if (dest[name] === void 0) dest[name] = [elem];
      else dest[name].push(elem);
    }
    function parse(header) {
      const offers = /* @__PURE__ */ Object.create(null);
      let params = /* @__PURE__ */ Object.create(null);
      let mustUnescape = false;
      let isEscaping = false;
      let inQuotes = false;
      let extensionName;
      let paramName;
      let start = -1;
      let code = -1;
      let end = -1;
      let i = 0;
      for (; i < header.length; i++) {
        code = header.charCodeAt(i);
        if (extensionName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (i !== 0 && (code === 32 || code === 9)) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            const name = header.slice(start, end);
            if (code === 44) {
              push(offers, name, params);
              params = /* @__PURE__ */ Object.create(null);
            } else {
              extensionName = name;
            }
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            push(params, header.slice(start, end), true);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            start = end = -1;
          } else if (code === 61 && start !== -1 && end === -1) {
            paramName = header.slice(start, i);
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start === -1) start = i;
            else if (!mustUnescape) mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start === -1) start = i;
            } else if (code === 34 && start !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 92) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (start !== -1 && (code === 32 || code === 9)) {
            if (end === -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            let value = header.slice(start, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, "");
              mustUnescape = false;
            }
            push(params, paramName, value);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            paramName = void 0;
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }
      if (start === -1 || inQuotes || code === 32 || code === 9) {
        throw new SyntaxError("Unexpected end of input");
      }
      if (end === -1) end = i;
      const token = header.slice(start, end);
      if (extensionName === void 0) {
        push(offers, token, params);
      } else {
        if (paramName === void 0) {
          push(params, token, true);
        } else if (mustUnescape) {
          push(params, paramName, token.replace(/\\/g, ""));
        } else {
          push(params, paramName, token);
        }
        push(offers, extensionName, params);
      }
      return offers;
    }
    function format(extensions) {
      return Object.keys(extensions).map((extension) => {
        let configurations = extensions[extension];
        if (!Array.isArray(configurations)) configurations = [configurations];
        return configurations.map((params) => {
          return [extension].concat(
            Object.keys(params).map((k) => {
              let values = params[k];
              if (!Array.isArray(values)) values = [values];
              return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
            })
          ).join("; ");
        }).join(", ");
      }).join(", ");
    }
    module.exports = { format, parse };
  }
});

// node_modules/ws/lib/websocket.js
var require_websocket = __commonJS({
  "node_modules/ws/lib/websocket.js"(exports2, module) {
    "use strict";
    var EventEmitter2 = __require("events");
    var https = __require("https");
    var http = __require("http");
    var net = __require("net");
    var tls = __require("tls");
    var { randomBytes, createHash } = __require("crypto");
    var { Duplex, Readable } = __require("stream");
    var { URL } = __require("url");
    var PerMessageDeflate = require_permessage_deflate();
    var Receiver = require_receiver();
    var Sender = require_sender();
    var { isBlob } = require_validation();
    var {
      BINARY_TYPES,
      CLOSE_TIMEOUT,
      EMPTY_BUFFER,
      GUID,
      kForOnEventAttribute,
      kListener,
      kStatusCode,
      kWebSocket,
      NOOP
    } = require_constants();
    var {
      EventTarget: { addEventListener, removeEventListener }
    } = require_event_target();
    var { format, parse } = require_extension();
    var { toBuffer } = require_buffer_util();
    var kAborted = Symbol("kAborted");
    var protocolVersions = [8, 13];
    var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
    var WebSocket = class _WebSocket extends EventEmitter2 {
      /**
       * Create a new `WebSocket`.
       *
       * @param {(String|URL)} address The URL to which to connect
       * @param {(String|String[])} [protocols] The subprotocols
       * @param {Object} [options] Connection options
       */
      constructor(address, protocols, options) {
        super();
        this._binaryType = BINARY_TYPES[0];
        this._closeCode = 1006;
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = EMPTY_BUFFER;
        this._closeTimer = null;
        this._errorEmitted = false;
        this._extensions = {};
        this._paused = false;
        this._protocol = "";
        this._readyState = _WebSocket.CONNECTING;
        this._receiver = null;
        this._sender = null;
        this._socket = null;
        if (address !== null) {
          this._bufferedAmount = 0;
          this._isServer = false;
          this._redirects = 0;
          if (protocols === void 0) {
            protocols = [];
          } else if (!Array.isArray(protocols)) {
            if (typeof protocols === "object" && protocols !== null) {
              options = protocols;
              protocols = [];
            } else {
              protocols = [protocols];
            }
          }
          initAsClient(this, address, protocols, options);
        } else {
          this._autoPong = options.autoPong;
          this._closeTimeout = options.closeTimeout;
          this._isServer = true;
        }
      }
      /**
       * For historical reasons, the custom "nodebuffer" type is used by the default
       * instead of "blob".
       *
       * @type {String}
       */
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        if (!BINARY_TYPES.includes(type)) return;
        this._binaryType = type;
        if (this._receiver) this._receiver._binaryType = type;
      }
      /**
       * @type {Number}
       */
      get bufferedAmount() {
        if (!this._socket) return this._bufferedAmount;
        return this._socket._writableState.length + this._sender._bufferedBytes;
      }
      /**
       * @type {String}
       */
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      /**
       * @type {Boolean}
       */
      get isPaused() {
        return this._paused;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onclose() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onerror() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onopen() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onmessage() {
        return null;
      }
      /**
       * @type {String}
       */
      get protocol() {
        return this._protocol;
      }
      /**
       * @type {Number}
       */
      get readyState() {
        return this._readyState;
      }
      /**
       * @type {String}
       */
      get url() {
        return this._url;
      }
      /**
       * Set up the socket and the internal resources.
       *
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Object} options Options object
       * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message size
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @private
       */
      setSocket(socket, head, options) {
        const receiver = new Receiver({
          allowSynchronousEvents: options.allowSynchronousEvents,
          binaryType: this.binaryType,
          extensions: this._extensions,
          isServer: this._isServer,
          maxBufferedChunks: options.maxBufferedChunks,
          maxFragments: options.maxFragments,
          maxPayload: options.maxPayload,
          skipUTF8Validation: options.skipUTF8Validation
        });
        const sender = new Sender(socket, this._extensions, options.generateMask);
        this._receiver = receiver;
        this._sender = sender;
        this._socket = socket;
        receiver[kWebSocket] = this;
        sender[kWebSocket] = this;
        socket[kWebSocket] = this;
        receiver.on("conclude", receiverOnConclude);
        receiver.on("drain", receiverOnDrain);
        receiver.on("error", receiverOnError);
        receiver.on("message", receiverOnMessage);
        receiver.on("ping", receiverOnPing);
        receiver.on("pong", receiverOnPong);
        sender.onerror = senderOnError;
        if (socket.setTimeout) socket.setTimeout(0);
        if (socket.setNoDelay) socket.setNoDelay();
        if (head.length > 0) socket.unshift(head);
        socket.on("close", socketOnClose);
        socket.on("data", socketOnData);
        socket.on("end", socketOnEnd);
        socket.on("error", socketOnError);
        this._readyState = _WebSocket.OPEN;
        this.emit("open");
      }
      /**
       * Emit the `'close'` event.
       *
       * @private
       */
      emitClose() {
        if (!this._socket) {
          this._readyState = _WebSocket.CLOSED;
          this.emit("close", this._closeCode, this._closeMessage);
          return;
        }
        if (this._extensions[PerMessageDeflate.extensionName]) {
          this._extensions[PerMessageDeflate.extensionName].cleanup();
        }
        this._receiver.removeAllListeners();
        this._readyState = _WebSocket.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
      }
      /**
       * Start a closing handshake.
       *
       *          +----------+   +-----------+   +----------+
       *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
       *    |     +----------+   +-----------+   +----------+     |
       *          +----------+   +-----------+         |
       * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
       *          +----------+   +-----------+   |
       *    |           |                        |   +---+        |
       *                +------------------------+-->|fin| - - - -
       *    |         +---+                      |   +---+
       *     - - - - -|fin|<---------------------+
       *              +---+
       *
       * @param {Number} [code] Status code explaining why the connection is closing
       * @param {(String|Buffer)} [data] The reason why the connection is
       *     closing
       * @public
       */
      close(code, data) {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this.readyState === _WebSocket.CLOSING) {
          if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
            this._socket.end();
          }
          return;
        }
        this._readyState = _WebSocket.CLOSING;
        this._sender.close(code, data, !this._isServer, (err) => {
          if (err) return;
          this._closeFrameSent = true;
          if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
            this._socket.end();
          }
        });
        setCloseTimer(this);
      }
      /**
       * Pause the socket.
       *
       * @public
       */
      pause() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = true;
        this._socket.pause();
      }
      /**
       * Send a ping.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the ping is sent
       * @public
       */
      ping(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Send a pong.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the pong is sent
       * @public
       */
      pong(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Resume the socket.
       *
       * @public
       */
      resume() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = false;
        if (!this._receiver._writableState.needDrain) this._socket.resume();
      }
      /**
       * Send a data message.
       *
       * @param {*} data The message to send
       * @param {Object} [options] Options object
       * @param {Boolean} [options.binary] Specifies whether `data` is binary or
       *     text
       * @param {Boolean} [options.compress] Specifies whether or not to compress
       *     `data`
       * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when data is written out
       * @public
       */
      send(data, options, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        const opts = {
          binary: typeof data !== "string",
          mask: !this._isServer,
          compress: true,
          fin: true,
          ...options
        };
        if (!this._extensions[PerMessageDeflate.extensionName]) {
          opts.compress = false;
        }
        this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }
      /**
       * Forcibly close the connection.
       *
       * @public
       */
      terminate() {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this._socket) {
          this._readyState = _WebSocket.CLOSING;
          this._socket.destroy();
        }
      }
    };
    Object.defineProperty(WebSocket, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket.prototype, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket.prototype, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket.prototype, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    Object.defineProperty(WebSocket.prototype, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    [
      "binaryType",
      "bufferedAmount",
      "extensions",
      "isPaused",
      "protocol",
      "readyState",
      "url"
    ].forEach((property) => {
      Object.defineProperty(WebSocket.prototype, property, { enumerable: true });
    });
    ["open", "error", "close", "message"].forEach((method) => {
      Object.defineProperty(WebSocket.prototype, `on${method}`, {
        enumerable: true,
        get() {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) return listener[kListener];
          }
          return null;
        },
        set(handler) {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) {
              this.removeListener(method, listener);
              break;
            }
          }
          if (typeof handler !== "function") return;
          this.addEventListener(method, handler, {
            [kForOnEventAttribute]: true
          });
        }
      });
    });
    WebSocket.prototype.addEventListener = addEventListener;
    WebSocket.prototype.removeEventListener = removeEventListener;
    module.exports = WebSocket;
    function initAsClient(websocket, address, protocols, options) {
      const opts = {
        allowSynchronousEvents: true,
        autoPong: true,
        closeTimeout: CLOSE_TIMEOUT,
        protocolVersion: protocolVersions[1],
        maxBufferedChunks: 256 * 1024,
        maxFragments: 16 * 1024,
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: false,
        perMessageDeflate: true,
        followRedirects: false,
        maxRedirects: 10,
        ...options,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        timeout: void 0,
        method: "GET",
        host: void 0,
        path: void 0,
        port: void 0
      };
      websocket._autoPong = opts.autoPong;
      websocket._closeTimeout = opts.closeTimeout;
      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
        );
      }
      let parsedUrl;
      if (address instanceof URL) {
        parsedUrl = address;
      } else {
        try {
          parsedUrl = new URL(address);
        } catch {
          throw new SyntaxError(`Invalid URL: ${address}`);
        }
      }
      if (parsedUrl.protocol === "http:") {
        parsedUrl.protocol = "ws:";
      } else if (parsedUrl.protocol === "https:") {
        parsedUrl.protocol = "wss:";
      }
      websocket._url = parsedUrl.href;
      const isSecure = parsedUrl.protocol === "wss:";
      const isIpcUrl = parsedUrl.protocol === "ws+unix:";
      let invalidUrlMessage;
      if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
        invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
      } else if (isIpcUrl && !parsedUrl.pathname) {
        invalidUrlMessage = "The URL's pathname is empty";
      } else if (parsedUrl.hash) {
        invalidUrlMessage = "The URL contains a fragment identifier";
      }
      if (invalidUrlMessage) {
        const err = new SyntaxError(invalidUrlMessage);
        if (websocket._redirects === 0) {
          throw err;
        } else {
          emitErrorAndClose(websocket, err);
          return;
        }
      }
      const defaultPort = isSecure ? 443 : 80;
      const key = randomBytes(16).toString("base64");
      const request = isSecure ? https.request : http.request;
      const protocolSet = /* @__PURE__ */ new Set();
      let perMessageDeflate;
      opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
      opts.headers = {
        ...opts.headers,
        "Sec-WebSocket-Version": opts.protocolVersion,
        "Sec-WebSocket-Key": key,
        Connection: "Upgrade",
        Upgrade: "websocket"
      };
      opts.path = parsedUrl.pathname + parsedUrl.search;
      opts.timeout = opts.handshakeTimeout;
      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate({
          ...opts.perMessageDeflate,
          isServer: false,
          maxPayload: opts.maxPayload
        });
        opts.headers["Sec-WebSocket-Extensions"] = format({
          [PerMessageDeflate.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols.length) {
        for (const protocol of protocols) {
          if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
            throw new SyntaxError(
              "An invalid or duplicated subprotocol was specified"
            );
          }
          protocolSet.add(protocol);
        }
        opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers["Sec-WebSocket-Origin"] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }
      if (isIpcUrl) {
        const parts = opts.path.split(":");
        opts.socketPath = parts[0];
        opts.path = parts[1];
      }
      let req;
      if (opts.followRedirects) {
        if (websocket._redirects === 0) {
          websocket._originalIpc = isIpcUrl;
          websocket._originalSecure = isSecure;
          websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
          const headers = options && options.headers;
          options = { ...options, headers: {} };
          if (headers) {
            for (const [key2, value] of Object.entries(headers)) {
              options.headers[key2.toLowerCase()] = value;
            }
          }
        } else if (websocket.listenerCount("redirect") === 0) {
          const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
          if (!isSameHost || websocket._originalSecure && !isSecure) {
            delete opts.headers.authorization;
            delete opts.headers.cookie;
            if (!isSameHost) delete opts.headers.host;
            opts.auth = void 0;
          }
        }
        if (opts.auth && !options.headers.authorization) {
          options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
        }
        req = websocket._req = request(opts);
        if (websocket._redirects) {
          websocket.emit("redirect", websocket.url, req);
        }
      } else {
        req = websocket._req = request(opts);
      }
      if (opts.timeout) {
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        });
      }
      req.on("error", (err) => {
        if (req === null || req[kAborted]) return;
        req = websocket._req = null;
        emitErrorAndClose(websocket, err);
      });
      req.on("response", (res) => {
        const location = res.headers.location;
        const statusCode = res.statusCode;
        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, "Maximum redirects exceeded");
            return;
          }
          req.abort();
          let addr;
          try {
            addr = new URL(location, address);
          } catch (e) {
            const err = new SyntaxError(`Invalid URL: ${location}`);
            emitErrorAndClose(websocket, err);
            return;
          }
          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit("unexpected-response", req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });
      req.on("upgrade", (res, socket, head) => {
        websocket.emit("upgrade", res);
        if (websocket.readyState !== WebSocket.CONNECTING) return;
        req = websocket._req = null;
        const upgrade = res.headers.upgrade;
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          abortHandshake(websocket, socket, "Invalid Upgrade header");
          return;
        }
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        if (res.headers["sec-websocket-accept"] !== digest) {
          abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
          return;
        }
        const serverProt = res.headers["sec-websocket-protocol"];
        let protError;
        if (serverProt !== void 0) {
          if (!protocolSet.size) {
            protError = "Server sent a subprotocol but none was requested";
          } else if (!protocolSet.has(serverProt)) {
            protError = "Server sent an invalid subprotocol";
          }
        } else if (protocolSet.size) {
          protError = "Server sent no subprotocol";
        }
        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }
        if (serverProt) websocket._protocol = serverProt;
        const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
        if (secWebSocketExtensions !== void 0) {
          if (!perMessageDeflate) {
            const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          let extensions;
          try {
            extensions = parse(secWebSocketExtensions);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          const extensionNames = Object.keys(extensions);
          if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate.extensionName) {
            const message = "Server indicated an extension that was not requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          try {
            perMessageDeflate.accept(extensions[PerMessageDeflate.extensionName]);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          websocket._extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
        }
        websocket.setSocket(socket, head, {
          allowSynchronousEvents: opts.allowSynchronousEvents,
          generateMask: opts.generateMask,
          maxBufferedChunks: opts.maxBufferedChunks,
          maxFragments: opts.maxFragments,
          maxPayload: opts.maxPayload,
          skipUTF8Validation: opts.skipUTF8Validation
        });
      });
      if (opts.finishRequest) {
        opts.finishRequest(req, websocket);
      } else {
        req.end();
      }
    }
    function emitErrorAndClose(websocket, err) {
      websocket._readyState = WebSocket.CLOSING;
      websocket._errorEmitted = true;
      websocket.emit("error", err);
      websocket.emitClose();
    }
    function netConnect(options) {
      options.path = options.socketPath;
      return net.connect(options);
    }
    function tlsConnect(options) {
      options.path = void 0;
      if (!options.servername && options.servername !== "") {
        options.servername = net.isIP(options.host) ? "" : options.host;
      }
      return tls.connect(options);
    }
    function abortHandshake(websocket, stream, message) {
      websocket._readyState = WebSocket.CLOSING;
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshake);
      if (stream.setHeader) {
        stream[kAborted] = true;
        stream.abort();
        if (stream.socket && !stream.socket.destroyed) {
          stream.socket.destroy();
        }
        process.nextTick(emitErrorAndClose, websocket, err);
      } else {
        stream.destroy(err);
        stream.once("error", websocket.emit.bind(websocket, "error"));
        stream.once("close", websocket.emitClose.bind(websocket));
      }
    }
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = isBlob(data) ? data.size : toBuffer(data).length;
        if (websocket._socket) websocket._sender._bufferedBytes += length;
        else websocket._bufferedAmount += length;
      }
      if (cb) {
        const err = new Error(
          `WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`
        );
        process.nextTick(cb, err);
      }
    }
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;
      if (websocket._socket[kWebSocket] === void 0) return;
      websocket._socket.removeListener("data", socketOnData);
      process.nextTick(resume, websocket._socket);
      if (code === 1005) websocket.close();
      else websocket.close(code, reason);
    }
    function receiverOnDrain() {
      const websocket = this[kWebSocket];
      if (!websocket.isPaused) websocket._socket.resume();
    }
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket._socket[kWebSocket] !== void 0) {
        websocket._socket.removeListener("data", socketOnData);
        process.nextTick(resume, websocket._socket);
        websocket.close(err[kStatusCode]);
      }
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    function receiverOnMessage(data, isBinary) {
      this[kWebSocket].emit("message", data, isBinary);
    }
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
      websocket.emit("ping", data);
    }
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    function resume(stream) {
      stream.resume();
    }
    function senderOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket.readyState === WebSocket.CLOSED) return;
      if (websocket.readyState === WebSocket.OPEN) {
        websocket._readyState = WebSocket.CLOSING;
        setCloseTimer(websocket);
      }
      this._socket.end();
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function setCloseTimer(websocket) {
      websocket._closeTimer = setTimeout(
        websocket._socket.destroy.bind(websocket._socket),
        websocket._closeTimeout
      );
    }
    function socketOnClose() {
      const websocket = this[kWebSocket];
      this.removeListener("close", socketOnClose);
      this.removeListener("data", socketOnData);
      this.removeListener("end", socketOnEnd);
      websocket._readyState = WebSocket.CLOSING;
      if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
        const chunk = this.read(this._readableState.length);
        websocket._receiver.write(chunk);
      }
      websocket._receiver.end();
      this[kWebSocket] = void 0;
      clearTimeout(websocket._closeTimer);
      if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
        websocket.emitClose();
      } else {
        websocket._receiver.on("error", receiverOnFinish);
        websocket._receiver.on("finish", receiverOnFinish);
      }
    }
    function socketOnData(chunk) {
      if (!this[kWebSocket]._receiver.write(chunk)) {
        this.pause();
      }
    }
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      websocket._readyState = WebSocket.CLOSING;
      websocket._receiver.end();
      this.end();
    }
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError);
      this.on("error", NOOP);
      if (websocket) {
        websocket._readyState = WebSocket.CLOSING;
        this.destroy();
      }
    }
  }
});

// node_modules/ws/lib/stream.js
var require_stream = __commonJS({
  "node_modules/ws/lib/stream.js"(exports2, module) {
    "use strict";
    var WebSocket = require_websocket();
    var { Duplex } = __require("stream");
    function emitClose(stream) {
      stream.emit("close");
    }
    function duplexOnEnd() {
      if (!this.destroyed && this._writableState.finished) {
        this.destroy();
      }
    }
    function duplexOnError(err) {
      this.removeListener("error", duplexOnError);
      this.destroy();
      if (this.listenerCount("error") === 0) {
        this.emit("error", err);
      }
    }
    function createWebSocketStream(ws, options) {
      let terminateOnDestroy = true;
      const duplex = new Duplex({
        ...options,
        autoDestroy: false,
        emitClose: false,
        objectMode: false,
        writableObjectMode: false
      });
      ws.on("message", function message(msg, isBinary) {
        const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
        if (!duplex.push(data)) ws.pause();
      });
      ws.once("error", function error(err) {
        if (duplex.destroyed) return;
        terminateOnDestroy = false;
        duplex.destroy(err);
      });
      ws.once("close", function close() {
        if (duplex.destroyed) return;
        duplex.push(null);
      });
      duplex._destroy = function(err, callback) {
        if (ws.readyState === ws.CLOSED) {
          callback(err);
          process.nextTick(emitClose, duplex);
          return;
        }
        let called = false;
        ws.once("error", function error(err2) {
          called = true;
          callback(err2);
        });
        ws.once("close", function close() {
          if (!called) callback(err);
          process.nextTick(emitClose, duplex);
        });
        if (terminateOnDestroy) ws.terminate();
      };
      duplex._final = function(callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._final(callback);
          });
          return;
        }
        if (ws._socket === null) return;
        if (ws._socket._writableState.finished) {
          callback();
          if (duplex._readableState.endEmitted) duplex.destroy();
        } else {
          ws._socket.once("finish", function finish() {
            callback();
          });
          ws.close();
        }
      };
      duplex._read = function() {
        if (ws.isPaused) ws.resume();
      };
      duplex._write = function(chunk, encoding, callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._write(chunk, encoding, callback);
          });
          return;
        }
        ws.send(chunk, callback);
      };
      duplex.on("end", duplexOnEnd);
      duplex.on("error", duplexOnError);
      return duplex;
    }
    module.exports = createWebSocketStream;
  }
});

// node_modules/ws/lib/subprotocol.js
var require_subprotocol = __commonJS({
  "node_modules/ws/lib/subprotocol.js"(exports2, module) {
    "use strict";
    var { tokenChars } = require_validation();
    function parse(header) {
      const protocols = /* @__PURE__ */ new Set();
      let start = -1;
      let end = -1;
      let i = 0;
      for (i; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (i !== 0 && (code === 32 || code === 9)) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          const protocol2 = header.slice(start, end);
          if (protocols.has(protocol2)) {
            throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
          }
          protocols.add(protocol2);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
      if (start === -1 || end !== -1) {
        throw new SyntaxError("Unexpected end of input");
      }
      const protocol = header.slice(start, i);
      if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
      }
      protocols.add(protocol);
      return protocols;
    }
    module.exports = { parse };
  }
});

// node_modules/ws/lib/websocket-server.js
var require_websocket_server = __commonJS({
  "node_modules/ws/lib/websocket-server.js"(exports2, module) {
    "use strict";
    var EventEmitter2 = __require("events");
    var http = __require("http");
    var { Duplex } = __require("stream");
    var { createHash } = __require("crypto");
    var extension = require_extension();
    var PerMessageDeflate = require_permessage_deflate();
    var subprotocol = require_subprotocol();
    var WebSocket = require_websocket();
    var { CLOSE_TIMEOUT, GUID, kWebSocket } = require_constants();
    var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    var RUNNING = 0;
    var CLOSING = 1;
    var CLOSED = 2;
    var WebSocketServer = class extends EventEmitter2 {
      /**
       * Create a `WebSocketServer` instance.
       *
       * @param {Object} options Configuration options
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Boolean} [options.autoPong=true] Specifies whether or not to
       *     automatically send a pong in response to a ping
       * @param {Number} [options.backlog=511] The maximum length of the queue of
       *     pending connections
       * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
       *     track clients
       * @param {Number} [options.closeTimeout=30000] Duration in milliseconds to
       *     wait for the closing handshake to finish after `websocket.close()` is
       *     called
       * @param {Function} [options.handleProtocols] A hook to handle protocols
       * @param {String} [options.host] The hostname where to bind the server
       * @param {Number} [options.maxBufferedChunks=262144] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=16384] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=104857600] The maximum allowed message
       *     size
       * @param {Boolean} [options.noServer=false] Enable no server mode
       * @param {String} [options.path] Accept only connections matching this path
       * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
       *     permessage-deflate
       * @param {Number} [options.port] The port where to bind the server
       * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
       *     server to use
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @param {Function} [options.verifyClient] A hook to reject connections
       * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
       *     class to use. It must be the `WebSocket` class or class that extends it
       * @param {Function} [callback] A listener for the `listening` event
       */
      constructor(options, callback) {
        super();
        options = {
          allowSynchronousEvents: true,
          autoPong: true,
          maxBufferedChunks: 256 * 1024,
          maxFragments: 16 * 1024,
          maxPayload: 100 * 1024 * 1024,
          skipUTF8Validation: false,
          perMessageDeflate: false,
          handleProtocols: null,
          clientTracking: true,
          closeTimeout: CLOSE_TIMEOUT,
          verifyClient: null,
          noServer: false,
          backlog: null,
          // use default (511 as implemented in net.js)
          server: null,
          host: null,
          path: null,
          port: null,
          WebSocket,
          ...options
        };
        if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
          throw new TypeError(
            'One and only one of the "port", "server", or "noServer" options must be specified'
          );
        }
        if (options.port != null) {
          this._server = http.createServer((req, res) => {
            const body = http.STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }
        if (this._server) {
          const emitConnection = this.emit.bind(this, "connection");
          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: (req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            }
          });
        }
        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
        if (options.clientTracking) {
          this.clients = /* @__PURE__ */ new Set();
          this._shouldEmitClose = false;
        }
        this.options = options;
        this._state = RUNNING;
      }
      /**
       * Returns the bound address, the address family name, and port of the server
       * as reported by the operating system if listening on an IP socket.
       * If the server is listening on a pipe or UNIX domain socket, the name is
       * returned as a string.
       *
       * @return {(Object|String|null)} The address of the server
       * @public
       */
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }
        if (!this._server) return null;
        return this._server.address();
      }
      /**
       * Stop the server from accepting new connections and emit the `'close'` event
       * when all existing connections are closed.
       *
       * @param {Function} [cb] A one-time listener for the `'close'` event
       * @public
       */
      close(cb) {
        if (this._state === CLOSED) {
          if (cb) {
            this.once("close", () => {
              cb(new Error("The server is not running"));
            });
          }
          process.nextTick(emitClose, this);
          return;
        }
        if (cb) this.once("close", cb);
        if (this._state === CLOSING) return;
        this._state = CLOSING;
        if (this.options.noServer || this.options.server) {
          if (this._server) {
            this._removeListeners();
            this._removeListeners = this._server = null;
          }
          if (this.clients) {
            if (!this.clients.size) {
              process.nextTick(emitClose, this);
            } else {
              this._shouldEmitClose = true;
            }
          } else {
            process.nextTick(emitClose, this);
          }
        } else {
          const server = this._server;
          this._removeListeners();
          this._removeListeners = this._server = null;
          server.close(() => {
            emitClose(this);
          });
        }
      }
      /**
       * See if a given request should be handled by this server instance.
       *
       * @param {http.IncomingMessage} req Request object to inspect
       * @return {Boolean} `true` if the request is valid, else `false`
       * @public
       */
      shouldHandle(req) {
        if (this.options.path) {
          const index = req.url.indexOf("?");
          const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
          if (pathname !== this.options.path) return false;
        }
        return true;
      }
      /**
       * Handle a HTTP Upgrade request.
       *
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @public
       */
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key = req.headers["sec-websocket-key"];
        const upgrade = req.headers.upgrade;
        const version = +req.headers["sec-websocket-version"];
        if (req.method !== "GET") {
          const message = "Invalid HTTP method";
          abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
          return;
        }
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          const message = "Invalid Upgrade header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (key === void 0 || !keyRegex.test(key)) {
          const message = "Missing or invalid Sec-WebSocket-Key header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (version !== 13 && version !== 8) {
          const message = "Missing or invalid Sec-WebSocket-Version header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message, {
            "Sec-WebSocket-Version": "13, 8"
          });
          return;
        }
        if (!this.shouldHandle(req)) {
          abortHandshake(socket, 400);
          return;
        }
        const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
        let protocols = /* @__PURE__ */ new Set();
        if (secWebSocketProtocol !== void 0) {
          try {
            protocols = subprotocol.parse(secWebSocketProtocol);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Protocol header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
        const extensions = {};
        if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
          const perMessageDeflate = new PerMessageDeflate({
            ...this.options.perMessageDeflate,
            isServer: true,
            maxPayload: this.options.maxPayload
          });
          try {
            const offers = extension.parse(secWebSocketExtensions);
            if (offers[PerMessageDeflate.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate.extensionName]);
              extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            const message = "Invalid or unacceptable Sec-WebSocket-Extensions header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
            secure: !!(req.socket.authorized || req.socket.encrypted),
            req
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(info, (verified, code, message, headers) => {
              if (!verified) {
                return abortHandshake(socket, code || 401, message, headers);
              }
              this.completeUpgrade(
                extensions,
                key,
                protocols,
                req,
                socket,
                head,
                cb
              );
            });
            return;
          }
          if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
        }
        this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
      }
      /**
       * Upgrade the connection to WebSocket.
       *
       * @param {Object} extensions The accepted extensions
       * @param {String} key The value of the `Sec-WebSocket-Key` header
       * @param {Set} protocols The subprotocols
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @throws {Error} If called more than once with the same socket
       * @private
       */
      completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
        if (!socket.readable || !socket.writable) return socket.destroy();
        if (socket[kWebSocket]) {
          throw new Error(
            "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
          );
        }
        if (this._state > RUNNING) return abortHandshake(socket, 503);
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        const headers = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${digest}`
        ];
        const ws = new this.options.WebSocket(null, void 0, this.options);
        if (protocols.size) {
          const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws._protocol = protocol;
          }
        }
        if (extensions[PerMessageDeflate.extensionName]) {
          const params = extensions[PerMessageDeflate.extensionName].params;
          const value = extension.format({
            [PerMessageDeflate.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions;
        }
        this.emit("headers", headers, req);
        socket.write(headers.concat("\r\n").join("\r\n"));
        socket.removeListener("error", socketOnError);
        ws.setSocket(socket, head, {
          allowSynchronousEvents: this.options.allowSynchronousEvents,
          maxBufferedChunks: this.options.maxBufferedChunks,
          maxFragments: this.options.maxFragments,
          maxPayload: this.options.maxPayload,
          skipUTF8Validation: this.options.skipUTF8Validation
        });
        if (this.clients) {
          this.clients.add(ws);
          ws.on("close", () => {
            this.clients.delete(ws);
            if (this._shouldEmitClose && !this.clients.size) {
              process.nextTick(emitClose, this);
            }
          });
        }
        cb(ws, req);
      }
    };
    module.exports = WebSocketServer;
    function addListeners(server, map) {
      for (const event of Object.keys(map)) server.on(event, map[event]);
      return function removeListeners() {
        for (const event of Object.keys(map)) {
          server.removeListener(event, map[event]);
        }
      };
    }
    function emitClose(server) {
      server._state = CLOSED;
      server.emit("close");
    }
    function socketOnError() {
      this.destroy();
    }
    function abortHandshake(socket, code, message, headers) {
      message = message || http.STATUS_CODES[code];
      headers = {
        Connection: "close",
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(message),
        ...headers
      };
      socket.once("finish", socket.destroy);
      socket.end(
        `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message
      );
    }
    function abortHandshakeOrEmitwsClientError(server, req, socket, code, message, headers) {
      if (server.listenerCount("wsClientError")) {
        const err = new Error(message);
        Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
        server.emit("wsClientError", err, socket, req);
      } else {
        abortHandshake(socket, code, message, headers);
      }
    }
  }
});

// node_modules/ws/index.js
var require_ws = __commonJS({
  "node_modules/ws/index.js"(exports2, module) {
    "use strict";
    var createWebSocketStream = require_stream();
    var extension = require_extension();
    var PerMessageDeflate = require_permessage_deflate();
    var Receiver = require_receiver();
    var Sender = require_sender();
    var subprotocol = require_subprotocol();
    var WebSocket = require_websocket();
    var WebSocketServer = require_websocket_server();
    WebSocket.createWebSocketStream = createWebSocketStream;
    WebSocket.extension = extension;
    WebSocket.PerMessageDeflate = PerMessageDeflate;
    WebSocket.Receiver = Receiver;
    WebSocket.Sender = Sender;
    WebSocket.Server = WebSocketServer;
    WebSocket.subprotocol = subprotocol;
    WebSocket.WebSocket = WebSocket;
    WebSocket.WebSocketServer = WebSocketServer;
    module.exports = WebSocket;
  }
});

// node_modules/isomorphic-ws/node.js
var require_node2 = __commonJS({
  "node_modules/isomorphic-ws/node.js"(exports2, module) {
    "use strict";
    module.exports = require_ws();
  }
});

// node_modules/crypto-js/core.js
var require_core = __commonJS({
  "node_modules/crypto-js/core.js"(exports2, module) {
    (function(root, factory) {
      if (typeof exports2 === "object") {
        module.exports = exports2 = factory();
      } else if (typeof define === "function" && define.amd) {
        define([], factory);
      } else {
        root.CryptoJS = factory();
      }
    })(exports2, function() {
      var CryptoJS = CryptoJS || (function(Math2, undefined2) {
        var crypto;
        if (typeof window !== "undefined" && window.crypto) {
          crypto = window.crypto;
        }
        if (typeof self !== "undefined" && self.crypto) {
          crypto = self.crypto;
        }
        if (typeof globalThis !== "undefined" && globalThis.crypto) {
          crypto = globalThis.crypto;
        }
        if (!crypto && typeof window !== "undefined" && window.msCrypto) {
          crypto = window.msCrypto;
        }
        if (!crypto && typeof global !== "undefined" && global.crypto) {
          crypto = global.crypto;
        }
        if (!crypto && typeof __require === "function") {
          try {
            crypto = __require("crypto");
          } catch (err) {
          }
        }
        var cryptoSecureRandomInt = function() {
          if (crypto) {
            if (typeof crypto.getRandomValues === "function") {
              try {
                return crypto.getRandomValues(new Uint32Array(1))[0];
              } catch (err) {
              }
            }
            if (typeof crypto.randomBytes === "function") {
              try {
                return crypto.randomBytes(4).readInt32LE();
              } catch (err) {
              }
            }
          }
          throw new Error("Native crypto module could not be used to get secure random number.");
        };
        var create = Object.create || /* @__PURE__ */ (function() {
          function F() {
          }
          return function(obj) {
            var subtype;
            F.prototype = obj;
            subtype = new F();
            F.prototype = null;
            return subtype;
          };
        })();
        var C = {};
        var C_lib = C.lib = {};
        var Base = C_lib.Base = /* @__PURE__ */ (function() {
          return {
            /**
             * Creates a new object that inherits from this object.
             *
             * @param {Object} overrides Properties to copy into the new object.
             *
             * @return {Object} The new object.
             *
             * @static
             *
             * @example
             *
             *     var MyType = CryptoJS.lib.Base.extend({
             *         field: 'value',
             *
             *         method: function () {
             *         }
             *     });
             */
            extend: function(overrides) {
              var subtype = create(this);
              if (overrides) {
                subtype.mixIn(overrides);
              }
              if (!subtype.hasOwnProperty("init") || this.init === subtype.init) {
                subtype.init = function() {
                  subtype.$super.init.apply(this, arguments);
                };
              }
              subtype.init.prototype = subtype;
              subtype.$super = this;
              return subtype;
            },
            /**
             * Extends this object and runs the init method.
             * Arguments to create() will be passed to init().
             *
             * @return {Object} The new object.
             *
             * @static
             *
             * @example
             *
             *     var instance = MyType.create();
             */
            create: function() {
              var instance = this.extend();
              instance.init.apply(instance, arguments);
              return instance;
            },
            /**
             * Initializes a newly created object.
             * Override this method to add some logic when your objects are created.
             *
             * @example
             *
             *     var MyType = CryptoJS.lib.Base.extend({
             *         init: function () {
             *             // ...
             *         }
             *     });
             */
            init: function() {
            },
            /**
             * Copies properties into this object.
             *
             * @param {Object} properties The properties to mix in.
             *
             * @example
             *
             *     MyType.mixIn({
             *         field: 'value'
             *     });
             */
            mixIn: function(properties) {
              for (var propertyName in properties) {
                if (properties.hasOwnProperty(propertyName)) {
                  this[propertyName] = properties[propertyName];
                }
              }
              if (properties.hasOwnProperty("toString")) {
                this.toString = properties.toString;
              }
            },
            /**
             * Creates a copy of this object.
             *
             * @return {Object} The clone.
             *
             * @example
             *
             *     var clone = instance.clone();
             */
            clone: function() {
              return this.init.prototype.extend(this);
            }
          };
        })();
        var WordArray = C_lib.WordArray = Base.extend({
          /**
           * Initializes a newly created word array.
           *
           * @param {Array} words (Optional) An array of 32-bit words.
           * @param {number} sigBytes (Optional) The number of significant bytes in the words.
           *
           * @example
           *
           *     var wordArray = CryptoJS.lib.WordArray.create();
           *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
           *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
           */
          init: function(words, sigBytes) {
            words = this.words = words || [];
            if (sigBytes != undefined2) {
              this.sigBytes = sigBytes;
            } else {
              this.sigBytes = words.length * 4;
            }
          },
          /**
           * Converts this word array to a string.
           *
           * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
           *
           * @return {string} The stringified word array.
           *
           * @example
           *
           *     var string = wordArray + '';
           *     var string = wordArray.toString();
           *     var string = wordArray.toString(CryptoJS.enc.Utf8);
           */
          toString: function(encoder) {
            return (encoder || Hex).stringify(this);
          },
          /**
           * Concatenates a word array to this word array.
           *
           * @param {WordArray} wordArray The word array to append.
           *
           * @return {WordArray} This word array.
           *
           * @example
           *
           *     wordArray1.concat(wordArray2);
           */
          concat: function(wordArray) {
            var thisWords = this.words;
            var thatWords = wordArray.words;
            var thisSigBytes = this.sigBytes;
            var thatSigBytes = wordArray.sigBytes;
            this.clamp();
            if (thisSigBytes % 4) {
              for (var i = 0; i < thatSigBytes; i++) {
                var thatByte = thatWords[i >>> 2] >>> 24 - i % 4 * 8 & 255;
                thisWords[thisSigBytes + i >>> 2] |= thatByte << 24 - (thisSigBytes + i) % 4 * 8;
              }
            } else {
              for (var j = 0; j < thatSigBytes; j += 4) {
                thisWords[thisSigBytes + j >>> 2] = thatWords[j >>> 2];
              }
            }
            this.sigBytes += thatSigBytes;
            return this;
          },
          /**
           * Removes insignificant bits.
           *
           * @example
           *
           *     wordArray.clamp();
           */
          clamp: function() {
            var words = this.words;
            var sigBytes = this.sigBytes;
            words[sigBytes >>> 2] &= 4294967295 << 32 - sigBytes % 4 * 8;
            words.length = Math2.ceil(sigBytes / 4);
          },
          /**
           * Creates a copy of this word array.
           *
           * @return {WordArray} The clone.
           *
           * @example
           *
           *     var clone = wordArray.clone();
           */
          clone: function() {
            var clone = Base.clone.call(this);
            clone.words = this.words.slice(0);
            return clone;
          },
          /**
           * Creates a word array filled with random bytes.
           *
           * @param {number} nBytes The number of random bytes to generate.
           *
           * @return {WordArray} The random word array.
           *
           * @static
           *
           * @example
           *
           *     var wordArray = CryptoJS.lib.WordArray.random(16);
           */
          random: function(nBytes) {
            var words = [];
            for (var i = 0; i < nBytes; i += 4) {
              words.push(cryptoSecureRandomInt());
            }
            return new WordArray.init(words, nBytes);
          }
        });
        var C_enc = C.enc = {};
        var Hex = C_enc.Hex = {
          /**
           * Converts a word array to a hex string.
           *
           * @param {WordArray} wordArray The word array.
           *
           * @return {string} The hex string.
           *
           * @static
           *
           * @example
           *
           *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
           */
          stringify: function(wordArray) {
            var words = wordArray.words;
            var sigBytes = wordArray.sigBytes;
            var hexChars = [];
            for (var i = 0; i < sigBytes; i++) {
              var bite = words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
              hexChars.push((bite >>> 4).toString(16));
              hexChars.push((bite & 15).toString(16));
            }
            return hexChars.join("");
          },
          /**
           * Converts a hex string to a word array.
           *
           * @param {string} hexStr The hex string.
           *
           * @return {WordArray} The word array.
           *
           * @static
           *
           * @example
           *
           *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
           */
          parse: function(hexStr) {
            var hexStrLength = hexStr.length;
            var words = [];
            for (var i = 0; i < hexStrLength; i += 2) {
              words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << 24 - i % 8 * 4;
            }
            return new WordArray.init(words, hexStrLength / 2);
          }
        };
        var Latin1 = C_enc.Latin1 = {
          /**
           * Converts a word array to a Latin1 string.
           *
           * @param {WordArray} wordArray The word array.
           *
           * @return {string} The Latin1 string.
           *
           * @static
           *
           * @example
           *
           *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
           */
          stringify: function(wordArray) {
            var words = wordArray.words;
            var sigBytes = wordArray.sigBytes;
            var latin1Chars = [];
            for (var i = 0; i < sigBytes; i++) {
              var bite = words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
              latin1Chars.push(String.fromCharCode(bite));
            }
            return latin1Chars.join("");
          },
          /**
           * Converts a Latin1 string to a word array.
           *
           * @param {string} latin1Str The Latin1 string.
           *
           * @return {WordArray} The word array.
           *
           * @static
           *
           * @example
           *
           *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
           */
          parse: function(latin1Str) {
            var latin1StrLength = latin1Str.length;
            var words = [];
            for (var i = 0; i < latin1StrLength; i++) {
              words[i >>> 2] |= (latin1Str.charCodeAt(i) & 255) << 24 - i % 4 * 8;
            }
            return new WordArray.init(words, latin1StrLength);
          }
        };
        var Utf8 = C_enc.Utf8 = {
          /**
           * Converts a word array to a UTF-8 string.
           *
           * @param {WordArray} wordArray The word array.
           *
           * @return {string} The UTF-8 string.
           *
           * @static
           *
           * @example
           *
           *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
           */
          stringify: function(wordArray) {
            try {
              return decodeURIComponent(escape(Latin1.stringify(wordArray)));
            } catch (e) {
              throw new Error("Malformed UTF-8 data");
            }
          },
          /**
           * Converts a UTF-8 string to a word array.
           *
           * @param {string} utf8Str The UTF-8 string.
           *
           * @return {WordArray} The word array.
           *
           * @static
           *
           * @example
           *
           *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
           */
          parse: function(utf8Str) {
            return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
          }
        };
        var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
          /**
           * Resets this block algorithm's data buffer to its initial state.
           *
           * @example
           *
           *     bufferedBlockAlgorithm.reset();
           */
          reset: function() {
            this._data = new WordArray.init();
            this._nDataBytes = 0;
          },
          /**
           * Adds new data to this block algorithm's buffer.
           *
           * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
           *
           * @example
           *
           *     bufferedBlockAlgorithm._append('data');
           *     bufferedBlockAlgorithm._append(wordArray);
           */
          _append: function(data) {
            if (typeof data == "string") {
              data = Utf8.parse(data);
            }
            this._data.concat(data);
            this._nDataBytes += data.sigBytes;
          },
          /**
           * Processes available data blocks.
           *
           * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
           *
           * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
           *
           * @return {WordArray} The processed data.
           *
           * @example
           *
           *     var processedData = bufferedBlockAlgorithm._process();
           *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
           */
          _process: function(doFlush) {
            var processedWords;
            var data = this._data;
            var dataWords = data.words;
            var dataSigBytes = data.sigBytes;
            var blockSize = this.blockSize;
            var blockSizeBytes = blockSize * 4;
            var nBlocksReady = dataSigBytes / blockSizeBytes;
            if (doFlush) {
              nBlocksReady = Math2.ceil(nBlocksReady);
            } else {
              nBlocksReady = Math2.max((nBlocksReady | 0) - this._minBufferSize, 0);
            }
            var nWordsReady = nBlocksReady * blockSize;
            var nBytesReady = Math2.min(nWordsReady * 4, dataSigBytes);
            if (nWordsReady) {
              for (var offset = 0; offset < nWordsReady; offset += blockSize) {
                this._doProcessBlock(dataWords, offset);
              }
              processedWords = dataWords.splice(0, nWordsReady);
              data.sigBytes -= nBytesReady;
            }
            return new WordArray.init(processedWords, nBytesReady);
          },
          /**
           * Creates a copy of this object.
           *
           * @return {Object} The clone.
           *
           * @example
           *
           *     var clone = bufferedBlockAlgorithm.clone();
           */
          clone: function() {
            var clone = Base.clone.call(this);
            clone._data = this._data.clone();
            return clone;
          },
          _minBufferSize: 0
        });
        var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
          /**
           * Configuration options.
           */
          cfg: Base.extend(),
          /**
           * Initializes a newly created hasher.
           *
           * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
           *
           * @example
           *
           *     var hasher = CryptoJS.algo.SHA256.create();
           */
          init: function(cfg) {
            this.cfg = this.cfg.extend(cfg);
            this.reset();
          },
          /**
           * Resets this hasher to its initial state.
           *
           * @example
           *
           *     hasher.reset();
           */
          reset: function() {
            BufferedBlockAlgorithm.reset.call(this);
            this._doReset();
          },
          /**
           * Updates this hasher with a message.
           *
           * @param {WordArray|string} messageUpdate The message to append.
           *
           * @return {Hasher} This hasher.
           *
           * @example
           *
           *     hasher.update('message');
           *     hasher.update(wordArray);
           */
          update: function(messageUpdate) {
            this._append(messageUpdate);
            this._process();
            return this;
          },
          /**
           * Finalizes the hash computation.
           * Note that the finalize operation is effectively a destructive, read-once operation.
           *
           * @param {WordArray|string} messageUpdate (Optional) A final message update.
           *
           * @return {WordArray} The hash.
           *
           * @example
           *
           *     var hash = hasher.finalize();
           *     var hash = hasher.finalize('message');
           *     var hash = hasher.finalize(wordArray);
           */
          finalize: function(messageUpdate) {
            if (messageUpdate) {
              this._append(messageUpdate);
            }
            var hash = this._doFinalize();
            return hash;
          },
          blockSize: 512 / 32,
          /**
           * Creates a shortcut function to a hasher's object interface.
           *
           * @param {Hasher} hasher The hasher to create a helper for.
           *
           * @return {Function} The shortcut function.
           *
           * @static
           *
           * @example
           *
           *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
           */
          _createHelper: function(hasher) {
            return function(message, cfg) {
              return new hasher.init(cfg).finalize(message);
            };
          },
          /**
           * Creates a shortcut function to the HMAC's object interface.
           *
           * @param {Hasher} hasher The hasher to use in this HMAC helper.
           *
           * @return {Function} The shortcut function.
           *
           * @static
           *
           * @example
           *
           *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
           */
          _createHmacHelper: function(hasher) {
            return function(message, key) {
              return new C_algo.HMAC.init(hasher, key).finalize(message);
            };
          }
        });
        var C_algo = C.algo = {};
        return C;
      })(Math);
      return CryptoJS;
    });
  }
});

// node_modules/crypto-js/sha256.js
var require_sha256 = __commonJS({
  "node_modules/crypto-js/sha256.js"(exports2, module) {
    (function(root, factory) {
      if (typeof exports2 === "object") {
        module.exports = exports2 = factory(require_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports2, function(CryptoJS) {
      (function(Math2) {
        var C = CryptoJS;
        var C_lib = C.lib;
        var WordArray = C_lib.WordArray;
        var Hasher = C_lib.Hasher;
        var C_algo = C.algo;
        var H = [];
        var K = [];
        (function() {
          function isPrime(n2) {
            var sqrtN = Math2.sqrt(n2);
            for (var factor = 2; factor <= sqrtN; factor++) {
              if (!(n2 % factor)) {
                return false;
              }
            }
            return true;
          }
          function getFractionalBits(n2) {
            return (n2 - (n2 | 0)) * 4294967296 | 0;
          }
          var n = 2;
          var nPrime = 0;
          while (nPrime < 64) {
            if (isPrime(n)) {
              if (nPrime < 8) {
                H[nPrime] = getFractionalBits(Math2.pow(n, 1 / 2));
              }
              K[nPrime] = getFractionalBits(Math2.pow(n, 1 / 3));
              nPrime++;
            }
            n++;
          }
        })();
        var W = [];
        var SHA256 = C_algo.SHA256 = Hasher.extend({
          _doReset: function() {
            this._hash = new WordArray.init(H.slice(0));
          },
          _doProcessBlock: function(M, offset) {
            var H2 = this._hash.words;
            var a = H2[0];
            var b = H2[1];
            var c = H2[2];
            var d = H2[3];
            var e = H2[4];
            var f = H2[5];
            var g = H2[6];
            var h = H2[7];
            for (var i = 0; i < 64; i++) {
              if (i < 16) {
                W[i] = M[offset + i] | 0;
              } else {
                var gamma0x = W[i - 15];
                var gamma0 = (gamma0x << 25 | gamma0x >>> 7) ^ (gamma0x << 14 | gamma0x >>> 18) ^ gamma0x >>> 3;
                var gamma1x = W[i - 2];
                var gamma1 = (gamma1x << 15 | gamma1x >>> 17) ^ (gamma1x << 13 | gamma1x >>> 19) ^ gamma1x >>> 10;
                W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
              }
              var ch = e & f ^ ~e & g;
              var maj = a & b ^ a & c ^ b & c;
              var sigma0 = (a << 30 | a >>> 2) ^ (a << 19 | a >>> 13) ^ (a << 10 | a >>> 22);
              var sigma1 = (e << 26 | e >>> 6) ^ (e << 21 | e >>> 11) ^ (e << 7 | e >>> 25);
              var t1 = h + sigma1 + ch + K[i] + W[i];
              var t2 = sigma0 + maj;
              h = g;
              g = f;
              f = e;
              e = d + t1 | 0;
              d = c;
              c = b;
              b = a;
              a = t1 + t2 | 0;
            }
            H2[0] = H2[0] + a | 0;
            H2[1] = H2[1] + b | 0;
            H2[2] = H2[2] + c | 0;
            H2[3] = H2[3] + d | 0;
            H2[4] = H2[4] + e | 0;
            H2[5] = H2[5] + f | 0;
            H2[6] = H2[6] + g | 0;
            H2[7] = H2[7] + h | 0;
          },
          _doFinalize: function() {
            var data = this._data;
            var dataWords = data.words;
            var nBitsTotal = this._nDataBytes * 8;
            var nBitsLeft = data.sigBytes * 8;
            dataWords[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
            dataWords[(nBitsLeft + 64 >>> 9 << 4) + 14] = Math2.floor(nBitsTotal / 4294967296);
            dataWords[(nBitsLeft + 64 >>> 9 << 4) + 15] = nBitsTotal;
            data.sigBytes = dataWords.length * 4;
            this._process();
            return this._hash;
          },
          clone: function() {
            var clone = Hasher.clone.call(this);
            clone._hash = this._hash.clone();
            return clone;
          }
        });
        C.SHA256 = Hasher._createHelper(SHA256);
        C.HmacSHA256 = Hasher._createHmacHelper(SHA256);
      })(Math);
      return CryptoJS.SHA256;
    });
  }
});

// node_modules/crypto-js/enc-base64.js
var require_enc_base64 = __commonJS({
  "node_modules/crypto-js/enc-base64.js"(exports2, module) {
    (function(root, factory) {
      if (typeof exports2 === "object") {
        module.exports = exports2 = factory(require_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports2, function(CryptoJS) {
      (function() {
        var C = CryptoJS;
        var C_lib = C.lib;
        var WordArray = C_lib.WordArray;
        var C_enc = C.enc;
        var Base642 = C_enc.Base64 = {
          /**
           * Converts a word array to a Base64 string.
           *
           * @param {WordArray} wordArray The word array.
           *
           * @return {string} The Base64 string.
           *
           * @static
           *
           * @example
           *
           *     var base64String = CryptoJS.enc.Base64.stringify(wordArray);
           */
          stringify: function(wordArray) {
            var words = wordArray.words;
            var sigBytes = wordArray.sigBytes;
            var map = this._map;
            wordArray.clamp();
            var base64Chars = [];
            for (var i = 0; i < sigBytes; i += 3) {
              var byte1 = words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
              var byte2 = words[i + 1 >>> 2] >>> 24 - (i + 1) % 4 * 8 & 255;
              var byte3 = words[i + 2 >>> 2] >>> 24 - (i + 2) % 4 * 8 & 255;
              var triplet = byte1 << 16 | byte2 << 8 | byte3;
              for (var j = 0; j < 4 && i + j * 0.75 < sigBytes; j++) {
                base64Chars.push(map.charAt(triplet >>> 6 * (3 - j) & 63));
              }
            }
            var paddingChar = map.charAt(64);
            if (paddingChar) {
              while (base64Chars.length % 4) {
                base64Chars.push(paddingChar);
              }
            }
            return base64Chars.join("");
          },
          /**
           * Converts a Base64 string to a word array.
           *
           * @param {string} base64Str The Base64 string.
           *
           * @return {WordArray} The word array.
           *
           * @static
           *
           * @example
           *
           *     var wordArray = CryptoJS.enc.Base64.parse(base64String);
           */
          parse: function(base64Str) {
            var base64StrLength = base64Str.length;
            var map = this._map;
            var reverseMap = this._reverseMap;
            if (!reverseMap) {
              reverseMap = this._reverseMap = [];
              for (var j = 0; j < map.length; j++) {
                reverseMap[map.charCodeAt(j)] = j;
              }
            }
            var paddingChar = map.charAt(64);
            if (paddingChar) {
              var paddingIndex = base64Str.indexOf(paddingChar);
              if (paddingIndex !== -1) {
                base64StrLength = paddingIndex;
              }
            }
            return parseLoop(base64Str, base64StrLength, reverseMap);
          },
          _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
        };
        function parseLoop(base64Str, base64StrLength, reverseMap) {
          var words = [];
          var nBytes = 0;
          for (var i = 0; i < base64StrLength; i++) {
            if (i % 4) {
              var bits1 = reverseMap[base64Str.charCodeAt(i - 1)] << i % 4 * 2;
              var bits2 = reverseMap[base64Str.charCodeAt(i)] >>> 6 - i % 4 * 2;
              var bitsCombined = bits1 | bits2;
              words[nBytes >>> 2] |= bitsCombined << 24 - nBytes % 4 * 8;
              nBytes++;
            }
          }
          return WordArray.create(words, nBytes);
        }
      })();
      return CryptoJS.enc.Base64;
    });
  }
});

// node_modules/@msgpack/msgpack/dist/utils/int.js
var require_int = __commonJS({
  "node_modules/@msgpack/msgpack/dist/utils/int.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getUint64 = exports2.getInt64 = exports2.setInt64 = exports2.setUint64 = exports2.UINT32_MAX = void 0;
    exports2.UINT32_MAX = 4294967295;
    function setUint64(view, offset, value) {
      const high = value / 4294967296;
      const low = value;
      view.setUint32(offset, high);
      view.setUint32(offset + 4, low);
    }
    exports2.setUint64 = setUint64;
    function setInt64(view, offset, value) {
      const high = Math.floor(value / 4294967296);
      const low = value;
      view.setUint32(offset, high);
      view.setUint32(offset + 4, low);
    }
    exports2.setInt64 = setInt64;
    function getInt64(view, offset) {
      const high = view.getInt32(offset);
      const low = view.getUint32(offset + 4);
      return high * 4294967296 + low;
    }
    exports2.getInt64 = getInt64;
    function getUint64(view, offset) {
      const high = view.getUint32(offset);
      const low = view.getUint32(offset + 4);
      return high * 4294967296 + low;
    }
    exports2.getUint64 = getUint64;
  }
});

// node_modules/@msgpack/msgpack/dist/utils/utf8.js
var require_utf8 = __commonJS({
  "node_modules/@msgpack/msgpack/dist/utils/utf8.js"(exports2) {
    "use strict";
    var _a;
    var _b;
    var _c;
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.utf8DecodeTD = exports2.TEXT_DECODER_THRESHOLD = exports2.utf8DecodeJs = exports2.utf8EncodeTE = exports2.TEXT_ENCODER_THRESHOLD = exports2.utf8EncodeJs = exports2.utf8Count = void 0;
    var int_1 = require_int();
    var TEXT_ENCODING_AVAILABLE = (typeof process === "undefined" || ((_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a["TEXT_ENCODING"]) !== "never") && typeof TextEncoder !== "undefined" && typeof TextDecoder !== "undefined";
    function utf8Count(str) {
      const strLength = str.length;
      let byteLength = 0;
      let pos = 0;
      while (pos < strLength) {
        let value = str.charCodeAt(pos++);
        if ((value & 4294967168) === 0) {
          byteLength++;
          continue;
        } else if ((value & 4294965248) === 0) {
          byteLength += 2;
        } else {
          if (value >= 55296 && value <= 56319) {
            if (pos < strLength) {
              const extra = str.charCodeAt(pos);
              if ((extra & 64512) === 56320) {
                ++pos;
                value = ((value & 1023) << 10) + (extra & 1023) + 65536;
              }
            }
          }
          if ((value & 4294901760) === 0) {
            byteLength += 3;
          } else {
            byteLength += 4;
          }
        }
      }
      return byteLength;
    }
    exports2.utf8Count = utf8Count;
    function utf8EncodeJs(str, output, outputOffset) {
      const strLength = str.length;
      let offset = outputOffset;
      let pos = 0;
      while (pos < strLength) {
        let value = str.charCodeAt(pos++);
        if ((value & 4294967168) === 0) {
          output[offset++] = value;
          continue;
        } else if ((value & 4294965248) === 0) {
          output[offset++] = value >> 6 & 31 | 192;
        } else {
          if (value >= 55296 && value <= 56319) {
            if (pos < strLength) {
              const extra = str.charCodeAt(pos);
              if ((extra & 64512) === 56320) {
                ++pos;
                value = ((value & 1023) << 10) + (extra & 1023) + 65536;
              }
            }
          }
          if ((value & 4294901760) === 0) {
            output[offset++] = value >> 12 & 15 | 224;
            output[offset++] = value >> 6 & 63 | 128;
          } else {
            output[offset++] = value >> 18 & 7 | 240;
            output[offset++] = value >> 12 & 63 | 128;
            output[offset++] = value >> 6 & 63 | 128;
          }
        }
        output[offset++] = value & 63 | 128;
      }
    }
    exports2.utf8EncodeJs = utf8EncodeJs;
    var sharedTextEncoder = TEXT_ENCODING_AVAILABLE ? new TextEncoder() : void 0;
    exports2.TEXT_ENCODER_THRESHOLD = !TEXT_ENCODING_AVAILABLE ? int_1.UINT32_MAX : typeof process !== "undefined" && ((_b = process === null || process === void 0 ? void 0 : process.env) === null || _b === void 0 ? void 0 : _b["TEXT_ENCODING"]) !== "force" ? 200 : 0;
    function utf8EncodeTEencode(str, output, outputOffset) {
      output.set(sharedTextEncoder.encode(str), outputOffset);
    }
    function utf8EncodeTEencodeInto(str, output, outputOffset) {
      sharedTextEncoder.encodeInto(str, output.subarray(outputOffset));
    }
    exports2.utf8EncodeTE = (sharedTextEncoder === null || sharedTextEncoder === void 0 ? void 0 : sharedTextEncoder.encodeInto) ? utf8EncodeTEencodeInto : utf8EncodeTEencode;
    var CHUNK_SIZE = 4096;
    function utf8DecodeJs(bytes, inputOffset, byteLength) {
      let offset = inputOffset;
      const end = offset + byteLength;
      const units = [];
      let result = "";
      while (offset < end) {
        const byte1 = bytes[offset++];
        if ((byte1 & 128) === 0) {
          units.push(byte1);
        } else if ((byte1 & 224) === 192) {
          const byte2 = bytes[offset++] & 63;
          units.push((byte1 & 31) << 6 | byte2);
        } else if ((byte1 & 240) === 224) {
          const byte2 = bytes[offset++] & 63;
          const byte3 = bytes[offset++] & 63;
          units.push((byte1 & 31) << 12 | byte2 << 6 | byte3);
        } else if ((byte1 & 248) === 240) {
          const byte2 = bytes[offset++] & 63;
          const byte3 = bytes[offset++] & 63;
          const byte4 = bytes[offset++] & 63;
          let unit = (byte1 & 7) << 18 | byte2 << 12 | byte3 << 6 | byte4;
          if (unit > 65535) {
            unit -= 65536;
            units.push(unit >>> 10 & 1023 | 55296);
            unit = 56320 | unit & 1023;
          }
          units.push(unit);
        } else {
          units.push(byte1);
        }
        if (units.length >= CHUNK_SIZE) {
          result += String.fromCharCode(...units);
          units.length = 0;
        }
      }
      if (units.length > 0) {
        result += String.fromCharCode(...units);
      }
      return result;
    }
    exports2.utf8DecodeJs = utf8DecodeJs;
    var sharedTextDecoder = TEXT_ENCODING_AVAILABLE ? new TextDecoder() : null;
    exports2.TEXT_DECODER_THRESHOLD = !TEXT_ENCODING_AVAILABLE ? int_1.UINT32_MAX : typeof process !== "undefined" && ((_c = process === null || process === void 0 ? void 0 : process.env) === null || _c === void 0 ? void 0 : _c["TEXT_DECODER"]) !== "force" ? 200 : 0;
    function utf8DecodeTD(bytes, inputOffset, byteLength) {
      const stringBytes = bytes.subarray(inputOffset, inputOffset + byteLength);
      return sharedTextDecoder.decode(stringBytes);
    }
    exports2.utf8DecodeTD = utf8DecodeTD;
  }
});

// node_modules/@msgpack/msgpack/dist/ExtData.js
var require_ExtData = __commonJS({
  "node_modules/@msgpack/msgpack/dist/ExtData.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ExtData = void 0;
    var ExtData = class {
      constructor(type, data) {
        this.type = type;
        this.data = data;
      }
    };
    exports2.ExtData = ExtData;
  }
});

// node_modules/@msgpack/msgpack/dist/DecodeError.js
var require_DecodeError = __commonJS({
  "node_modules/@msgpack/msgpack/dist/DecodeError.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.DecodeError = void 0;
    var DecodeError = class _DecodeError extends Error {
      constructor(message) {
        super(message);
        const proto = Object.create(_DecodeError.prototype);
        Object.setPrototypeOf(this, proto);
        Object.defineProperty(this, "name", {
          configurable: true,
          enumerable: false,
          value: _DecodeError.name
        });
      }
    };
    exports2.DecodeError = DecodeError;
  }
});

// node_modules/@msgpack/msgpack/dist/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/@msgpack/msgpack/dist/timestamp.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.timestampExtension = exports2.decodeTimestampExtension = exports2.decodeTimestampToTimeSpec = exports2.encodeTimestampExtension = exports2.encodeDateToTimeSpec = exports2.encodeTimeSpecToTimestamp = exports2.EXT_TIMESTAMP = void 0;
    var DecodeError_1 = require_DecodeError();
    var int_1 = require_int();
    exports2.EXT_TIMESTAMP = -1;
    var TIMESTAMP32_MAX_SEC = 4294967296 - 1;
    var TIMESTAMP64_MAX_SEC = 17179869184 - 1;
    function encodeTimeSpecToTimestamp({ sec, nsec }) {
      if (sec >= 0 && nsec >= 0 && sec <= TIMESTAMP64_MAX_SEC) {
        if (nsec === 0 && sec <= TIMESTAMP32_MAX_SEC) {
          const rv = new Uint8Array(4);
          const view = new DataView(rv.buffer);
          view.setUint32(0, sec);
          return rv;
        } else {
          const secHigh = sec / 4294967296;
          const secLow = sec & 4294967295;
          const rv = new Uint8Array(8);
          const view = new DataView(rv.buffer);
          view.setUint32(0, nsec << 2 | secHigh & 3);
          view.setUint32(4, secLow);
          return rv;
        }
      } else {
        const rv = new Uint8Array(12);
        const view = new DataView(rv.buffer);
        view.setUint32(0, nsec);
        (0, int_1.setInt64)(view, 4, sec);
        return rv;
      }
    }
    exports2.encodeTimeSpecToTimestamp = encodeTimeSpecToTimestamp;
    function encodeDateToTimeSpec(date) {
      const msec = date.getTime();
      const sec = Math.floor(msec / 1e3);
      const nsec = (msec - sec * 1e3) * 1e6;
      const nsecInSec = Math.floor(nsec / 1e9);
      return {
        sec: sec + nsecInSec,
        nsec: nsec - nsecInSec * 1e9
      };
    }
    exports2.encodeDateToTimeSpec = encodeDateToTimeSpec;
    function encodeTimestampExtension(object) {
      if (object instanceof Date) {
        const timeSpec = encodeDateToTimeSpec(object);
        return encodeTimeSpecToTimestamp(timeSpec);
      } else {
        return null;
      }
    }
    exports2.encodeTimestampExtension = encodeTimestampExtension;
    function decodeTimestampToTimeSpec(data) {
      const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      switch (data.byteLength) {
        case 4: {
          const sec = view.getUint32(0);
          const nsec = 0;
          return { sec, nsec };
        }
        case 8: {
          const nsec30AndSecHigh2 = view.getUint32(0);
          const secLow32 = view.getUint32(4);
          const sec = (nsec30AndSecHigh2 & 3) * 4294967296 + secLow32;
          const nsec = nsec30AndSecHigh2 >>> 2;
          return { sec, nsec };
        }
        case 12: {
          const sec = (0, int_1.getInt64)(view, 4);
          const nsec = view.getUint32(0);
          return { sec, nsec };
        }
        default:
          throw new DecodeError_1.DecodeError(`Unrecognized data size for timestamp (expected 4, 8, or 12): ${data.length}`);
      }
    }
    exports2.decodeTimestampToTimeSpec = decodeTimestampToTimeSpec;
    function decodeTimestampExtension(data) {
      const timeSpec = decodeTimestampToTimeSpec(data);
      return new Date(timeSpec.sec * 1e3 + timeSpec.nsec / 1e6);
    }
    exports2.decodeTimestampExtension = decodeTimestampExtension;
    exports2.timestampExtension = {
      type: exports2.EXT_TIMESTAMP,
      encode: encodeTimestampExtension,
      decode: decodeTimestampExtension
    };
  }
});

// node_modules/@msgpack/msgpack/dist/ExtensionCodec.js
var require_ExtensionCodec = __commonJS({
  "node_modules/@msgpack/msgpack/dist/ExtensionCodec.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ExtensionCodec = void 0;
    var ExtData_1 = require_ExtData();
    var timestamp_1 = require_timestamp();
    var ExtensionCodec = class {
      constructor() {
        this.builtInEncoders = [];
        this.builtInDecoders = [];
        this.encoders = [];
        this.decoders = [];
        this.register(timestamp_1.timestampExtension);
      }
      register({ type, encode: encode2, decode: decode2 }) {
        if (type >= 0) {
          this.encoders[type] = encode2;
          this.decoders[type] = decode2;
        } else {
          const index = 1 + type;
          this.builtInEncoders[index] = encode2;
          this.builtInDecoders[index] = decode2;
        }
      }
      tryToEncode(object, context) {
        for (let i = 0; i < this.builtInEncoders.length; i++) {
          const encodeExt = this.builtInEncoders[i];
          if (encodeExt != null) {
            const data = encodeExt(object, context);
            if (data != null) {
              const type = -1 - i;
              return new ExtData_1.ExtData(type, data);
            }
          }
        }
        for (let i = 0; i < this.encoders.length; i++) {
          const encodeExt = this.encoders[i];
          if (encodeExt != null) {
            const data = encodeExt(object, context);
            if (data != null) {
              const type = i;
              return new ExtData_1.ExtData(type, data);
            }
          }
        }
        if (object instanceof ExtData_1.ExtData) {
          return object;
        }
        return null;
      }
      decode(data, type, context) {
        const decodeExt = type < 0 ? this.builtInDecoders[-1 - type] : this.decoders[type];
        if (decodeExt) {
          return decodeExt(data, type, context);
        } else {
          return new ExtData_1.ExtData(type, data);
        }
      }
    };
    exports2.ExtensionCodec = ExtensionCodec;
    ExtensionCodec.defaultCodec = new ExtensionCodec();
  }
});

// node_modules/@msgpack/msgpack/dist/utils/typedArrays.js
var require_typedArrays = __commonJS({
  "node_modules/@msgpack/msgpack/dist/utils/typedArrays.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createDataView = exports2.ensureUint8Array = void 0;
    function ensureUint8Array(buffer) {
      if (buffer instanceof Uint8Array) {
        return buffer;
      } else if (ArrayBuffer.isView(buffer)) {
        return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      } else if (buffer instanceof ArrayBuffer) {
        return new Uint8Array(buffer);
      } else {
        return Uint8Array.from(buffer);
      }
    }
    exports2.ensureUint8Array = ensureUint8Array;
    function createDataView(buffer) {
      if (buffer instanceof ArrayBuffer) {
        return new DataView(buffer);
      }
      const bufferView = ensureUint8Array(buffer);
      return new DataView(bufferView.buffer, bufferView.byteOffset, bufferView.byteLength);
    }
    exports2.createDataView = createDataView;
  }
});

// node_modules/@msgpack/msgpack/dist/Encoder.js
var require_Encoder = __commonJS({
  "node_modules/@msgpack/msgpack/dist/Encoder.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Encoder = exports2.DEFAULT_INITIAL_BUFFER_SIZE = exports2.DEFAULT_MAX_DEPTH = void 0;
    var utf8_1 = require_utf8();
    var ExtensionCodec_1 = require_ExtensionCodec();
    var int_1 = require_int();
    var typedArrays_1 = require_typedArrays();
    exports2.DEFAULT_MAX_DEPTH = 100;
    exports2.DEFAULT_INITIAL_BUFFER_SIZE = 2048;
    var Encoder = class {
      constructor(extensionCodec = ExtensionCodec_1.ExtensionCodec.defaultCodec, context = void 0, maxDepth = exports2.DEFAULT_MAX_DEPTH, initialBufferSize = exports2.DEFAULT_INITIAL_BUFFER_SIZE, sortKeys = false, forceFloat32 = false, ignoreUndefined = false, forceIntegerToFloat = false) {
        this.extensionCodec = extensionCodec;
        this.context = context;
        this.maxDepth = maxDepth;
        this.initialBufferSize = initialBufferSize;
        this.sortKeys = sortKeys;
        this.forceFloat32 = forceFloat32;
        this.ignoreUndefined = ignoreUndefined;
        this.forceIntegerToFloat = forceIntegerToFloat;
        this.pos = 0;
        this.view = new DataView(new ArrayBuffer(this.initialBufferSize));
        this.bytes = new Uint8Array(this.view.buffer);
      }
      reinitializeState() {
        this.pos = 0;
      }
      /**
       * This is almost equivalent to {@link Encoder#encode}, but it returns an reference of the encoder's internal buffer and thus much faster than {@link Encoder#encode}.
       *
       * @returns Encodes the object and returns a shared reference the encoder's internal buffer.
       */
      encodeSharedRef(object) {
        this.reinitializeState();
        this.doEncode(object, 1);
        return this.bytes.subarray(0, this.pos);
      }
      /**
       * @returns Encodes the object and returns a copy of the encoder's internal buffer.
       */
      encode(object) {
        this.reinitializeState();
        this.doEncode(object, 1);
        return this.bytes.slice(0, this.pos);
      }
      doEncode(object, depth) {
        if (depth > this.maxDepth) {
          throw new Error(`Too deep objects in depth ${depth}`);
        }
        if (object == null) {
          this.encodeNil();
        } else if (typeof object === "boolean") {
          this.encodeBoolean(object);
        } else if (typeof object === "number") {
          this.encodeNumber(object);
        } else if (typeof object === "string") {
          this.encodeString(object);
        } else {
          this.encodeObject(object, depth);
        }
      }
      ensureBufferSizeToWrite(sizeToWrite) {
        const requiredSize = this.pos + sizeToWrite;
        if (this.view.byteLength < requiredSize) {
          this.resizeBuffer(requiredSize * 2);
        }
      }
      resizeBuffer(newSize) {
        const newBuffer = new ArrayBuffer(newSize);
        const newBytes = new Uint8Array(newBuffer);
        const newView = new DataView(newBuffer);
        newBytes.set(this.bytes);
        this.view = newView;
        this.bytes = newBytes;
      }
      encodeNil() {
        this.writeU8(192);
      }
      encodeBoolean(object) {
        if (object === false) {
          this.writeU8(194);
        } else {
          this.writeU8(195);
        }
      }
      encodeNumber(object) {
        if (Number.isSafeInteger(object) && !this.forceIntegerToFloat) {
          if (object >= 0) {
            if (object < 128) {
              this.writeU8(object);
            } else if (object < 256) {
              this.writeU8(204);
              this.writeU8(object);
            } else if (object < 65536) {
              this.writeU8(205);
              this.writeU16(object);
            } else if (object < 4294967296) {
              this.writeU8(206);
              this.writeU32(object);
            } else {
              this.writeU8(207);
              this.writeU64(object);
            }
          } else {
            if (object >= -32) {
              this.writeU8(224 | object + 32);
            } else if (object >= -128) {
              this.writeU8(208);
              this.writeI8(object);
            } else if (object >= -32768) {
              this.writeU8(209);
              this.writeI16(object);
            } else if (object >= -2147483648) {
              this.writeU8(210);
              this.writeI32(object);
            } else {
              this.writeU8(211);
              this.writeI64(object);
            }
          }
        } else {
          if (this.forceFloat32) {
            this.writeU8(202);
            this.writeF32(object);
          } else {
            this.writeU8(203);
            this.writeF64(object);
          }
        }
      }
      writeStringHeader(byteLength) {
        if (byteLength < 32) {
          this.writeU8(160 + byteLength);
        } else if (byteLength < 256) {
          this.writeU8(217);
          this.writeU8(byteLength);
        } else if (byteLength < 65536) {
          this.writeU8(218);
          this.writeU16(byteLength);
        } else if (byteLength < 4294967296) {
          this.writeU8(219);
          this.writeU32(byteLength);
        } else {
          throw new Error(`Too long string: ${byteLength} bytes in UTF-8`);
        }
      }
      encodeString(object) {
        const maxHeaderSize = 1 + 4;
        const strLength = object.length;
        if (strLength > utf8_1.TEXT_ENCODER_THRESHOLD) {
          const byteLength = (0, utf8_1.utf8Count)(object);
          this.ensureBufferSizeToWrite(maxHeaderSize + byteLength);
          this.writeStringHeader(byteLength);
          (0, utf8_1.utf8EncodeTE)(object, this.bytes, this.pos);
          this.pos += byteLength;
        } else {
          const byteLength = (0, utf8_1.utf8Count)(object);
          this.ensureBufferSizeToWrite(maxHeaderSize + byteLength);
          this.writeStringHeader(byteLength);
          (0, utf8_1.utf8EncodeJs)(object, this.bytes, this.pos);
          this.pos += byteLength;
        }
      }
      encodeObject(object, depth) {
        const ext = this.extensionCodec.tryToEncode(object, this.context);
        if (ext != null) {
          this.encodeExtension(ext);
        } else if (Array.isArray(object)) {
          this.encodeArray(object, depth);
        } else if (ArrayBuffer.isView(object)) {
          this.encodeBinary(object);
        } else if (typeof object === "object") {
          this.encodeMap(object, depth);
        } else {
          throw new Error(`Unrecognized object: ${Object.prototype.toString.apply(object)}`);
        }
      }
      encodeBinary(object) {
        const size = object.byteLength;
        if (size < 256) {
          this.writeU8(196);
          this.writeU8(size);
        } else if (size < 65536) {
          this.writeU8(197);
          this.writeU16(size);
        } else if (size < 4294967296) {
          this.writeU8(198);
          this.writeU32(size);
        } else {
          throw new Error(`Too large binary: ${size}`);
        }
        const bytes = (0, typedArrays_1.ensureUint8Array)(object);
        this.writeU8a(bytes);
      }
      encodeArray(object, depth) {
        const size = object.length;
        if (size < 16) {
          this.writeU8(144 + size);
        } else if (size < 65536) {
          this.writeU8(220);
          this.writeU16(size);
        } else if (size < 4294967296) {
          this.writeU8(221);
          this.writeU32(size);
        } else {
          throw new Error(`Too large array: ${size}`);
        }
        for (const item of object) {
          this.doEncode(item, depth + 1);
        }
      }
      countWithoutUndefined(object, keys) {
        let count = 0;
        for (const key of keys) {
          if (object[key] !== void 0) {
            count++;
          }
        }
        return count;
      }
      encodeMap(object, depth) {
        const keys = Object.keys(object);
        if (this.sortKeys) {
          keys.sort();
        }
        const size = this.ignoreUndefined ? this.countWithoutUndefined(object, keys) : keys.length;
        if (size < 16) {
          this.writeU8(128 + size);
        } else if (size < 65536) {
          this.writeU8(222);
          this.writeU16(size);
        } else if (size < 4294967296) {
          this.writeU8(223);
          this.writeU32(size);
        } else {
          throw new Error(`Too large map object: ${size}`);
        }
        for (const key of keys) {
          const value = object[key];
          if (!(this.ignoreUndefined && value === void 0)) {
            this.encodeString(key);
            this.doEncode(value, depth + 1);
          }
        }
      }
      encodeExtension(ext) {
        const size = ext.data.length;
        if (size === 1) {
          this.writeU8(212);
        } else if (size === 2) {
          this.writeU8(213);
        } else if (size === 4) {
          this.writeU8(214);
        } else if (size === 8) {
          this.writeU8(215);
        } else if (size === 16) {
          this.writeU8(216);
        } else if (size < 256) {
          this.writeU8(199);
          this.writeU8(size);
        } else if (size < 65536) {
          this.writeU8(200);
          this.writeU16(size);
        } else if (size < 4294967296) {
          this.writeU8(201);
          this.writeU32(size);
        } else {
          throw new Error(`Too large extension object: ${size}`);
        }
        this.writeI8(ext.type);
        this.writeU8a(ext.data);
      }
      writeU8(value) {
        this.ensureBufferSizeToWrite(1);
        this.view.setUint8(this.pos, value);
        this.pos++;
      }
      writeU8a(values) {
        const size = values.length;
        this.ensureBufferSizeToWrite(size);
        this.bytes.set(values, this.pos);
        this.pos += size;
      }
      writeI8(value) {
        this.ensureBufferSizeToWrite(1);
        this.view.setInt8(this.pos, value);
        this.pos++;
      }
      writeU16(value) {
        this.ensureBufferSizeToWrite(2);
        this.view.setUint16(this.pos, value);
        this.pos += 2;
      }
      writeI16(value) {
        this.ensureBufferSizeToWrite(2);
        this.view.setInt16(this.pos, value);
        this.pos += 2;
      }
      writeU32(value) {
        this.ensureBufferSizeToWrite(4);
        this.view.setUint32(this.pos, value);
        this.pos += 4;
      }
      writeI32(value) {
        this.ensureBufferSizeToWrite(4);
        this.view.setInt32(this.pos, value);
        this.pos += 4;
      }
      writeF32(value) {
        this.ensureBufferSizeToWrite(4);
        this.view.setFloat32(this.pos, value);
        this.pos += 4;
      }
      writeF64(value) {
        this.ensureBufferSizeToWrite(8);
        this.view.setFloat64(this.pos, value);
        this.pos += 8;
      }
      writeU64(value) {
        this.ensureBufferSizeToWrite(8);
        (0, int_1.setUint64)(this.view, this.pos, value);
        this.pos += 8;
      }
      writeI64(value) {
        this.ensureBufferSizeToWrite(8);
        (0, int_1.setInt64)(this.view, this.pos, value);
        this.pos += 8;
      }
    };
    exports2.Encoder = Encoder;
  }
});

// node_modules/@msgpack/msgpack/dist/encode.js
var require_encode = __commonJS({
  "node_modules/@msgpack/msgpack/dist/encode.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.encode = void 0;
    var Encoder_1 = require_Encoder();
    var defaultEncodeOptions = {};
    function encode2(value, options = defaultEncodeOptions) {
      const encoder = new Encoder_1.Encoder(options.extensionCodec, options.context, options.maxDepth, options.initialBufferSize, options.sortKeys, options.forceFloat32, options.ignoreUndefined, options.forceIntegerToFloat);
      return encoder.encodeSharedRef(value);
    }
    exports2.encode = encode2;
  }
});

// node_modules/@msgpack/msgpack/dist/utils/prettyByte.js
var require_prettyByte = __commonJS({
  "node_modules/@msgpack/msgpack/dist/utils/prettyByte.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.prettyByte = void 0;
    function prettyByte(byte) {
      return `${byte < 0 ? "-" : ""}0x${Math.abs(byte).toString(16).padStart(2, "0")}`;
    }
    exports2.prettyByte = prettyByte;
  }
});

// node_modules/@msgpack/msgpack/dist/CachedKeyDecoder.js
var require_CachedKeyDecoder = __commonJS({
  "node_modules/@msgpack/msgpack/dist/CachedKeyDecoder.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.CachedKeyDecoder = void 0;
    var utf8_1 = require_utf8();
    var DEFAULT_MAX_KEY_LENGTH = 16;
    var DEFAULT_MAX_LENGTH_PER_KEY = 16;
    var CachedKeyDecoder = class {
      constructor(maxKeyLength = DEFAULT_MAX_KEY_LENGTH, maxLengthPerKey = DEFAULT_MAX_LENGTH_PER_KEY) {
        this.maxKeyLength = maxKeyLength;
        this.maxLengthPerKey = maxLengthPerKey;
        this.hit = 0;
        this.miss = 0;
        this.caches = [];
        for (let i = 0; i < this.maxKeyLength; i++) {
          this.caches.push([]);
        }
      }
      canBeCached(byteLength) {
        return byteLength > 0 && byteLength <= this.maxKeyLength;
      }
      find(bytes, inputOffset, byteLength) {
        const records = this.caches[byteLength - 1];
        FIND_CHUNK: for (const record of records) {
          const recordBytes = record.bytes;
          for (let j = 0; j < byteLength; j++) {
            if (recordBytes[j] !== bytes[inputOffset + j]) {
              continue FIND_CHUNK;
            }
          }
          return record.str;
        }
        return null;
      }
      store(bytes, value) {
        const records = this.caches[bytes.length - 1];
        const record = { bytes, str: value };
        if (records.length >= this.maxLengthPerKey) {
          records[Math.random() * records.length | 0] = record;
        } else {
          records.push(record);
        }
      }
      decode(bytes, inputOffset, byteLength) {
        const cachedValue = this.find(bytes, inputOffset, byteLength);
        if (cachedValue != null) {
          this.hit++;
          return cachedValue;
        }
        this.miss++;
        const str = (0, utf8_1.utf8DecodeJs)(bytes, inputOffset, byteLength);
        const slicedCopyOfBytes = Uint8Array.prototype.slice.call(bytes, inputOffset, inputOffset + byteLength);
        this.store(slicedCopyOfBytes, str);
        return str;
      }
    };
    exports2.CachedKeyDecoder = CachedKeyDecoder;
  }
});

// node_modules/@msgpack/msgpack/dist/Decoder.js
var require_Decoder = __commonJS({
  "node_modules/@msgpack/msgpack/dist/Decoder.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Decoder = exports2.DataViewIndexOutOfBoundsError = void 0;
    var prettyByte_1 = require_prettyByte();
    var ExtensionCodec_1 = require_ExtensionCodec();
    var int_1 = require_int();
    var utf8_1 = require_utf8();
    var typedArrays_1 = require_typedArrays();
    var CachedKeyDecoder_1 = require_CachedKeyDecoder();
    var DecodeError_1 = require_DecodeError();
    var isValidMapKeyType = (key) => {
      const keyType = typeof key;
      return keyType === "string" || keyType === "number";
    };
    var HEAD_BYTE_REQUIRED = -1;
    var EMPTY_VIEW = new DataView(new ArrayBuffer(0));
    var EMPTY_BYTES = new Uint8Array(EMPTY_VIEW.buffer);
    exports2.DataViewIndexOutOfBoundsError = (() => {
      try {
        EMPTY_VIEW.getInt8(0);
      } catch (e) {
        return e.constructor;
      }
      throw new Error("never reached");
    })();
    var MORE_DATA = new exports2.DataViewIndexOutOfBoundsError("Insufficient data");
    var sharedCachedKeyDecoder = new CachedKeyDecoder_1.CachedKeyDecoder();
    var Decoder = class {
      constructor(extensionCodec = ExtensionCodec_1.ExtensionCodec.defaultCodec, context = void 0, maxStrLength = int_1.UINT32_MAX, maxBinLength = int_1.UINT32_MAX, maxArrayLength = int_1.UINT32_MAX, maxMapLength = int_1.UINT32_MAX, maxExtLength = int_1.UINT32_MAX, keyDecoder = sharedCachedKeyDecoder) {
        this.extensionCodec = extensionCodec;
        this.context = context;
        this.maxStrLength = maxStrLength;
        this.maxBinLength = maxBinLength;
        this.maxArrayLength = maxArrayLength;
        this.maxMapLength = maxMapLength;
        this.maxExtLength = maxExtLength;
        this.keyDecoder = keyDecoder;
        this.totalPos = 0;
        this.pos = 0;
        this.view = EMPTY_VIEW;
        this.bytes = EMPTY_BYTES;
        this.headByte = HEAD_BYTE_REQUIRED;
        this.stack = [];
      }
      reinitializeState() {
        this.totalPos = 0;
        this.headByte = HEAD_BYTE_REQUIRED;
        this.stack.length = 0;
      }
      setBuffer(buffer) {
        this.bytes = (0, typedArrays_1.ensureUint8Array)(buffer);
        this.view = (0, typedArrays_1.createDataView)(this.bytes);
        this.pos = 0;
      }
      appendBuffer(buffer) {
        if (this.headByte === HEAD_BYTE_REQUIRED && !this.hasRemaining(1)) {
          this.setBuffer(buffer);
        } else {
          const remainingData = this.bytes.subarray(this.pos);
          const newData = (0, typedArrays_1.ensureUint8Array)(buffer);
          const newBuffer = new Uint8Array(remainingData.length + newData.length);
          newBuffer.set(remainingData);
          newBuffer.set(newData, remainingData.length);
          this.setBuffer(newBuffer);
        }
      }
      hasRemaining(size) {
        return this.view.byteLength - this.pos >= size;
      }
      createExtraByteError(posToShow) {
        const { view, pos } = this;
        return new RangeError(`Extra ${view.byteLength - pos} of ${view.byteLength} byte(s) found at buffer[${posToShow}]`);
      }
      /**
       * @throws {@link DecodeError}
       * @throws {@link RangeError}
       */
      decode(buffer) {
        this.reinitializeState();
        this.setBuffer(buffer);
        const object = this.doDecodeSync();
        if (this.hasRemaining(1)) {
          throw this.createExtraByteError(this.pos);
        }
        return object;
      }
      *decodeMulti(buffer) {
        this.reinitializeState();
        this.setBuffer(buffer);
        while (this.hasRemaining(1)) {
          yield this.doDecodeSync();
        }
      }
      async decodeAsync(stream) {
        let decoded = false;
        let object;
        for await (const buffer of stream) {
          if (decoded) {
            throw this.createExtraByteError(this.totalPos);
          }
          this.appendBuffer(buffer);
          try {
            object = this.doDecodeSync();
            decoded = true;
          } catch (e) {
            if (!(e instanceof exports2.DataViewIndexOutOfBoundsError)) {
              throw e;
            }
          }
          this.totalPos += this.pos;
        }
        if (decoded) {
          if (this.hasRemaining(1)) {
            throw this.createExtraByteError(this.totalPos);
          }
          return object;
        }
        const { headByte, pos, totalPos } = this;
        throw new RangeError(`Insufficient data in parsing ${(0, prettyByte_1.prettyByte)(headByte)} at ${totalPos} (${pos} in the current buffer)`);
      }
      decodeArrayStream(stream) {
        return this.decodeMultiAsync(stream, true);
      }
      decodeStream(stream) {
        return this.decodeMultiAsync(stream, false);
      }
      async *decodeMultiAsync(stream, isArray) {
        let isArrayHeaderRequired = isArray;
        let arrayItemsLeft = -1;
        for await (const buffer of stream) {
          if (isArray && arrayItemsLeft === 0) {
            throw this.createExtraByteError(this.totalPos);
          }
          this.appendBuffer(buffer);
          if (isArrayHeaderRequired) {
            arrayItemsLeft = this.readArraySize();
            isArrayHeaderRequired = false;
            this.complete();
          }
          try {
            while (true) {
              yield this.doDecodeSync();
              if (--arrayItemsLeft === 0) {
                break;
              }
            }
          } catch (e) {
            if (!(e instanceof exports2.DataViewIndexOutOfBoundsError)) {
              throw e;
            }
          }
          this.totalPos += this.pos;
        }
      }
      doDecodeSync() {
        DECODE: while (true) {
          const headByte = this.readHeadByte();
          let object;
          if (headByte >= 224) {
            object = headByte - 256;
          } else if (headByte < 192) {
            if (headByte < 128) {
              object = headByte;
            } else if (headByte < 144) {
              const size = headByte - 128;
              if (size !== 0) {
                this.pushMapState(size);
                this.complete();
                continue DECODE;
              } else {
                object = {};
              }
            } else if (headByte < 160) {
              const size = headByte - 144;
              if (size !== 0) {
                this.pushArrayState(size);
                this.complete();
                continue DECODE;
              } else {
                object = [];
              }
            } else {
              const byteLength = headByte - 160;
              object = this.decodeUtf8String(byteLength, 0);
            }
          } else if (headByte === 192) {
            object = null;
          } else if (headByte === 194) {
            object = false;
          } else if (headByte === 195) {
            object = true;
          } else if (headByte === 202) {
            object = this.readF32();
          } else if (headByte === 203) {
            object = this.readF64();
          } else if (headByte === 204) {
            object = this.readU8();
          } else if (headByte === 205) {
            object = this.readU16();
          } else if (headByte === 206) {
            object = this.readU32();
          } else if (headByte === 207) {
            object = this.readU64();
          } else if (headByte === 208) {
            object = this.readI8();
          } else if (headByte === 209) {
            object = this.readI16();
          } else if (headByte === 210) {
            object = this.readI32();
          } else if (headByte === 211) {
            object = this.readI64();
          } else if (headByte === 217) {
            const byteLength = this.lookU8();
            object = this.decodeUtf8String(byteLength, 1);
          } else if (headByte === 218) {
            const byteLength = this.lookU16();
            object = this.decodeUtf8String(byteLength, 2);
          } else if (headByte === 219) {
            const byteLength = this.lookU32();
            object = this.decodeUtf8String(byteLength, 4);
          } else if (headByte === 220) {
            const size = this.readU16();
            if (size !== 0) {
              this.pushArrayState(size);
              this.complete();
              continue DECODE;
            } else {
              object = [];
            }
          } else if (headByte === 221) {
            const size = this.readU32();
            if (size !== 0) {
              this.pushArrayState(size);
              this.complete();
              continue DECODE;
            } else {
              object = [];
            }
          } else if (headByte === 222) {
            const size = this.readU16();
            if (size !== 0) {
              this.pushMapState(size);
              this.complete();
              continue DECODE;
            } else {
              object = {};
            }
          } else if (headByte === 223) {
            const size = this.readU32();
            if (size !== 0) {
              this.pushMapState(size);
              this.complete();
              continue DECODE;
            } else {
              object = {};
            }
          } else if (headByte === 196) {
            const size = this.lookU8();
            object = this.decodeBinary(size, 1);
          } else if (headByte === 197) {
            const size = this.lookU16();
            object = this.decodeBinary(size, 2);
          } else if (headByte === 198) {
            const size = this.lookU32();
            object = this.decodeBinary(size, 4);
          } else if (headByte === 212) {
            object = this.decodeExtension(1, 0);
          } else if (headByte === 213) {
            object = this.decodeExtension(2, 0);
          } else if (headByte === 214) {
            object = this.decodeExtension(4, 0);
          } else if (headByte === 215) {
            object = this.decodeExtension(8, 0);
          } else if (headByte === 216) {
            object = this.decodeExtension(16, 0);
          } else if (headByte === 199) {
            const size = this.lookU8();
            object = this.decodeExtension(size, 1);
          } else if (headByte === 200) {
            const size = this.lookU16();
            object = this.decodeExtension(size, 2);
          } else if (headByte === 201) {
            const size = this.lookU32();
            object = this.decodeExtension(size, 4);
          } else {
            throw new DecodeError_1.DecodeError(`Unrecognized type byte: ${(0, prettyByte_1.prettyByte)(headByte)}`);
          }
          this.complete();
          const stack = this.stack;
          while (stack.length > 0) {
            const state = stack[stack.length - 1];
            if (state.type === 0) {
              state.array[state.position] = object;
              state.position++;
              if (state.position === state.size) {
                stack.pop();
                object = state.array;
              } else {
                continue DECODE;
              }
            } else if (state.type === 1) {
              if (!isValidMapKeyType(object)) {
                throw new DecodeError_1.DecodeError("The type of key must be string or number but " + typeof object);
              }
              if (object === "__proto__") {
                throw new DecodeError_1.DecodeError("The key __proto__ is not allowed");
              }
              state.key = object;
              state.type = 2;
              continue DECODE;
            } else {
              state.map[state.key] = object;
              state.readCount++;
              if (state.readCount === state.size) {
                stack.pop();
                object = state.map;
              } else {
                state.key = null;
                state.type = 1;
                continue DECODE;
              }
            }
          }
          return object;
        }
      }
      readHeadByte() {
        if (this.headByte === HEAD_BYTE_REQUIRED) {
          this.headByte = this.readU8();
        }
        return this.headByte;
      }
      complete() {
        this.headByte = HEAD_BYTE_REQUIRED;
      }
      readArraySize() {
        const headByte = this.readHeadByte();
        switch (headByte) {
          case 220:
            return this.readU16();
          case 221:
            return this.readU32();
          default: {
            if (headByte < 160) {
              return headByte - 144;
            } else {
              throw new DecodeError_1.DecodeError(`Unrecognized array type byte: ${(0, prettyByte_1.prettyByte)(headByte)}`);
            }
          }
        }
      }
      pushMapState(size) {
        if (size > this.maxMapLength) {
          throw new DecodeError_1.DecodeError(`Max length exceeded: map length (${size}) > maxMapLengthLength (${this.maxMapLength})`);
        }
        this.stack.push({
          type: 1,
          size,
          key: null,
          readCount: 0,
          map: {}
        });
      }
      pushArrayState(size) {
        if (size > this.maxArrayLength) {
          throw new DecodeError_1.DecodeError(`Max length exceeded: array length (${size}) > maxArrayLength (${this.maxArrayLength})`);
        }
        this.stack.push({
          type: 0,
          size,
          array: new Array(size),
          position: 0
        });
      }
      decodeUtf8String(byteLength, headerOffset) {
        var _a;
        if (byteLength > this.maxStrLength) {
          throw new DecodeError_1.DecodeError(`Max length exceeded: UTF-8 byte length (${byteLength}) > maxStrLength (${this.maxStrLength})`);
        }
        if (this.bytes.byteLength < this.pos + headerOffset + byteLength) {
          throw MORE_DATA;
        }
        const offset = this.pos + headerOffset;
        let object;
        if (this.stateIsMapKey() && ((_a = this.keyDecoder) === null || _a === void 0 ? void 0 : _a.canBeCached(byteLength))) {
          object = this.keyDecoder.decode(this.bytes, offset, byteLength);
        } else if (byteLength > utf8_1.TEXT_DECODER_THRESHOLD) {
          object = (0, utf8_1.utf8DecodeTD)(this.bytes, offset, byteLength);
        } else {
          object = (0, utf8_1.utf8DecodeJs)(this.bytes, offset, byteLength);
        }
        this.pos += headerOffset + byteLength;
        return object;
      }
      stateIsMapKey() {
        if (this.stack.length > 0) {
          const state = this.stack[this.stack.length - 1];
          return state.type === 1;
        }
        return false;
      }
      decodeBinary(byteLength, headOffset) {
        if (byteLength > this.maxBinLength) {
          throw new DecodeError_1.DecodeError(`Max length exceeded: bin length (${byteLength}) > maxBinLength (${this.maxBinLength})`);
        }
        if (!this.hasRemaining(byteLength + headOffset)) {
          throw MORE_DATA;
        }
        const offset = this.pos + headOffset;
        const object = this.bytes.subarray(offset, offset + byteLength);
        this.pos += headOffset + byteLength;
        return object;
      }
      decodeExtension(size, headOffset) {
        if (size > this.maxExtLength) {
          throw new DecodeError_1.DecodeError(`Max length exceeded: ext length (${size}) > maxExtLength (${this.maxExtLength})`);
        }
        const extType = this.view.getInt8(this.pos + headOffset);
        const data = this.decodeBinary(
          size,
          headOffset + 1
          /* extType */
        );
        return this.extensionCodec.decode(data, extType, this.context);
      }
      lookU8() {
        return this.view.getUint8(this.pos);
      }
      lookU16() {
        return this.view.getUint16(this.pos);
      }
      lookU32() {
        return this.view.getUint32(this.pos);
      }
      readU8() {
        const value = this.view.getUint8(this.pos);
        this.pos++;
        return value;
      }
      readI8() {
        const value = this.view.getInt8(this.pos);
        this.pos++;
        return value;
      }
      readU16() {
        const value = this.view.getUint16(this.pos);
        this.pos += 2;
        return value;
      }
      readI16() {
        const value = this.view.getInt16(this.pos);
        this.pos += 2;
        return value;
      }
      readU32() {
        const value = this.view.getUint32(this.pos);
        this.pos += 4;
        return value;
      }
      readI32() {
        const value = this.view.getInt32(this.pos);
        this.pos += 4;
        return value;
      }
      readU64() {
        const value = (0, int_1.getUint64)(this.view, this.pos);
        this.pos += 8;
        return value;
      }
      readI64() {
        const value = (0, int_1.getInt64)(this.view, this.pos);
        this.pos += 8;
        return value;
      }
      readF32() {
        const value = this.view.getFloat32(this.pos);
        this.pos += 4;
        return value;
      }
      readF64() {
        const value = this.view.getFloat64(this.pos);
        this.pos += 8;
        return value;
      }
    };
    exports2.Decoder = Decoder;
  }
});

// node_modules/@msgpack/msgpack/dist/decode.js
var require_decode = __commonJS({
  "node_modules/@msgpack/msgpack/dist/decode.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.decodeMulti = exports2.decode = exports2.defaultDecodeOptions = void 0;
    var Decoder_1 = require_Decoder();
    exports2.defaultDecodeOptions = {};
    function decode2(buffer, options = exports2.defaultDecodeOptions) {
      const decoder = new Decoder_1.Decoder(options.extensionCodec, options.context, options.maxStrLength, options.maxBinLength, options.maxArrayLength, options.maxMapLength, options.maxExtLength);
      return decoder.decode(buffer);
    }
    exports2.decode = decode2;
    function decodeMulti(buffer, options = exports2.defaultDecodeOptions) {
      const decoder = new Decoder_1.Decoder(options.extensionCodec, options.context, options.maxStrLength, options.maxBinLength, options.maxArrayLength, options.maxMapLength, options.maxExtLength);
      return decoder.decodeMulti(buffer);
    }
    exports2.decodeMulti = decodeMulti;
  }
});

// node_modules/@msgpack/msgpack/dist/utils/stream.js
var require_stream2 = __commonJS({
  "node_modules/@msgpack/msgpack/dist/utils/stream.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ensureAsyncIterable = exports2.asyncIterableFromStream = exports2.isAsyncIterable = void 0;
    function isAsyncIterable(object) {
      return object[Symbol.asyncIterator] != null;
    }
    exports2.isAsyncIterable = isAsyncIterable;
    function assertNonNull(value) {
      if (value == null) {
        throw new Error("Assertion Failure: value must not be null nor undefined");
      }
    }
    async function* asyncIterableFromStream(stream) {
      const reader = stream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            return;
          }
          assertNonNull(value);
          yield value;
        }
      } finally {
        reader.releaseLock();
      }
    }
    exports2.asyncIterableFromStream = asyncIterableFromStream;
    function ensureAsyncIterable(streamLike) {
      if (isAsyncIterable(streamLike)) {
        return streamLike;
      } else {
        return asyncIterableFromStream(streamLike);
      }
    }
    exports2.ensureAsyncIterable = ensureAsyncIterable;
  }
});

// node_modules/@msgpack/msgpack/dist/decodeAsync.js
var require_decodeAsync = __commonJS({
  "node_modules/@msgpack/msgpack/dist/decodeAsync.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.decodeStream = exports2.decodeMultiStream = exports2.decodeArrayStream = exports2.decodeAsync = void 0;
    var Decoder_1 = require_Decoder();
    var stream_1 = require_stream2();
    var decode_1 = require_decode();
    async function decodeAsync(streamLike, options = decode_1.defaultDecodeOptions) {
      const stream = (0, stream_1.ensureAsyncIterable)(streamLike);
      const decoder = new Decoder_1.Decoder(options.extensionCodec, options.context, options.maxStrLength, options.maxBinLength, options.maxArrayLength, options.maxMapLength, options.maxExtLength);
      return decoder.decodeAsync(stream);
    }
    exports2.decodeAsync = decodeAsync;
    function decodeArrayStream(streamLike, options = decode_1.defaultDecodeOptions) {
      const stream = (0, stream_1.ensureAsyncIterable)(streamLike);
      const decoder = new Decoder_1.Decoder(options.extensionCodec, options.context, options.maxStrLength, options.maxBinLength, options.maxArrayLength, options.maxMapLength, options.maxExtLength);
      return decoder.decodeArrayStream(stream);
    }
    exports2.decodeArrayStream = decodeArrayStream;
    function decodeMultiStream(streamLike, options = decode_1.defaultDecodeOptions) {
      const stream = (0, stream_1.ensureAsyncIterable)(streamLike);
      const decoder = new Decoder_1.Decoder(options.extensionCodec, options.context, options.maxStrLength, options.maxBinLength, options.maxArrayLength, options.maxMapLength, options.maxExtLength);
      return decoder.decodeStream(stream);
    }
    exports2.decodeMultiStream = decodeMultiStream;
    function decodeStream(streamLike, options = decode_1.defaultDecodeOptions) {
      return decodeMultiStream(streamLike, options);
    }
    exports2.decodeStream = decodeStream;
  }
});

// node_modules/@msgpack/msgpack/dist/index.js
var require_dist = __commonJS({
  "node_modules/@msgpack/msgpack/dist/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.decodeTimestampExtension = exports2.encodeTimestampExtension = exports2.decodeTimestampToTimeSpec = exports2.encodeTimeSpecToTimestamp = exports2.encodeDateToTimeSpec = exports2.EXT_TIMESTAMP = exports2.ExtData = exports2.ExtensionCodec = exports2.Encoder = exports2.DataViewIndexOutOfBoundsError = exports2.DecodeError = exports2.Decoder = exports2.decodeStream = exports2.decodeMultiStream = exports2.decodeArrayStream = exports2.decodeAsync = exports2.decodeMulti = exports2.decode = exports2.encode = void 0;
    var encode_1 = require_encode();
    Object.defineProperty(exports2, "encode", { enumerable: true, get: function() {
      return encode_1.encode;
    } });
    var decode_1 = require_decode();
    Object.defineProperty(exports2, "decode", { enumerable: true, get: function() {
      return decode_1.decode;
    } });
    Object.defineProperty(exports2, "decodeMulti", { enumerable: true, get: function() {
      return decode_1.decodeMulti;
    } });
    var decodeAsync_1 = require_decodeAsync();
    Object.defineProperty(exports2, "decodeAsync", { enumerable: true, get: function() {
      return decodeAsync_1.decodeAsync;
    } });
    Object.defineProperty(exports2, "decodeArrayStream", { enumerable: true, get: function() {
      return decodeAsync_1.decodeArrayStream;
    } });
    Object.defineProperty(exports2, "decodeMultiStream", { enumerable: true, get: function() {
      return decodeAsync_1.decodeMultiStream;
    } });
    Object.defineProperty(exports2, "decodeStream", { enumerable: true, get: function() {
      return decodeAsync_1.decodeStream;
    } });
    var Decoder_1 = require_Decoder();
    Object.defineProperty(exports2, "Decoder", { enumerable: true, get: function() {
      return Decoder_1.Decoder;
    } });
    Object.defineProperty(exports2, "DataViewIndexOutOfBoundsError", { enumerable: true, get: function() {
      return Decoder_1.DataViewIndexOutOfBoundsError;
    } });
    var DecodeError_1 = require_DecodeError();
    Object.defineProperty(exports2, "DecodeError", { enumerable: true, get: function() {
      return DecodeError_1.DecodeError;
    } });
    var Encoder_1 = require_Encoder();
    Object.defineProperty(exports2, "Encoder", { enumerable: true, get: function() {
      return Encoder_1.Encoder;
    } });
    var ExtensionCodec_1 = require_ExtensionCodec();
    Object.defineProperty(exports2, "ExtensionCodec", { enumerable: true, get: function() {
      return ExtensionCodec_1.ExtensionCodec;
    } });
    var ExtData_1 = require_ExtData();
    Object.defineProperty(exports2, "ExtData", { enumerable: true, get: function() {
      return ExtData_1.ExtData;
    } });
    var timestamp_1 = require_timestamp();
    Object.defineProperty(exports2, "EXT_TIMESTAMP", { enumerable: true, get: function() {
      return timestamp_1.EXT_TIMESTAMP;
    } });
    Object.defineProperty(exports2, "encodeDateToTimeSpec", { enumerable: true, get: function() {
      return timestamp_1.encodeDateToTimeSpec;
    } });
    Object.defineProperty(exports2, "encodeTimeSpecToTimestamp", { enumerable: true, get: function() {
      return timestamp_1.encodeTimeSpecToTimestamp;
    } });
    Object.defineProperty(exports2, "decodeTimestampToTimeSpec", { enumerable: true, get: function() {
      return timestamp_1.decodeTimestampToTimeSpec;
    } });
    Object.defineProperty(exports2, "encodeTimestampExtension", { enumerable: true, get: function() {
      return timestamp_1.encodeTimestampExtension;
    } });
    Object.defineProperty(exports2, "decodeTimestampExtension", { enumerable: true, get: function() {
      return timestamp_1.decodeTimestampExtension;
    } });
  }
});

// node_modules/obs-websocket-js/dist/chunk-MVPOL3ZW.js
var import_debug = __toESM(require_src(), 1);

// node_modules/eventemitter3/index.mjs
var import_index = __toESM(require_eventemitter3(), 1);

// node_modules/obs-websocket-js/dist/chunk-MVPOL3ZW.js
var import_isomorphic_ws = __toESM(require_node2(), 1);
var import_sha256 = __toESM(require_sha256(), 1);
var import_enc_base64 = __toESM(require_enc_base64(), 1);
function authenticationHashing_default(salt, challenge, msg) {
  const hash = import_enc_base64.default.stringify((0, import_sha256.default)(msg + salt));
  return import_enc_base64.default.stringify((0, import_sha256.default)(hash + challenge));
}
var debug = (0, import_debug.default)("obs-websocket-js");
var OBSWebSocketError = class extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
};
var BaseOBSWebSocket = class _BaseOBSWebSocket extends import_index.default {
  static requestCounter = 1;
  static generateMessageId() {
    return String(_BaseOBSWebSocket.requestCounter++);
  }
  _identified = false;
  internalListeners = new import_index.default();
  socket;
  get identified() {
    return this._identified;
  }
  /**
   * Connect to an obs-websocket server
   * @param url Websocket server to connect to (including ws:// or wss:// protocol)
   * @param password Password
   * @param identificationParams Data for Identify event
   * @returns Hello & Identified messages data (combined)
   */
  async connect(url = "ws://127.0.0.1:4455", password, identificationParams = {}) {
    if (this.socket) {
      await this.disconnect();
    }
    try {
      const connectionClosedPromise = this.internalEventPromise("ConnectionClosed");
      const connectionErrorPromise = this.internalEventPromise("ConnectionError");
      return await Promise.race([
        (async () => {
          const hello = await this.createConnection(url);
          this.emit("Hello", hello);
          return this.identify(hello, password, identificationParams);
        })(),
        // Choose the best promise for connection error/close
        // In browser connection close has close code + reason,
        // while in node error event has these
        new Promise((resolve, reject) => {
          void connectionErrorPromise.then((e) => {
            if (e.message) {
              reject(e);
            }
          });
          void connectionClosedPromise.then((e) => {
            reject(e);
          });
        })
      ]);
    } catch (error) {
      await this.disconnect();
      throw error;
    }
  }
  /**
   * Disconnect from obs-websocket server
   */
  async disconnect() {
    if (!this.socket || this.socket.readyState === import_isomorphic_ws.default.CLOSED) {
      return;
    }
    const connectionClosedPromise = this.internalEventPromise("ConnectionClosed");
    this.socket.close();
    await connectionClosedPromise;
  }
  /**
   * Update session parameters
   * @param data Reidentify data
   * @returns Identified message data
   */
  async reidentify(data) {
    const identifiedPromise = this.internalEventPromise(`op:${2}`);
    await this.message(3, data);
    return identifiedPromise;
  }
  /**
   * Send a request to obs-websocket
   * @param requestType Request name
   * @param requestData Request data
   * @returns Request response
   */
  async call(requestType, requestData) {
    const requestId = _BaseOBSWebSocket.generateMessageId();
    const responsePromise = this.internalEventPromise(`res:${requestId}`);
    await this.message(6, {
      requestId,
      requestType,
      requestData
    });
    const { requestStatus, responseData } = await responsePromise;
    if (!requestStatus.result) {
      throw new OBSWebSocketError(requestStatus.code, requestStatus.comment);
    }
    return responseData;
  }
  /**
   * Send a batch request to obs-websocket
   * @param requests Array of Request objects (type and data)
   * @param options A set of options for how the batch will be executed
   * @param options.executionType The mode of execution obs-websocket will run the batch in
   * @param options.haltOnFailure Whether obs-websocket should stop executing the batch if one request fails
   * @returns RequestBatch response
   */
  async callBatch(requests, options = {}) {
    const requestId = _BaseOBSWebSocket.generateMessageId();
    const responsePromise = this.internalEventPromise(`res:${requestId}`);
    await this.message(8, {
      requestId,
      requests,
      ...options
    });
    const { results } = await responsePromise;
    return results;
  }
  /**
   * Cleanup from socket disconnection
   */
  cleanup() {
    if (!this.socket) {
      return;
    }
    this.socket.onopen = null;
    this.socket.onmessage = null;
    this.socket.onerror = null;
    this.socket.onclose = null;
    this.socket = void 0;
    this._identified = false;
    this.internalListeners.removeAllListeners();
  }
  /**
   * Create connection to specified obs-websocket server
   *
   * @private
   * @param url Websocket address
   * @returns Promise for hello data
   */
  async createConnection(url) {
    var _a;
    const connectionOpenedPromise = this.internalEventPromise("ConnectionOpened");
    const helloPromise = this.internalEventPromise(`op:${0}`);
    this.socket = new import_isomorphic_ws.default(url, this.protocol);
    this.socket.onopen = this.onOpen.bind(this);
    this.socket.onmessage = this.onMessage.bind(this);
    this.socket.onerror = this.onError.bind(this);
    this.socket.onclose = this.onClose.bind(this);
    await connectionOpenedPromise;
    const protocol = (_a = this.socket) == null ? void 0 : _a.protocol;
    if (!protocol) {
      throw new OBSWebSocketError(-1, "Server sent no subprotocol");
    }
    if (protocol !== this.protocol) {
      throw new OBSWebSocketError(-1, "Server sent an invalid subprotocol");
    }
    return helloPromise;
  }
  /**
   * Send identify message
   *
   * @private
   * @param hello Hello message data
   * @param password Password
   * @param identificationParams Identification params
   * @returns Hello & Identified messages data (combined)
   */
  async identify({
    authentication,
    rpcVersion,
    ...helloRest
  }, password, identificationParams = {}) {
    const data = {
      rpcVersion,
      ...identificationParams
    };
    if (authentication && password) {
      data.authentication = authenticationHashing_default(authentication.salt, authentication.challenge, password);
    }
    const identifiedPromise = this.internalEventPromise(`op:${2}`);
    await this.message(1, data);
    const identified = await identifiedPromise;
    this._identified = true;
    this.emit("Identified", identified);
    return {
      rpcVersion,
      ...helloRest,
      ...identified
    };
  }
  /**
   * Send message to obs-websocket
   *
   * @private
   * @param op WebSocketOpCode
   * @param d Message data
   */
  async message(op, d) {
    if (!this.socket) {
      throw new Error("Not connected");
    }
    if (!this.identified && op !== 1) {
      throw new Error("Socket not identified");
    }
    const encoded = await this.encodeMessage({
      op,
      d
    });
    this.socket.send(encoded);
  }
  /**
   * Create a promise to listen for an event on internal listener
   * (will be cleaned up on disconnect)
   *
   * @private
   * @param event Event to listen to
   * @returns Event data
   */
  async internalEventPromise(event) {
    return new Promise((resolve) => {
      this.internalListeners.once(event, resolve);
    });
  }
  /**
   * Websocket open event listener
   *
   * @private
   * @param e Event
   */
  onOpen(e) {
    debug("socket.open");
    this.emit("ConnectionOpened");
    this.internalListeners.emit("ConnectionOpened", e);
  }
  /**
   * Websocket message event listener
   *
   * @private
   * @param e Event
   */
  async onMessage(e) {
    try {
      const { op, d } = await this.decodeMessage(e.data);
      debug("socket.message: %d %j", op, d);
      if (op === void 0 || d === void 0) {
        return;
      }
      switch (op) {
        case 5: {
          const { eventType, eventData } = d;
          this.emit(eventType, eventData);
          return;
        }
        case 7:
        case 9: {
          const { requestId } = d;
          this.internalListeners.emit(`res:${requestId}`, d);
          return;
        }
        default:
          this.internalListeners.emit(`op:${op}`, d);
      }
    } catch (error) {
      debug("error handling message: %o", error);
    }
  }
  /**
   * Websocket error event listener
   *
   * @private
   * @param e ErrorEvent
   */
  onError(e) {
    debug("socket.error: %o", e);
    const error = new OBSWebSocketError(-1, e.message);
    this.emit("ConnectionError", error);
    this.internalListeners.emit("ConnectionError", error);
  }
  /**
   * Websocket close event listener
   *
   * @private
   * @param e Event
   */
  onClose(e) {
    debug("socket.close: %s (%d)", e.reason, e.code);
    const error = new OBSWebSocketError(e.code, e.reason);
    this.emit("ConnectionClosed", error);
    this.internalListeners.emit("ConnectionClosed", error);
    this.cleanup();
  }
};
if (typeof exports !== "undefined") {
  Object.defineProperty(exports, "__esModule", { value: true });
}

// node_modules/obs-websocket-js/dist/msgpack.js
var import_msgpack = __toESM(require_dist(), 1);
var OBSWebSocket = class extends BaseOBSWebSocket {
  protocol = "obswebsocket.msgpack";
  async encodeMessage(data) {
    return (0, import_msgpack.encode)(data);
  }
  async decodeMessage(data) {
    if (typeof Blob !== "undefined" && data instanceof Blob) {
      data = await data.arrayBuffer();
    }
    return (0, import_msgpack.decode)(data);
  }
};

// src/avatar/obs.ts
var FaceTimeObsController = class {
  config;
  logger;
  client;
  #connected = false;
  #startedVirtualCamera = false;
  constructor(params) {
    this.config = params.config;
    this.logger = params.logger;
    this.client = params.client ?? new OBSWebSocket();
  }
  async configure(rendererUrl2) {
    const url = this.config.url ?? "ws://127.0.0.1:4455";
    const passwordEnv = this.config.passwordEnv ?? "OBS_WEBSOCKET_PASSWORD";
    const password = process.env[passwordEnv];
    await this.client.connect(url, password, { rpcVersion: 1 });
    this.#connected = true;
    const sceneName = this.config.sceneName ?? "OpenClaw FaceTime Avatar";
    const sourceName = this.config.sourceName ?? "OpenClaw Avatar Renderer";
    const scenes = await this.client.call("GetSceneList");
    if (!scenes.scenes.some((scene) => scene.sceneName === sceneName)) {
      await this.client.call("CreateScene", { sceneName });
    }
    const inputs = await this.client.call("GetInputList", { inputKind: "browser_source" });
    const inputSettings = {
      url: rendererUrl2,
      width: this.config.width ?? 1280,
      height: this.config.height ?? 720,
      reroute_audio: false,
      shutdown: false,
      restart_when_active: true
    };
    if (inputs.inputs.some((input) => input.inputName === sourceName)) {
      await this.client.call("SetInputSettings", {
        inputName: sourceName,
        inputSettings,
        overlay: true
      });
      try {
        const item = await this.client.call("GetSceneItemId", { sceneName, sourceName });
        await this.client.call("SetSceneItemEnabled", {
          sceneName,
          sceneItemId: item.sceneItemId,
          sceneItemEnabled: false
        });
        await this.client.call("SetSceneItemEnabled", {
          sceneName,
          sceneItemId: item.sceneItemId,
          sceneItemEnabled: true
        });
      } catch {
        await this.client.call("CreateSceneItem", { sceneName, sourceName, sceneItemEnabled: true });
      }
    } else {
      await this.client.call("CreateInput", {
        sceneName,
        inputName: sourceName,
        inputKind: "browser_source",
        inputSettings,
        sceneItemEnabled: true
      });
    }
    await this.client.call("SetCurrentProgramScene", { sceneName });
    this.logger.info("[facetime-avatar] OBS scene configured and renderer attached");
  }
  async startVirtualCamera() {
    if (!this.#connected || this.config.autoStartVirtualCamera === false) {
      return;
    }
    const status = await this.client.call("GetVirtualCamStatus");
    if (status.outputActive) {
      return;
    }
    await this.client.call("StartVirtualCam");
    const started = await this.client.call("GetVirtualCamStatus");
    if (!started.outputActive) {
      throw new Error(
        "OBS virtual camera did not start; approve the OBS Camera Extension in macOS System Settings"
      );
    }
    this.#startedVirtualCamera = true;
  }
  async stopVirtualCamera() {
    if (!this.#connected || !this.#startedVirtualCamera) {
      return;
    }
    await this.client.call("StopVirtualCam");
    this.#startedVirtualCamera = false;
  }
  async stop() {
    if (!this.#connected) {
      return;
    }
    await this.stopVirtualCamera().catch(() => {
    });
    await this.client.disconnect();
    this.#connected = false;
    this.#startedVirtualCamera = false;
  }
};

// src/avatar/obs-smoke.ts
var rendererUrl = process.argv[2];
if (!rendererUrl?.startsWith("http://127.0.0.1:")) {
  throw new Error("usage: npm run avatar:obs-smoke -- <loopback-renderer-url>");
}
var logger = {
  info: (message) => console.log(message),
  warn: (message) => console.warn(message),
  error: (message) => console.error(message)
};
var controller = new FaceTimeObsController({
  config: {
    enabled: true,
    url: "ws://127.0.0.1:4455",
    passwordEnv: "OBS_WEBSOCKET_PASSWORD",
    autoStartVirtualCamera: !process.argv.includes("--no-virtual-camera")
  },
  logger
});
await controller.configure(rendererUrl);
var testVirtualCamera = !process.argv.includes("--no-virtual-camera");
if (testVirtualCamera) {
  await controller.startVirtualCamera();
}
await new Promise((resolve) => setTimeout(resolve, 1e3));
await controller.stop();
console.log(
  testVirtualCamera ? "OBS avatar scene and virtual-camera start/stop smoke passed" : "OBS avatar scene smoke passed (virtual camera intentionally skipped)"
);
