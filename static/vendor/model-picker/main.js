var Ni = { exports: {} }, wr = {}, Li = { exports: {} }, $ = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Na;
function Vf() {
  if (Na) return $;
  Na = 1;
  var p = Symbol.for("react.element"), x = Symbol.for("react.portal"), v = Symbol.for("react.fragment"), j = Symbol.for("react.strict_mode"), H = Symbol.for("react.profiler"), Y = Symbol.for("react.provider"), F = Symbol.for("react.context"), b = Symbol.for("react.forward_ref"), D = Symbol.for("react.suspense"), U = Symbol.for("react.memo"), ae = Symbol.for("react.lazy"), I = Symbol.iterator;
  function K(c) {
    return c === null || typeof c != "object" ? null : (c = I && c[I] || c["@@iterator"], typeof c == "function" ? c : null);
  }
  var ne = { isMounted: function() {
    return !1;
  }, enqueueForceUpdate: function() {
  }, enqueueReplaceState: function() {
  }, enqueueSetState: function() {
  } }, ce = Object.assign, J = {};
  function X(c, y, A) {
    this.props = c, this.context = y, this.refs = J, this.updater = A || ne;
  }
  X.prototype.isReactComponent = {}, X.prototype.setState = function(c, y) {
    if (typeof c != "object" && typeof c != "function" && c != null) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
    this.updater.enqueueSetState(this, c, y, "setState");
  }, X.prototype.forceUpdate = function(c) {
    this.updater.enqueueForceUpdate(this, c, "forceUpdate");
  };
  function ht() {
  }
  ht.prototype = X.prototype;
  function st(c, y, A) {
    this.props = c, this.context = y, this.refs = J, this.updater = A || ne;
  }
  var Je = st.prototype = new ht();
  Je.constructor = st, ce(Je, X.prototype), Je.isPureReactComponent = !0;
  var xe = Array.isArray, be = Object.prototype.hasOwnProperty, Le = { current: null }, Re = { key: !0, ref: !0, __self: !0, __source: !0 };
  function We(c, y, A) {
    var V, W = {}, Q = null, ee = null;
    if (y != null) for (V in y.ref !== void 0 && (ee = y.ref), y.key !== void 0 && (Q = "" + y.key), y) be.call(y, V) && !Re.hasOwnProperty(V) && (W[V] = y[V]);
    var Z = arguments.length - 2;
    if (Z === 1) W.children = A;
    else if (1 < Z) {
      for (var oe = Array(Z), $e = 0; $e < Z; $e++) oe[$e] = arguments[$e + 2];
      W.children = oe;
    }
    if (c && c.defaultProps) for (V in Z = c.defaultProps, Z) W[V] === void 0 && (W[V] = Z[V]);
    return { $$typeof: p, type: c, key: Q, ref: ee, props: W, _owner: Le.current };
  }
  function Pt(c, y) {
    return { $$typeof: p, type: c.type, key: y, ref: c.ref, props: c.props, _owner: c._owner };
  }
  function yt(c) {
    return typeof c == "object" && c !== null && c.$$typeof === p;
  }
  function Qt(c) {
    var y = { "=": "=0", ":": "=2" };
    return "$" + c.replace(/[=:]/g, function(A) {
      return y[A];
    });
  }
  var at = /\/+/g;
  function Ue(c, y) {
    return typeof c == "object" && c !== null && c.key != null ? Qt("" + c.key) : y.toString(36);
  }
  function et(c, y, A, V, W) {
    var Q = typeof c;
    (Q === "undefined" || Q === "boolean") && (c = null);
    var ee = !1;
    if (c === null) ee = !0;
    else switch (Q) {
      case "string":
      case "number":
        ee = !0;
        break;
      case "object":
        switch (c.$$typeof) {
          case p:
          case x:
            ee = !0;
        }
    }
    if (ee) return ee = c, W = W(ee), c = V === "" ? "." + Ue(ee, 0) : V, xe(W) ? (A = "", c != null && (A = c.replace(at, "$&/") + "/"), et(W, y, A, "", function($e) {
      return $e;
    })) : W != null && (yt(W) && (W = Pt(W, A + (!W.key || ee && ee.key === W.key ? "" : ("" + W.key).replace(at, "$&/") + "/") + c)), y.push(W)), 1;
    if (ee = 0, V = V === "" ? "." : V + ":", xe(c)) for (var Z = 0; Z < c.length; Z++) {
      Q = c[Z];
      var oe = V + Ue(Q, Z);
      ee += et(Q, y, A, oe, W);
    }
    else if (oe = K(c), typeof oe == "function") for (c = oe.call(c), Z = 0; !(Q = c.next()).done; ) Q = Q.value, oe = V + Ue(Q, Z++), ee += et(Q, y, A, oe, W);
    else if (Q === "object") throw y = String(c), Error("Objects are not valid as a React child (found: " + (y === "[object Object]" ? "object with keys {" + Object.keys(c).join(", ") + "}" : y) + "). If you meant to render a collection of children, use an array instead.");
    return ee;
  }
  function ct(c, y, A) {
    if (c == null) return c;
    var V = [], W = 0;
    return et(c, V, "", "", function(Q) {
      return y.call(A, Q, W++);
    }), V;
  }
  function Ie(c) {
    if (c._status === -1) {
      var y = c._result;
      y = y(), y.then(function(A) {
        (c._status === 0 || c._status === -1) && (c._status = 1, c._result = A);
      }, function(A) {
        (c._status === 0 || c._status === -1) && (c._status = 2, c._result = A);
      }), c._status === -1 && (c._status = 0, c._result = y);
    }
    if (c._status === 1) return c._result.default;
    throw c._result;
  }
  var fe = { current: null }, S = { transition: null }, R = { ReactCurrentDispatcher: fe, ReactCurrentBatchConfig: S, ReactCurrentOwner: Le };
  function C() {
    throw Error("act(...) is not supported in production builds of React.");
  }
  return $.Children = { map: ct, forEach: function(c, y, A) {
    ct(c, function() {
      y.apply(this, arguments);
    }, A);
  }, count: function(c) {
    var y = 0;
    return ct(c, function() {
      y++;
    }), y;
  }, toArray: function(c) {
    return ct(c, function(y) {
      return y;
    }) || [];
  }, only: function(c) {
    if (!yt(c)) throw Error("React.Children.only expected to receive a single React element child.");
    return c;
  } }, $.Component = X, $.Fragment = v, $.Profiler = H, $.PureComponent = st, $.StrictMode = j, $.Suspense = D, $.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = R, $.act = C, $.cloneElement = function(c, y, A) {
    if (c == null) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + c + ".");
    var V = ce({}, c.props), W = c.key, Q = c.ref, ee = c._owner;
    if (y != null) {
      if (y.ref !== void 0 && (Q = y.ref, ee = Le.current), y.key !== void 0 && (W = "" + y.key), c.type && c.type.defaultProps) var Z = c.type.defaultProps;
      for (oe in y) be.call(y, oe) && !Re.hasOwnProperty(oe) && (V[oe] = y[oe] === void 0 && Z !== void 0 ? Z[oe] : y[oe]);
    }
    var oe = arguments.length - 2;
    if (oe === 1) V.children = A;
    else if (1 < oe) {
      Z = Array(oe);
      for (var $e = 0; $e < oe; $e++) Z[$e] = arguments[$e + 2];
      V.children = Z;
    }
    return { $$typeof: p, type: c.type, key: W, ref: Q, props: V, _owner: ee };
  }, $.createContext = function(c) {
    return c = { $$typeof: F, _currentValue: c, _currentValue2: c, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null }, c.Provider = { $$typeof: Y, _context: c }, c.Consumer = c;
  }, $.createElement = We, $.createFactory = function(c) {
    var y = We.bind(null, c);
    return y.type = c, y;
  }, $.createRef = function() {
    return { current: null };
  }, $.forwardRef = function(c) {
    return { $$typeof: b, render: c };
  }, $.isValidElement = yt, $.lazy = function(c) {
    return { $$typeof: ae, _payload: { _status: -1, _result: c }, _init: Ie };
  }, $.memo = function(c, y) {
    return { $$typeof: U, type: c, compare: y === void 0 ? null : y };
  }, $.startTransition = function(c) {
    var y = S.transition;
    S.transition = {};
    try {
      c();
    } finally {
      S.transition = y;
    }
  }, $.unstable_act = C, $.useCallback = function(c, y) {
    return fe.current.useCallback(c, y);
  }, $.useContext = function(c) {
    return fe.current.useContext(c);
  }, $.useDebugValue = function() {
  }, $.useDeferredValue = function(c) {
    return fe.current.useDeferredValue(c);
  }, $.useEffect = function(c, y) {
    return fe.current.useEffect(c, y);
  }, $.useId = function() {
    return fe.current.useId();
  }, $.useImperativeHandle = function(c, y, A) {
    return fe.current.useImperativeHandle(c, y, A);
  }, $.useInsertionEffect = function(c, y) {
    return fe.current.useInsertionEffect(c, y);
  }, $.useLayoutEffect = function(c, y) {
    return fe.current.useLayoutEffect(c, y);
  }, $.useMemo = function(c, y) {
    return fe.current.useMemo(c, y);
  }, $.useReducer = function(c, y, A) {
    return fe.current.useReducer(c, y, A);
  }, $.useRef = function(c) {
    return fe.current.useRef(c);
  }, $.useState = function(c) {
    return fe.current.useState(c);
  }, $.useSyncExternalStore = function(c, y, A) {
    return fe.current.useSyncExternalStore(c, y, A);
  }, $.useTransition = function() {
    return fe.current.useTransition();
  }, $.version = "18.3.1", $;
}
var La;
function Ii() {
  return La || (La = 1, Li.exports = Vf()), Li.exports;
}
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var za;
function Hf() {
  if (za) return wr;
  za = 1;
  var p = Ii(), x = Symbol.for("react.element"), v = Symbol.for("react.fragment"), j = Object.prototype.hasOwnProperty, H = p.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, Y = { key: !0, ref: !0, __self: !0, __source: !0 };
  function F(b, D, U) {
    var ae, I = {}, K = null, ne = null;
    U !== void 0 && (K = "" + U), D.key !== void 0 && (K = "" + D.key), D.ref !== void 0 && (ne = D.ref);
    for (ae in D) j.call(D, ae) && !Y.hasOwnProperty(ae) && (I[ae] = D[ae]);
    if (b && b.defaultProps) for (ae in D = b.defaultProps, D) I[ae] === void 0 && (I[ae] = D[ae]);
    return { $$typeof: x, type: b, key: K, ref: ne, props: I, _owner: H.current };
  }
  return wr.Fragment = v, wr.jsx = F, wr.jsxs = F, wr;
}
var Ta;
function Bf() {
  return Ta || (Ta = 1, Ni.exports = Hf()), Ni.exports;
}
var M = Bf(), In = Ii(), Rl = {}, zi = { exports: {} }, Fe = {}, Ti = { exports: {} }, Ri = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Ra;
function Kf() {
  return Ra || (Ra = 1, (function(p) {
    function x(S, R) {
      var C = S.length;
      S.push(R);
      e: for (; 0 < C; ) {
        var c = C - 1 >>> 1, y = S[c];
        if (0 < H(y, R)) S[c] = R, S[C] = y, C = c;
        else break e;
      }
    }
    function v(S) {
      return S.length === 0 ? null : S[0];
    }
    function j(S) {
      if (S.length === 0) return null;
      var R = S[0], C = S.pop();
      if (C !== R) {
        S[0] = C;
        e: for (var c = 0, y = S.length, A = y >>> 1; c < A; ) {
          var V = 2 * (c + 1) - 1, W = S[V], Q = V + 1, ee = S[Q];
          if (0 > H(W, C)) Q < y && 0 > H(ee, W) ? (S[c] = ee, S[Q] = C, c = Q) : (S[c] = W, S[V] = C, c = V);
          else if (Q < y && 0 > H(ee, C)) S[c] = ee, S[Q] = C, c = Q;
          else break e;
        }
      }
      return R;
    }
    function H(S, R) {
      var C = S.sortIndex - R.sortIndex;
      return C !== 0 ? C : S.id - R.id;
    }
    if (typeof performance == "object" && typeof performance.now == "function") {
      var Y = performance;
      p.unstable_now = function() {
        return Y.now();
      };
    } else {
      var F = Date, b = F.now();
      p.unstable_now = function() {
        return F.now() - b;
      };
    }
    var D = [], U = [], ae = 1, I = null, K = 3, ne = !1, ce = !1, J = !1, X = typeof setTimeout == "function" ? setTimeout : null, ht = typeof clearTimeout == "function" ? clearTimeout : null, st = typeof setImmediate < "u" ? setImmediate : null;
    typeof navigator < "u" && navigator.scheduling !== void 0 && navigator.scheduling.isInputPending !== void 0 && navigator.scheduling.isInputPending.bind(navigator.scheduling);
    function Je(S) {
      for (var R = v(U); R !== null; ) {
        if (R.callback === null) j(U);
        else if (R.startTime <= S) j(U), R.sortIndex = R.expirationTime, x(D, R);
        else break;
        R = v(U);
      }
    }
    function xe(S) {
      if (J = !1, Je(S), !ce) if (v(D) !== null) ce = !0, Ie(be);
      else {
        var R = v(U);
        R !== null && fe(xe, R.startTime - S);
      }
    }
    function be(S, R) {
      ce = !1, J && (J = !1, ht(We), We = -1), ne = !0;
      var C = K;
      try {
        for (Je(R), I = v(D); I !== null && (!(I.expirationTime > R) || S && !Qt()); ) {
          var c = I.callback;
          if (typeof c == "function") {
            I.callback = null, K = I.priorityLevel;
            var y = c(I.expirationTime <= R);
            R = p.unstable_now(), typeof y == "function" ? I.callback = y : I === v(D) && j(D), Je(R);
          } else j(D);
          I = v(D);
        }
        if (I !== null) var A = !0;
        else {
          var V = v(U);
          V !== null && fe(xe, V.startTime - R), A = !1;
        }
        return A;
      } finally {
        I = null, K = C, ne = !1;
      }
    }
    var Le = !1, Re = null, We = -1, Pt = 5, yt = -1;
    function Qt() {
      return !(p.unstable_now() - yt < Pt);
    }
    function at() {
      if (Re !== null) {
        var S = p.unstable_now();
        yt = S;
        var R = !0;
        try {
          R = Re(!0, S);
        } finally {
          R ? Ue() : (Le = !1, Re = null);
        }
      } else Le = !1;
    }
    var Ue;
    if (typeof st == "function") Ue = function() {
      st(at);
    };
    else if (typeof MessageChannel < "u") {
      var et = new MessageChannel(), ct = et.port2;
      et.port1.onmessage = at, Ue = function() {
        ct.postMessage(null);
      };
    } else Ue = function() {
      X(at, 0);
    };
    function Ie(S) {
      Re = S, Le || (Le = !0, Ue());
    }
    function fe(S, R) {
      We = X(function() {
        S(p.unstable_now());
      }, R);
    }
    p.unstable_IdlePriority = 5, p.unstable_ImmediatePriority = 1, p.unstable_LowPriority = 4, p.unstable_NormalPriority = 3, p.unstable_Profiling = null, p.unstable_UserBlockingPriority = 2, p.unstable_cancelCallback = function(S) {
      S.callback = null;
    }, p.unstable_continueExecution = function() {
      ce || ne || (ce = !0, Ie(be));
    }, p.unstable_forceFrameRate = function(S) {
      0 > S || 125 < S ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : Pt = 0 < S ? Math.floor(1e3 / S) : 5;
    }, p.unstable_getCurrentPriorityLevel = function() {
      return K;
    }, p.unstable_getFirstCallbackNode = function() {
      return v(D);
    }, p.unstable_next = function(S) {
      switch (K) {
        case 1:
        case 2:
        case 3:
          var R = 3;
          break;
        default:
          R = K;
      }
      var C = K;
      K = R;
      try {
        return S();
      } finally {
        K = C;
      }
    }, p.unstable_pauseExecution = function() {
    }, p.unstable_requestPaint = function() {
    }, p.unstable_runWithPriority = function(S, R) {
      switch (S) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          break;
        default:
          S = 3;
      }
      var C = K;
      K = S;
      try {
        return R();
      } finally {
        K = C;
      }
    }, p.unstable_scheduleCallback = function(S, R, C) {
      var c = p.unstable_now();
      switch (typeof C == "object" && C !== null ? (C = C.delay, C = typeof C == "number" && 0 < C ? c + C : c) : C = c, S) {
        case 1:
          var y = -1;
          break;
        case 2:
          y = 250;
          break;
        case 5:
          y = 1073741823;
          break;
        case 4:
          y = 1e4;
          break;
        default:
          y = 5e3;
      }
      return y = C + y, S = { id: ae++, callback: R, priorityLevel: S, startTime: C, expirationTime: y, sortIndex: -1 }, C > c ? (S.sortIndex = C, x(U, S), v(D) === null && S === v(U) && (J ? (ht(We), We = -1) : J = !0, fe(xe, C - c))) : (S.sortIndex = y, x(D, S), ce || ne || (ce = !0, Ie(be))), S;
    }, p.unstable_shouldYield = Qt, p.unstable_wrapCallback = function(S) {
      var R = K;
      return function() {
        var C = K;
        K = R;
        try {
          return S.apply(this, arguments);
        } finally {
          K = C;
        }
      };
    };
  })(Ri)), Ri;
}
var Ia;
function Wf() {
  return Ia || (Ia = 1, Ti.exports = Kf()), Ti.exports;
}
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Oa;
function Qf() {
  if (Oa) return Fe;
  Oa = 1;
  var p = Ii(), x = Wf();
  function v(e) {
    for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
    return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  var j = /* @__PURE__ */ new Set(), H = {};
  function Y(e, t) {
    F(e, t), F(e + "Capture", t);
  }
  function F(e, t) {
    for (H[e] = t, e = 0; e < t.length; e++) j.add(t[e]);
  }
  var b = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), D = Object.prototype.hasOwnProperty, U = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, ae = {}, I = {};
  function K(e) {
    return D.call(I, e) ? !0 : D.call(ae, e) ? !1 : U.test(e) ? I[e] = !0 : (ae[e] = !0, !1);
  }
  function ne(e, t, n, r) {
    if (n !== null && n.type === 0) return !1;
    switch (typeof t) {
      case "function":
      case "symbol":
        return !0;
      case "boolean":
        return r ? !1 : n !== null ? !n.acceptsBooleans : (e = e.toLowerCase().slice(0, 5), e !== "data-" && e !== "aria-");
      default:
        return !1;
    }
  }
  function ce(e, t, n, r) {
    if (t === null || typeof t > "u" || ne(e, t, n, r)) return !0;
    if (r) return !1;
    if (n !== null) switch (n.type) {
      case 3:
        return !t;
      case 4:
        return t === !1;
      case 5:
        return isNaN(t);
      case 6:
        return isNaN(t) || 1 > t;
    }
    return !1;
  }
  function J(e, t, n, r, l, o, i) {
    this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = r, this.attributeNamespace = l, this.mustUseProperty = n, this.propertyName = e, this.type = t, this.sanitizeURL = o, this.removeEmptyString = i;
  }
  var X = {};
  "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e) {
    X[e] = new J(e, 0, !1, e, null, !1, !1);
  }), [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(e) {
    var t = e[0];
    X[t] = new J(t, 1, !1, e[1], null, !1, !1);
  }), ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(e) {
    X[e] = new J(e, 2, !1, e.toLowerCase(), null, !1, !1);
  }), ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(e) {
    X[e] = new J(e, 2, !1, e, null, !1, !1);
  }), "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e) {
    X[e] = new J(e, 3, !1, e.toLowerCase(), null, !1, !1);
  }), ["checked", "multiple", "muted", "selected"].forEach(function(e) {
    X[e] = new J(e, 3, !0, e, null, !1, !1);
  }), ["capture", "download"].forEach(function(e) {
    X[e] = new J(e, 4, !1, e, null, !1, !1);
  }), ["cols", "rows", "size", "span"].forEach(function(e) {
    X[e] = new J(e, 6, !1, e, null, !1, !1);
  }), ["rowSpan", "start"].forEach(function(e) {
    X[e] = new J(e, 5, !1, e.toLowerCase(), null, !1, !1);
  });
  var ht = /[\-:]([a-z])/g;
  function st(e) {
    return e[1].toUpperCase();
  }
  "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e) {
    var t = e.replace(
      ht,
      st
    );
    X[t] = new J(t, 1, !1, e, null, !1, !1);
  }), "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
    var t = e.replace(ht, st);
    X[t] = new J(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1, !1);
  }), ["xml:base", "xml:lang", "xml:space"].forEach(function(e) {
    var t = e.replace(ht, st);
    X[t] = new J(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1, !1);
  }), ["tabIndex", "crossOrigin"].forEach(function(e) {
    X[e] = new J(e, 1, !1, e.toLowerCase(), null, !1, !1);
  }), X.xlinkHref = new J("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0, !1), ["src", "href", "action", "formAction"].forEach(function(e) {
    X[e] = new J(e, 1, !1, e.toLowerCase(), null, !0, !0);
  });
  function Je(e, t, n, r) {
    var l = X.hasOwnProperty(t) ? X[t] : null;
    (l !== null ? l.type !== 0 : r || !(2 < t.length) || t[0] !== "o" && t[0] !== "O" || t[1] !== "n" && t[1] !== "N") && (ce(t, n, l, r) && (n = null), r || l === null ? K(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n)) : l.mustUseProperty ? e[l.propertyName] = n === null ? l.type === 3 ? !1 : "" : n : (t = l.attributeName, r = l.attributeNamespace, n === null ? e.removeAttribute(t) : (l = l.type, n = l === 3 || l === 4 && n === !0 ? "" : "" + n, r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
  }
  var xe = p.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, be = Symbol.for("react.element"), Le = Symbol.for("react.portal"), Re = Symbol.for("react.fragment"), We = Symbol.for("react.strict_mode"), Pt = Symbol.for("react.profiler"), yt = Symbol.for("react.provider"), Qt = Symbol.for("react.context"), at = Symbol.for("react.forward_ref"), Ue = Symbol.for("react.suspense"), et = Symbol.for("react.suspense_list"), ct = Symbol.for("react.memo"), Ie = Symbol.for("react.lazy"), fe = Symbol.for("react.offscreen"), S = Symbol.iterator;
  function R(e) {
    return e === null || typeof e != "object" ? null : (e = S && e[S] || e["@@iterator"], typeof e == "function" ? e : null);
  }
  var C = Object.assign, c;
  function y(e) {
    if (c === void 0) try {
      throw Error();
    } catch (n) {
      var t = n.stack.trim().match(/\n( *(at )?)/);
      c = t && t[1] || "";
    }
    return `
` + c + e;
  }
  var A = !1;
  function V(e, t) {
    if (!e || A) return "";
    A = !0;
    var n = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      if (t) if (t = function() {
        throw Error();
      }, Object.defineProperty(t.prototype, "props", { set: function() {
        throw Error();
      } }), typeof Reflect == "object" && Reflect.construct) {
        try {
          Reflect.construct(t, []);
        } catch (m) {
          var r = m;
        }
        Reflect.construct(e, [], t);
      } else {
        try {
          t.call();
        } catch (m) {
          r = m;
        }
        e.call(t.prototype);
      }
      else {
        try {
          throw Error();
        } catch (m) {
          r = m;
        }
        e();
      }
    } catch (m) {
      if (m && r && typeof m.stack == "string") {
        for (var l = m.stack.split(`
`), o = r.stack.split(`
`), i = l.length - 1, u = o.length - 1; 1 <= i && 0 <= u && l[i] !== o[u]; ) u--;
        for (; 1 <= i && 0 <= u; i--, u--) if (l[i] !== o[u]) {
          if (i !== 1 || u !== 1)
            do
              if (i--, u--, 0 > u || l[i] !== o[u]) {
                var s = `
` + l[i].replace(" at new ", " at ");
                return e.displayName && s.includes("<anonymous>") && (s = s.replace("<anonymous>", e.displayName)), s;
              }
            while (1 <= i && 0 <= u);
          break;
        }
      }
    } finally {
      A = !1, Error.prepareStackTrace = n;
    }
    return (e = e ? e.displayName || e.name : "") ? y(e) : "";
  }
  function W(e) {
    switch (e.tag) {
      case 5:
        return y(e.type);
      case 16:
        return y("Lazy");
      case 13:
        return y("Suspense");
      case 19:
        return y("SuspenseList");
      case 0:
      case 2:
      case 15:
        return e = V(e.type, !1), e;
      case 11:
        return e = V(e.type.render, !1), e;
      case 1:
        return e = V(e.type, !0), e;
      default:
        return "";
    }
  }
  function Q(e) {
    if (e == null) return null;
    if (typeof e == "function") return e.displayName || e.name || null;
    if (typeof e == "string") return e;
    switch (e) {
      case Re:
        return "Fragment";
      case Le:
        return "Portal";
      case Pt:
        return "Profiler";
      case We:
        return "StrictMode";
      case Ue:
        return "Suspense";
      case et:
        return "SuspenseList";
    }
    if (typeof e == "object") switch (e.$$typeof) {
      case Qt:
        return (e.displayName || "Context") + ".Consumer";
      case yt:
        return (e._context.displayName || "Context") + ".Provider";
      case at:
        var t = e.render;
        return e = e.displayName, e || (e = t.displayName || t.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
      case ct:
        return t = e.displayName || null, t !== null ? t : Q(e.type) || "Memo";
      case Ie:
        t = e._payload, e = e._init;
        try {
          return Q(e(t));
        } catch {
        }
    }
    return null;
  }
  function ee(e) {
    var t = e.type;
    switch (e.tag) {
      case 24:
        return "Cache";
      case 9:
        return (t.displayName || "Context") + ".Consumer";
      case 10:
        return (t._context.displayName || "Context") + ".Provider";
      case 18:
        return "DehydratedFragment";
      case 11:
        return e = t.render, e = e.displayName || e.name || "", t.displayName || (e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef");
      case 7:
        return "Fragment";
      case 5:
        return t;
      case 4:
        return "Portal";
      case 3:
        return "Root";
      case 6:
        return "Text";
      case 16:
        return Q(t);
      case 8:
        return t === We ? "StrictMode" : "Mode";
      case 22:
        return "Offscreen";
      case 12:
        return "Profiler";
      case 21:
        return "Scope";
      case 13:
        return "Suspense";
      case 19:
        return "SuspenseList";
      case 25:
        return "TracingMarker";
      case 1:
      case 0:
      case 17:
      case 2:
      case 14:
      case 15:
        if (typeof t == "function") return t.displayName || t.name || null;
        if (typeof t == "string") return t;
    }
    return null;
  }
  function Z(e) {
    switch (typeof e) {
      case "boolean":
      case "number":
      case "string":
      case "undefined":
        return e;
      case "object":
        return e;
      default:
        return "";
    }
  }
  function oe(e) {
    var t = e.type;
    return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
  }
  function $e(e) {
    var t = oe(e) ? "checked" : "value", n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), r = "" + e[t];
    if (!e.hasOwnProperty(t) && typeof n < "u" && typeof n.get == "function" && typeof n.set == "function") {
      var l = n.get, o = n.set;
      return Object.defineProperty(e, t, { configurable: !0, get: function() {
        return l.call(this);
      }, set: function(i) {
        r = "" + i, o.call(this, i);
      } }), Object.defineProperty(e, t, { enumerable: n.enumerable }), { getValue: function() {
        return r;
      }, setValue: function(i) {
        r = "" + i;
      }, stopTracking: function() {
        e._valueTracker = null, delete e[t];
      } };
    }
  }
  function Sr(e) {
    e._valueTracker || (e._valueTracker = $e(e));
  }
  function Oi(e) {
    if (!e) return !1;
    var t = e._valueTracker;
    if (!t) return !0;
    var n = t.getValue(), r = "";
    return e && (r = oe(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n ? (t.setValue(e), !0) : !1;
  }
  function Er(e) {
    if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u") return null;
    try {
      return e.activeElement || e.body;
    } catch {
      return e.body;
    }
  }
  function Ol(e, t) {
    var n = t.checked;
    return C({}, t, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: n ?? e._wrapperState.initialChecked });
  }
  function ji(e, t) {
    var n = t.defaultValue == null ? "" : t.defaultValue, r = t.checked != null ? t.checked : t.defaultChecked;
    n = Z(t.value != null ? t.value : n), e._wrapperState = { initialChecked: r, initialValue: n, controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null };
  }
  function Mi(e, t) {
    t = t.checked, t != null && Je(e, "checked", t, !1);
  }
  function jl(e, t) {
    Mi(e, t);
    var n = Z(t.value), r = t.type;
    if (n != null) r === "number" ? (n === 0 && e.value === "" || e.value != n) && (e.value = "" + n) : e.value !== "" + n && (e.value = "" + n);
    else if (r === "submit" || r === "reset") {
      e.removeAttribute("value");
      return;
    }
    t.hasOwnProperty("value") ? Ml(e, t.type, n) : t.hasOwnProperty("defaultValue") && Ml(e, t.type, Z(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
  }
  function Di(e, t, n) {
    if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
      var r = t.type;
      if (!(r !== "submit" && r !== "reset" || t.value !== void 0 && t.value !== null)) return;
      t = "" + e._wrapperState.initialValue, n || t === e.value || (e.value = t), e.defaultValue = t;
    }
    n = e.name, n !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, n !== "" && (e.name = n);
  }
  function Ml(e, t, n) {
    (t !== "number" || Er(e.ownerDocument) !== e) && (n == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
  }
  var jn = Array.isArray;
  function un(e, t, n, r) {
    if (e = e.options, t) {
      t = {};
      for (var l = 0; l < n.length; l++) t["$" + n[l]] = !0;
      for (n = 0; n < e.length; n++) l = t.hasOwnProperty("$" + e[n].value), e[n].selected !== l && (e[n].selected = l), l && r && (e[n].defaultSelected = !0);
    } else {
      for (n = "" + Z(n), t = null, l = 0; l < e.length; l++) {
        if (e[l].value === n) {
          e[l].selected = !0, r && (e[l].defaultSelected = !0);
          return;
        }
        t !== null || e[l].disabled || (t = e[l]);
      }
      t !== null && (t.selected = !0);
    }
  }
  function Dl(e, t) {
    if (t.dangerouslySetInnerHTML != null) throw Error(v(91));
    return C({}, t, { value: void 0, defaultValue: void 0, children: "" + e._wrapperState.initialValue });
  }
  function Ai(e, t) {
    var n = t.value;
    if (n == null) {
      if (n = t.children, t = t.defaultValue, n != null) {
        if (t != null) throw Error(v(92));
        if (jn(n)) {
          if (1 < n.length) throw Error(v(93));
          n = n[0];
        }
        t = n;
      }
      t == null && (t = ""), n = t;
    }
    e._wrapperState = { initialValue: Z(n) };
  }
  function Fi(e, t) {
    var n = Z(t.value), r = Z(t.defaultValue);
    n != null && (n = "" + n, n !== e.value && (e.value = n), t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)), r != null && (e.defaultValue = "" + r);
  }
  function Ui(e) {
    var t = e.textContent;
    t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
  }
  function $i(e) {
    switch (e) {
      case "svg":
        return "http://www.w3.org/2000/svg";
      case "math":
        return "http://www.w3.org/1998/Math/MathML";
      default:
        return "http://www.w3.org/1999/xhtml";
    }
  }
  function Al(e, t) {
    return e == null || e === "http://www.w3.org/1999/xhtml" ? $i(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
  }
  var xr, Vi = (function(e) {
    return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, n, r, l) {
      MSApp.execUnsafeLocalFunction(function() {
        return e(t, n, r, l);
      });
    } : e;
  })(function(e, t) {
    if (e.namespaceURI !== "http://www.w3.org/2000/svg" || "innerHTML" in e) e.innerHTML = t;
    else {
      for (xr = xr || document.createElement("div"), xr.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>", t = xr.firstChild; e.firstChild; ) e.removeChild(e.firstChild);
      for (; t.firstChild; ) e.appendChild(t.firstChild);
    }
  });
  function Mn(e, t) {
    if (t) {
      var n = e.firstChild;
      if (n && n === e.lastChild && n.nodeType === 3) {
        n.nodeValue = t;
        return;
      }
    }
    e.textContent = t;
  }
  var Dn = {
    animationIterationCount: !0,
    aspectRatio: !0,
    borderImageOutset: !0,
    borderImageSlice: !0,
    borderImageWidth: !0,
    boxFlex: !0,
    boxFlexGroup: !0,
    boxOrdinalGroup: !0,
    columnCount: !0,
    columns: !0,
    flex: !0,
    flexGrow: !0,
    flexPositive: !0,
    flexShrink: !0,
    flexNegative: !0,
    flexOrder: !0,
    gridArea: !0,
    gridRow: !0,
    gridRowEnd: !0,
    gridRowSpan: !0,
    gridRowStart: !0,
    gridColumn: !0,
    gridColumnEnd: !0,
    gridColumnSpan: !0,
    gridColumnStart: !0,
    fontWeight: !0,
    lineClamp: !0,
    lineHeight: !0,
    opacity: !0,
    order: !0,
    orphans: !0,
    tabSize: !0,
    widows: !0,
    zIndex: !0,
    zoom: !0,
    fillOpacity: !0,
    floodOpacity: !0,
    stopOpacity: !0,
    strokeDasharray: !0,
    strokeDashoffset: !0,
    strokeMiterlimit: !0,
    strokeOpacity: !0,
    strokeWidth: !0
  }, Ka = ["Webkit", "ms", "Moz", "O"];
  Object.keys(Dn).forEach(function(e) {
    Ka.forEach(function(t) {
      t = t + e.charAt(0).toUpperCase() + e.substring(1), Dn[t] = Dn[e];
    });
  });
  function Hi(e, t, n) {
    return t == null || typeof t == "boolean" || t === "" ? "" : n || typeof t != "number" || t === 0 || Dn.hasOwnProperty(e) && Dn[e] ? ("" + t).trim() : t + "px";
  }
  function Bi(e, t) {
    e = e.style;
    for (var n in t) if (t.hasOwnProperty(n)) {
      var r = n.indexOf("--") === 0, l = Hi(n, t[n], r);
      n === "float" && (n = "cssFloat"), r ? e.setProperty(n, l) : e[n] = l;
    }
  }
  var Wa = C({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
  function Fl(e, t) {
    if (t) {
      if (Wa[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(v(137, e));
      if (t.dangerouslySetInnerHTML != null) {
        if (t.children != null) throw Error(v(60));
        if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML)) throw Error(v(61));
      }
      if (t.style != null && typeof t.style != "object") throw Error(v(62));
    }
  }
  function Ul(e, t) {
    if (e.indexOf("-") === -1) return typeof t.is == "string";
    switch (e) {
      case "annotation-xml":
      case "color-profile":
      case "font-face":
      case "font-face-src":
      case "font-face-uri":
      case "font-face-format":
      case "font-face-name":
      case "missing-glyph":
        return !1;
      default:
        return !0;
    }
  }
  var $l = null;
  function Vl(e) {
    return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
  }
  var Hl = null, sn = null, an = null;
  function Ki(e) {
    if (e = lr(e)) {
      if (typeof Hl != "function") throw Error(v(280));
      var t = e.stateNode;
      t && (t = Qr(t), Hl(e.stateNode, e.type, t));
    }
  }
  function Wi(e) {
    sn ? an ? an.push(e) : an = [e] : sn = e;
  }
  function Qi() {
    if (sn) {
      var e = sn, t = an;
      if (an = sn = null, Ki(e), t) for (e = 0; e < t.length; e++) Ki(t[e]);
    }
  }
  function Gi(e, t) {
    return e(t);
  }
  function Yi() {
  }
  var Bl = !1;
  function Xi(e, t, n) {
    if (Bl) return e(t, n);
    Bl = !0;
    try {
      return Gi(e, t, n);
    } finally {
      Bl = !1, (sn !== null || an !== null) && (Yi(), Qi());
    }
  }
  function An(e, t) {
    var n = e.stateNode;
    if (n === null) return null;
    var r = Qr(n);
    if (r === null) return null;
    n = r[t];
    e: switch (t) {
      case "onClick":
      case "onClickCapture":
      case "onDoubleClick":
      case "onDoubleClickCapture":
      case "onMouseDown":
      case "onMouseDownCapture":
      case "onMouseMove":
      case "onMouseMoveCapture":
      case "onMouseUp":
      case "onMouseUpCapture":
      case "onMouseEnter":
        (r = !r.disabled) || (e = e.type, r = !(e === "button" || e === "input" || e === "select" || e === "textarea")), e = !r;
        break e;
      default:
        e = !1;
    }
    if (e) return null;
    if (n && typeof n != "function") throw Error(v(231, t, typeof n));
    return n;
  }
  var Kl = !1;
  if (b) try {
    var Fn = {};
    Object.defineProperty(Fn, "passive", { get: function() {
      Kl = !0;
    } }), window.addEventListener("test", Fn, Fn), window.removeEventListener("test", Fn, Fn);
  } catch {
    Kl = !1;
  }
  function Qa(e, t, n, r, l, o, i, u, s) {
    var m = Array.prototype.slice.call(arguments, 3);
    try {
      t.apply(n, m);
    } catch (g) {
      this.onError(g);
    }
  }
  var Un = !1, _r = null, Cr = !1, Wl = null, Ga = { onError: function(e) {
    Un = !0, _r = e;
  } };
  function Ya(e, t, n, r, l, o, i, u, s) {
    Un = !1, _r = null, Qa.apply(Ga, arguments);
  }
  function Xa(e, t, n, r, l, o, i, u, s) {
    if (Ya.apply(this, arguments), Un) {
      if (Un) {
        var m = _r;
        Un = !1, _r = null;
      } else throw Error(v(198));
      Cr || (Cr = !0, Wl = m);
    }
  }
  function Gt(e) {
    var t = e, n = e;
    if (e.alternate) for (; t.return; ) t = t.return;
    else {
      e = t;
      do
        t = e, (t.flags & 4098) !== 0 && (n = t.return), e = t.return;
      while (e);
    }
    return t.tag === 3 ? n : null;
  }
  function Zi(e) {
    if (e.tag === 13) {
      var t = e.memoizedState;
      if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
    }
    return null;
  }
  function qi(e) {
    if (Gt(e) !== e) throw Error(v(188));
  }
  function Za(e) {
    var t = e.alternate;
    if (!t) {
      if (t = Gt(e), t === null) throw Error(v(188));
      return t !== e ? null : e;
    }
    for (var n = e, r = t; ; ) {
      var l = n.return;
      if (l === null) break;
      var o = l.alternate;
      if (o === null) {
        if (r = l.return, r !== null) {
          n = r;
          continue;
        }
        break;
      }
      if (l.child === o.child) {
        for (o = l.child; o; ) {
          if (o === n) return qi(l), e;
          if (o === r) return qi(l), t;
          o = o.sibling;
        }
        throw Error(v(188));
      }
      if (n.return !== r.return) n = l, r = o;
      else {
        for (var i = !1, u = l.child; u; ) {
          if (u === n) {
            i = !0, n = l, r = o;
            break;
          }
          if (u === r) {
            i = !0, r = l, n = o;
            break;
          }
          u = u.sibling;
        }
        if (!i) {
          for (u = o.child; u; ) {
            if (u === n) {
              i = !0, n = o, r = l;
              break;
            }
            if (u === r) {
              i = !0, r = o, n = l;
              break;
            }
            u = u.sibling;
          }
          if (!i) throw Error(v(189));
        }
      }
      if (n.alternate !== r) throw Error(v(190));
    }
    if (n.tag !== 3) throw Error(v(188));
    return n.stateNode.current === n ? e : t;
  }
  function Ji(e) {
    return e = Za(e), e !== null ? bi(e) : null;
  }
  function bi(e) {
    if (e.tag === 5 || e.tag === 6) return e;
    for (e = e.child; e !== null; ) {
      var t = bi(e);
      if (t !== null) return t;
      e = e.sibling;
    }
    return null;
  }
  var eu = x.unstable_scheduleCallback, tu = x.unstable_cancelCallback, qa = x.unstable_shouldYield, Ja = x.unstable_requestPaint, pe = x.unstable_now, ba = x.unstable_getCurrentPriorityLevel, Ql = x.unstable_ImmediatePriority, nu = x.unstable_UserBlockingPriority, Pr = x.unstable_NormalPriority, ec = x.unstable_LowPriority, ru = x.unstable_IdlePriority, Nr = null, ft = null;
  function tc(e) {
    if (ft && typeof ft.onCommitFiberRoot == "function") try {
      ft.onCommitFiberRoot(Nr, e, void 0, (e.current.flags & 128) === 128);
    } catch {
    }
  }
  var tt = Math.clz32 ? Math.clz32 : lc, nc = Math.log, rc = Math.LN2;
  function lc(e) {
    return e >>>= 0, e === 0 ? 32 : 31 - (nc(e) / rc | 0) | 0;
  }
  var Lr = 64, zr = 4194304;
  function $n(e) {
    switch (e & -e) {
      case 1:
        return 1;
      case 2:
        return 2;
      case 4:
        return 4;
      case 8:
        return 8;
      case 16:
        return 16;
      case 32:
        return 32;
      case 64:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return e & 4194240;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
      case 67108864:
        return e & 130023424;
      case 134217728:
        return 134217728;
      case 268435456:
        return 268435456;
      case 536870912:
        return 536870912;
      case 1073741824:
        return 1073741824;
      default:
        return e;
    }
  }
  function Tr(e, t) {
    var n = e.pendingLanes;
    if (n === 0) return 0;
    var r = 0, l = e.suspendedLanes, o = e.pingedLanes, i = n & 268435455;
    if (i !== 0) {
      var u = i & ~l;
      u !== 0 ? r = $n(u) : (o &= i, o !== 0 && (r = $n(o)));
    } else i = n & ~l, i !== 0 ? r = $n(i) : o !== 0 && (r = $n(o));
    if (r === 0) return 0;
    if (t !== 0 && t !== r && (t & l) === 0 && (l = r & -r, o = t & -t, l >= o || l === 16 && (o & 4194240) !== 0)) return t;
    if ((r & 4) !== 0 && (r |= n & 16), t = e.entangledLanes, t !== 0) for (e = e.entanglements, t &= r; 0 < t; ) n = 31 - tt(t), l = 1 << n, r |= e[n], t &= ~l;
    return r;
  }
  function oc(e, t) {
    switch (e) {
      case 1:
      case 2:
      case 4:
        return t + 250;
      case 8:
      case 16:
      case 32:
      case 64:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return t + 5e3;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
      case 67108864:
        return -1;
      case 134217728:
      case 268435456:
      case 536870912:
      case 1073741824:
        return -1;
      default:
        return -1;
    }
  }
  function ic(e, t) {
    for (var n = e.suspendedLanes, r = e.pingedLanes, l = e.expirationTimes, o = e.pendingLanes; 0 < o; ) {
      var i = 31 - tt(o), u = 1 << i, s = l[i];
      s === -1 ? ((u & n) === 0 || (u & r) !== 0) && (l[i] = oc(u, t)) : s <= t && (e.expiredLanes |= u), o &= ~u;
    }
  }
  function Gl(e) {
    return e = e.pendingLanes & -1073741825, e !== 0 ? e : e & 1073741824 ? 1073741824 : 0;
  }
  function lu() {
    var e = Lr;
    return Lr <<= 1, (Lr & 4194240) === 0 && (Lr = 64), e;
  }
  function Yl(e) {
    for (var t = [], n = 0; 31 > n; n++) t.push(e);
    return t;
  }
  function Vn(e, t, n) {
    e.pendingLanes |= t, t !== 536870912 && (e.suspendedLanes = 0, e.pingedLanes = 0), e = e.eventTimes, t = 31 - tt(t), e[t] = n;
  }
  function uc(e, t) {
    var n = e.pendingLanes & ~t;
    e.pendingLanes = t, e.suspendedLanes = 0, e.pingedLanes = 0, e.expiredLanes &= t, e.mutableReadLanes &= t, e.entangledLanes &= t, t = e.entanglements;
    var r = e.eventTimes;
    for (e = e.expirationTimes; 0 < n; ) {
      var l = 31 - tt(n), o = 1 << l;
      t[l] = 0, r[l] = -1, e[l] = -1, n &= ~o;
    }
  }
  function Xl(e, t) {
    var n = e.entangledLanes |= t;
    for (e = e.entanglements; n; ) {
      var r = 31 - tt(n), l = 1 << r;
      l & t | e[r] & t && (e[r] |= t), n &= ~l;
    }
  }
  var q = 0;
  function ou(e) {
    return e &= -e, 1 < e ? 4 < e ? (e & 268435455) !== 0 ? 16 : 536870912 : 4 : 1;
  }
  var iu, Zl, uu, su, au, ql = !1, Rr = [], Nt = null, Lt = null, zt = null, Hn = /* @__PURE__ */ new Map(), Bn = /* @__PURE__ */ new Map(), Tt = [], sc = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
  function cu(e, t) {
    switch (e) {
      case "focusin":
      case "focusout":
        Nt = null;
        break;
      case "dragenter":
      case "dragleave":
        Lt = null;
        break;
      case "mouseover":
      case "mouseout":
        zt = null;
        break;
      case "pointerover":
      case "pointerout":
        Hn.delete(t.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        Bn.delete(t.pointerId);
    }
  }
  function Kn(e, t, n, r, l, o) {
    return e === null || e.nativeEvent !== o ? (e = { blockedOn: t, domEventName: n, eventSystemFlags: r, nativeEvent: o, targetContainers: [l] }, t !== null && (t = lr(t), t !== null && Zl(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, l !== null && t.indexOf(l) === -1 && t.push(l), e);
  }
  function ac(e, t, n, r, l) {
    switch (t) {
      case "focusin":
        return Nt = Kn(Nt, e, t, n, r, l), !0;
      case "dragenter":
        return Lt = Kn(Lt, e, t, n, r, l), !0;
      case "mouseover":
        return zt = Kn(zt, e, t, n, r, l), !0;
      case "pointerover":
        var o = l.pointerId;
        return Hn.set(o, Kn(Hn.get(o) || null, e, t, n, r, l)), !0;
      case "gotpointercapture":
        return o = l.pointerId, Bn.set(o, Kn(Bn.get(o) || null, e, t, n, r, l)), !0;
    }
    return !1;
  }
  function fu(e) {
    var t = Yt(e.target);
    if (t !== null) {
      var n = Gt(t);
      if (n !== null) {
        if (t = n.tag, t === 13) {
          if (t = Zi(n), t !== null) {
            e.blockedOn = t, au(e.priority, function() {
              uu(n);
            });
            return;
          }
        } else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
          e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
          return;
        }
      }
    }
    e.blockedOn = null;
  }
  function Ir(e) {
    if (e.blockedOn !== null) return !1;
    for (var t = e.targetContainers; 0 < t.length; ) {
      var n = bl(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
      if (n === null) {
        n = e.nativeEvent;
        var r = new n.constructor(n.type, n);
        $l = r, n.target.dispatchEvent(r), $l = null;
      } else return t = lr(n), t !== null && Zl(t), e.blockedOn = n, !1;
      t.shift();
    }
    return !0;
  }
  function du(e, t, n) {
    Ir(e) && n.delete(t);
  }
  function cc() {
    ql = !1, Nt !== null && Ir(Nt) && (Nt = null), Lt !== null && Ir(Lt) && (Lt = null), zt !== null && Ir(zt) && (zt = null), Hn.forEach(du), Bn.forEach(du);
  }
  function Wn(e, t) {
    e.blockedOn === t && (e.blockedOn = null, ql || (ql = !0, x.unstable_scheduleCallback(x.unstable_NormalPriority, cc)));
  }
  function Qn(e) {
    function t(l) {
      return Wn(l, e);
    }
    if (0 < Rr.length) {
      Wn(Rr[0], e);
      for (var n = 1; n < Rr.length; n++) {
        var r = Rr[n];
        r.blockedOn === e && (r.blockedOn = null);
      }
    }
    for (Nt !== null && Wn(Nt, e), Lt !== null && Wn(Lt, e), zt !== null && Wn(zt, e), Hn.forEach(t), Bn.forEach(t), n = 0; n < Tt.length; n++) r = Tt[n], r.blockedOn === e && (r.blockedOn = null);
    for (; 0 < Tt.length && (n = Tt[0], n.blockedOn === null); ) fu(n), n.blockedOn === null && Tt.shift();
  }
  var cn = xe.ReactCurrentBatchConfig, Or = !0;
  function fc(e, t, n, r) {
    var l = q, o = cn.transition;
    cn.transition = null;
    try {
      q = 1, Jl(e, t, n, r);
    } finally {
      q = l, cn.transition = o;
    }
  }
  function dc(e, t, n, r) {
    var l = q, o = cn.transition;
    cn.transition = null;
    try {
      q = 4, Jl(e, t, n, r);
    } finally {
      q = l, cn.transition = o;
    }
  }
  function Jl(e, t, n, r) {
    if (Or) {
      var l = bl(e, t, n, r);
      if (l === null) yo(e, t, r, jr, n), cu(e, r);
      else if (ac(l, e, t, n, r)) r.stopPropagation();
      else if (cu(e, r), t & 4 && -1 < sc.indexOf(e)) {
        for (; l !== null; ) {
          var o = lr(l);
          if (o !== null && iu(o), o = bl(e, t, n, r), o === null && yo(e, t, r, jr, n), o === l) break;
          l = o;
        }
        l !== null && r.stopPropagation();
      } else yo(e, t, r, null, n);
    }
  }
  var jr = null;
  function bl(e, t, n, r) {
    if (jr = null, e = Vl(r), e = Yt(e), e !== null) if (t = Gt(e), t === null) e = null;
    else if (n = t.tag, n === 13) {
      if (e = Zi(t), e !== null) return e;
      e = null;
    } else if (n === 3) {
      if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
      e = null;
    } else t !== e && (e = null);
    return jr = e, null;
  }
  function pu(e) {
    switch (e) {
      case "cancel":
      case "click":
      case "close":
      case "contextmenu":
      case "copy":
      case "cut":
      case "auxclick":
      case "dblclick":
      case "dragend":
      case "dragstart":
      case "drop":
      case "focusin":
      case "focusout":
      case "input":
      case "invalid":
      case "keydown":
      case "keypress":
      case "keyup":
      case "mousedown":
      case "mouseup":
      case "paste":
      case "pause":
      case "play":
      case "pointercancel":
      case "pointerdown":
      case "pointerup":
      case "ratechange":
      case "reset":
      case "resize":
      case "seeked":
      case "submit":
      case "touchcancel":
      case "touchend":
      case "touchstart":
      case "volumechange":
      case "change":
      case "selectionchange":
      case "textInput":
      case "compositionstart":
      case "compositionend":
      case "compositionupdate":
      case "beforeblur":
      case "afterblur":
      case "beforeinput":
      case "blur":
      case "fullscreenchange":
      case "focus":
      case "hashchange":
      case "popstate":
      case "select":
      case "selectstart":
        return 1;
      case "drag":
      case "dragenter":
      case "dragexit":
      case "dragleave":
      case "dragover":
      case "mousemove":
      case "mouseout":
      case "mouseover":
      case "pointermove":
      case "pointerout":
      case "pointerover":
      case "scroll":
      case "toggle":
      case "touchmove":
      case "wheel":
      case "mouseenter":
      case "mouseleave":
      case "pointerenter":
      case "pointerleave":
        return 4;
      case "message":
        switch (ba()) {
          case Ql:
            return 1;
          case nu:
            return 4;
          case Pr:
          case ec:
            return 16;
          case ru:
            return 536870912;
          default:
            return 16;
        }
      default:
        return 16;
    }
  }
  var Rt = null, eo = null, Mr = null;
  function mu() {
    if (Mr) return Mr;
    var e, t = eo, n = t.length, r, l = "value" in Rt ? Rt.value : Rt.textContent, o = l.length;
    for (e = 0; e < n && t[e] === l[e]; e++) ;
    var i = n - e;
    for (r = 1; r <= i && t[n - r] === l[o - r]; r++) ;
    return Mr = l.slice(e, 1 < r ? 1 - r : void 0);
  }
  function Dr(e) {
    var t = e.keyCode;
    return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
  }
  function Ar() {
    return !0;
  }
  function vu() {
    return !1;
  }
  function Ve(e) {
    function t(n, r, l, o, i) {
      this._reactName = n, this._targetInst = l, this.type = r, this.nativeEvent = o, this.target = i, this.currentTarget = null;
      for (var u in e) e.hasOwnProperty(u) && (n = e[u], this[u] = n ? n(o) : o[u]);
      return this.isDefaultPrevented = (o.defaultPrevented != null ? o.defaultPrevented : o.returnValue === !1) ? Ar : vu, this.isPropagationStopped = vu, this;
    }
    return C(t.prototype, { preventDefault: function() {
      this.defaultPrevented = !0;
      var n = this.nativeEvent;
      n && (n.preventDefault ? n.preventDefault() : typeof n.returnValue != "unknown" && (n.returnValue = !1), this.isDefaultPrevented = Ar);
    }, stopPropagation: function() {
      var n = this.nativeEvent;
      n && (n.stopPropagation ? n.stopPropagation() : typeof n.cancelBubble != "unknown" && (n.cancelBubble = !0), this.isPropagationStopped = Ar);
    }, persist: function() {
    }, isPersistent: Ar }), t;
  }
  var fn = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(e) {
    return e.timeStamp || Date.now();
  }, defaultPrevented: 0, isTrusted: 0 }, to = Ve(fn), Gn = C({}, fn, { view: 0, detail: 0 }), pc = Ve(Gn), no, ro, Yn, Fr = C({}, Gn, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: oo, button: 0, buttons: 0, relatedTarget: function(e) {
    return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
  }, movementX: function(e) {
    return "movementX" in e ? e.movementX : (e !== Yn && (Yn && e.type === "mousemove" ? (no = e.screenX - Yn.screenX, ro = e.screenY - Yn.screenY) : ro = no = 0, Yn = e), no);
  }, movementY: function(e) {
    return "movementY" in e ? e.movementY : ro;
  } }), hu = Ve(Fr), mc = C({}, Fr, { dataTransfer: 0 }), vc = Ve(mc), hc = C({}, Gn, { relatedTarget: 0 }), lo = Ve(hc), yc = C({}, fn, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), gc = Ve(yc), wc = C({}, fn, { clipboardData: function(e) {
    return "clipboardData" in e ? e.clipboardData : window.clipboardData;
  } }), kc = Ve(wc), Sc = C({}, fn, { data: 0 }), yu = Ve(Sc), Ec = {
    Esc: "Escape",
    Spacebar: " ",
    Left: "ArrowLeft",
    Up: "ArrowUp",
    Right: "ArrowRight",
    Down: "ArrowDown",
    Del: "Delete",
    Win: "OS",
    Menu: "ContextMenu",
    Apps: "ContextMenu",
    Scroll: "ScrollLock",
    MozPrintableKey: "Unidentified"
  }, xc = {
    8: "Backspace",
    9: "Tab",
    12: "Clear",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    19: "Pause",
    20: "CapsLock",
    27: "Escape",
    32: " ",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    45: "Insert",
    46: "Delete",
    112: "F1",
    113: "F2",
    114: "F3",
    115: "F4",
    116: "F5",
    117: "F6",
    118: "F7",
    119: "F8",
    120: "F9",
    121: "F10",
    122: "F11",
    123: "F12",
    144: "NumLock",
    145: "ScrollLock",
    224: "Meta"
  }, _c = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
  function Cc(e) {
    var t = this.nativeEvent;
    return t.getModifierState ? t.getModifierState(e) : (e = _c[e]) ? !!t[e] : !1;
  }
  function oo() {
    return Cc;
  }
  var Pc = C({}, Gn, { key: function(e) {
    if (e.key) {
      var t = Ec[e.key] || e.key;
      if (t !== "Unidentified") return t;
    }
    return e.type === "keypress" ? (e = Dr(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? xc[e.keyCode] || "Unidentified" : "";
  }, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: oo, charCode: function(e) {
    return e.type === "keypress" ? Dr(e) : 0;
  }, keyCode: function(e) {
    return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
  }, which: function(e) {
    return e.type === "keypress" ? Dr(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
  } }), Nc = Ve(Pc), Lc = C({}, Fr, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), gu = Ve(Lc), zc = C({}, Gn, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: oo }), Tc = Ve(zc), Rc = C({}, fn, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), Ic = Ve(Rc), Oc = C({}, Fr, {
    deltaX: function(e) {
      return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
    },
    deltaY: function(e) {
      return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
    },
    deltaZ: 0,
    deltaMode: 0
  }), jc = Ve(Oc), Mc = [9, 13, 27, 32], io = b && "CompositionEvent" in window, Xn = null;
  b && "documentMode" in document && (Xn = document.documentMode);
  var Dc = b && "TextEvent" in window && !Xn, wu = b && (!io || Xn && 8 < Xn && 11 >= Xn), ku = " ", Su = !1;
  function Eu(e, t) {
    switch (e) {
      case "keyup":
        return Mc.indexOf(t.keyCode) !== -1;
      case "keydown":
        return t.keyCode !== 229;
      case "keypress":
      case "mousedown":
      case "focusout":
        return !0;
      default:
        return !1;
    }
  }
  function xu(e) {
    return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
  }
  var dn = !1;
  function Ac(e, t) {
    switch (e) {
      case "compositionend":
        return xu(t);
      case "keypress":
        return t.which !== 32 ? null : (Su = !0, ku);
      case "textInput":
        return e = t.data, e === ku && Su ? null : e;
      default:
        return null;
    }
  }
  function Fc(e, t) {
    if (dn) return e === "compositionend" || !io && Eu(e, t) ? (e = mu(), Mr = eo = Rt = null, dn = !1, e) : null;
    switch (e) {
      case "paste":
        return null;
      case "keypress":
        if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
          if (t.char && 1 < t.char.length) return t.char;
          if (t.which) return String.fromCharCode(t.which);
        }
        return null;
      case "compositionend":
        return wu && t.locale !== "ko" ? null : t.data;
      default:
        return null;
    }
  }
  var Uc = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
  function _u(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t === "input" ? !!Uc[e.type] : t === "textarea";
  }
  function Cu(e, t, n, r) {
    Wi(r), t = Br(t, "onChange"), 0 < t.length && (n = new to("onChange", "change", null, n, r), e.push({ event: n, listeners: t }));
  }
  var Zn = null, qn = null;
  function $c(e) {
    Bu(e, 0);
  }
  function Ur(e) {
    var t = yn(e);
    if (Oi(t)) return e;
  }
  function Vc(e, t) {
    if (e === "change") return t;
  }
  var Pu = !1;
  if (b) {
    var uo;
    if (b) {
      var so = "oninput" in document;
      if (!so) {
        var Nu = document.createElement("div");
        Nu.setAttribute("oninput", "return;"), so = typeof Nu.oninput == "function";
      }
      uo = so;
    } else uo = !1;
    Pu = uo && (!document.documentMode || 9 < document.documentMode);
  }
  function Lu() {
    Zn && (Zn.detachEvent("onpropertychange", zu), qn = Zn = null);
  }
  function zu(e) {
    if (e.propertyName === "value" && Ur(qn)) {
      var t = [];
      Cu(t, qn, e, Vl(e)), Xi($c, t);
    }
  }
  function Hc(e, t, n) {
    e === "focusin" ? (Lu(), Zn = t, qn = n, Zn.attachEvent("onpropertychange", zu)) : e === "focusout" && Lu();
  }
  function Bc(e) {
    if (e === "selectionchange" || e === "keyup" || e === "keydown") return Ur(qn);
  }
  function Kc(e, t) {
    if (e === "click") return Ur(t);
  }
  function Wc(e, t) {
    if (e === "input" || e === "change") return Ur(t);
  }
  function Qc(e, t) {
    return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
  }
  var nt = typeof Object.is == "function" ? Object.is : Qc;
  function Jn(e, t) {
    if (nt(e, t)) return !0;
    if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
    var n = Object.keys(e), r = Object.keys(t);
    if (n.length !== r.length) return !1;
    for (r = 0; r < n.length; r++) {
      var l = n[r];
      if (!D.call(t, l) || !nt(e[l], t[l])) return !1;
    }
    return !0;
  }
  function Tu(e) {
    for (; e && e.firstChild; ) e = e.firstChild;
    return e;
  }
  function Ru(e, t) {
    var n = Tu(e);
    e = 0;
    for (var r; n; ) {
      if (n.nodeType === 3) {
        if (r = e + n.textContent.length, e <= t && r >= t) return { node: n, offset: t - e };
        e = r;
      }
      e: {
        for (; n; ) {
          if (n.nextSibling) {
            n = n.nextSibling;
            break e;
          }
          n = n.parentNode;
        }
        n = void 0;
      }
      n = Tu(n);
    }
  }
  function Iu(e, t) {
    return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Iu(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
  }
  function Ou() {
    for (var e = window, t = Er(); t instanceof e.HTMLIFrameElement; ) {
      try {
        var n = typeof t.contentWindow.location.href == "string";
      } catch {
        n = !1;
      }
      if (n) e = t.contentWindow;
      else break;
      t = Er(e.document);
    }
    return t;
  }
  function ao(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
  }
  function Gc(e) {
    var t = Ou(), n = e.focusedElem, r = e.selectionRange;
    if (t !== n && n && n.ownerDocument && Iu(n.ownerDocument.documentElement, n)) {
      if (r !== null && ao(n)) {
        if (t = r.start, e = r.end, e === void 0 && (e = t), "selectionStart" in n) n.selectionStart = t, n.selectionEnd = Math.min(e, n.value.length);
        else if (e = (t = n.ownerDocument || document) && t.defaultView || window, e.getSelection) {
          e = e.getSelection();
          var l = n.textContent.length, o = Math.min(r.start, l);
          r = r.end === void 0 ? o : Math.min(r.end, l), !e.extend && o > r && (l = r, r = o, o = l), l = Ru(n, o);
          var i = Ru(
            n,
            r
          );
          l && i && (e.rangeCount !== 1 || e.anchorNode !== l.node || e.anchorOffset !== l.offset || e.focusNode !== i.node || e.focusOffset !== i.offset) && (t = t.createRange(), t.setStart(l.node, l.offset), e.removeAllRanges(), o > r ? (e.addRange(t), e.extend(i.node, i.offset)) : (t.setEnd(i.node, i.offset), e.addRange(t)));
        }
      }
      for (t = [], e = n; e = e.parentNode; ) e.nodeType === 1 && t.push({ element: e, left: e.scrollLeft, top: e.scrollTop });
      for (typeof n.focus == "function" && n.focus(), n = 0; n < t.length; n++) e = t[n], e.element.scrollLeft = e.left, e.element.scrollTop = e.top;
    }
  }
  var Yc = b && "documentMode" in document && 11 >= document.documentMode, pn = null, co = null, bn = null, fo = !1;
  function ju(e, t, n) {
    var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
    fo || pn == null || pn !== Er(r) || (r = pn, "selectionStart" in r && ao(r) ? r = { start: r.selectionStart, end: r.selectionEnd } : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = { anchorNode: r.anchorNode, anchorOffset: r.anchorOffset, focusNode: r.focusNode, focusOffset: r.focusOffset }), bn && Jn(bn, r) || (bn = r, r = Br(co, "onSelect"), 0 < r.length && (t = new to("onSelect", "select", null, t, n), e.push({ event: t, listeners: r }), t.target = pn)));
  }
  function $r(e, t) {
    var n = {};
    return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
  }
  var mn = { animationend: $r("Animation", "AnimationEnd"), animationiteration: $r("Animation", "AnimationIteration"), animationstart: $r("Animation", "AnimationStart"), transitionend: $r("Transition", "TransitionEnd") }, po = {}, Mu = {};
  b && (Mu = document.createElement("div").style, "AnimationEvent" in window || (delete mn.animationend.animation, delete mn.animationiteration.animation, delete mn.animationstart.animation), "TransitionEvent" in window || delete mn.transitionend.transition);
  function Vr(e) {
    if (po[e]) return po[e];
    if (!mn[e]) return e;
    var t = mn[e], n;
    for (n in t) if (t.hasOwnProperty(n) && n in Mu) return po[e] = t[n];
    return e;
  }
  var Du = Vr("animationend"), Au = Vr("animationiteration"), Fu = Vr("animationstart"), Uu = Vr("transitionend"), $u = /* @__PURE__ */ new Map(), Vu = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
  function It(e, t) {
    $u.set(e, t), Y(t, [e]);
  }
  for (var mo = 0; mo < Vu.length; mo++) {
    var vo = Vu[mo], Xc = vo.toLowerCase(), Zc = vo[0].toUpperCase() + vo.slice(1);
    It(Xc, "on" + Zc);
  }
  It(Du, "onAnimationEnd"), It(Au, "onAnimationIteration"), It(Fu, "onAnimationStart"), It("dblclick", "onDoubleClick"), It("focusin", "onFocus"), It("focusout", "onBlur"), It(Uu, "onTransitionEnd"), F("onMouseEnter", ["mouseout", "mouseover"]), F("onMouseLeave", ["mouseout", "mouseover"]), F("onPointerEnter", ["pointerout", "pointerover"]), F("onPointerLeave", ["pointerout", "pointerover"]), Y("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), Y("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), Y("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]), Y("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), Y("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), Y("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
  var er = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), qc = new Set("cancel close invalid load scroll toggle".split(" ").concat(er));
  function Hu(e, t, n) {
    var r = e.type || "unknown-event";
    e.currentTarget = n, Xa(r, t, void 0, e), e.currentTarget = null;
  }
  function Bu(e, t) {
    t = (t & 4) !== 0;
    for (var n = 0; n < e.length; n++) {
      var r = e[n], l = r.event;
      r = r.listeners;
      e: {
        var o = void 0;
        if (t) for (var i = r.length - 1; 0 <= i; i--) {
          var u = r[i], s = u.instance, m = u.currentTarget;
          if (u = u.listener, s !== o && l.isPropagationStopped()) break e;
          Hu(l, u, m), o = s;
        }
        else for (i = 0; i < r.length; i++) {
          if (u = r[i], s = u.instance, m = u.currentTarget, u = u.listener, s !== o && l.isPropagationStopped()) break e;
          Hu(l, u, m), o = s;
        }
      }
    }
    if (Cr) throw e = Wl, Cr = !1, Wl = null, e;
  }
  function re(e, t) {
    var n = t[xo];
    n === void 0 && (n = t[xo] = /* @__PURE__ */ new Set());
    var r = e + "__bubble";
    n.has(r) || (Ku(t, e, 2, !1), n.add(r));
  }
  function ho(e, t, n) {
    var r = 0;
    t && (r |= 4), Ku(n, e, r, t);
  }
  var Hr = "_reactListening" + Math.random().toString(36).slice(2);
  function tr(e) {
    if (!e[Hr]) {
      e[Hr] = !0, j.forEach(function(n) {
        n !== "selectionchange" && (qc.has(n) || ho(n, !1, e), ho(n, !0, e));
      });
      var t = e.nodeType === 9 ? e : e.ownerDocument;
      t === null || t[Hr] || (t[Hr] = !0, ho("selectionchange", !1, t));
    }
  }
  function Ku(e, t, n, r) {
    switch (pu(t)) {
      case 1:
        var l = fc;
        break;
      case 4:
        l = dc;
        break;
      default:
        l = Jl;
    }
    n = l.bind(null, t, n, e), l = void 0, !Kl || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (l = !0), r ? l !== void 0 ? e.addEventListener(t, n, { capture: !0, passive: l }) : e.addEventListener(t, n, !0) : l !== void 0 ? e.addEventListener(t, n, { passive: l }) : e.addEventListener(t, n, !1);
  }
  function yo(e, t, n, r, l) {
    var o = r;
    if ((t & 1) === 0 && (t & 2) === 0 && r !== null) e: for (; ; ) {
      if (r === null) return;
      var i = r.tag;
      if (i === 3 || i === 4) {
        var u = r.stateNode.containerInfo;
        if (u === l || u.nodeType === 8 && u.parentNode === l) break;
        if (i === 4) for (i = r.return; i !== null; ) {
          var s = i.tag;
          if ((s === 3 || s === 4) && (s = i.stateNode.containerInfo, s === l || s.nodeType === 8 && s.parentNode === l)) return;
          i = i.return;
        }
        for (; u !== null; ) {
          if (i = Yt(u), i === null) return;
          if (s = i.tag, s === 5 || s === 6) {
            r = o = i;
            continue e;
          }
          u = u.parentNode;
        }
      }
      r = r.return;
    }
    Xi(function() {
      var m = o, g = Vl(n), w = [];
      e: {
        var h = $u.get(e);
        if (h !== void 0) {
          var E = to, P = e;
          switch (e) {
            case "keypress":
              if (Dr(n) === 0) break e;
            case "keydown":
            case "keyup":
              E = Nc;
              break;
            case "focusin":
              P = "focus", E = lo;
              break;
            case "focusout":
              P = "blur", E = lo;
              break;
            case "beforeblur":
            case "afterblur":
              E = lo;
              break;
            case "click":
              if (n.button === 2) break e;
            case "auxclick":
            case "dblclick":
            case "mousedown":
            case "mousemove":
            case "mouseup":
            case "mouseout":
            case "mouseover":
            case "contextmenu":
              E = hu;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              E = vc;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              E = Tc;
              break;
            case Du:
            case Au:
            case Fu:
              E = gc;
              break;
            case Uu:
              E = Ic;
              break;
            case "scroll":
              E = pc;
              break;
            case "wheel":
              E = jc;
              break;
            case "copy":
            case "cut":
            case "paste":
              E = kc;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              E = gu;
          }
          var N = (t & 4) !== 0, me = !N && e === "scroll", f = N ? h !== null ? h + "Capture" : null : h;
          N = [];
          for (var a = m, d; a !== null; ) {
            d = a;
            var k = d.stateNode;
            if (d.tag === 5 && k !== null && (d = k, f !== null && (k = An(a, f), k != null && N.push(nr(a, k, d)))), me) break;
            a = a.return;
          }
          0 < N.length && (h = new E(h, P, null, n, g), w.push({ event: h, listeners: N }));
        }
      }
      if ((t & 7) === 0) {
        e: {
          if (h = e === "mouseover" || e === "pointerover", E = e === "mouseout" || e === "pointerout", h && n !== $l && (P = n.relatedTarget || n.fromElement) && (Yt(P) || P[gt])) break e;
          if ((E || h) && (h = g.window === g ? g : (h = g.ownerDocument) ? h.defaultView || h.parentWindow : window, E ? (P = n.relatedTarget || n.toElement, E = m, P = P ? Yt(P) : null, P !== null && (me = Gt(P), P !== me || P.tag !== 5 && P.tag !== 6) && (P = null)) : (E = null, P = m), E !== P)) {
            if (N = hu, k = "onMouseLeave", f = "onMouseEnter", a = "mouse", (e === "pointerout" || e === "pointerover") && (N = gu, k = "onPointerLeave", f = "onPointerEnter", a = "pointer"), me = E == null ? h : yn(E), d = P == null ? h : yn(P), h = new N(k, a + "leave", E, n, g), h.target = me, h.relatedTarget = d, k = null, Yt(g) === m && (N = new N(f, a + "enter", P, n, g), N.target = d, N.relatedTarget = me, k = N), me = k, E && P) t: {
              for (N = E, f = P, a = 0, d = N; d; d = vn(d)) a++;
              for (d = 0, k = f; k; k = vn(k)) d++;
              for (; 0 < a - d; ) N = vn(N), a--;
              for (; 0 < d - a; ) f = vn(f), d--;
              for (; a--; ) {
                if (N === f || f !== null && N === f.alternate) break t;
                N = vn(N), f = vn(f);
              }
              N = null;
            }
            else N = null;
            E !== null && Wu(w, h, E, N, !1), P !== null && me !== null && Wu(w, me, P, N, !0);
          }
        }
        e: {
          if (h = m ? yn(m) : window, E = h.nodeName && h.nodeName.toLowerCase(), E === "select" || E === "input" && h.type === "file") var L = Vc;
          else if (_u(h)) if (Pu) L = Wc;
          else {
            L = Bc;
            var z = Hc;
          }
          else (E = h.nodeName) && E.toLowerCase() === "input" && (h.type === "checkbox" || h.type === "radio") && (L = Kc);
          if (L && (L = L(e, m))) {
            Cu(w, L, n, g);
            break e;
          }
          z && z(e, h, m), e === "focusout" && (z = h._wrapperState) && z.controlled && h.type === "number" && Ml(h, "number", h.value);
        }
        switch (z = m ? yn(m) : window, e) {
          case "focusin":
            (_u(z) || z.contentEditable === "true") && (pn = z, co = m, bn = null);
            break;
          case "focusout":
            bn = co = pn = null;
            break;
          case "mousedown":
            fo = !0;
            break;
          case "contextmenu":
          case "mouseup":
          case "dragend":
            fo = !1, ju(w, n, g);
            break;
          case "selectionchange":
            if (Yc) break;
          case "keydown":
          case "keyup":
            ju(w, n, g);
        }
        var T;
        if (io) e: {
          switch (e) {
            case "compositionstart":
              var O = "onCompositionStart";
              break e;
            case "compositionend":
              O = "onCompositionEnd";
              break e;
            case "compositionupdate":
              O = "onCompositionUpdate";
              break e;
          }
          O = void 0;
        }
        else dn ? Eu(e, n) && (O = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (O = "onCompositionStart");
        O && (wu && n.locale !== "ko" && (dn || O !== "onCompositionStart" ? O === "onCompositionEnd" && dn && (T = mu()) : (Rt = g, eo = "value" in Rt ? Rt.value : Rt.textContent, dn = !0)), z = Br(m, O), 0 < z.length && (O = new yu(O, e, null, n, g), w.push({ event: O, listeners: z }), T ? O.data = T : (T = xu(n), T !== null && (O.data = T)))), (T = Dc ? Ac(e, n) : Fc(e, n)) && (m = Br(m, "onBeforeInput"), 0 < m.length && (g = new yu("onBeforeInput", "beforeinput", null, n, g), w.push({ event: g, listeners: m }), g.data = T));
      }
      Bu(w, t);
    });
  }
  function nr(e, t, n) {
    return { instance: e, listener: t, currentTarget: n };
  }
  function Br(e, t) {
    for (var n = t + "Capture", r = []; e !== null; ) {
      var l = e, o = l.stateNode;
      l.tag === 5 && o !== null && (l = o, o = An(e, n), o != null && r.unshift(nr(e, o, l)), o = An(e, t), o != null && r.push(nr(e, o, l))), e = e.return;
    }
    return r;
  }
  function vn(e) {
    if (e === null) return null;
    do
      e = e.return;
    while (e && e.tag !== 5);
    return e || null;
  }
  function Wu(e, t, n, r, l) {
    for (var o = t._reactName, i = []; n !== null && n !== r; ) {
      var u = n, s = u.alternate, m = u.stateNode;
      if (s !== null && s === r) break;
      u.tag === 5 && m !== null && (u = m, l ? (s = An(n, o), s != null && i.unshift(nr(n, s, u))) : l || (s = An(n, o), s != null && i.push(nr(n, s, u)))), n = n.return;
    }
    i.length !== 0 && e.push({ event: t, listeners: i });
  }
  var Jc = /\r\n?/g, bc = /\u0000|\uFFFD/g;
  function Qu(e) {
    return (typeof e == "string" ? e : "" + e).replace(Jc, `
`).replace(bc, "");
  }
  function Kr(e, t, n) {
    if (t = Qu(t), Qu(e) !== t && n) throw Error(v(425));
  }
  function Wr() {
  }
  var go = null, wo = null;
  function ko(e, t) {
    return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
  }
  var So = typeof setTimeout == "function" ? setTimeout : void 0, ef = typeof clearTimeout == "function" ? clearTimeout : void 0, Gu = typeof Promise == "function" ? Promise : void 0, tf = typeof queueMicrotask == "function" ? queueMicrotask : typeof Gu < "u" ? function(e) {
    return Gu.resolve(null).then(e).catch(nf);
  } : So;
  function nf(e) {
    setTimeout(function() {
      throw e;
    });
  }
  function Eo(e, t) {
    var n = t, r = 0;
    do {
      var l = n.nextSibling;
      if (e.removeChild(n), l && l.nodeType === 8) if (n = l.data, n === "/$") {
        if (r === 0) {
          e.removeChild(l), Qn(t);
          return;
        }
        r--;
      } else n !== "$" && n !== "$?" && n !== "$!" || r++;
      n = l;
    } while (n);
    Qn(t);
  }
  function Ot(e) {
    for (; e != null; e = e.nextSibling) {
      var t = e.nodeType;
      if (t === 1 || t === 3) break;
      if (t === 8) {
        if (t = e.data, t === "$" || t === "$!" || t === "$?") break;
        if (t === "/$") return null;
      }
    }
    return e;
  }
  function Yu(e) {
    e = e.previousSibling;
    for (var t = 0; e; ) {
      if (e.nodeType === 8) {
        var n = e.data;
        if (n === "$" || n === "$!" || n === "$?") {
          if (t === 0) return e;
          t--;
        } else n === "/$" && t++;
      }
      e = e.previousSibling;
    }
    return null;
  }
  var hn = Math.random().toString(36).slice(2), dt = "__reactFiber$" + hn, rr = "__reactProps$" + hn, gt = "__reactContainer$" + hn, xo = "__reactEvents$" + hn, rf = "__reactListeners$" + hn, lf = "__reactHandles$" + hn;
  function Yt(e) {
    var t = e[dt];
    if (t) return t;
    for (var n = e.parentNode; n; ) {
      if (t = n[gt] || n[dt]) {
        if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = Yu(e); e !== null; ) {
          if (n = e[dt]) return n;
          e = Yu(e);
        }
        return t;
      }
      e = n, n = e.parentNode;
    }
    return null;
  }
  function lr(e) {
    return e = e[dt] || e[gt], !e || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
  }
  function yn(e) {
    if (e.tag === 5 || e.tag === 6) return e.stateNode;
    throw Error(v(33));
  }
  function Qr(e) {
    return e[rr] || null;
  }
  var _o = [], gn = -1;
  function jt(e) {
    return { current: e };
  }
  function le(e) {
    0 > gn || (e.current = _o[gn], _o[gn] = null, gn--);
  }
  function te(e, t) {
    gn++, _o[gn] = e.current, e.current = t;
  }
  var Mt = {}, _e = jt(Mt), Oe = jt(!1), Xt = Mt;
  function wn(e, t) {
    var n = e.type.contextTypes;
    if (!n) return Mt;
    var r = e.stateNode;
    if (r && r.__reactInternalMemoizedUnmaskedChildContext === t) return r.__reactInternalMemoizedMaskedChildContext;
    var l = {}, o;
    for (o in n) l[o] = t[o];
    return r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = l), l;
  }
  function je(e) {
    return e = e.childContextTypes, e != null;
  }
  function Gr() {
    le(Oe), le(_e);
  }
  function Xu(e, t, n) {
    if (_e.current !== Mt) throw Error(v(168));
    te(_e, t), te(Oe, n);
  }
  function Zu(e, t, n) {
    var r = e.stateNode;
    if (t = t.childContextTypes, typeof r.getChildContext != "function") return n;
    r = r.getChildContext();
    for (var l in r) if (!(l in t)) throw Error(v(108, ee(e) || "Unknown", l));
    return C({}, n, r);
  }
  function Yr(e) {
    return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || Mt, Xt = _e.current, te(_e, e), te(Oe, Oe.current), !0;
  }
  function qu(e, t, n) {
    var r = e.stateNode;
    if (!r) throw Error(v(169));
    n ? (e = Zu(e, t, Xt), r.__reactInternalMemoizedMergedChildContext = e, le(Oe), le(_e), te(_e, e)) : le(Oe), te(Oe, n);
  }
  var wt = null, Xr = !1, Co = !1;
  function Ju(e) {
    wt === null ? wt = [e] : wt.push(e);
  }
  function of(e) {
    Xr = !0, Ju(e);
  }
  function Dt() {
    if (!Co && wt !== null) {
      Co = !0;
      var e = 0, t = q;
      try {
        var n = wt;
        for (q = 1; e < n.length; e++) {
          var r = n[e];
          do
            r = r(!0);
          while (r !== null);
        }
        wt = null, Xr = !1;
      } catch (l) {
        throw wt !== null && (wt = wt.slice(e + 1)), eu(Ql, Dt), l;
      } finally {
        q = t, Co = !1;
      }
    }
    return null;
  }
  var kn = [], Sn = 0, Zr = null, qr = 0, Qe = [], Ge = 0, Zt = null, kt = 1, St = "";
  function qt(e, t) {
    kn[Sn++] = qr, kn[Sn++] = Zr, Zr = e, qr = t;
  }
  function bu(e, t, n) {
    Qe[Ge++] = kt, Qe[Ge++] = St, Qe[Ge++] = Zt, Zt = e;
    var r = kt;
    e = St;
    var l = 32 - tt(r) - 1;
    r &= ~(1 << l), n += 1;
    var o = 32 - tt(t) + l;
    if (30 < o) {
      var i = l - l % 5;
      o = (r & (1 << i) - 1).toString(32), r >>= i, l -= i, kt = 1 << 32 - tt(t) + l | n << l | r, St = o + e;
    } else kt = 1 << o | n << l | r, St = e;
  }
  function Po(e) {
    e.return !== null && (qt(e, 1), bu(e, 1, 0));
  }
  function No(e) {
    for (; e === Zr; ) Zr = kn[--Sn], kn[Sn] = null, qr = kn[--Sn], kn[Sn] = null;
    for (; e === Zt; ) Zt = Qe[--Ge], Qe[Ge] = null, St = Qe[--Ge], Qe[Ge] = null, kt = Qe[--Ge], Qe[Ge] = null;
  }
  var He = null, Be = null, ie = !1, rt = null;
  function es(e, t) {
    var n = qe(5, null, null, 0);
    n.elementType = "DELETED", n.stateNode = t, n.return = e, t = e.deletions, t === null ? (e.deletions = [n], e.flags |= 16) : t.push(n);
  }
  function ts(e, t) {
    switch (e.tag) {
      case 5:
        var n = e.type;
        return t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t, t !== null ? (e.stateNode = t, He = e, Be = Ot(t.firstChild), !0) : !1;
      case 6:
        return t = e.pendingProps === "" || t.nodeType !== 3 ? null : t, t !== null ? (e.stateNode = t, He = e, Be = null, !0) : !1;
      case 13:
        return t = t.nodeType !== 8 ? null : t, t !== null ? (n = Zt !== null ? { id: kt, overflow: St } : null, e.memoizedState = { dehydrated: t, treeContext: n, retryLane: 1073741824 }, n = qe(18, null, null, 0), n.stateNode = t, n.return = e, e.child = n, He = e, Be = null, !0) : !1;
      default:
        return !1;
    }
  }
  function Lo(e) {
    return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
  }
  function zo(e) {
    if (ie) {
      var t = Be;
      if (t) {
        var n = t;
        if (!ts(e, t)) {
          if (Lo(e)) throw Error(v(418));
          t = Ot(n.nextSibling);
          var r = He;
          t && ts(e, t) ? es(r, n) : (e.flags = e.flags & -4097 | 2, ie = !1, He = e);
        }
      } else {
        if (Lo(e)) throw Error(v(418));
        e.flags = e.flags & -4097 | 2, ie = !1, He = e;
      }
    }
  }
  function ns(e) {
    for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
    He = e;
  }
  function Jr(e) {
    if (e !== He) return !1;
    if (!ie) return ns(e), ie = !0, !1;
    var t;
    if ((t = e.tag !== 3) && !(t = e.tag !== 5) && (t = e.type, t = t !== "head" && t !== "body" && !ko(e.type, e.memoizedProps)), t && (t = Be)) {
      if (Lo(e)) throw rs(), Error(v(418));
      for (; t; ) es(e, t), t = Ot(t.nextSibling);
    }
    if (ns(e), e.tag === 13) {
      if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(v(317));
      e: {
        for (e = e.nextSibling, t = 0; e; ) {
          if (e.nodeType === 8) {
            var n = e.data;
            if (n === "/$") {
              if (t === 0) {
                Be = Ot(e.nextSibling);
                break e;
              }
              t--;
            } else n !== "$" && n !== "$!" && n !== "$?" || t++;
          }
          e = e.nextSibling;
        }
        Be = null;
      }
    } else Be = He ? Ot(e.stateNode.nextSibling) : null;
    return !0;
  }
  function rs() {
    for (var e = Be; e; ) e = Ot(e.nextSibling);
  }
  function En() {
    Be = He = null, ie = !1;
  }
  function To(e) {
    rt === null ? rt = [e] : rt.push(e);
  }
  var uf = xe.ReactCurrentBatchConfig;
  function or(e, t, n) {
    if (e = n.ref, e !== null && typeof e != "function" && typeof e != "object") {
      if (n._owner) {
        if (n = n._owner, n) {
          if (n.tag !== 1) throw Error(v(309));
          var r = n.stateNode;
        }
        if (!r) throw Error(v(147, e));
        var l = r, o = "" + e;
        return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === o ? t.ref : (t = function(i) {
          var u = l.refs;
          i === null ? delete u[o] : u[o] = i;
        }, t._stringRef = o, t);
      }
      if (typeof e != "string") throw Error(v(284));
      if (!n._owner) throw Error(v(290, e));
    }
    return e;
  }
  function br(e, t) {
    throw e = Object.prototype.toString.call(t), Error(v(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e));
  }
  function ls(e) {
    var t = e._init;
    return t(e._payload);
  }
  function os(e) {
    function t(f, a) {
      if (e) {
        var d = f.deletions;
        d === null ? (f.deletions = [a], f.flags |= 16) : d.push(a);
      }
    }
    function n(f, a) {
      if (!e) return null;
      for (; a !== null; ) t(f, a), a = a.sibling;
      return null;
    }
    function r(f, a) {
      for (f = /* @__PURE__ */ new Map(); a !== null; ) a.key !== null ? f.set(a.key, a) : f.set(a.index, a), a = a.sibling;
      return f;
    }
    function l(f, a) {
      return f = Kt(f, a), f.index = 0, f.sibling = null, f;
    }
    function o(f, a, d) {
      return f.index = d, e ? (d = f.alternate, d !== null ? (d = d.index, d < a ? (f.flags |= 2, a) : d) : (f.flags |= 2, a)) : (f.flags |= 1048576, a);
    }
    function i(f) {
      return e && f.alternate === null && (f.flags |= 2), f;
    }
    function u(f, a, d, k) {
      return a === null || a.tag !== 6 ? (a = Si(d, f.mode, k), a.return = f, a) : (a = l(a, d), a.return = f, a);
    }
    function s(f, a, d, k) {
      var L = d.type;
      return L === Re ? g(f, a, d.props.children, k, d.key) : a !== null && (a.elementType === L || typeof L == "object" && L !== null && L.$$typeof === Ie && ls(L) === a.type) ? (k = l(a, d.props), k.ref = or(f, a, d), k.return = f, k) : (k = xl(d.type, d.key, d.props, null, f.mode, k), k.ref = or(f, a, d), k.return = f, k);
    }
    function m(f, a, d, k) {
      return a === null || a.tag !== 4 || a.stateNode.containerInfo !== d.containerInfo || a.stateNode.implementation !== d.implementation ? (a = Ei(d, f.mode, k), a.return = f, a) : (a = l(a, d.children || []), a.return = f, a);
    }
    function g(f, a, d, k, L) {
      return a === null || a.tag !== 7 ? (a = on(d, f.mode, k, L), a.return = f, a) : (a = l(a, d), a.return = f, a);
    }
    function w(f, a, d) {
      if (typeof a == "string" && a !== "" || typeof a == "number") return a = Si("" + a, f.mode, d), a.return = f, a;
      if (typeof a == "object" && a !== null) {
        switch (a.$$typeof) {
          case be:
            return d = xl(a.type, a.key, a.props, null, f.mode, d), d.ref = or(f, null, a), d.return = f, d;
          case Le:
            return a = Ei(a, f.mode, d), a.return = f, a;
          case Ie:
            var k = a._init;
            return w(f, k(a._payload), d);
        }
        if (jn(a) || R(a)) return a = on(a, f.mode, d, null), a.return = f, a;
        br(f, a);
      }
      return null;
    }
    function h(f, a, d, k) {
      var L = a !== null ? a.key : null;
      if (typeof d == "string" && d !== "" || typeof d == "number") return L !== null ? null : u(f, a, "" + d, k);
      if (typeof d == "object" && d !== null) {
        switch (d.$$typeof) {
          case be:
            return d.key === L ? s(f, a, d, k) : null;
          case Le:
            return d.key === L ? m(f, a, d, k) : null;
          case Ie:
            return L = d._init, h(
              f,
              a,
              L(d._payload),
              k
            );
        }
        if (jn(d) || R(d)) return L !== null ? null : g(f, a, d, k, null);
        br(f, d);
      }
      return null;
    }
    function E(f, a, d, k, L) {
      if (typeof k == "string" && k !== "" || typeof k == "number") return f = f.get(d) || null, u(a, f, "" + k, L);
      if (typeof k == "object" && k !== null) {
        switch (k.$$typeof) {
          case be:
            return f = f.get(k.key === null ? d : k.key) || null, s(a, f, k, L);
          case Le:
            return f = f.get(k.key === null ? d : k.key) || null, m(a, f, k, L);
          case Ie:
            var z = k._init;
            return E(f, a, d, z(k._payload), L);
        }
        if (jn(k) || R(k)) return f = f.get(d) || null, g(a, f, k, L, null);
        br(a, k);
      }
      return null;
    }
    function P(f, a, d, k) {
      for (var L = null, z = null, T = a, O = a = 0, ke = null; T !== null && O < d.length; O++) {
        T.index > O ? (ke = T, T = null) : ke = T.sibling;
        var G = h(f, T, d[O], k);
        if (G === null) {
          T === null && (T = ke);
          break;
        }
        e && T && G.alternate === null && t(f, T), a = o(G, a, O), z === null ? L = G : z.sibling = G, z = G, T = ke;
      }
      if (O === d.length) return n(f, T), ie && qt(f, O), L;
      if (T === null) {
        for (; O < d.length; O++) T = w(f, d[O], k), T !== null && (a = o(T, a, O), z === null ? L = T : z.sibling = T, z = T);
        return ie && qt(f, O), L;
      }
      for (T = r(f, T); O < d.length; O++) ke = E(T, f, O, d[O], k), ke !== null && (e && ke.alternate !== null && T.delete(ke.key === null ? O : ke.key), a = o(ke, a, O), z === null ? L = ke : z.sibling = ke, z = ke);
      return e && T.forEach(function(Wt) {
        return t(f, Wt);
      }), ie && qt(f, O), L;
    }
    function N(f, a, d, k) {
      var L = R(d);
      if (typeof L != "function") throw Error(v(150));
      if (d = L.call(d), d == null) throw Error(v(151));
      for (var z = L = null, T = a, O = a = 0, ke = null, G = d.next(); T !== null && !G.done; O++, G = d.next()) {
        T.index > O ? (ke = T, T = null) : ke = T.sibling;
        var Wt = h(f, T, G.value, k);
        if (Wt === null) {
          T === null && (T = ke);
          break;
        }
        e && T && Wt.alternate === null && t(f, T), a = o(Wt, a, O), z === null ? L = Wt : z.sibling = Wt, z = Wt, T = ke;
      }
      if (G.done) return n(
        f,
        T
      ), ie && qt(f, O), L;
      if (T === null) {
        for (; !G.done; O++, G = d.next()) G = w(f, G.value, k), G !== null && (a = o(G, a, O), z === null ? L = G : z.sibling = G, z = G);
        return ie && qt(f, O), L;
      }
      for (T = r(f, T); !G.done; O++, G = d.next()) G = E(T, f, O, G.value, k), G !== null && (e && G.alternate !== null && T.delete(G.key === null ? O : G.key), a = o(G, a, O), z === null ? L = G : z.sibling = G, z = G);
      return e && T.forEach(function($f) {
        return t(f, $f);
      }), ie && qt(f, O), L;
    }
    function me(f, a, d, k) {
      if (typeof d == "object" && d !== null && d.type === Re && d.key === null && (d = d.props.children), typeof d == "object" && d !== null) {
        switch (d.$$typeof) {
          case be:
            e: {
              for (var L = d.key, z = a; z !== null; ) {
                if (z.key === L) {
                  if (L = d.type, L === Re) {
                    if (z.tag === 7) {
                      n(f, z.sibling), a = l(z, d.props.children), a.return = f, f = a;
                      break e;
                    }
                  } else if (z.elementType === L || typeof L == "object" && L !== null && L.$$typeof === Ie && ls(L) === z.type) {
                    n(f, z.sibling), a = l(z, d.props), a.ref = or(f, z, d), a.return = f, f = a;
                    break e;
                  }
                  n(f, z);
                  break;
                } else t(f, z);
                z = z.sibling;
              }
              d.type === Re ? (a = on(d.props.children, f.mode, k, d.key), a.return = f, f = a) : (k = xl(d.type, d.key, d.props, null, f.mode, k), k.ref = or(f, a, d), k.return = f, f = k);
            }
            return i(f);
          case Le:
            e: {
              for (z = d.key; a !== null; ) {
                if (a.key === z) if (a.tag === 4 && a.stateNode.containerInfo === d.containerInfo && a.stateNode.implementation === d.implementation) {
                  n(f, a.sibling), a = l(a, d.children || []), a.return = f, f = a;
                  break e;
                } else {
                  n(f, a);
                  break;
                }
                else t(f, a);
                a = a.sibling;
              }
              a = Ei(d, f.mode, k), a.return = f, f = a;
            }
            return i(f);
          case Ie:
            return z = d._init, me(f, a, z(d._payload), k);
        }
        if (jn(d)) return P(f, a, d, k);
        if (R(d)) return N(f, a, d, k);
        br(f, d);
      }
      return typeof d == "string" && d !== "" || typeof d == "number" ? (d = "" + d, a !== null && a.tag === 6 ? (n(f, a.sibling), a = l(a, d), a.return = f, f = a) : (n(f, a), a = Si(d, f.mode, k), a.return = f, f = a), i(f)) : n(f, a);
    }
    return me;
  }
  var xn = os(!0), is = os(!1), el = jt(null), tl = null, _n = null, Ro = null;
  function Io() {
    Ro = _n = tl = null;
  }
  function Oo(e) {
    var t = el.current;
    le(el), e._currentValue = t;
  }
  function jo(e, t, n) {
    for (; e !== null; ) {
      var r = e.alternate;
      if ((e.childLanes & t) !== t ? (e.childLanes |= t, r !== null && (r.childLanes |= t)) : r !== null && (r.childLanes & t) !== t && (r.childLanes |= t), e === n) break;
      e = e.return;
    }
  }
  function Cn(e, t) {
    tl = e, Ro = _n = null, e = e.dependencies, e !== null && e.firstContext !== null && ((e.lanes & t) !== 0 && (Me = !0), e.firstContext = null);
  }
  function Ye(e) {
    var t = e._currentValue;
    if (Ro !== e) if (e = { context: e, memoizedValue: t, next: null }, _n === null) {
      if (tl === null) throw Error(v(308));
      _n = e, tl.dependencies = { lanes: 0, firstContext: e };
    } else _n = _n.next = e;
    return t;
  }
  var Jt = null;
  function Mo(e) {
    Jt === null ? Jt = [e] : Jt.push(e);
  }
  function us(e, t, n, r) {
    var l = t.interleaved;
    return l === null ? (n.next = n, Mo(t)) : (n.next = l.next, l.next = n), t.interleaved = n, Et(e, r);
  }
  function Et(e, t) {
    e.lanes |= t;
    var n = e.alternate;
    for (n !== null && (n.lanes |= t), n = e, e = e.return; e !== null; ) e.childLanes |= t, n = e.alternate, n !== null && (n.childLanes |= t), n = e, e = e.return;
    return n.tag === 3 ? n.stateNode : null;
  }
  var At = !1;
  function Do(e) {
    e.updateQueue = { baseState: e.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
  }
  function ss(e, t) {
    e = e.updateQueue, t.updateQueue === e && (t.updateQueue = { baseState: e.baseState, firstBaseUpdate: e.firstBaseUpdate, lastBaseUpdate: e.lastBaseUpdate, shared: e.shared, effects: e.effects });
  }
  function xt(e, t) {
    return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
  }
  function Ft(e, t, n) {
    var r = e.updateQueue;
    if (r === null) return null;
    if (r = r.shared, (B & 2) !== 0) {
      var l = r.pending;
      return l === null ? t.next = t : (t.next = l.next, l.next = t), r.pending = t, Et(e, n);
    }
    return l = r.interleaved, l === null ? (t.next = t, Mo(r)) : (t.next = l.next, l.next = t), r.interleaved = t, Et(e, n);
  }
  function nl(e, t, n) {
    if (t = t.updateQueue, t !== null && (t = t.shared, (n & 4194240) !== 0)) {
      var r = t.lanes;
      r &= e.pendingLanes, n |= r, t.lanes = n, Xl(e, n);
    }
  }
  function as(e, t) {
    var n = e.updateQueue, r = e.alternate;
    if (r !== null && (r = r.updateQueue, n === r)) {
      var l = null, o = null;
      if (n = n.firstBaseUpdate, n !== null) {
        do {
          var i = { eventTime: n.eventTime, lane: n.lane, tag: n.tag, payload: n.payload, callback: n.callback, next: null };
          o === null ? l = o = i : o = o.next = i, n = n.next;
        } while (n !== null);
        o === null ? l = o = t : o = o.next = t;
      } else l = o = t;
      n = { baseState: r.baseState, firstBaseUpdate: l, lastBaseUpdate: o, shared: r.shared, effects: r.effects }, e.updateQueue = n;
      return;
    }
    e = n.lastBaseUpdate, e === null ? n.firstBaseUpdate = t : e.next = t, n.lastBaseUpdate = t;
  }
  function rl(e, t, n, r) {
    var l = e.updateQueue;
    At = !1;
    var o = l.firstBaseUpdate, i = l.lastBaseUpdate, u = l.shared.pending;
    if (u !== null) {
      l.shared.pending = null;
      var s = u, m = s.next;
      s.next = null, i === null ? o = m : i.next = m, i = s;
      var g = e.alternate;
      g !== null && (g = g.updateQueue, u = g.lastBaseUpdate, u !== i && (u === null ? g.firstBaseUpdate = m : u.next = m, g.lastBaseUpdate = s));
    }
    if (o !== null) {
      var w = l.baseState;
      i = 0, g = m = s = null, u = o;
      do {
        var h = u.lane, E = u.eventTime;
        if ((r & h) === h) {
          g !== null && (g = g.next = {
            eventTime: E,
            lane: 0,
            tag: u.tag,
            payload: u.payload,
            callback: u.callback,
            next: null
          });
          e: {
            var P = e, N = u;
            switch (h = t, E = n, N.tag) {
              case 1:
                if (P = N.payload, typeof P == "function") {
                  w = P.call(E, w, h);
                  break e;
                }
                w = P;
                break e;
              case 3:
                P.flags = P.flags & -65537 | 128;
              case 0:
                if (P = N.payload, h = typeof P == "function" ? P.call(E, w, h) : P, h == null) break e;
                w = C({}, w, h);
                break e;
              case 2:
                At = !0;
            }
          }
          u.callback !== null && u.lane !== 0 && (e.flags |= 64, h = l.effects, h === null ? l.effects = [u] : h.push(u));
        } else E = { eventTime: E, lane: h, tag: u.tag, payload: u.payload, callback: u.callback, next: null }, g === null ? (m = g = E, s = w) : g = g.next = E, i |= h;
        if (u = u.next, u === null) {
          if (u = l.shared.pending, u === null) break;
          h = u, u = h.next, h.next = null, l.lastBaseUpdate = h, l.shared.pending = null;
        }
      } while (!0);
      if (g === null && (s = w), l.baseState = s, l.firstBaseUpdate = m, l.lastBaseUpdate = g, t = l.shared.interleaved, t !== null) {
        l = t;
        do
          i |= l.lane, l = l.next;
        while (l !== t);
      } else o === null && (l.shared.lanes = 0);
      tn |= i, e.lanes = i, e.memoizedState = w;
    }
  }
  function cs(e, t, n) {
    if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
      var r = e[t], l = r.callback;
      if (l !== null) {
        if (r.callback = null, r = n, typeof l != "function") throw Error(v(191, l));
        l.call(r);
      }
    }
  }
  var ir = {}, pt = jt(ir), ur = jt(ir), sr = jt(ir);
  function bt(e) {
    if (e === ir) throw Error(v(174));
    return e;
  }
  function Ao(e, t) {
    switch (te(sr, t), te(ur, e), te(pt, ir), e = t.nodeType, e) {
      case 9:
      case 11:
        t = (t = t.documentElement) ? t.namespaceURI : Al(null, "");
        break;
      default:
        e = e === 8 ? t.parentNode : t, t = e.namespaceURI || null, e = e.tagName, t = Al(t, e);
    }
    le(pt), te(pt, t);
  }
  function Pn() {
    le(pt), le(ur), le(sr);
  }
  function fs(e) {
    bt(sr.current);
    var t = bt(pt.current), n = Al(t, e.type);
    t !== n && (te(ur, e), te(pt, n));
  }
  function Fo(e) {
    ur.current === e && (le(pt), le(ur));
  }
  var ue = jt(0);
  function ll(e) {
    for (var t = e; t !== null; ) {
      if (t.tag === 13) {
        var n = t.memoizedState;
        if (n !== null && (n = n.dehydrated, n === null || n.data === "$?" || n.data === "$!")) return t;
      } else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
        if ((t.flags & 128) !== 0) return t;
      } else if (t.child !== null) {
        t.child.return = t, t = t.child;
        continue;
      }
      if (t === e) break;
      for (; t.sibling === null; ) {
        if (t.return === null || t.return === e) return null;
        t = t.return;
      }
      t.sibling.return = t.return, t = t.sibling;
    }
    return null;
  }
  var Uo = [];
  function $o() {
    for (var e = 0; e < Uo.length; e++) Uo[e]._workInProgressVersionPrimary = null;
    Uo.length = 0;
  }
  var ol = xe.ReactCurrentDispatcher, Vo = xe.ReactCurrentBatchConfig, en = 0, se = null, he = null, ge = null, il = !1, ar = !1, cr = 0, sf = 0;
  function Ce() {
    throw Error(v(321));
  }
  function Ho(e, t) {
    if (t === null) return !1;
    for (var n = 0; n < t.length && n < e.length; n++) if (!nt(e[n], t[n])) return !1;
    return !0;
  }
  function Bo(e, t, n, r, l, o) {
    if (en = o, se = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, ol.current = e === null || e.memoizedState === null ? df : pf, e = n(r, l), ar) {
      o = 0;
      do {
        if (ar = !1, cr = 0, 25 <= o) throw Error(v(301));
        o += 1, ge = he = null, t.updateQueue = null, ol.current = mf, e = n(r, l);
      } while (ar);
    }
    if (ol.current = al, t = he !== null && he.next !== null, en = 0, ge = he = se = null, il = !1, t) throw Error(v(300));
    return e;
  }
  function Ko() {
    var e = cr !== 0;
    return cr = 0, e;
  }
  function mt() {
    var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
    return ge === null ? se.memoizedState = ge = e : ge = ge.next = e, ge;
  }
  function Xe() {
    if (he === null) {
      var e = se.alternate;
      e = e !== null ? e.memoizedState : null;
    } else e = he.next;
    var t = ge === null ? se.memoizedState : ge.next;
    if (t !== null) ge = t, he = e;
    else {
      if (e === null) throw Error(v(310));
      he = e, e = { memoizedState: he.memoizedState, baseState: he.baseState, baseQueue: he.baseQueue, queue: he.queue, next: null }, ge === null ? se.memoizedState = ge = e : ge = ge.next = e;
    }
    return ge;
  }
  function fr(e, t) {
    return typeof t == "function" ? t(e) : t;
  }
  function Wo(e) {
    var t = Xe(), n = t.queue;
    if (n === null) throw Error(v(311));
    n.lastRenderedReducer = e;
    var r = he, l = r.baseQueue, o = n.pending;
    if (o !== null) {
      if (l !== null) {
        var i = l.next;
        l.next = o.next, o.next = i;
      }
      r.baseQueue = l = o, n.pending = null;
    }
    if (l !== null) {
      o = l.next, r = r.baseState;
      var u = i = null, s = null, m = o;
      do {
        var g = m.lane;
        if ((en & g) === g) s !== null && (s = s.next = { lane: 0, action: m.action, hasEagerState: m.hasEagerState, eagerState: m.eagerState, next: null }), r = m.hasEagerState ? m.eagerState : e(r, m.action);
        else {
          var w = {
            lane: g,
            action: m.action,
            hasEagerState: m.hasEagerState,
            eagerState: m.eagerState,
            next: null
          };
          s === null ? (u = s = w, i = r) : s = s.next = w, se.lanes |= g, tn |= g;
        }
        m = m.next;
      } while (m !== null && m !== o);
      s === null ? i = r : s.next = u, nt(r, t.memoizedState) || (Me = !0), t.memoizedState = r, t.baseState = i, t.baseQueue = s, n.lastRenderedState = r;
    }
    if (e = n.interleaved, e !== null) {
      l = e;
      do
        o = l.lane, se.lanes |= o, tn |= o, l = l.next;
      while (l !== e);
    } else l === null && (n.lanes = 0);
    return [t.memoizedState, n.dispatch];
  }
  function Qo(e) {
    var t = Xe(), n = t.queue;
    if (n === null) throw Error(v(311));
    n.lastRenderedReducer = e;
    var r = n.dispatch, l = n.pending, o = t.memoizedState;
    if (l !== null) {
      n.pending = null;
      var i = l = l.next;
      do
        o = e(o, i.action), i = i.next;
      while (i !== l);
      nt(o, t.memoizedState) || (Me = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
    }
    return [o, r];
  }
  function ds() {
  }
  function ps(e, t) {
    var n = se, r = Xe(), l = t(), o = !nt(r.memoizedState, l);
    if (o && (r.memoizedState = l, Me = !0), r = r.queue, Go(hs.bind(null, n, r, e), [e]), r.getSnapshot !== t || o || ge !== null && ge.memoizedState.tag & 1) {
      if (n.flags |= 2048, dr(9, vs.bind(null, n, r, l, t), void 0, null), we === null) throw Error(v(349));
      (en & 30) !== 0 || ms(n, t, l);
    }
    return l;
  }
  function ms(e, t, n) {
    e.flags |= 16384, e = { getSnapshot: t, value: n }, t = se.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, se.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
  }
  function vs(e, t, n, r) {
    t.value = n, t.getSnapshot = r, ys(t) && gs(e);
  }
  function hs(e, t, n) {
    return n(function() {
      ys(t) && gs(e);
    });
  }
  function ys(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
      var n = t();
      return !nt(e, n);
    } catch {
      return !0;
    }
  }
  function gs(e) {
    var t = Et(e, 1);
    t !== null && ut(t, e, 1, -1);
  }
  function ws(e) {
    var t = mt();
    return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: fr, lastRenderedState: e }, t.queue = e, e = e.dispatch = ff.bind(null, se, e), [t.memoizedState, e];
  }
  function dr(e, t, n, r) {
    return e = { tag: e, create: t, destroy: n, deps: r, next: null }, t = se.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, se.updateQueue = t, t.lastEffect = e.next = e) : (n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e)), e;
  }
  function ks() {
    return Xe().memoizedState;
  }
  function ul(e, t, n, r) {
    var l = mt();
    se.flags |= e, l.memoizedState = dr(1 | t, n, void 0, r === void 0 ? null : r);
  }
  function sl(e, t, n, r) {
    var l = Xe();
    r = r === void 0 ? null : r;
    var o = void 0;
    if (he !== null) {
      var i = he.memoizedState;
      if (o = i.destroy, r !== null && Ho(r, i.deps)) {
        l.memoizedState = dr(t, n, o, r);
        return;
      }
    }
    se.flags |= e, l.memoizedState = dr(1 | t, n, o, r);
  }
  function Ss(e, t) {
    return ul(8390656, 8, e, t);
  }
  function Go(e, t) {
    return sl(2048, 8, e, t);
  }
  function Es(e, t) {
    return sl(4, 2, e, t);
  }
  function xs(e, t) {
    return sl(4, 4, e, t);
  }
  function _s(e, t) {
    if (typeof t == "function") return e = e(), t(e), function() {
      t(null);
    };
    if (t != null) return e = e(), t.current = e, function() {
      t.current = null;
    };
  }
  function Cs(e, t, n) {
    return n = n != null ? n.concat([e]) : null, sl(4, 4, _s.bind(null, t, e), n);
  }
  function Yo() {
  }
  function Ps(e, t) {
    var n = Xe();
    t = t === void 0 ? null : t;
    var r = n.memoizedState;
    return r !== null && t !== null && Ho(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
  }
  function Ns(e, t) {
    var n = Xe();
    t = t === void 0 ? null : t;
    var r = n.memoizedState;
    return r !== null && t !== null && Ho(t, r[1]) ? r[0] : (e = e(), n.memoizedState = [e, t], e);
  }
  function Ls(e, t, n) {
    return (en & 21) === 0 ? (e.baseState && (e.baseState = !1, Me = !0), e.memoizedState = n) : (nt(n, t) || (n = lu(), se.lanes |= n, tn |= n, e.baseState = !0), t);
  }
  function af(e, t) {
    var n = q;
    q = n !== 0 && 4 > n ? n : 4, e(!0);
    var r = Vo.transition;
    Vo.transition = {};
    try {
      e(!1), t();
    } finally {
      q = n, Vo.transition = r;
    }
  }
  function zs() {
    return Xe().memoizedState;
  }
  function cf(e, t, n) {
    var r = Ht(e);
    if (n = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null }, Ts(e)) Rs(t, n);
    else if (n = us(e, t, n, r), n !== null) {
      var l = Te();
      ut(n, e, r, l), Is(n, t, r);
    }
  }
  function ff(e, t, n) {
    var r = Ht(e), l = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null };
    if (Ts(e)) Rs(t, l);
    else {
      var o = e.alternate;
      if (e.lanes === 0 && (o === null || o.lanes === 0) && (o = t.lastRenderedReducer, o !== null)) try {
        var i = t.lastRenderedState, u = o(i, n);
        if (l.hasEagerState = !0, l.eagerState = u, nt(u, i)) {
          var s = t.interleaved;
          s === null ? (l.next = l, Mo(t)) : (l.next = s.next, s.next = l), t.interleaved = l;
          return;
        }
      } catch {
      } finally {
      }
      n = us(e, t, l, r), n !== null && (l = Te(), ut(n, e, r, l), Is(n, t, r));
    }
  }
  function Ts(e) {
    var t = e.alternate;
    return e === se || t !== null && t === se;
  }
  function Rs(e, t) {
    ar = il = !0;
    var n = e.pending;
    n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
  }
  function Is(e, t, n) {
    if ((n & 4194240) !== 0) {
      var r = t.lanes;
      r &= e.pendingLanes, n |= r, t.lanes = n, Xl(e, n);
    }
  }
  var al = { readContext: Ye, useCallback: Ce, useContext: Ce, useEffect: Ce, useImperativeHandle: Ce, useInsertionEffect: Ce, useLayoutEffect: Ce, useMemo: Ce, useReducer: Ce, useRef: Ce, useState: Ce, useDebugValue: Ce, useDeferredValue: Ce, useTransition: Ce, useMutableSource: Ce, useSyncExternalStore: Ce, useId: Ce, unstable_isNewReconciler: !1 }, df = { readContext: Ye, useCallback: function(e, t) {
    return mt().memoizedState = [e, t === void 0 ? null : t], e;
  }, useContext: Ye, useEffect: Ss, useImperativeHandle: function(e, t, n) {
    return n = n != null ? n.concat([e]) : null, ul(
      4194308,
      4,
      _s.bind(null, t, e),
      n
    );
  }, useLayoutEffect: function(e, t) {
    return ul(4194308, 4, e, t);
  }, useInsertionEffect: function(e, t) {
    return ul(4, 2, e, t);
  }, useMemo: function(e, t) {
    var n = mt();
    return t = t === void 0 ? null : t, e = e(), n.memoizedState = [e, t], e;
  }, useReducer: function(e, t, n) {
    var r = mt();
    return t = n !== void 0 ? n(t) : t, r.memoizedState = r.baseState = t, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }, r.queue = e, e = e.dispatch = cf.bind(null, se, e), [r.memoizedState, e];
  }, useRef: function(e) {
    var t = mt();
    return e = { current: e }, t.memoizedState = e;
  }, useState: ws, useDebugValue: Yo, useDeferredValue: function(e) {
    return mt().memoizedState = e;
  }, useTransition: function() {
    var e = ws(!1), t = e[0];
    return e = af.bind(null, e[1]), mt().memoizedState = e, [t, e];
  }, useMutableSource: function() {
  }, useSyncExternalStore: function(e, t, n) {
    var r = se, l = mt();
    if (ie) {
      if (n === void 0) throw Error(v(407));
      n = n();
    } else {
      if (n = t(), we === null) throw Error(v(349));
      (en & 30) !== 0 || ms(r, t, n);
    }
    l.memoizedState = n;
    var o = { value: n, getSnapshot: t };
    return l.queue = o, Ss(hs.bind(
      null,
      r,
      o,
      e
    ), [e]), r.flags |= 2048, dr(9, vs.bind(null, r, o, n, t), void 0, null), n;
  }, useId: function() {
    var e = mt(), t = we.identifierPrefix;
    if (ie) {
      var n = St, r = kt;
      n = (r & ~(1 << 32 - tt(r) - 1)).toString(32) + n, t = ":" + t + "R" + n, n = cr++, 0 < n && (t += "H" + n.toString(32)), t += ":";
    } else n = sf++, t = ":" + t + "r" + n.toString(32) + ":";
    return e.memoizedState = t;
  }, unstable_isNewReconciler: !1 }, pf = {
    readContext: Ye,
    useCallback: Ps,
    useContext: Ye,
    useEffect: Go,
    useImperativeHandle: Cs,
    useInsertionEffect: Es,
    useLayoutEffect: xs,
    useMemo: Ns,
    useReducer: Wo,
    useRef: ks,
    useState: function() {
      return Wo(fr);
    },
    useDebugValue: Yo,
    useDeferredValue: function(e) {
      var t = Xe();
      return Ls(t, he.memoizedState, e);
    },
    useTransition: function() {
      var e = Wo(fr)[0], t = Xe().memoizedState;
      return [e, t];
    },
    useMutableSource: ds,
    useSyncExternalStore: ps,
    useId: zs,
    unstable_isNewReconciler: !1
  }, mf = { readContext: Ye, useCallback: Ps, useContext: Ye, useEffect: Go, useImperativeHandle: Cs, useInsertionEffect: Es, useLayoutEffect: xs, useMemo: Ns, useReducer: Qo, useRef: ks, useState: function() {
    return Qo(fr);
  }, useDebugValue: Yo, useDeferredValue: function(e) {
    var t = Xe();
    return he === null ? t.memoizedState = e : Ls(t, he.memoizedState, e);
  }, useTransition: function() {
    var e = Qo(fr)[0], t = Xe().memoizedState;
    return [e, t];
  }, useMutableSource: ds, useSyncExternalStore: ps, useId: zs, unstable_isNewReconciler: !1 };
  function lt(e, t) {
    if (e && e.defaultProps) {
      t = C({}, t), e = e.defaultProps;
      for (var n in e) t[n] === void 0 && (t[n] = e[n]);
      return t;
    }
    return t;
  }
  function Xo(e, t, n, r) {
    t = e.memoizedState, n = n(r, t), n = n == null ? t : C({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
  }
  var cl = { isMounted: function(e) {
    return (e = e._reactInternals) ? Gt(e) === e : !1;
  }, enqueueSetState: function(e, t, n) {
    e = e._reactInternals;
    var r = Te(), l = Ht(e), o = xt(r, l);
    o.payload = t, n != null && (o.callback = n), t = Ft(e, o, l), t !== null && (ut(t, e, l, r), nl(t, e, l));
  }, enqueueReplaceState: function(e, t, n) {
    e = e._reactInternals;
    var r = Te(), l = Ht(e), o = xt(r, l);
    o.tag = 1, o.payload = t, n != null && (o.callback = n), t = Ft(e, o, l), t !== null && (ut(t, e, l, r), nl(t, e, l));
  }, enqueueForceUpdate: function(e, t) {
    e = e._reactInternals;
    var n = Te(), r = Ht(e), l = xt(n, r);
    l.tag = 2, t != null && (l.callback = t), t = Ft(e, l, r), t !== null && (ut(t, e, r, n), nl(t, e, r));
  } };
  function Os(e, t, n, r, l, o, i) {
    return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, o, i) : t.prototype && t.prototype.isPureReactComponent ? !Jn(n, r) || !Jn(l, o) : !0;
  }
  function js(e, t, n) {
    var r = !1, l = Mt, o = t.contextType;
    return typeof o == "object" && o !== null ? o = Ye(o) : (l = je(t) ? Xt : _e.current, r = t.contextTypes, o = (r = r != null) ? wn(e, l) : Mt), t = new t(n, o), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = cl, e.stateNode = t, t._reactInternals = e, r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = l, e.__reactInternalMemoizedMaskedChildContext = o), t;
  }
  function Ms(e, t, n, r) {
    e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && cl.enqueueReplaceState(t, t.state, null);
  }
  function Zo(e, t, n, r) {
    var l = e.stateNode;
    l.props = n, l.state = e.memoizedState, l.refs = {}, Do(e);
    var o = t.contextType;
    typeof o == "object" && o !== null ? l.context = Ye(o) : (o = je(t) ? Xt : _e.current, l.context = wn(e, o)), l.state = e.memoizedState, o = t.getDerivedStateFromProps, typeof o == "function" && (Xo(e, t, o, n), l.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof l.getSnapshotBeforeUpdate == "function" || typeof l.UNSAFE_componentWillMount != "function" && typeof l.componentWillMount != "function" || (t = l.state, typeof l.componentWillMount == "function" && l.componentWillMount(), typeof l.UNSAFE_componentWillMount == "function" && l.UNSAFE_componentWillMount(), t !== l.state && cl.enqueueReplaceState(l, l.state, null), rl(e, n, l, r), l.state = e.memoizedState), typeof l.componentDidMount == "function" && (e.flags |= 4194308);
  }
  function Nn(e, t) {
    try {
      var n = "", r = t;
      do
        n += W(r), r = r.return;
      while (r);
      var l = n;
    } catch (o) {
      l = `
Error generating stack: ` + o.message + `
` + o.stack;
    }
    return { value: e, source: t, stack: l, digest: null };
  }
  function qo(e, t, n) {
    return { value: e, source: null, stack: n ?? null, digest: t ?? null };
  }
  function Jo(e, t) {
    try {
      console.error(t.value);
    } catch (n) {
      setTimeout(function() {
        throw n;
      });
    }
  }
  var vf = typeof WeakMap == "function" ? WeakMap : Map;
  function Ds(e, t, n) {
    n = xt(-1, n), n.tag = 3, n.payload = { element: null };
    var r = t.value;
    return n.callback = function() {
      yl || (yl = !0, pi = r), Jo(e, t);
    }, n;
  }
  function As(e, t, n) {
    n = xt(-1, n), n.tag = 3;
    var r = e.type.getDerivedStateFromError;
    if (typeof r == "function") {
      var l = t.value;
      n.payload = function() {
        return r(l);
      }, n.callback = function() {
        Jo(e, t);
      };
    }
    var o = e.stateNode;
    return o !== null && typeof o.componentDidCatch == "function" && (n.callback = function() {
      Jo(e, t), typeof r != "function" && ($t === null ? $t = /* @__PURE__ */ new Set([this]) : $t.add(this));
      var i = t.stack;
      this.componentDidCatch(t.value, { componentStack: i !== null ? i : "" });
    }), n;
  }
  function Fs(e, t, n) {
    var r = e.pingCache;
    if (r === null) {
      r = e.pingCache = new vf();
      var l = /* @__PURE__ */ new Set();
      r.set(t, l);
    } else l = r.get(t), l === void 0 && (l = /* @__PURE__ */ new Set(), r.set(t, l));
    l.has(n) || (l.add(n), e = zf.bind(null, e, t, n), t.then(e, e));
  }
  function Us(e) {
    do {
      var t;
      if ((t = e.tag === 13) && (t = e.memoizedState, t = t !== null ? t.dehydrated !== null : !0), t) return e;
      e = e.return;
    } while (e !== null);
    return null;
  }
  function $s(e, t, n, r, l) {
    return (e.mode & 1) === 0 ? (e === t ? e.flags |= 65536 : (e.flags |= 128, n.flags |= 131072, n.flags &= -52805, n.tag === 1 && (n.alternate === null ? n.tag = 17 : (t = xt(-1, 1), t.tag = 2, Ft(n, t, 1))), n.lanes |= 1), e) : (e.flags |= 65536, e.lanes = l, e);
  }
  var hf = xe.ReactCurrentOwner, Me = !1;
  function ze(e, t, n, r) {
    t.child = e === null ? is(t, null, n, r) : xn(t, e.child, n, r);
  }
  function Vs(e, t, n, r, l) {
    n = n.render;
    var o = t.ref;
    return Cn(t, l), r = Bo(e, t, n, r, o, l), n = Ko(), e !== null && !Me ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~l, _t(e, t, l)) : (ie && n && Po(t), t.flags |= 1, ze(e, t, r, l), t.child);
  }
  function Hs(e, t, n, r, l) {
    if (e === null) {
      var o = n.type;
      return typeof o == "function" && !ki(o) && o.defaultProps === void 0 && n.compare === null && n.defaultProps === void 0 ? (t.tag = 15, t.type = o, Bs(e, t, o, r, l)) : (e = xl(n.type, null, r, t, t.mode, l), e.ref = t.ref, e.return = t, t.child = e);
    }
    if (o = e.child, (e.lanes & l) === 0) {
      var i = o.memoizedProps;
      if (n = n.compare, n = n !== null ? n : Jn, n(i, r) && e.ref === t.ref) return _t(e, t, l);
    }
    return t.flags |= 1, e = Kt(o, r), e.ref = t.ref, e.return = t, t.child = e;
  }
  function Bs(e, t, n, r, l) {
    if (e !== null) {
      var o = e.memoizedProps;
      if (Jn(o, r) && e.ref === t.ref) if (Me = !1, t.pendingProps = r = o, (e.lanes & l) !== 0) (e.flags & 131072) !== 0 && (Me = !0);
      else return t.lanes = e.lanes, _t(e, t, l);
    }
    return bo(e, t, n, r, l);
  }
  function Ks(e, t, n) {
    var r = t.pendingProps, l = r.children, o = e !== null ? e.memoizedState : null;
    if (r.mode === "hidden") if ((t.mode & 1) === 0) t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, te(zn, Ke), Ke |= n;
    else {
      if ((n & 1073741824) === 0) return e = o !== null ? o.baseLanes | n : n, t.lanes = t.childLanes = 1073741824, t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }, t.updateQueue = null, te(zn, Ke), Ke |= e, null;
      t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, r = o !== null ? o.baseLanes : n, te(zn, Ke), Ke |= r;
    }
    else o !== null ? (r = o.baseLanes | n, t.memoizedState = null) : r = n, te(zn, Ke), Ke |= r;
    return ze(e, t, l, n), t.child;
  }
  function Ws(e, t) {
    var n = t.ref;
    (e === null && n !== null || e !== null && e.ref !== n) && (t.flags |= 512, t.flags |= 2097152);
  }
  function bo(e, t, n, r, l) {
    var o = je(n) ? Xt : _e.current;
    return o = wn(t, o), Cn(t, l), n = Bo(e, t, n, r, o, l), r = Ko(), e !== null && !Me ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~l, _t(e, t, l)) : (ie && r && Po(t), t.flags |= 1, ze(e, t, n, l), t.child);
  }
  function Qs(e, t, n, r, l) {
    if (je(n)) {
      var o = !0;
      Yr(t);
    } else o = !1;
    if (Cn(t, l), t.stateNode === null) dl(e, t), js(t, n, r), Zo(t, n, r, l), r = !0;
    else if (e === null) {
      var i = t.stateNode, u = t.memoizedProps;
      i.props = u;
      var s = i.context, m = n.contextType;
      typeof m == "object" && m !== null ? m = Ye(m) : (m = je(n) ? Xt : _e.current, m = wn(t, m));
      var g = n.getDerivedStateFromProps, w = typeof g == "function" || typeof i.getSnapshotBeforeUpdate == "function";
      w || typeof i.UNSAFE_componentWillReceiveProps != "function" && typeof i.componentWillReceiveProps != "function" || (u !== r || s !== m) && Ms(t, i, r, m), At = !1;
      var h = t.memoizedState;
      i.state = h, rl(t, r, i, l), s = t.memoizedState, u !== r || h !== s || Oe.current || At ? (typeof g == "function" && (Xo(t, n, g, r), s = t.memoizedState), (u = At || Os(t, n, u, r, h, s, m)) ? (w || typeof i.UNSAFE_componentWillMount != "function" && typeof i.componentWillMount != "function" || (typeof i.componentWillMount == "function" && i.componentWillMount(), typeof i.UNSAFE_componentWillMount == "function" && i.UNSAFE_componentWillMount()), typeof i.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof i.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = s), i.props = r, i.state = s, i.context = m, r = u) : (typeof i.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
    } else {
      i = t.stateNode, ss(e, t), u = t.memoizedProps, m = t.type === t.elementType ? u : lt(t.type, u), i.props = m, w = t.pendingProps, h = i.context, s = n.contextType, typeof s == "object" && s !== null ? s = Ye(s) : (s = je(n) ? Xt : _e.current, s = wn(t, s));
      var E = n.getDerivedStateFromProps;
      (g = typeof E == "function" || typeof i.getSnapshotBeforeUpdate == "function") || typeof i.UNSAFE_componentWillReceiveProps != "function" && typeof i.componentWillReceiveProps != "function" || (u !== w || h !== s) && Ms(t, i, r, s), At = !1, h = t.memoizedState, i.state = h, rl(t, r, i, l);
      var P = t.memoizedState;
      u !== w || h !== P || Oe.current || At ? (typeof E == "function" && (Xo(t, n, E, r), P = t.memoizedState), (m = At || Os(t, n, m, r, h, P, s) || !1) ? (g || typeof i.UNSAFE_componentWillUpdate != "function" && typeof i.componentWillUpdate != "function" || (typeof i.componentWillUpdate == "function" && i.componentWillUpdate(r, P, s), typeof i.UNSAFE_componentWillUpdate == "function" && i.UNSAFE_componentWillUpdate(r, P, s)), typeof i.componentDidUpdate == "function" && (t.flags |= 4), typeof i.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof i.componentDidUpdate != "function" || u === e.memoizedProps && h === e.memoizedState || (t.flags |= 4), typeof i.getSnapshotBeforeUpdate != "function" || u === e.memoizedProps && h === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = P), i.props = r, i.state = P, i.context = s, r = m) : (typeof i.componentDidUpdate != "function" || u === e.memoizedProps && h === e.memoizedState || (t.flags |= 4), typeof i.getSnapshotBeforeUpdate != "function" || u === e.memoizedProps && h === e.memoizedState || (t.flags |= 1024), r = !1);
    }
    return ei(e, t, n, r, o, l);
  }
  function ei(e, t, n, r, l, o) {
    Ws(e, t);
    var i = (t.flags & 128) !== 0;
    if (!r && !i) return l && qu(t, n, !1), _t(e, t, o);
    r = t.stateNode, hf.current = t;
    var u = i && typeof n.getDerivedStateFromError != "function" ? null : r.render();
    return t.flags |= 1, e !== null && i ? (t.child = xn(t, e.child, null, o), t.child = xn(t, null, u, o)) : ze(e, t, u, o), t.memoizedState = r.state, l && qu(t, n, !0), t.child;
  }
  function Gs(e) {
    var t = e.stateNode;
    t.pendingContext ? Xu(e, t.pendingContext, t.pendingContext !== t.context) : t.context && Xu(e, t.context, !1), Ao(e, t.containerInfo);
  }
  function Ys(e, t, n, r, l) {
    return En(), To(l), t.flags |= 256, ze(e, t, n, r), t.child;
  }
  var ti = { dehydrated: null, treeContext: null, retryLane: 0 };
  function ni(e) {
    return { baseLanes: e, cachePool: null, transitions: null };
  }
  function Xs(e, t, n) {
    var r = t.pendingProps, l = ue.current, o = !1, i = (t.flags & 128) !== 0, u;
    if ((u = i) || (u = e !== null && e.memoizedState === null ? !1 : (l & 2) !== 0), u ? (o = !0, t.flags &= -129) : (e === null || e.memoizedState !== null) && (l |= 1), te(ue, l & 1), e === null)
      return zo(t), e = t.memoizedState, e !== null && (e = e.dehydrated, e !== null) ? ((t.mode & 1) === 0 ? t.lanes = 1 : e.data === "$!" ? t.lanes = 8 : t.lanes = 1073741824, null) : (i = r.children, e = r.fallback, o ? (r = t.mode, o = t.child, i = { mode: "hidden", children: i }, (r & 1) === 0 && o !== null ? (o.childLanes = 0, o.pendingProps = i) : o = _l(i, r, 0, null), e = on(e, r, n, null), o.return = t, e.return = t, o.sibling = e, t.child = o, t.child.memoizedState = ni(n), t.memoizedState = ti, e) : ri(t, i));
    if (l = e.memoizedState, l !== null && (u = l.dehydrated, u !== null)) return yf(e, t, i, r, u, l, n);
    if (o) {
      o = r.fallback, i = t.mode, l = e.child, u = l.sibling;
      var s = { mode: "hidden", children: r.children };
      return (i & 1) === 0 && t.child !== l ? (r = t.child, r.childLanes = 0, r.pendingProps = s, t.deletions = null) : (r = Kt(l, s), r.subtreeFlags = l.subtreeFlags & 14680064), u !== null ? o = Kt(u, o) : (o = on(o, i, n, null), o.flags |= 2), o.return = t, r.return = t, r.sibling = o, t.child = r, r = o, o = t.child, i = e.child.memoizedState, i = i === null ? ni(n) : { baseLanes: i.baseLanes | n, cachePool: null, transitions: i.transitions }, o.memoizedState = i, o.childLanes = e.childLanes & ~n, t.memoizedState = ti, r;
    }
    return o = e.child, e = o.sibling, r = Kt(o, { mode: "visible", children: r.children }), (t.mode & 1) === 0 && (r.lanes = n), r.return = t, r.sibling = null, e !== null && (n = t.deletions, n === null ? (t.deletions = [e], t.flags |= 16) : n.push(e)), t.child = r, t.memoizedState = null, r;
  }
  function ri(e, t) {
    return t = _l({ mode: "visible", children: t }, e.mode, 0, null), t.return = e, e.child = t;
  }
  function fl(e, t, n, r) {
    return r !== null && To(r), xn(t, e.child, null, n), e = ri(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
  }
  function yf(e, t, n, r, l, o, i) {
    if (n)
      return t.flags & 256 ? (t.flags &= -257, r = qo(Error(v(422))), fl(e, t, i, r)) : t.memoizedState !== null ? (t.child = e.child, t.flags |= 128, null) : (o = r.fallback, l = t.mode, r = _l({ mode: "visible", children: r.children }, l, 0, null), o = on(o, l, i, null), o.flags |= 2, r.return = t, o.return = t, r.sibling = o, t.child = r, (t.mode & 1) !== 0 && xn(t, e.child, null, i), t.child.memoizedState = ni(i), t.memoizedState = ti, o);
    if ((t.mode & 1) === 0) return fl(e, t, i, null);
    if (l.data === "$!") {
      if (r = l.nextSibling && l.nextSibling.dataset, r) var u = r.dgst;
      return r = u, o = Error(v(419)), r = qo(o, r, void 0), fl(e, t, i, r);
    }
    if (u = (i & e.childLanes) !== 0, Me || u) {
      if (r = we, r !== null) {
        switch (i & -i) {
          case 4:
            l = 2;
            break;
          case 16:
            l = 8;
            break;
          case 64:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
          case 67108864:
            l = 32;
            break;
          case 536870912:
            l = 268435456;
            break;
          default:
            l = 0;
        }
        l = (l & (r.suspendedLanes | i)) !== 0 ? 0 : l, l !== 0 && l !== o.retryLane && (o.retryLane = l, Et(e, l), ut(r, e, l, -1));
      }
      return wi(), r = qo(Error(v(421))), fl(e, t, i, r);
    }
    return l.data === "$?" ? (t.flags |= 128, t.child = e.child, t = Tf.bind(null, e), l._reactRetry = t, null) : (e = o.treeContext, Be = Ot(l.nextSibling), He = t, ie = !0, rt = null, e !== null && (Qe[Ge++] = kt, Qe[Ge++] = St, Qe[Ge++] = Zt, kt = e.id, St = e.overflow, Zt = t), t = ri(t, r.children), t.flags |= 4096, t);
  }
  function Zs(e, t, n) {
    e.lanes |= t;
    var r = e.alternate;
    r !== null && (r.lanes |= t), jo(e.return, t, n);
  }
  function li(e, t, n, r, l) {
    var o = e.memoizedState;
    o === null ? e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: r, tail: n, tailMode: l } : (o.isBackwards = t, o.rendering = null, o.renderingStartTime = 0, o.last = r, o.tail = n, o.tailMode = l);
  }
  function qs(e, t, n) {
    var r = t.pendingProps, l = r.revealOrder, o = r.tail;
    if (ze(e, t, r.children, n), r = ue.current, (r & 2) !== 0) r = r & 1 | 2, t.flags |= 128;
    else {
      if (e !== null && (e.flags & 128) !== 0) e: for (e = t.child; e !== null; ) {
        if (e.tag === 13) e.memoizedState !== null && Zs(e, n, t);
        else if (e.tag === 19) Zs(e, n, t);
        else if (e.child !== null) {
          e.child.return = e, e = e.child;
          continue;
        }
        if (e === t) break e;
        for (; e.sibling === null; ) {
          if (e.return === null || e.return === t) break e;
          e = e.return;
        }
        e.sibling.return = e.return, e = e.sibling;
      }
      r &= 1;
    }
    if (te(ue, r), (t.mode & 1) === 0) t.memoizedState = null;
    else switch (l) {
      case "forwards":
        for (n = t.child, l = null; n !== null; ) e = n.alternate, e !== null && ll(e) === null && (l = n), n = n.sibling;
        n = l, n === null ? (l = t.child, t.child = null) : (l = n.sibling, n.sibling = null), li(t, !1, l, n, o);
        break;
      case "backwards":
        for (n = null, l = t.child, t.child = null; l !== null; ) {
          if (e = l.alternate, e !== null && ll(e) === null) {
            t.child = l;
            break;
          }
          e = l.sibling, l.sibling = n, n = l, l = e;
        }
        li(t, !0, n, null, o);
        break;
      case "together":
        li(t, !1, null, null, void 0);
        break;
      default:
        t.memoizedState = null;
    }
    return t.child;
  }
  function dl(e, t) {
    (t.mode & 1) === 0 && e !== null && (e.alternate = null, t.alternate = null, t.flags |= 2);
  }
  function _t(e, t, n) {
    if (e !== null && (t.dependencies = e.dependencies), tn |= t.lanes, (n & t.childLanes) === 0) return null;
    if (e !== null && t.child !== e.child) throw Error(v(153));
    if (t.child !== null) {
      for (e = t.child, n = Kt(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null; ) e = e.sibling, n = n.sibling = Kt(e, e.pendingProps), n.return = t;
      n.sibling = null;
    }
    return t.child;
  }
  function gf(e, t, n) {
    switch (t.tag) {
      case 3:
        Gs(t), En();
        break;
      case 5:
        fs(t);
        break;
      case 1:
        je(t.type) && Yr(t);
        break;
      case 4:
        Ao(t, t.stateNode.containerInfo);
        break;
      case 10:
        var r = t.type._context, l = t.memoizedProps.value;
        te(el, r._currentValue), r._currentValue = l;
        break;
      case 13:
        if (r = t.memoizedState, r !== null)
          return r.dehydrated !== null ? (te(ue, ue.current & 1), t.flags |= 128, null) : (n & t.child.childLanes) !== 0 ? Xs(e, t, n) : (te(ue, ue.current & 1), e = _t(e, t, n), e !== null ? e.sibling : null);
        te(ue, ue.current & 1);
        break;
      case 19:
        if (r = (n & t.childLanes) !== 0, (e.flags & 128) !== 0) {
          if (r) return qs(e, t, n);
          t.flags |= 128;
        }
        if (l = t.memoizedState, l !== null && (l.rendering = null, l.tail = null, l.lastEffect = null), te(ue, ue.current), r) break;
        return null;
      case 22:
      case 23:
        return t.lanes = 0, Ks(e, t, n);
    }
    return _t(e, t, n);
  }
  var Js, oi, bs, ea;
  Js = function(e, t) {
    for (var n = t.child; n !== null; ) {
      if (n.tag === 5 || n.tag === 6) e.appendChild(n.stateNode);
      else if (n.tag !== 4 && n.child !== null) {
        n.child.return = n, n = n.child;
        continue;
      }
      if (n === t) break;
      for (; n.sibling === null; ) {
        if (n.return === null || n.return === t) return;
        n = n.return;
      }
      n.sibling.return = n.return, n = n.sibling;
    }
  }, oi = function() {
  }, bs = function(e, t, n, r) {
    var l = e.memoizedProps;
    if (l !== r) {
      e = t.stateNode, bt(pt.current);
      var o = null;
      switch (n) {
        case "input":
          l = Ol(e, l), r = Ol(e, r), o = [];
          break;
        case "select":
          l = C({}, l, { value: void 0 }), r = C({}, r, { value: void 0 }), o = [];
          break;
        case "textarea":
          l = Dl(e, l), r = Dl(e, r), o = [];
          break;
        default:
          typeof l.onClick != "function" && typeof r.onClick == "function" && (e.onclick = Wr);
      }
      Fl(n, r);
      var i;
      n = null;
      for (m in l) if (!r.hasOwnProperty(m) && l.hasOwnProperty(m) && l[m] != null) if (m === "style") {
        var u = l[m];
        for (i in u) u.hasOwnProperty(i) && (n || (n = {}), n[i] = "");
      } else m !== "dangerouslySetInnerHTML" && m !== "children" && m !== "suppressContentEditableWarning" && m !== "suppressHydrationWarning" && m !== "autoFocus" && (H.hasOwnProperty(m) ? o || (o = []) : (o = o || []).push(m, null));
      for (m in r) {
        var s = r[m];
        if (u = l != null ? l[m] : void 0, r.hasOwnProperty(m) && s !== u && (s != null || u != null)) if (m === "style") if (u) {
          for (i in u) !u.hasOwnProperty(i) || s && s.hasOwnProperty(i) || (n || (n = {}), n[i] = "");
          for (i in s) s.hasOwnProperty(i) && u[i] !== s[i] && (n || (n = {}), n[i] = s[i]);
        } else n || (o || (o = []), o.push(
          m,
          n
        )), n = s;
        else m === "dangerouslySetInnerHTML" ? (s = s ? s.__html : void 0, u = u ? u.__html : void 0, s != null && u !== s && (o = o || []).push(m, s)) : m === "children" ? typeof s != "string" && typeof s != "number" || (o = o || []).push(m, "" + s) : m !== "suppressContentEditableWarning" && m !== "suppressHydrationWarning" && (H.hasOwnProperty(m) ? (s != null && m === "onScroll" && re("scroll", e), o || u === s || (o = [])) : (o = o || []).push(m, s));
      }
      n && (o = o || []).push("style", n);
      var m = o;
      (t.updateQueue = m) && (t.flags |= 4);
    }
  }, ea = function(e, t, n, r) {
    n !== r && (t.flags |= 4);
  };
  function pr(e, t) {
    if (!ie) switch (e.tailMode) {
      case "hidden":
        t = e.tail;
        for (var n = null; t !== null; ) t.alternate !== null && (n = t), t = t.sibling;
        n === null ? e.tail = null : n.sibling = null;
        break;
      case "collapsed":
        n = e.tail;
        for (var r = null; n !== null; ) n.alternate !== null && (r = n), n = n.sibling;
        r === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : r.sibling = null;
    }
  }
  function Pe(e) {
    var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
    if (t) for (var l = e.child; l !== null; ) n |= l.lanes | l.childLanes, r |= l.subtreeFlags & 14680064, r |= l.flags & 14680064, l.return = e, l = l.sibling;
    else for (l = e.child; l !== null; ) n |= l.lanes | l.childLanes, r |= l.subtreeFlags, r |= l.flags, l.return = e, l = l.sibling;
    return e.subtreeFlags |= r, e.childLanes = n, t;
  }
  function wf(e, t, n) {
    var r = t.pendingProps;
    switch (No(t), t.tag) {
      case 2:
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return Pe(t), null;
      case 1:
        return je(t.type) && Gr(), Pe(t), null;
      case 3:
        return r = t.stateNode, Pn(), le(Oe), le(_e), $o(), r.pendingContext && (r.context = r.pendingContext, r.pendingContext = null), (e === null || e.child === null) && (Jr(t) ? t.flags |= 4 : e === null || e.memoizedState.isDehydrated && (t.flags & 256) === 0 || (t.flags |= 1024, rt !== null && (hi(rt), rt = null))), oi(e, t), Pe(t), null;
      case 5:
        Fo(t);
        var l = bt(sr.current);
        if (n = t.type, e !== null && t.stateNode != null) bs(e, t, n, r, l), e.ref !== t.ref && (t.flags |= 512, t.flags |= 2097152);
        else {
          if (!r) {
            if (t.stateNode === null) throw Error(v(166));
            return Pe(t), null;
          }
          if (e = bt(pt.current), Jr(t)) {
            r = t.stateNode, n = t.type;
            var o = t.memoizedProps;
            switch (r[dt] = t, r[rr] = o, e = (t.mode & 1) !== 0, n) {
              case "dialog":
                re("cancel", r), re("close", r);
                break;
              case "iframe":
              case "object":
              case "embed":
                re("load", r);
                break;
              case "video":
              case "audio":
                for (l = 0; l < er.length; l++) re(er[l], r);
                break;
              case "source":
                re("error", r);
                break;
              case "img":
              case "image":
              case "link":
                re(
                  "error",
                  r
                ), re("load", r);
                break;
              case "details":
                re("toggle", r);
                break;
              case "input":
                ji(r, o), re("invalid", r);
                break;
              case "select":
                r._wrapperState = { wasMultiple: !!o.multiple }, re("invalid", r);
                break;
              case "textarea":
                Ai(r, o), re("invalid", r);
            }
            Fl(n, o), l = null;
            for (var i in o) if (o.hasOwnProperty(i)) {
              var u = o[i];
              i === "children" ? typeof u == "string" ? r.textContent !== u && (o.suppressHydrationWarning !== !0 && Kr(r.textContent, u, e), l = ["children", u]) : typeof u == "number" && r.textContent !== "" + u && (o.suppressHydrationWarning !== !0 && Kr(
                r.textContent,
                u,
                e
              ), l = ["children", "" + u]) : H.hasOwnProperty(i) && u != null && i === "onScroll" && re("scroll", r);
            }
            switch (n) {
              case "input":
                Sr(r), Di(r, o, !0);
                break;
              case "textarea":
                Sr(r), Ui(r);
                break;
              case "select":
              case "option":
                break;
              default:
                typeof o.onClick == "function" && (r.onclick = Wr);
            }
            r = l, t.updateQueue = r, r !== null && (t.flags |= 4);
          } else {
            i = l.nodeType === 9 ? l : l.ownerDocument, e === "http://www.w3.org/1999/xhtml" && (e = $i(n)), e === "http://www.w3.org/1999/xhtml" ? n === "script" ? (e = i.createElement("div"), e.innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof r.is == "string" ? e = i.createElement(n, { is: r.is }) : (e = i.createElement(n), n === "select" && (i = e, r.multiple ? i.multiple = !0 : r.size && (i.size = r.size))) : e = i.createElementNS(e, n), e[dt] = t, e[rr] = r, Js(e, t, !1, !1), t.stateNode = e;
            e: {
              switch (i = Ul(n, r), n) {
                case "dialog":
                  re("cancel", e), re("close", e), l = r;
                  break;
                case "iframe":
                case "object":
                case "embed":
                  re("load", e), l = r;
                  break;
                case "video":
                case "audio":
                  for (l = 0; l < er.length; l++) re(er[l], e);
                  l = r;
                  break;
                case "source":
                  re("error", e), l = r;
                  break;
                case "img":
                case "image":
                case "link":
                  re(
                    "error",
                    e
                  ), re("load", e), l = r;
                  break;
                case "details":
                  re("toggle", e), l = r;
                  break;
                case "input":
                  ji(e, r), l = Ol(e, r), re("invalid", e);
                  break;
                case "option":
                  l = r;
                  break;
                case "select":
                  e._wrapperState = { wasMultiple: !!r.multiple }, l = C({}, r, { value: void 0 }), re("invalid", e);
                  break;
                case "textarea":
                  Ai(e, r), l = Dl(e, r), re("invalid", e);
                  break;
                default:
                  l = r;
              }
              Fl(n, l), u = l;
              for (o in u) if (u.hasOwnProperty(o)) {
                var s = u[o];
                o === "style" ? Bi(e, s) : o === "dangerouslySetInnerHTML" ? (s = s ? s.__html : void 0, s != null && Vi(e, s)) : o === "children" ? typeof s == "string" ? (n !== "textarea" || s !== "") && Mn(e, s) : typeof s == "number" && Mn(e, "" + s) : o !== "suppressContentEditableWarning" && o !== "suppressHydrationWarning" && o !== "autoFocus" && (H.hasOwnProperty(o) ? s != null && o === "onScroll" && re("scroll", e) : s != null && Je(e, o, s, i));
              }
              switch (n) {
                case "input":
                  Sr(e), Di(e, r, !1);
                  break;
                case "textarea":
                  Sr(e), Ui(e);
                  break;
                case "option":
                  r.value != null && e.setAttribute("value", "" + Z(r.value));
                  break;
                case "select":
                  e.multiple = !!r.multiple, o = r.value, o != null ? un(e, !!r.multiple, o, !1) : r.defaultValue != null && un(
                    e,
                    !!r.multiple,
                    r.defaultValue,
                    !0
                  );
                  break;
                default:
                  typeof l.onClick == "function" && (e.onclick = Wr);
              }
              switch (n) {
                case "button":
                case "input":
                case "select":
                case "textarea":
                  r = !!r.autoFocus;
                  break e;
                case "img":
                  r = !0;
                  break e;
                default:
                  r = !1;
              }
            }
            r && (t.flags |= 4);
          }
          t.ref !== null && (t.flags |= 512, t.flags |= 2097152);
        }
        return Pe(t), null;
      case 6:
        if (e && t.stateNode != null) ea(e, t, e.memoizedProps, r);
        else {
          if (typeof r != "string" && t.stateNode === null) throw Error(v(166));
          if (n = bt(sr.current), bt(pt.current), Jr(t)) {
            if (r = t.stateNode, n = t.memoizedProps, r[dt] = t, (o = r.nodeValue !== n) && (e = He, e !== null)) switch (e.tag) {
              case 3:
                Kr(r.nodeValue, n, (e.mode & 1) !== 0);
                break;
              case 5:
                e.memoizedProps.suppressHydrationWarning !== !0 && Kr(r.nodeValue, n, (e.mode & 1) !== 0);
            }
            o && (t.flags |= 4);
          } else r = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r), r[dt] = t, t.stateNode = r;
        }
        return Pe(t), null;
      case 13:
        if (le(ue), r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
          if (ie && Be !== null && (t.mode & 1) !== 0 && (t.flags & 128) === 0) rs(), En(), t.flags |= 98560, o = !1;
          else if (o = Jr(t), r !== null && r.dehydrated !== null) {
            if (e === null) {
              if (!o) throw Error(v(318));
              if (o = t.memoizedState, o = o !== null ? o.dehydrated : null, !o) throw Error(v(317));
              o[dt] = t;
            } else En(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            Pe(t), o = !1;
          } else rt !== null && (hi(rt), rt = null), o = !0;
          if (!o) return t.flags & 65536 ? t : null;
        }
        return (t.flags & 128) !== 0 ? (t.lanes = n, t) : (r = r !== null, r !== (e !== null && e.memoizedState !== null) && r && (t.child.flags |= 8192, (t.mode & 1) !== 0 && (e === null || (ue.current & 1) !== 0 ? ye === 0 && (ye = 3) : wi())), t.updateQueue !== null && (t.flags |= 4), Pe(t), null);
      case 4:
        return Pn(), oi(e, t), e === null && tr(t.stateNode.containerInfo), Pe(t), null;
      case 10:
        return Oo(t.type._context), Pe(t), null;
      case 17:
        return je(t.type) && Gr(), Pe(t), null;
      case 19:
        if (le(ue), o = t.memoizedState, o === null) return Pe(t), null;
        if (r = (t.flags & 128) !== 0, i = o.rendering, i === null) if (r) pr(o, !1);
        else {
          if (ye !== 0 || e !== null && (e.flags & 128) !== 0) for (e = t.child; e !== null; ) {
            if (i = ll(e), i !== null) {
              for (t.flags |= 128, pr(o, !1), r = i.updateQueue, r !== null && (t.updateQueue = r, t.flags |= 4), t.subtreeFlags = 0, r = n, n = t.child; n !== null; ) o = n, e = r, o.flags &= 14680066, i = o.alternate, i === null ? (o.childLanes = 0, o.lanes = e, o.child = null, o.subtreeFlags = 0, o.memoizedProps = null, o.memoizedState = null, o.updateQueue = null, o.dependencies = null, o.stateNode = null) : (o.childLanes = i.childLanes, o.lanes = i.lanes, o.child = i.child, o.subtreeFlags = 0, o.deletions = null, o.memoizedProps = i.memoizedProps, o.memoizedState = i.memoizedState, o.updateQueue = i.updateQueue, o.type = i.type, e = i.dependencies, o.dependencies = e === null ? null : { lanes: e.lanes, firstContext: e.firstContext }), n = n.sibling;
              return te(ue, ue.current & 1 | 2), t.child;
            }
            e = e.sibling;
          }
          o.tail !== null && pe() > Tn && (t.flags |= 128, r = !0, pr(o, !1), t.lanes = 4194304);
        }
        else {
          if (!r) if (e = ll(i), e !== null) {
            if (t.flags |= 128, r = !0, n = e.updateQueue, n !== null && (t.updateQueue = n, t.flags |= 4), pr(o, !0), o.tail === null && o.tailMode === "hidden" && !i.alternate && !ie) return Pe(t), null;
          } else 2 * pe() - o.renderingStartTime > Tn && n !== 1073741824 && (t.flags |= 128, r = !0, pr(o, !1), t.lanes = 4194304);
          o.isBackwards ? (i.sibling = t.child, t.child = i) : (n = o.last, n !== null ? n.sibling = i : t.child = i, o.last = i);
        }
        return o.tail !== null ? (t = o.tail, o.rendering = t, o.tail = t.sibling, o.renderingStartTime = pe(), t.sibling = null, n = ue.current, te(ue, r ? n & 1 | 2 : n & 1), t) : (Pe(t), null);
      case 22:
      case 23:
        return gi(), r = t.memoizedState !== null, e !== null && e.memoizedState !== null !== r && (t.flags |= 8192), r && (t.mode & 1) !== 0 ? (Ke & 1073741824) !== 0 && (Pe(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : Pe(t), null;
      case 24:
        return null;
      case 25:
        return null;
    }
    throw Error(v(156, t.tag));
  }
  function kf(e, t) {
    switch (No(t), t.tag) {
      case 1:
        return je(t.type) && Gr(), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 3:
        return Pn(), le(Oe), le(_e), $o(), e = t.flags, (e & 65536) !== 0 && (e & 128) === 0 ? (t.flags = e & -65537 | 128, t) : null;
      case 5:
        return Fo(t), null;
      case 13:
        if (le(ue), e = t.memoizedState, e !== null && e.dehydrated !== null) {
          if (t.alternate === null) throw Error(v(340));
          En();
        }
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 19:
        return le(ue), null;
      case 4:
        return Pn(), null;
      case 10:
        return Oo(t.type._context), null;
      case 22:
      case 23:
        return gi(), null;
      case 24:
        return null;
      default:
        return null;
    }
  }
  var pl = !1, Ne = !1, Sf = typeof WeakSet == "function" ? WeakSet : Set, _ = null;
  function Ln(e, t) {
    var n = e.ref;
    if (n !== null) if (typeof n == "function") try {
      n(null);
    } catch (r) {
      de(e, t, r);
    }
    else n.current = null;
  }
  function ii(e, t, n) {
    try {
      n();
    } catch (r) {
      de(e, t, r);
    }
  }
  var ta = !1;
  function Ef(e, t) {
    if (go = Or, e = Ou(), ao(e)) {
      if ("selectionStart" in e) var n = { start: e.selectionStart, end: e.selectionEnd };
      else e: {
        n = (n = e.ownerDocument) && n.defaultView || window;
        var r = n.getSelection && n.getSelection();
        if (r && r.rangeCount !== 0) {
          n = r.anchorNode;
          var l = r.anchorOffset, o = r.focusNode;
          r = r.focusOffset;
          try {
            n.nodeType, o.nodeType;
          } catch {
            n = null;
            break e;
          }
          var i = 0, u = -1, s = -1, m = 0, g = 0, w = e, h = null;
          t: for (; ; ) {
            for (var E; w !== n || l !== 0 && w.nodeType !== 3 || (u = i + l), w !== o || r !== 0 && w.nodeType !== 3 || (s = i + r), w.nodeType === 3 && (i += w.nodeValue.length), (E = w.firstChild) !== null; )
              h = w, w = E;
            for (; ; ) {
              if (w === e) break t;
              if (h === n && ++m === l && (u = i), h === o && ++g === r && (s = i), (E = w.nextSibling) !== null) break;
              w = h, h = w.parentNode;
            }
            w = E;
          }
          n = u === -1 || s === -1 ? null : { start: u, end: s };
        } else n = null;
      }
      n = n || { start: 0, end: 0 };
    } else n = null;
    for (wo = { focusedElem: e, selectionRange: n }, Or = !1, _ = t; _ !== null; ) if (t = _, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null) e.return = t, _ = e;
    else for (; _ !== null; ) {
      t = _;
      try {
        var P = t.alternate;
        if ((t.flags & 1024) !== 0) switch (t.tag) {
          case 0:
          case 11:
          case 15:
            break;
          case 1:
            if (P !== null) {
              var N = P.memoizedProps, me = P.memoizedState, f = t.stateNode, a = f.getSnapshotBeforeUpdate(t.elementType === t.type ? N : lt(t.type, N), me);
              f.__reactInternalSnapshotBeforeUpdate = a;
            }
            break;
          case 3:
            var d = t.stateNode.containerInfo;
            d.nodeType === 1 ? d.textContent = "" : d.nodeType === 9 && d.documentElement && d.removeChild(d.documentElement);
            break;
          case 5:
          case 6:
          case 4:
          case 17:
            break;
          default:
            throw Error(v(163));
        }
      } catch (k) {
        de(t, t.return, k);
      }
      if (e = t.sibling, e !== null) {
        e.return = t.return, _ = e;
        break;
      }
      _ = t.return;
    }
    return P = ta, ta = !1, P;
  }
  function mr(e, t, n) {
    var r = t.updateQueue;
    if (r = r !== null ? r.lastEffect : null, r !== null) {
      var l = r = r.next;
      do {
        if ((l.tag & e) === e) {
          var o = l.destroy;
          l.destroy = void 0, o !== void 0 && ii(t, n, o);
        }
        l = l.next;
      } while (l !== r);
    }
  }
  function ml(e, t) {
    if (t = t.updateQueue, t = t !== null ? t.lastEffect : null, t !== null) {
      var n = t = t.next;
      do {
        if ((n.tag & e) === e) {
          var r = n.create;
          n.destroy = r();
        }
        n = n.next;
      } while (n !== t);
    }
  }
  function ui(e) {
    var t = e.ref;
    if (t !== null) {
      var n = e.stateNode;
      switch (e.tag) {
        case 5:
          e = n;
          break;
        default:
          e = n;
      }
      typeof t == "function" ? t(e) : t.current = e;
    }
  }
  function na(e) {
    var t = e.alternate;
    t !== null && (e.alternate = null, na(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && (delete t[dt], delete t[rr], delete t[xo], delete t[rf], delete t[lf])), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
  }
  function ra(e) {
    return e.tag === 5 || e.tag === 3 || e.tag === 4;
  }
  function la(e) {
    e: for (; ; ) {
      for (; e.sibling === null; ) {
        if (e.return === null || ra(e.return)) return null;
        e = e.return;
      }
      for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
        if (e.flags & 2 || e.child === null || e.tag === 4) continue e;
        e.child.return = e, e = e.child;
      }
      if (!(e.flags & 2)) return e.stateNode;
    }
  }
  function si(e, t, n) {
    var r = e.tag;
    if (r === 5 || r === 6) e = e.stateNode, t ? n.nodeType === 8 ? n.parentNode.insertBefore(e, t) : n.insertBefore(e, t) : (n.nodeType === 8 ? (t = n.parentNode, t.insertBefore(e, n)) : (t = n, t.appendChild(e)), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = Wr));
    else if (r !== 4 && (e = e.child, e !== null)) for (si(e, t, n), e = e.sibling; e !== null; ) si(e, t, n), e = e.sibling;
  }
  function ai(e, t, n) {
    var r = e.tag;
    if (r === 5 || r === 6) e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
    else if (r !== 4 && (e = e.child, e !== null)) for (ai(e, t, n), e = e.sibling; e !== null; ) ai(e, t, n), e = e.sibling;
  }
  var Se = null, ot = !1;
  function Ut(e, t, n) {
    for (n = n.child; n !== null; ) oa(e, t, n), n = n.sibling;
  }
  function oa(e, t, n) {
    if (ft && typeof ft.onCommitFiberUnmount == "function") try {
      ft.onCommitFiberUnmount(Nr, n);
    } catch {
    }
    switch (n.tag) {
      case 5:
        Ne || Ln(n, t);
      case 6:
        var r = Se, l = ot;
        Se = null, Ut(e, t, n), Se = r, ot = l, Se !== null && (ot ? (e = Se, n = n.stateNode, e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n)) : Se.removeChild(n.stateNode));
        break;
      case 18:
        Se !== null && (ot ? (e = Se, n = n.stateNode, e.nodeType === 8 ? Eo(e.parentNode, n) : e.nodeType === 1 && Eo(e, n), Qn(e)) : Eo(Se, n.stateNode));
        break;
      case 4:
        r = Se, l = ot, Se = n.stateNode.containerInfo, ot = !0, Ut(e, t, n), Se = r, ot = l;
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        if (!Ne && (r = n.updateQueue, r !== null && (r = r.lastEffect, r !== null))) {
          l = r = r.next;
          do {
            var o = l, i = o.destroy;
            o = o.tag, i !== void 0 && ((o & 2) !== 0 || (o & 4) !== 0) && ii(n, t, i), l = l.next;
          } while (l !== r);
        }
        Ut(e, t, n);
        break;
      case 1:
        if (!Ne && (Ln(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function")) try {
          r.props = n.memoizedProps, r.state = n.memoizedState, r.componentWillUnmount();
        } catch (u) {
          de(n, t, u);
        }
        Ut(e, t, n);
        break;
      case 21:
        Ut(e, t, n);
        break;
      case 22:
        n.mode & 1 ? (Ne = (r = Ne) || n.memoizedState !== null, Ut(e, t, n), Ne = r) : Ut(e, t, n);
        break;
      default:
        Ut(e, t, n);
    }
  }
  function ia(e) {
    var t = e.updateQueue;
    if (t !== null) {
      e.updateQueue = null;
      var n = e.stateNode;
      n === null && (n = e.stateNode = new Sf()), t.forEach(function(r) {
        var l = Rf.bind(null, e, r);
        n.has(r) || (n.add(r), r.then(l, l));
      });
    }
  }
  function it(e, t) {
    var n = t.deletions;
    if (n !== null) for (var r = 0; r < n.length; r++) {
      var l = n[r];
      try {
        var o = e, i = t, u = i;
        e: for (; u !== null; ) {
          switch (u.tag) {
            case 5:
              Se = u.stateNode, ot = !1;
              break e;
            case 3:
              Se = u.stateNode.containerInfo, ot = !0;
              break e;
            case 4:
              Se = u.stateNode.containerInfo, ot = !0;
              break e;
          }
          u = u.return;
        }
        if (Se === null) throw Error(v(160));
        oa(o, i, l), Se = null, ot = !1;
        var s = l.alternate;
        s !== null && (s.return = null), l.return = null;
      } catch (m) {
        de(l, t, m);
      }
    }
    if (t.subtreeFlags & 12854) for (t = t.child; t !== null; ) ua(t, e), t = t.sibling;
  }
  function ua(e, t) {
    var n = e.alternate, r = e.flags;
    switch (e.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        if (it(t, e), vt(e), r & 4) {
          try {
            mr(3, e, e.return), ml(3, e);
          } catch (N) {
            de(e, e.return, N);
          }
          try {
            mr(5, e, e.return);
          } catch (N) {
            de(e, e.return, N);
          }
        }
        break;
      case 1:
        it(t, e), vt(e), r & 512 && n !== null && Ln(n, n.return);
        break;
      case 5:
        if (it(t, e), vt(e), r & 512 && n !== null && Ln(n, n.return), e.flags & 32) {
          var l = e.stateNode;
          try {
            Mn(l, "");
          } catch (N) {
            de(e, e.return, N);
          }
        }
        if (r & 4 && (l = e.stateNode, l != null)) {
          var o = e.memoizedProps, i = n !== null ? n.memoizedProps : o, u = e.type, s = e.updateQueue;
          if (e.updateQueue = null, s !== null) try {
            u === "input" && o.type === "radio" && o.name != null && Mi(l, o), Ul(u, i);
            var m = Ul(u, o);
            for (i = 0; i < s.length; i += 2) {
              var g = s[i], w = s[i + 1];
              g === "style" ? Bi(l, w) : g === "dangerouslySetInnerHTML" ? Vi(l, w) : g === "children" ? Mn(l, w) : Je(l, g, w, m);
            }
            switch (u) {
              case "input":
                jl(l, o);
                break;
              case "textarea":
                Fi(l, o);
                break;
              case "select":
                var h = l._wrapperState.wasMultiple;
                l._wrapperState.wasMultiple = !!o.multiple;
                var E = o.value;
                E != null ? un(l, !!o.multiple, E, !1) : h !== !!o.multiple && (o.defaultValue != null ? un(
                  l,
                  !!o.multiple,
                  o.defaultValue,
                  !0
                ) : un(l, !!o.multiple, o.multiple ? [] : "", !1));
            }
            l[rr] = o;
          } catch (N) {
            de(e, e.return, N);
          }
        }
        break;
      case 6:
        if (it(t, e), vt(e), r & 4) {
          if (e.stateNode === null) throw Error(v(162));
          l = e.stateNode, o = e.memoizedProps;
          try {
            l.nodeValue = o;
          } catch (N) {
            de(e, e.return, N);
          }
        }
        break;
      case 3:
        if (it(t, e), vt(e), r & 4 && n !== null && n.memoizedState.isDehydrated) try {
          Qn(t.containerInfo);
        } catch (N) {
          de(e, e.return, N);
        }
        break;
      case 4:
        it(t, e), vt(e);
        break;
      case 13:
        it(t, e), vt(e), l = e.child, l.flags & 8192 && (o = l.memoizedState !== null, l.stateNode.isHidden = o, !o || l.alternate !== null && l.alternate.memoizedState !== null || (di = pe())), r & 4 && ia(e);
        break;
      case 22:
        if (g = n !== null && n.memoizedState !== null, e.mode & 1 ? (Ne = (m = Ne) || g, it(t, e), Ne = m) : it(t, e), vt(e), r & 8192) {
          if (m = e.memoizedState !== null, (e.stateNode.isHidden = m) && !g && (e.mode & 1) !== 0) for (_ = e, g = e.child; g !== null; ) {
            for (w = _ = g; _ !== null; ) {
              switch (h = _, E = h.child, h.tag) {
                case 0:
                case 11:
                case 14:
                case 15:
                  mr(4, h, h.return);
                  break;
                case 1:
                  Ln(h, h.return);
                  var P = h.stateNode;
                  if (typeof P.componentWillUnmount == "function") {
                    r = h, n = h.return;
                    try {
                      t = r, P.props = t.memoizedProps, P.state = t.memoizedState, P.componentWillUnmount();
                    } catch (N) {
                      de(r, n, N);
                    }
                  }
                  break;
                case 5:
                  Ln(h, h.return);
                  break;
                case 22:
                  if (h.memoizedState !== null) {
                    ca(w);
                    continue;
                  }
              }
              E !== null ? (E.return = h, _ = E) : ca(w);
            }
            g = g.sibling;
          }
          e: for (g = null, w = e; ; ) {
            if (w.tag === 5) {
              if (g === null) {
                g = w;
                try {
                  l = w.stateNode, m ? (o = l.style, typeof o.setProperty == "function" ? o.setProperty("display", "none", "important") : o.display = "none") : (u = w.stateNode, s = w.memoizedProps.style, i = s != null && s.hasOwnProperty("display") ? s.display : null, u.style.display = Hi("display", i));
                } catch (N) {
                  de(e, e.return, N);
                }
              }
            } else if (w.tag === 6) {
              if (g === null) try {
                w.stateNode.nodeValue = m ? "" : w.memoizedProps;
              } catch (N) {
                de(e, e.return, N);
              }
            } else if ((w.tag !== 22 && w.tag !== 23 || w.memoizedState === null || w === e) && w.child !== null) {
              w.child.return = w, w = w.child;
              continue;
            }
            if (w === e) break e;
            for (; w.sibling === null; ) {
              if (w.return === null || w.return === e) break e;
              g === w && (g = null), w = w.return;
            }
            g === w && (g = null), w.sibling.return = w.return, w = w.sibling;
          }
        }
        break;
      case 19:
        it(t, e), vt(e), r & 4 && ia(e);
        break;
      case 21:
        break;
      default:
        it(
          t,
          e
        ), vt(e);
    }
  }
  function vt(e) {
    var t = e.flags;
    if (t & 2) {
      try {
        e: {
          for (var n = e.return; n !== null; ) {
            if (ra(n)) {
              var r = n;
              break e;
            }
            n = n.return;
          }
          throw Error(v(160));
        }
        switch (r.tag) {
          case 5:
            var l = r.stateNode;
            r.flags & 32 && (Mn(l, ""), r.flags &= -33);
            var o = la(e);
            ai(e, o, l);
            break;
          case 3:
          case 4:
            var i = r.stateNode.containerInfo, u = la(e);
            si(e, u, i);
            break;
          default:
            throw Error(v(161));
        }
      } catch (s) {
        de(e, e.return, s);
      }
      e.flags &= -3;
    }
    t & 4096 && (e.flags &= -4097);
  }
  function xf(e, t, n) {
    _ = e, sa(e);
  }
  function sa(e, t, n) {
    for (var r = (e.mode & 1) !== 0; _ !== null; ) {
      var l = _, o = l.child;
      if (l.tag === 22 && r) {
        var i = l.memoizedState !== null || pl;
        if (!i) {
          var u = l.alternate, s = u !== null && u.memoizedState !== null || Ne;
          u = pl;
          var m = Ne;
          if (pl = i, (Ne = s) && !m) for (_ = l; _ !== null; ) i = _, s = i.child, i.tag === 22 && i.memoizedState !== null ? fa(l) : s !== null ? (s.return = i, _ = s) : fa(l);
          for (; o !== null; ) _ = o, sa(o), o = o.sibling;
          _ = l, pl = u, Ne = m;
        }
        aa(e);
      } else (l.subtreeFlags & 8772) !== 0 && o !== null ? (o.return = l, _ = o) : aa(e);
    }
  }
  function aa(e) {
    for (; _ !== null; ) {
      var t = _;
      if ((t.flags & 8772) !== 0) {
        var n = t.alternate;
        try {
          if ((t.flags & 8772) !== 0) switch (t.tag) {
            case 0:
            case 11:
            case 15:
              Ne || ml(5, t);
              break;
            case 1:
              var r = t.stateNode;
              if (t.flags & 4 && !Ne) if (n === null) r.componentDidMount();
              else {
                var l = t.elementType === t.type ? n.memoizedProps : lt(t.type, n.memoizedProps);
                r.componentDidUpdate(l, n.memoizedState, r.__reactInternalSnapshotBeforeUpdate);
              }
              var o = t.updateQueue;
              o !== null && cs(t, o, r);
              break;
            case 3:
              var i = t.updateQueue;
              if (i !== null) {
                if (n = null, t.child !== null) switch (t.child.tag) {
                  case 5:
                    n = t.child.stateNode;
                    break;
                  case 1:
                    n = t.child.stateNode;
                }
                cs(t, i, n);
              }
              break;
            case 5:
              var u = t.stateNode;
              if (n === null && t.flags & 4) {
                n = u;
                var s = t.memoizedProps;
                switch (t.type) {
                  case "button":
                  case "input":
                  case "select":
                  case "textarea":
                    s.autoFocus && n.focus();
                    break;
                  case "img":
                    s.src && (n.src = s.src);
                }
              }
              break;
            case 6:
              break;
            case 4:
              break;
            case 12:
              break;
            case 13:
              if (t.memoizedState === null) {
                var m = t.alternate;
                if (m !== null) {
                  var g = m.memoizedState;
                  if (g !== null) {
                    var w = g.dehydrated;
                    w !== null && Qn(w);
                  }
                }
              }
              break;
            case 19:
            case 17:
            case 21:
            case 22:
            case 23:
            case 25:
              break;
            default:
              throw Error(v(163));
          }
          Ne || t.flags & 512 && ui(t);
        } catch (h) {
          de(t, t.return, h);
        }
      }
      if (t === e) {
        _ = null;
        break;
      }
      if (n = t.sibling, n !== null) {
        n.return = t.return, _ = n;
        break;
      }
      _ = t.return;
    }
  }
  function ca(e) {
    for (; _ !== null; ) {
      var t = _;
      if (t === e) {
        _ = null;
        break;
      }
      var n = t.sibling;
      if (n !== null) {
        n.return = t.return, _ = n;
        break;
      }
      _ = t.return;
    }
  }
  function fa(e) {
    for (; _ !== null; ) {
      var t = _;
      try {
        switch (t.tag) {
          case 0:
          case 11:
          case 15:
            var n = t.return;
            try {
              ml(4, t);
            } catch (s) {
              de(t, n, s);
            }
            break;
          case 1:
            var r = t.stateNode;
            if (typeof r.componentDidMount == "function") {
              var l = t.return;
              try {
                r.componentDidMount();
              } catch (s) {
                de(t, l, s);
              }
            }
            var o = t.return;
            try {
              ui(t);
            } catch (s) {
              de(t, o, s);
            }
            break;
          case 5:
            var i = t.return;
            try {
              ui(t);
            } catch (s) {
              de(t, i, s);
            }
        }
      } catch (s) {
        de(t, t.return, s);
      }
      if (t === e) {
        _ = null;
        break;
      }
      var u = t.sibling;
      if (u !== null) {
        u.return = t.return, _ = u;
        break;
      }
      _ = t.return;
    }
  }
  var _f = Math.ceil, vl = xe.ReactCurrentDispatcher, ci = xe.ReactCurrentOwner, Ze = xe.ReactCurrentBatchConfig, B = 0, we = null, ve = null, Ee = 0, Ke = 0, zn = jt(0), ye = 0, vr = null, tn = 0, hl = 0, fi = 0, hr = null, De = null, di = 0, Tn = 1 / 0, Ct = null, yl = !1, pi = null, $t = null, gl = !1, Vt = null, wl = 0, yr = 0, mi = null, kl = -1, Sl = 0;
  function Te() {
    return (B & 6) !== 0 ? pe() : kl !== -1 ? kl : kl = pe();
  }
  function Ht(e) {
    return (e.mode & 1) === 0 ? 1 : (B & 2) !== 0 && Ee !== 0 ? Ee & -Ee : uf.transition !== null ? (Sl === 0 && (Sl = lu()), Sl) : (e = q, e !== 0 || (e = window.event, e = e === void 0 ? 16 : pu(e.type)), e);
  }
  function ut(e, t, n, r) {
    if (50 < yr) throw yr = 0, mi = null, Error(v(185));
    Vn(e, n, r), ((B & 2) === 0 || e !== we) && (e === we && ((B & 2) === 0 && (hl |= n), ye === 4 && Bt(e, Ee)), Ae(e, r), n === 1 && B === 0 && (t.mode & 1) === 0 && (Tn = pe() + 500, Xr && Dt()));
  }
  function Ae(e, t) {
    var n = e.callbackNode;
    ic(e, t);
    var r = Tr(e, e === we ? Ee : 0);
    if (r === 0) n !== null && tu(n), e.callbackNode = null, e.callbackPriority = 0;
    else if (t = r & -r, e.callbackPriority !== t) {
      if (n != null && tu(n), t === 1) e.tag === 0 ? of(pa.bind(null, e)) : Ju(pa.bind(null, e)), tf(function() {
        (B & 6) === 0 && Dt();
      }), n = null;
      else {
        switch (ou(r)) {
          case 1:
            n = Ql;
            break;
          case 4:
            n = nu;
            break;
          case 16:
            n = Pr;
            break;
          case 536870912:
            n = ru;
            break;
          default:
            n = Pr;
        }
        n = Sa(n, da.bind(null, e));
      }
      e.callbackPriority = t, e.callbackNode = n;
    }
  }
  function da(e, t) {
    if (kl = -1, Sl = 0, (B & 6) !== 0) throw Error(v(327));
    var n = e.callbackNode;
    if (Rn() && e.callbackNode !== n) return null;
    var r = Tr(e, e === we ? Ee : 0);
    if (r === 0) return null;
    if ((r & 30) !== 0 || (r & e.expiredLanes) !== 0 || t) t = El(e, r);
    else {
      t = r;
      var l = B;
      B |= 2;
      var o = va();
      (we !== e || Ee !== t) && (Ct = null, Tn = pe() + 500, rn(e, t));
      do
        try {
          Nf();
          break;
        } catch (u) {
          ma(e, u);
        }
      while (!0);
      Io(), vl.current = o, B = l, ve !== null ? t = 0 : (we = null, Ee = 0, t = ye);
    }
    if (t !== 0) {
      if (t === 2 && (l = Gl(e), l !== 0 && (r = l, t = vi(e, l))), t === 1) throw n = vr, rn(e, 0), Bt(e, r), Ae(e, pe()), n;
      if (t === 6) Bt(e, r);
      else {
        if (l = e.current.alternate, (r & 30) === 0 && !Cf(l) && (t = El(e, r), t === 2 && (o = Gl(e), o !== 0 && (r = o, t = vi(e, o))), t === 1)) throw n = vr, rn(e, 0), Bt(e, r), Ae(e, pe()), n;
        switch (e.finishedWork = l, e.finishedLanes = r, t) {
          case 0:
          case 1:
            throw Error(v(345));
          case 2:
            ln(e, De, Ct);
            break;
          case 3:
            if (Bt(e, r), (r & 130023424) === r && (t = di + 500 - pe(), 10 < t)) {
              if (Tr(e, 0) !== 0) break;
              if (l = e.suspendedLanes, (l & r) !== r) {
                Te(), e.pingedLanes |= e.suspendedLanes & l;
                break;
              }
              e.timeoutHandle = So(ln.bind(null, e, De, Ct), t);
              break;
            }
            ln(e, De, Ct);
            break;
          case 4:
            if (Bt(e, r), (r & 4194240) === r) break;
            for (t = e.eventTimes, l = -1; 0 < r; ) {
              var i = 31 - tt(r);
              o = 1 << i, i = t[i], i > l && (l = i), r &= ~o;
            }
            if (r = l, r = pe() - r, r = (120 > r ? 120 : 480 > r ? 480 : 1080 > r ? 1080 : 1920 > r ? 1920 : 3e3 > r ? 3e3 : 4320 > r ? 4320 : 1960 * _f(r / 1960)) - r, 10 < r) {
              e.timeoutHandle = So(ln.bind(null, e, De, Ct), r);
              break;
            }
            ln(e, De, Ct);
            break;
          case 5:
            ln(e, De, Ct);
            break;
          default:
            throw Error(v(329));
        }
      }
    }
    return Ae(e, pe()), e.callbackNode === n ? da.bind(null, e) : null;
  }
  function vi(e, t) {
    var n = hr;
    return e.current.memoizedState.isDehydrated && (rn(e, t).flags |= 256), e = El(e, t), e !== 2 && (t = De, De = n, t !== null && hi(t)), e;
  }
  function hi(e) {
    De === null ? De = e : De.push.apply(De, e);
  }
  function Cf(e) {
    for (var t = e; ; ) {
      if (t.flags & 16384) {
        var n = t.updateQueue;
        if (n !== null && (n = n.stores, n !== null)) for (var r = 0; r < n.length; r++) {
          var l = n[r], o = l.getSnapshot;
          l = l.value;
          try {
            if (!nt(o(), l)) return !1;
          } catch {
            return !1;
          }
        }
      }
      if (n = t.child, t.subtreeFlags & 16384 && n !== null) n.return = t, t = n;
      else {
        if (t === e) break;
        for (; t.sibling === null; ) {
          if (t.return === null || t.return === e) return !0;
          t = t.return;
        }
        t.sibling.return = t.return, t = t.sibling;
      }
    }
    return !0;
  }
  function Bt(e, t) {
    for (t &= ~fi, t &= ~hl, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes; 0 < t; ) {
      var n = 31 - tt(t), r = 1 << n;
      e[n] = -1, t &= ~r;
    }
  }
  function pa(e) {
    if ((B & 6) !== 0) throw Error(v(327));
    Rn();
    var t = Tr(e, 0);
    if ((t & 1) === 0) return Ae(e, pe()), null;
    var n = El(e, t);
    if (e.tag !== 0 && n === 2) {
      var r = Gl(e);
      r !== 0 && (t = r, n = vi(e, r));
    }
    if (n === 1) throw n = vr, rn(e, 0), Bt(e, t), Ae(e, pe()), n;
    if (n === 6) throw Error(v(345));
    return e.finishedWork = e.current.alternate, e.finishedLanes = t, ln(e, De, Ct), Ae(e, pe()), null;
  }
  function yi(e, t) {
    var n = B;
    B |= 1;
    try {
      return e(t);
    } finally {
      B = n, B === 0 && (Tn = pe() + 500, Xr && Dt());
    }
  }
  function nn(e) {
    Vt !== null && Vt.tag === 0 && (B & 6) === 0 && Rn();
    var t = B;
    B |= 1;
    var n = Ze.transition, r = q;
    try {
      if (Ze.transition = null, q = 1, e) return e();
    } finally {
      q = r, Ze.transition = n, B = t, (B & 6) === 0 && Dt();
    }
  }
  function gi() {
    Ke = zn.current, le(zn);
  }
  function rn(e, t) {
    e.finishedWork = null, e.finishedLanes = 0;
    var n = e.timeoutHandle;
    if (n !== -1 && (e.timeoutHandle = -1, ef(n)), ve !== null) for (n = ve.return; n !== null; ) {
      var r = n;
      switch (No(r), r.tag) {
        case 1:
          r = r.type.childContextTypes, r != null && Gr();
          break;
        case 3:
          Pn(), le(Oe), le(_e), $o();
          break;
        case 5:
          Fo(r);
          break;
        case 4:
          Pn();
          break;
        case 13:
          le(ue);
          break;
        case 19:
          le(ue);
          break;
        case 10:
          Oo(r.type._context);
          break;
        case 22:
        case 23:
          gi();
      }
      n = n.return;
    }
    if (we = e, ve = e = Kt(e.current, null), Ee = Ke = t, ye = 0, vr = null, fi = hl = tn = 0, De = hr = null, Jt !== null) {
      for (t = 0; t < Jt.length; t++) if (n = Jt[t], r = n.interleaved, r !== null) {
        n.interleaved = null;
        var l = r.next, o = n.pending;
        if (o !== null) {
          var i = o.next;
          o.next = l, r.next = i;
        }
        n.pending = r;
      }
      Jt = null;
    }
    return e;
  }
  function ma(e, t) {
    do {
      var n = ve;
      try {
        if (Io(), ol.current = al, il) {
          for (var r = se.memoizedState; r !== null; ) {
            var l = r.queue;
            l !== null && (l.pending = null), r = r.next;
          }
          il = !1;
        }
        if (en = 0, ge = he = se = null, ar = !1, cr = 0, ci.current = null, n === null || n.return === null) {
          ye = 1, vr = t, ve = null;
          break;
        }
        e: {
          var o = e, i = n.return, u = n, s = t;
          if (t = Ee, u.flags |= 32768, s !== null && typeof s == "object" && typeof s.then == "function") {
            var m = s, g = u, w = g.tag;
            if ((g.mode & 1) === 0 && (w === 0 || w === 11 || w === 15)) {
              var h = g.alternate;
              h ? (g.updateQueue = h.updateQueue, g.memoizedState = h.memoizedState, g.lanes = h.lanes) : (g.updateQueue = null, g.memoizedState = null);
            }
            var E = Us(i);
            if (E !== null) {
              E.flags &= -257, $s(E, i, u, o, t), E.mode & 1 && Fs(o, m, t), t = E, s = m;
              var P = t.updateQueue;
              if (P === null) {
                var N = /* @__PURE__ */ new Set();
                N.add(s), t.updateQueue = N;
              } else P.add(s);
              break e;
            } else {
              if ((t & 1) === 0) {
                Fs(o, m, t), wi();
                break e;
              }
              s = Error(v(426));
            }
          } else if (ie && u.mode & 1) {
            var me = Us(i);
            if (me !== null) {
              (me.flags & 65536) === 0 && (me.flags |= 256), $s(me, i, u, o, t), To(Nn(s, u));
              break e;
            }
          }
          o = s = Nn(s, u), ye !== 4 && (ye = 2), hr === null ? hr = [o] : hr.push(o), o = i;
          do {
            switch (o.tag) {
              case 3:
                o.flags |= 65536, t &= -t, o.lanes |= t;
                var f = Ds(o, s, t);
                as(o, f);
                break e;
              case 1:
                u = s;
                var a = o.type, d = o.stateNode;
                if ((o.flags & 128) === 0 && (typeof a.getDerivedStateFromError == "function" || d !== null && typeof d.componentDidCatch == "function" && ($t === null || !$t.has(d)))) {
                  o.flags |= 65536, t &= -t, o.lanes |= t;
                  var k = As(o, u, t);
                  as(o, k);
                  break e;
                }
            }
            o = o.return;
          } while (o !== null);
        }
        ya(n);
      } catch (L) {
        t = L, ve === n && n !== null && (ve = n = n.return);
        continue;
      }
      break;
    } while (!0);
  }
  function va() {
    var e = vl.current;
    return vl.current = al, e === null ? al : e;
  }
  function wi() {
    (ye === 0 || ye === 3 || ye === 2) && (ye = 4), we === null || (tn & 268435455) === 0 && (hl & 268435455) === 0 || Bt(we, Ee);
  }
  function El(e, t) {
    var n = B;
    B |= 2;
    var r = va();
    (we !== e || Ee !== t) && (Ct = null, rn(e, t));
    do
      try {
        Pf();
        break;
      } catch (l) {
        ma(e, l);
      }
    while (!0);
    if (Io(), B = n, vl.current = r, ve !== null) throw Error(v(261));
    return we = null, Ee = 0, ye;
  }
  function Pf() {
    for (; ve !== null; ) ha(ve);
  }
  function Nf() {
    for (; ve !== null && !qa(); ) ha(ve);
  }
  function ha(e) {
    var t = ka(e.alternate, e, Ke);
    e.memoizedProps = e.pendingProps, t === null ? ya(e) : ve = t, ci.current = null;
  }
  function ya(e) {
    var t = e;
    do {
      var n = t.alternate;
      if (e = t.return, (t.flags & 32768) === 0) {
        if (n = wf(n, t, Ke), n !== null) {
          ve = n;
          return;
        }
      } else {
        if (n = kf(n, t), n !== null) {
          n.flags &= 32767, ve = n;
          return;
        }
        if (e !== null) e.flags |= 32768, e.subtreeFlags = 0, e.deletions = null;
        else {
          ye = 6, ve = null;
          return;
        }
      }
      if (t = t.sibling, t !== null) {
        ve = t;
        return;
      }
      ve = t = e;
    } while (t !== null);
    ye === 0 && (ye = 5);
  }
  function ln(e, t, n) {
    var r = q, l = Ze.transition;
    try {
      Ze.transition = null, q = 1, Lf(e, t, n, r);
    } finally {
      Ze.transition = l, q = r;
    }
    return null;
  }
  function Lf(e, t, n, r) {
    do
      Rn();
    while (Vt !== null);
    if ((B & 6) !== 0) throw Error(v(327));
    n = e.finishedWork;
    var l = e.finishedLanes;
    if (n === null) return null;
    if (e.finishedWork = null, e.finishedLanes = 0, n === e.current) throw Error(v(177));
    e.callbackNode = null, e.callbackPriority = 0;
    var o = n.lanes | n.childLanes;
    if (uc(e, o), e === we && (ve = we = null, Ee = 0), (n.subtreeFlags & 2064) === 0 && (n.flags & 2064) === 0 || gl || (gl = !0, Sa(Pr, function() {
      return Rn(), null;
    })), o = (n.flags & 15990) !== 0, (n.subtreeFlags & 15990) !== 0 || o) {
      o = Ze.transition, Ze.transition = null;
      var i = q;
      q = 1;
      var u = B;
      B |= 4, ci.current = null, Ef(e, n), ua(n, e), Gc(wo), Or = !!go, wo = go = null, e.current = n, xf(n), Ja(), B = u, q = i, Ze.transition = o;
    } else e.current = n;
    if (gl && (gl = !1, Vt = e, wl = l), o = e.pendingLanes, o === 0 && ($t = null), tc(n.stateNode), Ae(e, pe()), t !== null) for (r = e.onRecoverableError, n = 0; n < t.length; n++) l = t[n], r(l.value, { componentStack: l.stack, digest: l.digest });
    if (yl) throw yl = !1, e = pi, pi = null, e;
    return (wl & 1) !== 0 && e.tag !== 0 && Rn(), o = e.pendingLanes, (o & 1) !== 0 ? e === mi ? yr++ : (yr = 0, mi = e) : yr = 0, Dt(), null;
  }
  function Rn() {
    if (Vt !== null) {
      var e = ou(wl), t = Ze.transition, n = q;
      try {
        if (Ze.transition = null, q = 16 > e ? 16 : e, Vt === null) var r = !1;
        else {
          if (e = Vt, Vt = null, wl = 0, (B & 6) !== 0) throw Error(v(331));
          var l = B;
          for (B |= 4, _ = e.current; _ !== null; ) {
            var o = _, i = o.child;
            if ((_.flags & 16) !== 0) {
              var u = o.deletions;
              if (u !== null) {
                for (var s = 0; s < u.length; s++) {
                  var m = u[s];
                  for (_ = m; _ !== null; ) {
                    var g = _;
                    switch (g.tag) {
                      case 0:
                      case 11:
                      case 15:
                        mr(8, g, o);
                    }
                    var w = g.child;
                    if (w !== null) w.return = g, _ = w;
                    else for (; _ !== null; ) {
                      g = _;
                      var h = g.sibling, E = g.return;
                      if (na(g), g === m) {
                        _ = null;
                        break;
                      }
                      if (h !== null) {
                        h.return = E, _ = h;
                        break;
                      }
                      _ = E;
                    }
                  }
                }
                var P = o.alternate;
                if (P !== null) {
                  var N = P.child;
                  if (N !== null) {
                    P.child = null;
                    do {
                      var me = N.sibling;
                      N.sibling = null, N = me;
                    } while (N !== null);
                  }
                }
                _ = o;
              }
            }
            if ((o.subtreeFlags & 2064) !== 0 && i !== null) i.return = o, _ = i;
            else e: for (; _ !== null; ) {
              if (o = _, (o.flags & 2048) !== 0) switch (o.tag) {
                case 0:
                case 11:
                case 15:
                  mr(9, o, o.return);
              }
              var f = o.sibling;
              if (f !== null) {
                f.return = o.return, _ = f;
                break e;
              }
              _ = o.return;
            }
          }
          var a = e.current;
          for (_ = a; _ !== null; ) {
            i = _;
            var d = i.child;
            if ((i.subtreeFlags & 2064) !== 0 && d !== null) d.return = i, _ = d;
            else e: for (i = a; _ !== null; ) {
              if (u = _, (u.flags & 2048) !== 0) try {
                switch (u.tag) {
                  case 0:
                  case 11:
                  case 15:
                    ml(9, u);
                }
              } catch (L) {
                de(u, u.return, L);
              }
              if (u === i) {
                _ = null;
                break e;
              }
              var k = u.sibling;
              if (k !== null) {
                k.return = u.return, _ = k;
                break e;
              }
              _ = u.return;
            }
          }
          if (B = l, Dt(), ft && typeof ft.onPostCommitFiberRoot == "function") try {
            ft.onPostCommitFiberRoot(Nr, e);
          } catch {
          }
          r = !0;
        }
        return r;
      } finally {
        q = n, Ze.transition = t;
      }
    }
    return !1;
  }
  function ga(e, t, n) {
    t = Nn(n, t), t = Ds(e, t, 1), e = Ft(e, t, 1), t = Te(), e !== null && (Vn(e, 1, t), Ae(e, t));
  }
  function de(e, t, n) {
    if (e.tag === 3) ga(e, e, n);
    else for (; t !== null; ) {
      if (t.tag === 3) {
        ga(t, e, n);
        break;
      } else if (t.tag === 1) {
        var r = t.stateNode;
        if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && ($t === null || !$t.has(r))) {
          e = Nn(n, e), e = As(t, e, 1), t = Ft(t, e, 1), e = Te(), t !== null && (Vn(t, 1, e), Ae(t, e));
          break;
        }
      }
      t = t.return;
    }
  }
  function zf(e, t, n) {
    var r = e.pingCache;
    r !== null && r.delete(t), t = Te(), e.pingedLanes |= e.suspendedLanes & n, we === e && (Ee & n) === n && (ye === 4 || ye === 3 && (Ee & 130023424) === Ee && 500 > pe() - di ? rn(e, 0) : fi |= n), Ae(e, t);
  }
  function wa(e, t) {
    t === 0 && ((e.mode & 1) === 0 ? t = 1 : (t = zr, zr <<= 1, (zr & 130023424) === 0 && (zr = 4194304)));
    var n = Te();
    e = Et(e, t), e !== null && (Vn(e, t, n), Ae(e, n));
  }
  function Tf(e) {
    var t = e.memoizedState, n = 0;
    t !== null && (n = t.retryLane), wa(e, n);
  }
  function Rf(e, t) {
    var n = 0;
    switch (e.tag) {
      case 13:
        var r = e.stateNode, l = e.memoizedState;
        l !== null && (n = l.retryLane);
        break;
      case 19:
        r = e.stateNode;
        break;
      default:
        throw Error(v(314));
    }
    r !== null && r.delete(t), wa(e, n);
  }
  var ka;
  ka = function(e, t, n) {
    if (e !== null) if (e.memoizedProps !== t.pendingProps || Oe.current) Me = !0;
    else {
      if ((e.lanes & n) === 0 && (t.flags & 128) === 0) return Me = !1, gf(e, t, n);
      Me = (e.flags & 131072) !== 0;
    }
    else Me = !1, ie && (t.flags & 1048576) !== 0 && bu(t, qr, t.index);
    switch (t.lanes = 0, t.tag) {
      case 2:
        var r = t.type;
        dl(e, t), e = t.pendingProps;
        var l = wn(t, _e.current);
        Cn(t, n), l = Bo(null, t, r, e, l, n);
        var o = Ko();
        return t.flags |= 1, typeof l == "object" && l !== null && typeof l.render == "function" && l.$$typeof === void 0 ? (t.tag = 1, t.memoizedState = null, t.updateQueue = null, je(r) ? (o = !0, Yr(t)) : o = !1, t.memoizedState = l.state !== null && l.state !== void 0 ? l.state : null, Do(t), l.updater = cl, t.stateNode = l, l._reactInternals = t, Zo(t, r, e, n), t = ei(null, t, r, !0, o, n)) : (t.tag = 0, ie && o && Po(t), ze(null, t, l, n), t = t.child), t;
      case 16:
        r = t.elementType;
        e: {
          switch (dl(e, t), e = t.pendingProps, l = r._init, r = l(r._payload), t.type = r, l = t.tag = Of(r), e = lt(r, e), l) {
            case 0:
              t = bo(null, t, r, e, n);
              break e;
            case 1:
              t = Qs(null, t, r, e, n);
              break e;
            case 11:
              t = Vs(null, t, r, e, n);
              break e;
            case 14:
              t = Hs(null, t, r, lt(r.type, e), n);
              break e;
          }
          throw Error(v(
            306,
            r,
            ""
          ));
        }
        return t;
      case 0:
        return r = t.type, l = t.pendingProps, l = t.elementType === r ? l : lt(r, l), bo(e, t, r, l, n);
      case 1:
        return r = t.type, l = t.pendingProps, l = t.elementType === r ? l : lt(r, l), Qs(e, t, r, l, n);
      case 3:
        e: {
          if (Gs(t), e === null) throw Error(v(387));
          r = t.pendingProps, o = t.memoizedState, l = o.element, ss(e, t), rl(t, r, null, n);
          var i = t.memoizedState;
          if (r = i.element, o.isDehydrated) if (o = { element: r, isDehydrated: !1, cache: i.cache, pendingSuspenseBoundaries: i.pendingSuspenseBoundaries, transitions: i.transitions }, t.updateQueue.baseState = o, t.memoizedState = o, t.flags & 256) {
            l = Nn(Error(v(423)), t), t = Ys(e, t, r, n, l);
            break e;
          } else if (r !== l) {
            l = Nn(Error(v(424)), t), t = Ys(e, t, r, n, l);
            break e;
          } else for (Be = Ot(t.stateNode.containerInfo.firstChild), He = t, ie = !0, rt = null, n = is(t, null, r, n), t.child = n; n; ) n.flags = n.flags & -3 | 4096, n = n.sibling;
          else {
            if (En(), r === l) {
              t = _t(e, t, n);
              break e;
            }
            ze(e, t, r, n);
          }
          t = t.child;
        }
        return t;
      case 5:
        return fs(t), e === null && zo(t), r = t.type, l = t.pendingProps, o = e !== null ? e.memoizedProps : null, i = l.children, ko(r, l) ? i = null : o !== null && ko(r, o) && (t.flags |= 32), Ws(e, t), ze(e, t, i, n), t.child;
      case 6:
        return e === null && zo(t), null;
      case 13:
        return Xs(e, t, n);
      case 4:
        return Ao(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = xn(t, null, r, n) : ze(e, t, r, n), t.child;
      case 11:
        return r = t.type, l = t.pendingProps, l = t.elementType === r ? l : lt(r, l), Vs(e, t, r, l, n);
      case 7:
        return ze(e, t, t.pendingProps, n), t.child;
      case 8:
        return ze(e, t, t.pendingProps.children, n), t.child;
      case 12:
        return ze(e, t, t.pendingProps.children, n), t.child;
      case 10:
        e: {
          if (r = t.type._context, l = t.pendingProps, o = t.memoizedProps, i = l.value, te(el, r._currentValue), r._currentValue = i, o !== null) if (nt(o.value, i)) {
            if (o.children === l.children && !Oe.current) {
              t = _t(e, t, n);
              break e;
            }
          } else for (o = t.child, o !== null && (o.return = t); o !== null; ) {
            var u = o.dependencies;
            if (u !== null) {
              i = o.child;
              for (var s = u.firstContext; s !== null; ) {
                if (s.context === r) {
                  if (o.tag === 1) {
                    s = xt(-1, n & -n), s.tag = 2;
                    var m = o.updateQueue;
                    if (m !== null) {
                      m = m.shared;
                      var g = m.pending;
                      g === null ? s.next = s : (s.next = g.next, g.next = s), m.pending = s;
                    }
                  }
                  o.lanes |= n, s = o.alternate, s !== null && (s.lanes |= n), jo(
                    o.return,
                    n,
                    t
                  ), u.lanes |= n;
                  break;
                }
                s = s.next;
              }
            } else if (o.tag === 10) i = o.type === t.type ? null : o.child;
            else if (o.tag === 18) {
              if (i = o.return, i === null) throw Error(v(341));
              i.lanes |= n, u = i.alternate, u !== null && (u.lanes |= n), jo(i, n, t), i = o.sibling;
            } else i = o.child;
            if (i !== null) i.return = o;
            else for (i = o; i !== null; ) {
              if (i === t) {
                i = null;
                break;
              }
              if (o = i.sibling, o !== null) {
                o.return = i.return, i = o;
                break;
              }
              i = i.return;
            }
            o = i;
          }
          ze(e, t, l.children, n), t = t.child;
        }
        return t;
      case 9:
        return l = t.type, r = t.pendingProps.children, Cn(t, n), l = Ye(l), r = r(l), t.flags |= 1, ze(e, t, r, n), t.child;
      case 14:
        return r = t.type, l = lt(r, t.pendingProps), l = lt(r.type, l), Hs(e, t, r, l, n);
      case 15:
        return Bs(e, t, t.type, t.pendingProps, n);
      case 17:
        return r = t.type, l = t.pendingProps, l = t.elementType === r ? l : lt(r, l), dl(e, t), t.tag = 1, je(r) ? (e = !0, Yr(t)) : e = !1, Cn(t, n), js(t, r, l), Zo(t, r, l, n), ei(null, t, r, !0, e, n);
      case 19:
        return qs(e, t, n);
      case 22:
        return Ks(e, t, n);
    }
    throw Error(v(156, t.tag));
  };
  function Sa(e, t) {
    return eu(e, t);
  }
  function If(e, t, n, r) {
    this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
  }
  function qe(e, t, n, r) {
    return new If(e, t, n, r);
  }
  function ki(e) {
    return e = e.prototype, !(!e || !e.isReactComponent);
  }
  function Of(e) {
    if (typeof e == "function") return ki(e) ? 1 : 0;
    if (e != null) {
      if (e = e.$$typeof, e === at) return 11;
      if (e === ct) return 14;
    }
    return 2;
  }
  function Kt(e, t) {
    var n = e.alternate;
    return n === null ? (n = qe(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 14680064, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n;
  }
  function xl(e, t, n, r, l, o) {
    var i = 2;
    if (r = e, typeof e == "function") ki(e) && (i = 1);
    else if (typeof e == "string") i = 5;
    else e: switch (e) {
      case Re:
        return on(n.children, l, o, t);
      case We:
        i = 8, l |= 8;
        break;
      case Pt:
        return e = qe(12, n, t, l | 2), e.elementType = Pt, e.lanes = o, e;
      case Ue:
        return e = qe(13, n, t, l), e.elementType = Ue, e.lanes = o, e;
      case et:
        return e = qe(19, n, t, l), e.elementType = et, e.lanes = o, e;
      case fe:
        return _l(n, l, o, t);
      default:
        if (typeof e == "object" && e !== null) switch (e.$$typeof) {
          case yt:
            i = 10;
            break e;
          case Qt:
            i = 9;
            break e;
          case at:
            i = 11;
            break e;
          case ct:
            i = 14;
            break e;
          case Ie:
            i = 16, r = null;
            break e;
        }
        throw Error(v(130, e == null ? e : typeof e, ""));
    }
    return t = qe(i, n, t, l), t.elementType = e, t.type = r, t.lanes = o, t;
  }
  function on(e, t, n, r) {
    return e = qe(7, e, r, t), e.lanes = n, e;
  }
  function _l(e, t, n, r) {
    return e = qe(22, e, r, t), e.elementType = fe, e.lanes = n, e.stateNode = { isHidden: !1 }, e;
  }
  function Si(e, t, n) {
    return e = qe(6, e, null, t), e.lanes = n, e;
  }
  function Ei(e, t, n) {
    return t = qe(4, e.children !== null ? e.children : [], e.key, t), t.lanes = n, t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }, t;
  }
  function jf(e, t, n, r, l) {
    this.tag = t, this.containerInfo = e, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = Yl(0), this.expirationTimes = Yl(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Yl(0), this.identifierPrefix = r, this.onRecoverableError = l, this.mutableSourceEagerHydrationData = null;
  }
  function xi(e, t, n, r, l, o, i, u, s) {
    return e = new jf(e, t, n, u, s), t === 1 ? (t = 1, o === !0 && (t |= 8)) : t = 0, o = qe(3, null, null, t), e.current = o, o.stateNode = e, o.memoizedState = { element: r, isDehydrated: n, cache: null, transitions: null, pendingSuspenseBoundaries: null }, Do(o), e;
  }
  function Mf(e, t, n) {
    var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return { $$typeof: Le, key: r == null ? null : "" + r, children: e, containerInfo: t, implementation: n };
  }
  function Ea(e) {
    if (!e) return Mt;
    e = e._reactInternals;
    e: {
      if (Gt(e) !== e || e.tag !== 1) throw Error(v(170));
      var t = e;
      do {
        switch (t.tag) {
          case 3:
            t = t.stateNode.context;
            break e;
          case 1:
            if (je(t.type)) {
              t = t.stateNode.__reactInternalMemoizedMergedChildContext;
              break e;
            }
        }
        t = t.return;
      } while (t !== null);
      throw Error(v(171));
    }
    if (e.tag === 1) {
      var n = e.type;
      if (je(n)) return Zu(e, n, t);
    }
    return t;
  }
  function xa(e, t, n, r, l, o, i, u, s) {
    return e = xi(n, r, !0, e, l, o, i, u, s), e.context = Ea(null), n = e.current, r = Te(), l = Ht(n), o = xt(r, l), o.callback = t ?? null, Ft(n, o, l), e.current.lanes = l, Vn(e, l, r), Ae(e, r), e;
  }
  function Cl(e, t, n, r) {
    var l = t.current, o = Te(), i = Ht(l);
    return n = Ea(n), t.context === null ? t.context = n : t.pendingContext = n, t = xt(o, i), t.payload = { element: e }, r = r === void 0 ? null : r, r !== null && (t.callback = r), e = Ft(l, t, i), e !== null && (ut(e, l, i, o), nl(e, l, i)), i;
  }
  function Pl(e) {
    if (e = e.current, !e.child) return null;
    switch (e.child.tag) {
      case 5:
        return e.child.stateNode;
      default:
        return e.child.stateNode;
    }
  }
  function _a(e, t) {
    if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
      var n = e.retryLane;
      e.retryLane = n !== 0 && n < t ? n : t;
    }
  }
  function _i(e, t) {
    _a(e, t), (e = e.alternate) && _a(e, t);
  }
  function Df() {
    return null;
  }
  var Ca = typeof reportError == "function" ? reportError : function(e) {
    console.error(e);
  };
  function Ci(e) {
    this._internalRoot = e;
  }
  Nl.prototype.render = Ci.prototype.render = function(e) {
    var t = this._internalRoot;
    if (t === null) throw Error(v(409));
    Cl(e, t, null, null);
  }, Nl.prototype.unmount = Ci.prototype.unmount = function() {
    var e = this._internalRoot;
    if (e !== null) {
      this._internalRoot = null;
      var t = e.containerInfo;
      nn(function() {
        Cl(null, e, null, null);
      }), t[gt] = null;
    }
  };
  function Nl(e) {
    this._internalRoot = e;
  }
  Nl.prototype.unstable_scheduleHydration = function(e) {
    if (e) {
      var t = su();
      e = { blockedOn: null, target: e, priority: t };
      for (var n = 0; n < Tt.length && t !== 0 && t < Tt[n].priority; n++) ;
      Tt.splice(n, 0, e), n === 0 && fu(e);
    }
  };
  function Pi(e) {
    return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
  }
  function Ll(e) {
    return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
  }
  function Pa() {
  }
  function Af(e, t, n, r, l) {
    if (l) {
      if (typeof r == "function") {
        var o = r;
        r = function() {
          var m = Pl(i);
          o.call(m);
        };
      }
      var i = xa(t, r, e, 0, null, !1, !1, "", Pa);
      return e._reactRootContainer = i, e[gt] = i.current, tr(e.nodeType === 8 ? e.parentNode : e), nn(), i;
    }
    for (; l = e.lastChild; ) e.removeChild(l);
    if (typeof r == "function") {
      var u = r;
      r = function() {
        var m = Pl(s);
        u.call(m);
      };
    }
    var s = xi(e, 0, !1, null, null, !1, !1, "", Pa);
    return e._reactRootContainer = s, e[gt] = s.current, tr(e.nodeType === 8 ? e.parentNode : e), nn(function() {
      Cl(t, s, n, r);
    }), s;
  }
  function zl(e, t, n, r, l) {
    var o = n._reactRootContainer;
    if (o) {
      var i = o;
      if (typeof l == "function") {
        var u = l;
        l = function() {
          var s = Pl(i);
          u.call(s);
        };
      }
      Cl(t, i, e, l);
    } else i = Af(n, t, e, l, r);
    return Pl(i);
  }
  iu = function(e) {
    switch (e.tag) {
      case 3:
        var t = e.stateNode;
        if (t.current.memoizedState.isDehydrated) {
          var n = $n(t.pendingLanes);
          n !== 0 && (Xl(t, n | 1), Ae(t, pe()), (B & 6) === 0 && (Tn = pe() + 500, Dt()));
        }
        break;
      case 13:
        nn(function() {
          var r = Et(e, 1);
          if (r !== null) {
            var l = Te();
            ut(r, e, 1, l);
          }
        }), _i(e, 1);
    }
  }, Zl = function(e) {
    if (e.tag === 13) {
      var t = Et(e, 134217728);
      if (t !== null) {
        var n = Te();
        ut(t, e, 134217728, n);
      }
      _i(e, 134217728);
    }
  }, uu = function(e) {
    if (e.tag === 13) {
      var t = Ht(e), n = Et(e, t);
      if (n !== null) {
        var r = Te();
        ut(n, e, t, r);
      }
      _i(e, t);
    }
  }, su = function() {
    return q;
  }, au = function(e, t) {
    var n = q;
    try {
      return q = e, t();
    } finally {
      q = n;
    }
  }, Hl = function(e, t, n) {
    switch (t) {
      case "input":
        if (jl(e, n), t = n.name, n.type === "radio" && t != null) {
          for (n = e; n.parentNode; ) n = n.parentNode;
          for (n = n.querySelectorAll("input[name=" + JSON.stringify("" + t) + '][type="radio"]'), t = 0; t < n.length; t++) {
            var r = n[t];
            if (r !== e && r.form === e.form) {
              var l = Qr(r);
              if (!l) throw Error(v(90));
              Oi(r), jl(r, l);
            }
          }
        }
        break;
      case "textarea":
        Fi(e, n);
        break;
      case "select":
        t = n.value, t != null && un(e, !!n.multiple, t, !1);
    }
  }, Gi = yi, Yi = nn;
  var Ff = { usingClientEntryPoint: !1, Events: [lr, yn, Qr, Wi, Qi, yi] }, gr = { findFiberByHostInstance: Yt, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" }, Uf = { bundleType: gr.bundleType, version: gr.version, rendererPackageName: gr.rendererPackageName, rendererConfig: gr.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: xe.ReactCurrentDispatcher, findHostInstanceByFiber: function(e) {
    return e = Ji(e), e === null ? null : e.stateNode;
  }, findFiberByHostInstance: gr.findFiberByHostInstance || Df, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
    var Tl = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!Tl.isDisabled && Tl.supportsFiber) try {
      Nr = Tl.inject(Uf), ft = Tl;
    } catch {
    }
  }
  return Fe.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Ff, Fe.createPortal = function(e, t) {
    var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!Pi(t)) throw Error(v(200));
    return Mf(e, t, null, n);
  }, Fe.createRoot = function(e, t) {
    if (!Pi(e)) throw Error(v(299));
    var n = !1, r = "", l = Ca;
    return t != null && (t.unstable_strictMode === !0 && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onRecoverableError !== void 0 && (l = t.onRecoverableError)), t = xi(e, 1, !1, null, null, n, !1, r, l), e[gt] = t.current, tr(e.nodeType === 8 ? e.parentNode : e), new Ci(t);
  }, Fe.findDOMNode = function(e) {
    if (e == null) return null;
    if (e.nodeType === 1) return e;
    var t = e._reactInternals;
    if (t === void 0)
      throw typeof e.render == "function" ? Error(v(188)) : (e = Object.keys(e).join(","), Error(v(268, e)));
    return e = Ji(t), e = e === null ? null : e.stateNode, e;
  }, Fe.flushSync = function(e) {
    return nn(e);
  }, Fe.hydrate = function(e, t, n) {
    if (!Ll(t)) throw Error(v(200));
    return zl(null, e, t, !0, n);
  }, Fe.hydrateRoot = function(e, t, n) {
    if (!Pi(e)) throw Error(v(405));
    var r = n != null && n.hydratedSources || null, l = !1, o = "", i = Ca;
    if (n != null && (n.unstable_strictMode === !0 && (l = !0), n.identifierPrefix !== void 0 && (o = n.identifierPrefix), n.onRecoverableError !== void 0 && (i = n.onRecoverableError)), t = xa(t, null, e, 1, n ?? null, l, !1, o, i), e[gt] = t.current, tr(e), r) for (e = 0; e < r.length; e++) n = r[e], l = n._getVersion, l = l(n._source), t.mutableSourceEagerHydrationData == null ? t.mutableSourceEagerHydrationData = [n, l] : t.mutableSourceEagerHydrationData.push(
      n,
      l
    );
    return new Nl(t);
  }, Fe.render = function(e, t, n) {
    if (!Ll(t)) throw Error(v(200));
    return zl(null, e, t, !1, n);
  }, Fe.unmountComponentAtNode = function(e) {
    if (!Ll(e)) throw Error(v(40));
    return e._reactRootContainer ? (nn(function() {
      zl(null, null, e, !1, function() {
        e._reactRootContainer = null, e[gt] = null;
      });
    }), !0) : !1;
  }, Fe.unstable_batchedUpdates = yi, Fe.unstable_renderSubtreeIntoContainer = function(e, t, n, r) {
    if (!Ll(n)) throw Error(v(200));
    if (e == null || e._reactInternals === void 0) throw Error(v(38));
    return zl(e, t, n, !1, r);
  }, Fe.version = "18.3.1-next-f1338f8080-20240426", Fe;
}
var ja;
function Gf() {
  if (ja) return zi.exports;
  ja = 1;
  function p() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(p);
      } catch (x) {
        console.error(x);
      }
  }
  return p(), zi.exports = Qf(), zi.exports;
}
var Ma;
function Yf() {
  if (Ma) return Rl;
  Ma = 1;
  var p = Gf();
  return Rl.createRoot = p.createRoot, Rl.hydrateRoot = p.hydrateRoot, Rl;
}
var Xf = Yf();
const On = {
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    free: !1,
    defaultModel: "gemini-2.0-flash",
    placeholder: "AIza...",
    infoUrl: "https://aistudio.google.com/app/apikey",
    infoText: "Get a free key from Google AI Studio"
  },
  groq: {
    id: "groq",
    name: "Groq",
    free: !0,
    defaultModel: "llama-3.1-8b-instant",
    placeholder: "gsk_...",
    infoUrl: "https://console.groq.com/keys",
    infoText: "Get a free key from Groq Console"
  },
  ollama: {
    id: "ollama",
    name: "Ollama (local)",
    free: !0,
    noKey: !0,
    defaultModel: "llama3.2",
    placeholder: "http://localhost:11434",
    infoUrl: "https://ollama.ai",
    infoText: "Install Ollama on your machine"
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic Claude",
    free: !1,
    defaultModel: "claude-haiku-4-5-20251001",
    placeholder: "sk-ant-...",
    infoUrl: "https://console.anthropic.com/settings/keys",
    infoText: "Get a key from the Anthropic Console"
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    free: !1,
    defaultModel: "gpt-4o-mini",
    placeholder: "sk-...",
    infoUrl: "https://platform.openai.com/api-keys",
    infoText: "Get a key from the OpenAI Platform"
  }
};
function Zf(p) {
  return Object.hasOwn(On, p);
}
const qf = {
  gemini: ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.5-pro"],
  groq: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "openai/gpt-oss-120b"],
  ollama: ["llama3.2", "llama3.1", "mistral", "qwen2.5"],
  anthropic: ["claude-haiku-4-5-20251001", "claude-sonnet-4-5", "claude-opus-4-8"],
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"]
};
function Jf(p) {
  const x = qf[p], v = On[p].defaultModel;
  return x.includes(v) ? x : [v, ...x];
}
const $a = {
  config: "aiConfig"
}, kr = "http://localhost:11434";
function Il(p) {
  if (typeof localStorage < "u")
    return localStorage;
  throw new Error("No storage available: pass a ConfigStorage explicitly outside a browser.");
}
function bf(p) {
  if (typeof p != "object" || p === null)
    return null;
  const { provider: x, model: v, apiKeys: j } = p;
  if (typeof x != "string" || !Zf(x))
    return null;
  const H = Array.isArray(j) ? j.filter((F) => typeof F == "string" && F.trim().length > 0).map((F) => F.trim()) : [], Y = typeof v == "string" && v.trim() ? v.trim() : On[x].defaultModel;
  return { provider: x, model: Y, apiKeys: H };
}
function ed(p, x = $a) {
  const j = Il().getItem(x.config);
  if (!j)
    return { providers: [], ollamaUrl: kr };
  let H;
  try {
    H = JSON.parse(j);
  } catch {
    return { providers: [], ollamaUrl: kr };
  }
  if (typeof H != "object" || H === null)
    return { providers: [], ollamaUrl: kr };
  const { providers: Y, ollamaUrl: F } = H, b = Array.isArray(Y) ? Y.map(bf).filter((U) => U !== null) : [], D = typeof F == "string" && F.trim() ? F.trim() : kr;
  return { providers: b, ollamaUrl: D };
}
function td(p, x, v = $a) {
  const j = Il(), H = {
    providers: p.providers.map((Y) => ({
      provider: Y.provider,
      model: Y.model.trim(),
      apiKeys: Y.apiKeys.map((F) => F.trim()).filter((F) => F.length > 0)
    })),
    ollamaUrl: p.ollamaUrl.trim() || kr
  };
  j.setItem(v.config, JSON.stringify(H));
}
const Va = {
  chatgpt: {
    id: "chatgpt",
    name: "ChatGPT",
    homeUrl: "https://chatgpt.com/",
    buildUrl: (p) => `https://chatgpt.com/?${new URLSearchParams({ q: p, hints: "search" })}`
  },
  claude: {
    id: "claude",
    name: "Claude",
    homeUrl: "https://claude.ai/new",
    buildUrl: (p) => `https://claude.ai/new?${new URLSearchParams({ q: p })}`
  },
  gemini: {
    id: "gemini",
    name: "Gemini (Google AI Mode)",
    homeUrl: "https://www.google.com/",
    // gemini.google.com itself has no known prefill parameter. Google
    // Search's AI Mode does (`udm=50`), and is the more reliable target for
    // "ask Google's AI this" — that's what this actually opens.
    buildUrl: (p) => `https://www.google.com/search?${new URLSearchParams({ q: p, udm: "50" })}`
  },
  geminiApp: {
    id: "geminiApp",
    name: "Gemini",
    homeUrl: "https://gemini.google.com/app",
    // The real Gemini app, distinct from the AI-Mode entry above. It has no
    // known query-prefill parameter — opens the plain app; the question
    // still goes to the clipboard.
    buildUrl: null
  },
  groq: {
    id: "groq",
    name: "Groq",
    homeUrl: "https://groq.com/",
    // No known query-prefill parameter for Groq's consumer chat product —
    // opens the plain homepage; the question still goes to the clipboard.
    buildUrl: null
  }
}, Ha = "aiExternalChatFavorite";
function nd(p) {
  return Object.hasOwn(Va, p);
}
function rd(p, x = Ha) {
  const v = Il().getItem(x);
  return v !== null && nd(v) ? v : null;
}
function ld(p, x, v = Ha) {
  const j = Il();
  p === null ? j.removeItem(v) : j.setItem(v, p);
}
const od = ["he"], id = {
  en: {
    picker: {
      intro: "Add one or more providers below — they're tried in order, with automatic fallback if one runs out or fails.",
      emptyState: "No providers added yet — add one below to get started.",
      modelLabel: "Model",
      urlLabel: (p) => `${p} URL`,
      apiKeyLabel: (p, x) => `${p} API key${x > 1 ? "s" : ""}`,
      addKey: "+ Add a key",
      addAnotherKey: "+ Add another key",
      removeProviderLabel: (p) => `Remove ${p}`,
      removeKeyLabel: (p) => `Remove this ${p} key`,
      chooseProviderPlaceholder: "Choose a provider…",
      chooseProviderAriaLabel: "Choose a provider to add",
      freeSuffix: " (free)",
      addProviderButton: "+ Add provider",
      favoriteGroupAriaLabel: "Favorite free AI app",
      favoriteLead: "Or save a favorite free AI app for later:",
      favoriteNone: "None",
      favoriteHint: "Just a saved preference — picking one here never opens anything.",
      glossaryLinkText: "New to AI agents? What's a prompt, model, or API key?"
    },
    askExternally: {
      askButton: (p) => `Ask ${p}`,
      openedPrefix: (p) => `Opened ${p}`,
      openedWithQuestion: " with your question filled in",
      copiedToClipboard: " — also copied to your clipboard."
    },
    noProvider: {
      lead: "You haven't set up an AI provider yet.",
      openSettings: "Open AI settings",
      noFavoriteHint: "Or save a favorite free AI app in Settings to skip API keys entirely.",
      orDivider: "or"
    },
    conversationIntro: {
      text: "You're chatting with AI — replies can be wrong, so double-check anything important."
    }
  },
  fr: {
    picker: {
      intro: "Ajoutez un ou plusieurs fournisseurs ci-dessous — ils sont essayés dans l'ordre, avec un repli automatique si l'un est épuisé ou échoue.",
      emptyState: "Aucun fournisseur ajouté pour l'instant — ajoutez-en un ci-dessous pour commencer.",
      modelLabel: "Modèle",
      urlLabel: (p) => `URL ${p}`,
      apiKeyLabel: (p, x) => `Clé${x > 1 ? "s" : ""} API ${p}`,
      addKey: "+ Ajouter une clé",
      addAnotherKey: "+ Ajouter une autre clé",
      removeProviderLabel: (p) => `Supprimer ${p}`,
      removeKeyLabel: (p) => `Supprimer cette clé ${p}`,
      chooseProviderPlaceholder: "Choisissez un fournisseur…",
      chooseProviderAriaLabel: "Choisir un fournisseur à ajouter",
      freeSuffix: " (gratuit)",
      addProviderButton: "+ Ajouter un fournisseur",
      favoriteGroupAriaLabel: "Application IA gratuite favorite",
      favoriteLead: "Ou enregistrez une application IA gratuite favorite pour plus tard :",
      favoriteNone: "Aucune",
      favoriteHint: "Juste une préférence enregistrée — en choisir une ici n'ouvre jamais rien.",
      glossaryLinkText: "Nouveau dans les agents IA ? Qu'est-ce qu'un prompt, un modèle ou une clé API ?"
    },
    askExternally: {
      askButton: (p) => `Demander à ${p}`,
      openedPrefix: (p) => `${p} ouvert`,
      openedWithQuestion: " avec votre question déjà remplie",
      copiedToClipboard: " — également copiée dans le presse-papiers."
    },
    noProvider: {
      lead: "Vous n'avez pas encore configuré de fournisseur IA.",
      openSettings: "Ouvrir les réglages IA",
      noFavoriteHint: "Ou enregistrez une application IA gratuite favorite dans les réglages pour éviter les clés API.",
      orDivider: "ou"
    },
    conversationIntro: {
      text: "Vous discutez avec une IA — les réponses peuvent être fausses, vérifiez tout ce qui compte."
    }
  },
  he: {
    picker: {
      intro: "הוסיפו ספק אחד או יותר למטה — הם ינוסו לפי הסדר, עם מעבר אוטומטי לחלופה אם אחד נכשל או נגמר.",
      emptyState: "עדיין לא נוספו ספקים — הוסיפו אחד למטה כדי להתחיל.",
      modelLabel: "מודל",
      urlLabel: (p) => `כתובת URL של ${p}`,
      apiKeyLabel: (p, x) => `מפתח${x > 1 ? "ות" : ""} API של ${p}`,
      addKey: "+ הוספת מפתח",
      addAnotherKey: "+ הוספת מפתח נוסף",
      removeProviderLabel: (p) => `הסרת ${p}`,
      removeKeyLabel: (p) => `הסרת מפתח ${p} זה`,
      chooseProviderPlaceholder: "בחרו ספק…",
      chooseProviderAriaLabel: "בחירת ספק להוספה",
      freeSuffix: " (חינם)",
      addProviderButton: "+ הוספת ספק",
      favoriteGroupAriaLabel: "אפליקציית AI חינמית מועדפת",
      favoriteLead: "או שמרו אפליקציית AI חינמית מועדפת לשימוש מאוחר יותר:",
      favoriteNone: "ללא",
      favoriteHint: "רק העדפה שמורה — בחירה כאן לעולם לא פותחת שום דבר.",
      glossaryLinkText: "חדשים בעולם סוכני ה-AI? מה זה פרומפט, מודל או מפתח API?"
    },
    askExternally: {
      askButton: (p) => `שאלו את ${p}`,
      openedPrefix: (p) => `${p} נפתח`,
      openedWithQuestion: " עם השאלה שלכם כבר ממולאת",
      copiedToClipboard: " — היא גם הועתקה ללוח."
    },
    noProvider: {
      lead: "עדיין לא הגדרתם ספק AI.",
      openSettings: "פתיחת הגדרות AI",
      noFavoriteHint: "או שמרו אפליקציית AI חינמית מועדפת בהגדרות כדי לדלג לגמרי על מפתחות API.",
      orDivider: "או"
    },
    conversationIntro: {
      text: "אתם משוחחים עם AI — התשובות עלולות להיות שגויות, בדקו כל דבר חשוב בעצמכם."
    }
  }
};
function ud(p) {
  return id[p];
}
function sd(p) {
  return od.includes(p) ? "rtl" : "ltr";
}
const ad = "https://joka-7.github.io/ModelDispatcher/ai-glossary.html", cd = Object.values(On), fd = Object.values(Va);
function dd(p, x, v) {
  return { ...p, providers: p.providers.map((j, H) => H === x ? { ...j, ...v } : j) };
}
function pd(p, x, v, j) {
  return {
    ...p,
    providers: p.providers.map((H, Y) => Y === x ? { ...H, apiKeys: H.apiKeys.map((F, b) => b === v ? j : F) } : H)
  };
}
function md(p, x) {
  return {
    ...p,
    providers: p.providers.map((v, j) => j === x ? { ...v, apiKeys: [...v.apiKeys, ""] } : v)
  };
}
function vd(p, x, v) {
  return {
    ...p,
    providers: p.providers.map((j, H) => H === x ? { ...j, apiKeys: j.apiKeys.filter((Y, F) => F !== v) } : j)
  };
}
function hd(p, x) {
  return { ...p, providers: p.providers.filter((v, j) => j !== x) };
}
function yd(p, x) {
  const v = On[x], j = { provider: x, model: v.defaultModel, apiKeys: v.noKey ? [] : [""] };
  return { ...p, providers: [...p.providers, j] };
}
function gd({ config: p, onConfigChange: x, externalChatFavorite: v, onExternalChatFavoriteChange: j, glossaryUrl: H = ad, locale: Y = "en" }) {
  const [F, b] = In.useState(""), D = cd.filter((I) => !p.providers.some((K) => K.provider === I.id)), U = ud(Y).picker;
  function ae() {
    F && (x(yd(p, F)), b(""));
  }
  return M.jsxs("div", { className: "md-picker", dir: sd(Y), children: [M.jsx("p", { className: "md-lead", children: U.intro }), p.providers.length === 0 && M.jsx("p", { className: "md-empty-state", children: U.emptyState }), p.providers.map((I, K) => {
    const ne = On[I.provider];
    return M.jsxs("div", { className: "md-provider-card", children: [M.jsxs("div", { className: "md-provider-card-head", children: [M.jsxs("span", { className: "md-provider-name", children: [ne.name, ne.free && M.jsx("span", { className: "md-badge md-badge-free", children: "free" }), ne.noKey && M.jsx("span", { className: "md-badge md-badge-nokey", children: "no key" })] }), M.jsx("button", { type: "button", className: "md-remove-btn", "aria-label": U.removeProviderLabel(ne.name), onClick: () => x(hd(p, K)), children: "×" })] }), M.jsxs("div", { className: "md-field", children: [M.jsx("label", { htmlFor: `md-model-${I.provider}`, children: U.modelLabel }), M.jsx("select", { id: `md-model-${I.provider}`, className: "md-select", value: I.model, onChange: (ce) => x(dd(p, K, { model: ce.target.value })), children: Jf(I.provider).map((ce) => M.jsx("option", { value: ce, children: ce }, ce)) })] }), ne.noKey ? M.jsxs("div", { className: "md-field", children: [M.jsx("label", { htmlFor: "md-ollama-url", children: U.urlLabel(ne.name) }), M.jsx("input", { id: "md-ollama-url", className: "md-input", type: "text", placeholder: ne.placeholder, value: p.ollamaUrl, onChange: (ce) => x({ ...p, ollamaUrl: ce.target.value }) })] }) : M.jsxs("div", { className: "md-field", children: [M.jsx("label", { children: U.apiKeyLabel(ne.name, I.apiKeys.length) }), M.jsx("div", { className: "md-key-list", children: I.apiKeys.map((ce, J) => M.jsxs("div", { className: "md-key-row", children: [M.jsx("input", { className: "md-input", type: "password", autoComplete: "off", placeholder: ne.placeholder, value: ce, onChange: (X) => x(pd(p, K, J, X.target.value)) }), M.jsx("button", { type: "button", className: "md-remove-btn md-remove-btn-small", "aria-label": U.removeKeyLabel(ne.name), onClick: () => x(vd(p, K, J)), children: "×" })] }, J)) }), M.jsxs("div", { className: "md-key-actions", children: [M.jsx("button", { type: "button", className: "md-link-btn", onClick: () => x(md(p, K)), children: I.apiKeys.length === 0 ? U.addKey : U.addAnotherKey }), M.jsx("a", { className: "md-help-link", href: ne.infoUrl, target: "_blank", rel: "noreferrer", children: ne.infoText })] })] })] }, I.provider);
  }), D.length > 0 && M.jsxs("div", { className: "md-add-provider", children: [M.jsxs("select", { className: "md-select", "aria-label": U.chooseProviderAriaLabel, value: F, onChange: (I) => b(I.target.value), children: [M.jsx("option", { value: "", children: U.chooseProviderPlaceholder }), D.map((I) => M.jsxs("option", { value: I.id, children: [I.name, I.free ? U.freeSuffix : ""] }, I.id))] }), M.jsx("button", { type: "button", className: "md-add-btn", disabled: !F, onClick: ae, children: U.addProviderButton })] }), M.jsxs("div", { className: "md-favorite", role: "radiogroup", "aria-label": U.favoriteGroupAriaLabel, children: [M.jsx("p", { className: "md-favorite-lead", children: U.favoriteLead }), M.jsxs("div", { className: "md-favorite-options", children: [M.jsxs("label", { className: "md-favorite-option", children: [M.jsx("input", { type: "radio", name: "md-external-chat-favorite", checked: v === null, onChange: () => j(null) }), U.favoriteNone] }), fd.map((I) => M.jsxs("label", { className: "md-favorite-option", children: [M.jsx("input", { type: "radio", name: "md-external-chat-favorite", checked: v === I.id, onChange: () => j(I.id) }), I.name] }, I.id))] }), M.jsx("p", { className: "md-favorite-hint", children: U.favoriteHint })] }), M.jsx("a", { className: "md-glossary-link", href: H, target: "_blank", rel: "noreferrer", children: U.glossaryLinkText })] });
}
const Da = { config: "shas-radar:ai-config" }, Aa = "shas-radar:ai-external-chat-favorite", Fa = "shas-radar:locale-changed";
function Ba(p) {
  return p === "en" || p === "fr" || p === "he";
}
function wd() {
  const p = document.documentElement.lang;
  return Ba(p) ? p : "he";
}
function kd() {
  const [p, x] = In.useState(wd), [v, j] = In.useState(() => ed(void 0, Da)), [H, Y] = In.useState(
    () => rd(void 0, Aa)
  );
  In.useEffect(() => {
    function D(U) {
      const ae = U.detail;
      typeof ae == "string" && Ba(ae) && x(ae);
    }
    return window.addEventListener(Fa, D), () => window.removeEventListener(Fa, D);
  }, []);
  function F(D) {
    j(D), td(D, void 0, Da);
  }
  function b(D) {
    Y(D), ld(D, void 0, Aa);
  }
  return /* @__PURE__ */ M.jsx(
    gd,
    {
      config: v,
      onConfigChange: F,
      externalChatFavorite: H,
      onExternalChatFavoriteChange: b,
      locale: p
    }
  );
}
const Ua = document.getElementById("ai-model-picker-root");
Ua && Xf.createRoot(Ua).render(
  /* @__PURE__ */ M.jsx(In.StrictMode, { children: /* @__PURE__ */ M.jsx(kd, {}) })
);
