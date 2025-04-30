// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

(function (
  modules,
  entry,
  mainEntry,
  parcelRequireName,
  externals,
  distDir,
  publicUrl,
  devServer
) {
  /* eslint-disable no-undef */
  var globalObject =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof self !== 'undefined'
      ? self
      : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
      ? global
      : {};
  /* eslint-enable no-undef */

  // Save the require from previous bundle to this closure if any
  var previousRequire =
    typeof globalObject[parcelRequireName] === 'function' &&
    globalObject[parcelRequireName];

  var importMap = previousRequire.i || {};
  var cache = previousRequire.cache || {};
  // Do not use `require` to prevent Webpack from trying to bundle this call
  var nodeRequire =
    typeof module !== 'undefined' &&
    typeof module.require === 'function' &&
    module.require.bind(module);

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        if (externals[name]) {
          return externals[name];
        }
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire =
          typeof globalObject[parcelRequireName] === 'function' &&
          globalObject[parcelRequireName];
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error("Cannot find module '" + name + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = (cache[name] = new newRequire.Module(name));

      modules[name][0].call(
        module.exports,
        localRequire,
        module,
        module.exports,
        globalObject
      );
    }

    return cache[name].exports;

    function localRequire(x) {
      var res = localRequire.resolve(x);
      return res === false ? {} : newRequire(res);
    }

    function resolve(x) {
      var id = modules[name][1][x];
      return id != null ? id : x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.require = nodeRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.distDir = distDir;
  newRequire.publicUrl = publicUrl;
  newRequire.devServer = devServer;
  newRequire.i = importMap;
  newRequire.register = function (id, exports) {
    modules[id] = [
      function (require, module) {
        module.exports = exports;
      },
      {},
    ];
  };

  // Only insert newRequire.load when it is actually used.
  // The code in this file is linted against ES5, so dynamic import is not allowed.
  // INSERT_LOAD_HERE

  Object.defineProperty(newRequire, 'root', {
    get: function () {
      return globalObject[parcelRequireName];
    },
  });

  globalObject[parcelRequireName] = newRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (mainEntry) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(mainEntry);

    // CommonJS
    if (typeof exports === 'object' && typeof module !== 'undefined') {
      module.exports = mainExports;

      // RequireJS
    } else if (typeof define === 'function' && define.amd) {
      define(function () {
        return mainExports;
      });
    }
  }
})({"io2N8":[function(require,module,exports,__globalThis) {
var global = arguments[3];
var HMR_HOST = null;
var HMR_PORT = null;
var HMR_SERVER_PORT = 1234;
var HMR_SECURE = false;
var HMR_ENV_HASH = "439701173a9199ea";
var HMR_USE_SSE = false;
module.bundle.HMR_BUNDLE_ID = "ba2beaa036960861";
"use strict";
/* global HMR_HOST, HMR_PORT, HMR_SERVER_PORT, HMR_ENV_HASH, HMR_SECURE, HMR_USE_SSE, chrome, browser, __parcel__import__, __parcel__importScripts__, ServiceWorkerGlobalScope */ /*::
import type {
  HMRAsset,
  HMRMessage,
} from '@parcel/reporter-dev-server/src/HMRServer.js';
interface ParcelRequire {
  (string): mixed;
  cache: {|[string]: ParcelModule|};
  hotData: {|[string]: mixed|};
  Module: any;
  parent: ?ParcelRequire;
  isParcelRequire: true;
  modules: {|[string]: [Function, {|[string]: string|}]|};
  HMR_BUNDLE_ID: string;
  root: ParcelRequire;
}
interface ParcelModule {
  hot: {|
    data: mixed,
    accept(cb: (Function) => void): void,
    dispose(cb: (mixed) => void): void,
    // accept(deps: Array<string> | string, cb: (Function) => void): void,
    // decline(): void,
    _acceptCallbacks: Array<(Function) => void>,
    _disposeCallbacks: Array<(mixed) => void>,
  |};
}
interface ExtensionContext {
  runtime: {|
    reload(): void,
    getURL(url: string): string;
    getManifest(): {manifest_version: number, ...};
  |};
}
declare var module: {bundle: ParcelRequire, ...};
declare var HMR_HOST: string;
declare var HMR_PORT: string;
declare var HMR_SERVER_PORT: string;
declare var HMR_ENV_HASH: string;
declare var HMR_SECURE: boolean;
declare var HMR_USE_SSE: boolean;
declare var chrome: ExtensionContext;
declare var browser: ExtensionContext;
declare var __parcel__import__: (string) => Promise<void>;
declare var __parcel__importScripts__: (string) => Promise<void>;
declare var globalThis: typeof self;
declare var ServiceWorkerGlobalScope: Object;
*/ var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;
function Module(moduleName) {
    OldModule.call(this, moduleName);
    this.hot = {
        data: module.bundle.hotData[moduleName],
        _acceptCallbacks: [],
        _disposeCallbacks: [],
        accept: function(fn) {
            this._acceptCallbacks.push(fn || function() {});
        },
        dispose: function(fn) {
            this._disposeCallbacks.push(fn);
        }
    };
    module.bundle.hotData[moduleName] = undefined;
}
module.bundle.Module = Module;
module.bundle.hotData = {};
var checkedAssets /*: {|[string]: boolean|} */ , disposedAssets /*: {|[string]: boolean|} */ , assetsToDispose /*: Array<[ParcelRequire, string]> */ , assetsToAccept /*: Array<[ParcelRequire, string]> */ , bundleNotFound = false;
function getHostname() {
    return HMR_HOST || (typeof location !== 'undefined' && location.protocol.indexOf('http') === 0 ? location.hostname : 'localhost');
}
function getPort() {
    return HMR_PORT || (typeof location !== 'undefined' ? location.port : HMR_SERVER_PORT);
}
// eslint-disable-next-line no-redeclare
let WebSocket = globalThis.WebSocket;
if (!WebSocket && typeof module.bundle.root === 'function') try {
    // eslint-disable-next-line no-global-assign
    WebSocket = module.bundle.root('ws');
} catch  {
// ignore.
}
var hostname = getHostname();
var port = getPort();
var protocol = HMR_SECURE || typeof location !== 'undefined' && location.protocol === 'https:' && ![
    'localhost',
    '127.0.0.1',
    '0.0.0.0'
].includes(hostname) ? 'wss' : 'ws';
// eslint-disable-next-line no-redeclare
var parent = module.bundle.parent;
if (!parent || !parent.isParcelRequire) {
    // Web extension context
    var extCtx = typeof browser === 'undefined' ? typeof chrome === 'undefined' ? null : chrome : browser;
    // Safari doesn't support sourceURL in error stacks.
    // eval may also be disabled via CSP, so do a quick check.
    var supportsSourceURL = false;
    try {
        (0, eval)('throw new Error("test"); //# sourceURL=test.js');
    } catch (err) {
        supportsSourceURL = err.stack.includes('test.js');
    }
    var ws;
    if (HMR_USE_SSE) ws = new EventSource('/__parcel_hmr');
    else try {
        // If we're running in the dev server's node runner, listen for messages on the parent port.
        let { workerData, parentPort } = module.bundle.root('node:worker_threads') /*: any*/ ;
        if (workerData !== null && workerData !== void 0 && workerData.__parcel) {
            parentPort.on('message', async (message)=>{
                try {
                    await handleMessage(message);
                    parentPort.postMessage('updated');
                } catch  {
                    parentPort.postMessage('restart');
                }
            });
            // After the bundle has finished running, notify the dev server that the HMR update is complete.
            queueMicrotask(()=>parentPort.postMessage('ready'));
        }
    } catch  {
        if (typeof WebSocket !== 'undefined') try {
            ws = new WebSocket(protocol + '://' + hostname + (port ? ':' + port : '') + '/');
        } catch (err) {
            // Ignore cloudflare workers error.
            if (err.message && !err.message.includes('Disallowed operation called within global scope')) console.error(err.message);
        }
    }
    if (ws) {
        // $FlowFixMe
        ws.onmessage = async function(event /*: {data: string, ...} */ ) {
            var data /*: HMRMessage */  = JSON.parse(event.data);
            await handleMessage(data);
        };
        if (ws instanceof WebSocket) {
            ws.onerror = function(e) {
                if (e.message) console.error(e.message);
            };
            ws.onclose = function() {
                console.warn("[parcel] \uD83D\uDEA8 Connection to the HMR server was lost");
            };
        }
    }
}
async function handleMessage(data /*: HMRMessage */ ) {
    checkedAssets = {} /*: {|[string]: boolean|} */ ;
    disposedAssets = {} /*: {|[string]: boolean|} */ ;
    assetsToAccept = [];
    assetsToDispose = [];
    bundleNotFound = false;
    if (data.type === 'reload') fullReload();
    else if (data.type === 'update') {
        // Remove error overlay if there is one
        if (typeof document !== 'undefined') removeErrorOverlay();
        let assets = data.assets;
        // Handle HMR Update
        let handled = assets.every((asset)=>{
            return asset.type === 'css' || asset.type === 'js' && hmrAcceptCheck(module.bundle.root, asset.id, asset.depsByBundle);
        });
        // Dispatch a custom event in case a bundle was not found. This might mean
        // an asset on the server changed and we should reload the page. This event
        // gives the client an opportunity to refresh without losing state
        // (e.g. via React Server Components). If e.preventDefault() is not called,
        // we will trigger a full page reload.
        if (handled && bundleNotFound && assets.some((a)=>a.envHash !== HMR_ENV_HASH) && typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') handled = !window.dispatchEvent(new CustomEvent('parcelhmrreload', {
            cancelable: true
        }));
        if (handled) {
            console.clear();
            // Dispatch custom event so other runtimes (e.g React Refresh) are aware.
            if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') window.dispatchEvent(new CustomEvent('parcelhmraccept'));
            await hmrApplyUpdates(assets);
            hmrDisposeQueue();
            // Run accept callbacks. This will also re-execute other disposed assets in topological order.
            let processedAssets = {};
            for(let i = 0; i < assetsToAccept.length; i++){
                let id = assetsToAccept[i][1];
                if (!processedAssets[id]) {
                    hmrAccept(assetsToAccept[i][0], id);
                    processedAssets[id] = true;
                }
            }
        } else fullReload();
    }
    if (data.type === 'error') {
        // Log parcel errors to console
        for (let ansiDiagnostic of data.diagnostics.ansi){
            let stack = ansiDiagnostic.codeframe ? ansiDiagnostic.codeframe : ansiDiagnostic.stack;
            console.error("\uD83D\uDEA8 [parcel]: " + ansiDiagnostic.message + '\n' + stack + '\n\n' + ansiDiagnostic.hints.join('\n'));
        }
        if (typeof document !== 'undefined') {
            // Render the fancy html overlay
            removeErrorOverlay();
            var overlay = createErrorOverlay(data.diagnostics.html);
            // $FlowFixMe
            document.body.appendChild(overlay);
        }
    }
}
function removeErrorOverlay() {
    var overlay = document.getElementById(OVERLAY_ID);
    if (overlay) {
        overlay.remove();
        console.log("[parcel] \u2728 Error resolved");
    }
}
function createErrorOverlay(diagnostics) {
    var overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    let errorHTML = '<div style="background: black; opacity: 0.85; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; font-family: Menlo, Consolas, monospace; z-index: 9999;">';
    for (let diagnostic of diagnostics){
        let stack = diagnostic.frames.length ? diagnostic.frames.reduce((p, frame)=>{
            return `${p}
<a href="${protocol === 'wss' ? 'https' : 'http'}://${hostname}:${port}/__parcel_launch_editor?file=${encodeURIComponent(frame.location)}" style="text-decoration: underline; color: #888" onclick="fetch(this.href); return false">${frame.location}</a>
${frame.code}`;
        }, '') : diagnostic.stack;
        errorHTML += `
      <div>
        <div style="font-size: 18px; font-weight: bold; margin-top: 20px;">
          \u{1F6A8} ${diagnostic.message}
        </div>
        <pre>${stack}</pre>
        <div>
          ${diagnostic.hints.map((hint)=>"<div>\uD83D\uDCA1 " + hint + '</div>').join('')}
        </div>
        ${diagnostic.documentation ? `<div>\u{1F4DD} <a style="color: violet" href="${diagnostic.documentation}" target="_blank">Learn more</a></div>` : ''}
      </div>
    `;
    }
    errorHTML += '</div>';
    overlay.innerHTML = errorHTML;
    return overlay;
}
function fullReload() {
    if (typeof location !== 'undefined' && 'reload' in location) location.reload();
    else if (typeof extCtx !== 'undefined' && extCtx && extCtx.runtime && extCtx.runtime.reload) extCtx.runtime.reload();
    else try {
        let { workerData, parentPort } = module.bundle.root('node:worker_threads') /*: any*/ ;
        if (workerData !== null && workerData !== void 0 && workerData.__parcel) parentPort.postMessage('restart');
    } catch (err) {
        console.error("[parcel] \u26A0\uFE0F An HMR update was not accepted. Please restart the process.");
    }
}
function getParents(bundle, id) /*: Array<[ParcelRequire, string]> */ {
    var modules = bundle.modules;
    if (!modules) return [];
    var parents = [];
    var k, d, dep;
    for(k in modules)for(d in modules[k][1]){
        dep = modules[k][1][d];
        if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) parents.push([
            bundle,
            k
        ]);
    }
    if (bundle.parent) parents = parents.concat(getParents(bundle.parent, id));
    return parents;
}
function updateLink(link) {
    var href = link.getAttribute('href');
    if (!href) return;
    var newLink = link.cloneNode();
    newLink.onload = function() {
        if (link.parentNode !== null) // $FlowFixMe
        link.parentNode.removeChild(link);
    };
    newLink.setAttribute('href', // $FlowFixMe
    href.split('?')[0] + '?' + Date.now());
    // $FlowFixMe
    link.parentNode.insertBefore(newLink, link.nextSibling);
}
var cssTimeout = null;
function reloadCSS() {
    if (cssTimeout || typeof document === 'undefined') return;
    cssTimeout = setTimeout(function() {
        var links = document.querySelectorAll('link[rel="stylesheet"]');
        for(var i = 0; i < links.length; i++){
            // $FlowFixMe[incompatible-type]
            var href /*: string */  = links[i].getAttribute('href');
            var hostname = getHostname();
            var servedFromHMRServer = hostname === 'localhost' ? new RegExp('^(https?:\\/\\/(0.0.0.0|127.0.0.1)|localhost):' + getPort()).test(href) : href.indexOf(hostname + ':' + getPort());
            var absolute = /^https?:\/\//i.test(href) && href.indexOf(location.origin) !== 0 && !servedFromHMRServer;
            if (!absolute) updateLink(links[i]);
        }
        cssTimeout = null;
    }, 50);
}
function hmrDownload(asset) {
    if (asset.type === 'js') {
        if (typeof document !== 'undefined') {
            let script = document.createElement('script');
            script.src = asset.url + '?t=' + Date.now();
            if (asset.outputFormat === 'esmodule') script.type = 'module';
            return new Promise((resolve, reject)=>{
                var _document$head;
                script.onload = ()=>resolve(script);
                script.onerror = reject;
                (_document$head = document.head) === null || _document$head === void 0 || _document$head.appendChild(script);
            });
        } else if (typeof importScripts === 'function') {
            // Worker scripts
            if (asset.outputFormat === 'esmodule') return import(asset.url + '?t=' + Date.now());
            else return new Promise((resolve, reject)=>{
                try {
                    importScripts(asset.url + '?t=' + Date.now());
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        }
    }
}
async function hmrApplyUpdates(assets) {
    global.parcelHotUpdate = Object.create(null);
    let scriptsToRemove;
    try {
        // If sourceURL comments aren't supported in eval, we need to load
        // the update from the dev server over HTTP so that stack traces
        // are correct in errors/logs. This is much slower than eval, so
        // we only do it if needed (currently just Safari).
        // https://bugs.webkit.org/show_bug.cgi?id=137297
        // This path is also taken if a CSP disallows eval.
        if (!supportsSourceURL) {
            let promises = assets.map((asset)=>{
                var _hmrDownload;
                return (_hmrDownload = hmrDownload(asset)) === null || _hmrDownload === void 0 ? void 0 : _hmrDownload.catch((err)=>{
                    // Web extension fix
                    if (extCtx && extCtx.runtime && extCtx.runtime.getManifest().manifest_version == 3 && typeof ServiceWorkerGlobalScope != 'undefined' && global instanceof ServiceWorkerGlobalScope) {
                        extCtx.runtime.reload();
                        return;
                    }
                    throw err;
                });
            });
            scriptsToRemove = await Promise.all(promises);
        }
        assets.forEach(function(asset) {
            hmrApply(module.bundle.root, asset);
        });
    } finally{
        delete global.parcelHotUpdate;
        if (scriptsToRemove) scriptsToRemove.forEach((script)=>{
            if (script) {
                var _document$head2;
                (_document$head2 = document.head) === null || _document$head2 === void 0 || _document$head2.removeChild(script);
            }
        });
    }
}
function hmrApply(bundle /*: ParcelRequire */ , asset /*:  HMRAsset */ ) {
    var modules = bundle.modules;
    if (!modules) return;
    if (asset.type === 'css') reloadCSS();
    else if (asset.type === 'js') {
        let deps = asset.depsByBundle[bundle.HMR_BUNDLE_ID];
        if (deps) {
            if (modules[asset.id]) {
                // Remove dependencies that are removed and will become orphaned.
                // This is necessary so that if the asset is added back again, the cache is gone, and we prevent a full page reload.
                let oldDeps = modules[asset.id][1];
                for(let dep in oldDeps)if (!deps[dep] || deps[dep] !== oldDeps[dep]) {
                    let id = oldDeps[dep];
                    let parents = getParents(module.bundle.root, id);
                    if (parents.length === 1) hmrDelete(module.bundle.root, id);
                }
            }
            if (supportsSourceURL) // Global eval. We would use `new Function` here but browser
            // support for source maps is better with eval.
            (0, eval)(asset.output);
            // $FlowFixMe
            let fn = global.parcelHotUpdate[asset.id];
            modules[asset.id] = [
                fn,
                deps
            ];
        }
        // Always traverse to the parent bundle, even if we already replaced the asset in this bundle.
        // This is required in case modules are duplicated. We need to ensure all instances have the updated code.
        if (bundle.parent) hmrApply(bundle.parent, asset);
    }
}
function hmrDelete(bundle, id) {
    let modules = bundle.modules;
    if (!modules) return;
    if (modules[id]) {
        // Collect dependencies that will become orphaned when this module is deleted.
        let deps = modules[id][1];
        let orphans = [];
        for(let dep in deps){
            let parents = getParents(module.bundle.root, deps[dep]);
            if (parents.length === 1) orphans.push(deps[dep]);
        }
        // Delete the module. This must be done before deleting dependencies in case of circular dependencies.
        delete modules[id];
        delete bundle.cache[id];
        // Now delete the orphans.
        orphans.forEach((id)=>{
            hmrDelete(module.bundle.root, id);
        });
    } else if (bundle.parent) hmrDelete(bundle.parent, id);
}
function hmrAcceptCheck(bundle /*: ParcelRequire */ , id /*: string */ , depsByBundle /*: ?{ [string]: { [string]: string } }*/ ) {
    checkedAssets = {};
    if (hmrAcceptCheckOne(bundle, id, depsByBundle)) return true;
    // Traverse parents breadth first. All possible ancestries must accept the HMR update, or we'll reload.
    let parents = getParents(module.bundle.root, id);
    let accepted = false;
    while(parents.length > 0){
        let v = parents.shift();
        let a = hmrAcceptCheckOne(v[0], v[1], null);
        if (a) // If this parent accepts, stop traversing upward, but still consider siblings.
        accepted = true;
        else if (a !== null) {
            // Otherwise, queue the parents in the next level upward.
            let p = getParents(module.bundle.root, v[1]);
            if (p.length === 0) {
                // If there are no parents, then we've reached an entry without accepting. Reload.
                accepted = false;
                break;
            }
            parents.push(...p);
        }
    }
    return accepted;
}
function hmrAcceptCheckOne(bundle /*: ParcelRequire */ , id /*: string */ , depsByBundle /*: ?{ [string]: { [string]: string } }*/ ) {
    var modules = bundle.modules;
    if (!modules) return;
    if (depsByBundle && !depsByBundle[bundle.HMR_BUNDLE_ID]) {
        // If we reached the root bundle without finding where the asset should go,
        // there's nothing to do. Mark as "accepted" so we don't reload the page.
        if (!bundle.parent) {
            bundleNotFound = true;
            return true;
        }
        return hmrAcceptCheckOne(bundle.parent, id, depsByBundle);
    }
    if (checkedAssets[id]) return null;
    checkedAssets[id] = true;
    var cached = bundle.cache[id];
    if (!cached) return true;
    assetsToDispose.push([
        bundle,
        id
    ]);
    if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
        assetsToAccept.push([
            bundle,
            id
        ]);
        return true;
    }
    return false;
}
function hmrDisposeQueue() {
    // Dispose all old assets.
    for(let i = 0; i < assetsToDispose.length; i++){
        let id = assetsToDispose[i][1];
        if (!disposedAssets[id]) {
            hmrDispose(assetsToDispose[i][0], id);
            disposedAssets[id] = true;
        }
    }
    assetsToDispose = [];
}
function hmrDispose(bundle /*: ParcelRequire */ , id /*: string */ ) {
    var cached = bundle.cache[id];
    bundle.hotData[id] = {};
    if (cached && cached.hot) cached.hot.data = bundle.hotData[id];
    if (cached && cached.hot && cached.hot._disposeCallbacks.length) cached.hot._disposeCallbacks.forEach(function(cb) {
        cb(bundle.hotData[id]);
    });
    delete bundle.cache[id];
}
function hmrAccept(bundle /*: ParcelRequire */ , id /*: string */ ) {
    // Execute the module.
    bundle(id);
    // Run the accept callbacks in the new version of the module.
    var cached = bundle.cache[id];
    if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
        let assetsToAlsoAccept = [];
        cached.hot._acceptCallbacks.forEach(function(cb) {
            let additionalAssets = cb(function() {
                return getParents(module.bundle.root, id);
            });
            if (Array.isArray(additionalAssets) && additionalAssets.length) assetsToAlsoAccept.push(...additionalAssets);
        });
        if (assetsToAlsoAccept.length) {
            let handled = assetsToAlsoAccept.every(function(a) {
                return hmrAcceptCheck(a[0], a[1]);
            });
            if (!handled) return fullReload();
            hmrDisposeQueue();
        }
    }
}

},{}],"bNJxx":[function(require,module,exports,__globalThis) {
// Imports MUST be at the top level
var _uiJs = require("./ui.js");
var _mapJs = require("./map.js"); // Keep OL map logic for now, maybe render to texture later?
var _globeJs = require("./globe.js");
var _stateJs = require("./state.js");
var _reteEditorJs = require("./rete-editor.js");
// import { initializeITownsView, getITownsView } from './itowns-view.js'; // Commented out due to build issues
var _syncJs = require("./sync.js");
// TODO: Resolve dependencies like ol, og being globally available or import them properly.
// Assuming 'ol' and 'og' are available globally for now.
document.addEventListener('DOMContentLoaded', ()=>{
    console.log("Mundial Main Script Initializing...");
    // --- Variable Setup (Minimal) ---
    // Most state is now managed in state.js
    // Need map/globe instances after initialization
    let map = null;
    let globus = null;
    // let itownsView = null; // Commented out for now
    // Need element references (could also import from map/globe modules if exported)
    const mapElement = document.getElementById('map');
    const globusElement = document.getElementById('globus');
    // const itownsElement = document.getElementById('itowns-viewer'); // Commented out for now
    // --- Helper Functions (Keep essential ones for now) ---
    // TODO: Move these helpers to a dedicated utils.js module later
    function hexToRgba(hex, alpha = 1.0) {
        if (!hex || typeof hex !== 'string') return [
            0,
            0,
            0,
            alpha
        ];
        hex = hex.replace('#', '');
        let r, g, b;
        if (hex.length === 3) {
            r = parseInt(hex.substring(0, 1).repeat(2), 16);
            g = parseInt(hex.substring(1, 2).repeat(2), 16);
            b = parseInt(hex.substring(2, 3).repeat(2), 16);
        } else if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        } else return [
            0,
            0,
            0,
            alpha
        ];
        return [
            r / 255,
            g / 255,
            b / 255,
            alpha
        ];
    }
    function lonLatToTileXYZ(lon, lat, zoom) {
        const n = Math.pow(2, zoom);
        const lat_rad = lat * Math.PI / 180;
        const tileX = Math.floor((lon + 180) / 360 * n);
        const tileY = Math.floor((1 - Math.log(Math.tan(lat_rad) + 1 / Math.cos(lat_rad)) / Math.PI) / 2 * n);
        if (tileX < 0 || tileX >= n || tileY < 0 || tileY >= n) return null;
        return {
            x: tileX,
            y: tileY,
            z: zoom
        };
    }
    function tileBoundsToLonLat(tileX, tileY, tileZ) {
        const n = Math.pow(2, tileZ);
        const lon_deg_min = tileX / n * 360.0 - 180.0;
        const lat_rad_min = Math.atan(Math.sinh(Math.PI * (1 - 2 * (tileY + 1) / n)));
        const lat_deg_min = lat_rad_min * 180.0 / Math.PI;
        const lon_deg_max = (tileX + 1) / n * 360.0 - 180.0;
        const lat_rad_max = Math.atan(Math.sinh(Math.PI * (1 - 2 * tileY / n)));
        const lat_deg_max = lat_rad_max * 180.0 / Math.PI;
        return [
            [
                lon_deg_min,
                lat_deg_min
            ],
            [
                lon_deg_max,
                lat_deg_min
            ],
            [
                lon_deg_max,
                lat_deg_max
            ],
            [
                lon_deg_min,
                lat_deg_max
            ],
            [
                lon_deg_min,
                lat_deg_min
            ]
        ];
    }
    // --- Z21 Grid Update Logic ---
    let gridUpdateTimeout;
    function updateZ21Grid() {
        const map = (0, _mapJs.getMap)(); // Use getter
        if (!map) return;
        const view = map.getView();
        const currentZoom = view.getZoom();
        const showGrid = currentZoom >= (0, _mapJs.GRID_VISIBILITY_MIN_ZOOM);
        // Ensure grid layer exists before trying to modify it
        const gridLayer = map.getLayers().getArray().find((layer)=>layer.get('title') === 'grid-z21');
        if (!gridLayer) {
            console.warn("Z21 Grid layer not found.");
            return;
        }
        const gridSource = gridLayer.getSource();
        if (!gridSource) {
            console.warn("Z21 Grid source not found.");
            return;
        }
        gridLayer.setVisible(showGrid);
        if (!showGrid) {
            gridSource.clear();
            return;
        }
        clearTimeout(gridUpdateTimeout);
        gridUpdateTimeout = setTimeout(()=>{
            console.time('updateZ21Grid');
            gridSource.clear();
            const extent = view.calculateExtent(map.getSize());
            const features = [];
            try {
                // Ensure selectionTileGrid is available (imported from map.js)
                (0, _mapJs.selectionTileGrid).forEachTileCoord(extent, (0, _mapJs.TILE_SELECTION_ZOOM), function(tileCoord) {
                    const tileExtent = (0, _mapJs.selectionTileGrid).getTileCoordExtent(tileCoord);
                    features.push(new ol.Feature({
                        geometry: ol.geom.Polygon.fromExtent(tileExtent)
                    }));
                });
                gridSource.addFeatures(features);
            } catch (error) {
                console.error("Error generating Z21 grid features:", error);
            } finally{
                console.timeEnd('updateZ21Grid');
            }
        }, 150); // Debounce grid updates
    } // End of updateZ21Grid
    // --- Map Move End Listener Setup Function ---
    function setupMapMoveEndListener() {
        const mapInstanceForListener = (0, _mapJs.getMap)(); // Get map instance once
        if (mapInstanceForListener) {
            mapInstanceForListener.on('moveend', ()=>{
                const view = mapInstanceForListener.getView();
                const currentZoom = Math.floor(view.getZoom()); // Use Math.floor for consistency
                const showGridAndSelection = currentZoom >= (0, _mapJs.GRID_VISIBILITY_MIN_ZOOM);
                // Find layers by title (safer than relying on order)
                const gridLayer = mapInstanceForListener.getLayers().getArray().find((l)=>l.get('title') === 'grid-z21');
                const selectionLayer = mapInstanceForListener.getLayers().getArray().find((l)=>l.get('title') === 'selection');
                // Control grid and selection layer visibility
                if (gridLayer) gridLayer.setVisible(showGridAndSelection);
                if (selectionLayer) selectionLayer.setVisible(showGridAndSelection);
                // Update user layer visibility (using a separate function for clarity)
                updateUserLayerVisibility(mapInstanceForListener, showGridAndSelection);
                // Update grid content if visible
                if (showGridAndSelection) updateZ21Grid(); // Assumes updateZ21Grid uses getMap() internally
                else {
                    // Clear sources when hidden
                    if (gridLayer) gridLayer.getSource()?.clear();
                    if (selectionLayer) selectionLayer.getSource()?.clear();
                }
            });
            console.log("Map moveend listener attached successfully.");
        } else console.error("Map instance not available to attach moveend listener.");
    }
    // --- User Layer Visibility Update Logic ---
    // Helper function called by moveend listener
    function updateUserLayerVisibility(map, showUserLayers) {
        if (!map) return;
        // console.log(`Updating user layer visibility: Show=${showUserLayers}`); // Optional debug log
        Object.values((0, _mapJs.userLayers)).forEach((layerInfo)=>{
            // Check if the layer itself exists before setting visibility
            if (layerInfo && layerInfo.layer) layerInfo.layer.setVisible(showUserLayers);
        });
    }
    // Stray brace removed
    // --- Core Initialization ---
    console.log("Initializing Map...");
    map = (0, _mapJs.initializeMap)('map'); // Initialize OL map and get instance
    // Attach listeners after map initialization
    setupMapMoveEndListener();
    console.log("Initializing Globe...");
    globus = (0, _globeJs.initializeOpenGlobus)(); // Initialize OG globe and get instance
    // Initialize Rete (if container exists)
    const reteContainer = document.getElementById('rete-editor-container');
    if (reteContainer) {
        console.log("Initializing Rete Editor...");
        (0, _reteEditorJs.initializeReteEditor)(reteContainer);
    } else console.warn("Rete container not found.");
    // --- Basic UI Setup & Listeners ---
    // Draggable Panels
    console.log("Making panels draggable...");
    (0, _uiJs.makeDraggable)(document.getElementById('layer-switcher'));
    (0, _uiJs.makeDraggable)(document.getElementById('user-layers-panel'));
    (0, _uiJs.makeDraggable)(document.getElementById('app-controls'));
    (0, _uiJs.makeDraggable)(document.getElementById('tileset-details-modal'));
    (0, _uiJs.makeDraggable)(document.getElementById('rete-editor-panel'));
    // Minimize/Expand Panels
    document.body.addEventListener('click', function(event) {
        if (event.target.classList.contains('minimize-btn')) {
            const panel = event.target.closest('.control-panel');
            if (panel) {
                panel.classList.toggle('minimized');
                event.target.textContent = panel.classList.contains('minimized') ? '+' : '-';
                event.target.title = panel.classList.contains('minimized') ? 'Expand' : 'Minimize';
            }
        }
    });
    // Base Layer Switcher (Original OL logic + Globe Sync Wrapper)
    function switchBaseLayerOL(selectedValue) {
        (0, _mapJs.baseLayers).forEach((layer)=>layer.setVisible(layer.get('title') === selectedValue));
    }
    const switchBaseLayerWithGlobeSync = function(selectedValue) {
        switchBaseLayerOL(selectedValue); // Call the OL switcher first
        const currentGlobus = (0, _globeJs.getGlobus)(); // Use getter
        if (currentGlobus) {
            const ogLayerTitle = `og_${selectedValue}`;
            const ogLayers = currentGlobus.planet.layers;
            ogLayers.forEach((layer)=>{
                if (layer.isBaseLayer) layer.setVisibility(layer.name === ogLayerTitle);
            });
            console.log(`Attempted to switch OG Base Layer to: ${ogLayerTitle}`);
        }
    };
    if ((0, _uiJs.uiElements).baseLayerSelect) {
        (0, _uiJs.uiElements).baseLayerSelect.value = (0, _mapJs.previouslySelectedLayerValue); // Set initial value
        (0, _uiJs.uiElements).baseLayerSelect.addEventListener('change', function() {
            const selectedValue = this.value;
            if (selectedValue === 'add-custom') {
                if ((0, _uiJs.uiElements).customLayerInputsDiv) (0, _uiJs.uiElements).customLayerInputsDiv.style.display = 'block';
                this.value = (0, _mapJs.previouslySelectedLayerValue); // Revert dropdown
            } else {
                if ((0, _uiJs.uiElements).customLayerInputsDiv) (0, _uiJs.uiElements).customLayerInputsDiv.style.display = 'none';
                switchBaseLayerWithGlobeSync(selectedValue);
                (0, _mapJs.setPreviouslySelectedLayerValue)(selectedValue); // Update state via map.js function
            }
        });
    } else console.warn("Base layer select element not found.");
    // --- Add Custom Base Layer Logic ---
    if ((0, _uiJs.uiElements).addCustomLayerBtn && (0, _uiJs.uiElements).customLayerNameInput && (0, _uiJs.uiElements).customLayerUrlInput && (0, _uiJs.uiElements).customLayerInputsDiv && (0, _uiJs.uiElements).baseLayerSelect) (0, _uiJs.uiElements).addCustomLayerBtn.addEventListener('click', function() {
        const name = (0, _uiJs.uiElements).customLayerNameInput.value.trim();
        const url = (0, _uiJs.uiElements).customLayerUrlInput.value.trim();
        const title = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); // Generate a safe title
        if (!name || !url || !url.includes('{z}') || !url.includes('{x}') || !url.includes('{y}')) {
            alert('Invalid name or URL template (must include {x}, {y}, {z}).');
            return;
        }
        const currentMap = (0, _mapJs.getMap)(); // Use getter
        if (!currentMap) {
            console.error("Map instance not available for adding custom layer.");
            return;
        }
        const allLayerTitles = currentMap.getLayers().getArray().map((l)=>l.get('title'));
        const reservedTitles = [
            'add-custom',
            'selection',
            'grid-z21',
            'highlight'
        ]; // Add known non-base layers
        if (reservedTitles.includes(title) || allLayerTitles.includes(title)) {
            alert(`Layer title "${title}" derived from name is reserved or already exists. Please choose a different name.`);
            return;
        }
        console.log(`Adding custom base layer: Name="${name}", Title="${title}"`);
        const newLayer = new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: url,
                attributions: `Custom: ${name}`
            }),
            visible: false,
            title: title
        });
        currentMap.getLayers().insertAt((0, _mapJs.baseLayers).length, newLayer); // Insert before overlay layers
        (0, _mapJs.baseLayers).push(newLayer); // Add to our tracked base layers
        const addCustomOption = (0, _uiJs.uiElements).baseLayerSelect.querySelector('option[value="add-custom"]');
        const newOption = document.createElement('option');
        newOption.value = title;
        newOption.textContent = name;
        (0, _uiJs.uiElements).baseLayerSelect.insertBefore(newOption, addCustomOption);
        // Clear inputs and hide section
        (0, _uiJs.uiElements).customLayerNameInput.value = '';
        (0, _uiJs.uiElements).customLayerUrlInput.value = '';
        // Initial updates block moved to the end of DOMContentLoaded
        (0, _uiJs.uiElements).customLayerInputsDiv.style.display = 'none';
        // Select and switch to the new layer
        (0, _uiJs.uiElements).baseLayerSelect.value = title;
        switchBaseLayerWithGlobeSync(title);
        (0, _mapJs.setPreviouslySelectedLayerValue)(title);
    });
    else console.warn("One or more elements required for 'Add Custom Base Layer' functionality not found.");
    // View Mode Switch Listener (Uses State and Sync functions)
    if ((0, _uiJs.uiElements).viewModeSwitch) {
        (0, _uiJs.uiElements).viewModeSwitch.checked = (0, _stateJs.getCurrentViewMode)() === 'globe'; // Set initial state
        (0, _uiJs.uiElements).viewModeSwitch.addEventListener('change', (event)=>{
            const switchToGlobe = event.target.checked;
            const currentMode = (0, _stateJs.getCurrentViewMode)();
            if (switchToGlobe && currentMode === 'map') {
                // Switch Map -> Globe
                console.log("Switching view: Map -> Globe");
                let currentGlobus = (0, _globeJs.getGlobus)();
                if (!currentGlobus) {
                    currentGlobus = (0, _globeJs.initializeOpenGlobus)();
                    if (!currentGlobus) {
                        console.error("Globe initialization failed during switch.");
                        event.target.checked = false;
                        alert("Failed to initialize Globe view.");
                        return;
                    }
                }
                const mapParams = (0, _syncJs.getMapViewParameters)();
                if (mapParams) (0, _syncJs.setGlobeView)(mapParams);
                if (mapElement) mapElement.style.display = 'none';
                if (globusElement) globusElement.style.display = 'block';
                (0, _stateJs.setCurrentViewMode)('globe');
                if (currentGlobus) currentGlobus.planet.renderer.active = true;
            } else if (!switchToGlobe && currentMode === 'globe') {
                // Switch Globe -> Map
                console.log("Switching view: Globe -> Map");
                const globeParams = (0, _syncJs.getGlobeViewParameters)();
                const currentMap = (0, _mapJs.getMap)();
                if (globeParams && currentMap) (0, _syncJs.setMapView)(globeParams);
                if (globusElement) globusElement.style.display = 'none';
                if (mapElement) mapElement.style.display = 'block';
                (0, _stateJs.setCurrentViewMode)('map');
                const currentGlobus = (0, _globeJs.getGlobus)();
                if (currentGlobus) currentGlobus.planet.renderer.active = false;
                if (currentMap) currentMap.updateSize();
            }
        });
    } else console.warn("View mode switch element not found.");
    // Dimension Switch Listener (Uses State)
    if ((0, _uiJs.uiElements).dimensionSwitch) {
        (0, _uiJs.uiElements).dimensionSwitch.checked = (0, _stateJs.getIs3D)(); // Set initial state
        (0, _uiJs.uiElements).dimensionSwitch.addEventListener('change', (event)=>{
            const isNow3D = event.target.checked;
            (0, _stateJs.setIs3D)(isNow3D);
            console.log(`Dimension Toggled: ${isNow3D ? '3D' : '2D'}`);
        // TODO: Apply 3D/2D specific logic 
        });
    } else console.warn("Dimension switch element not found.");
    // --- Initial UI State ---
    console.log("Setting initial UI state...");
    const babylonCanvas = document.getElementById('babylon-canvas'); // Get Babylon canvas element
    if ((0, _stateJs.getCurrentViewMode)() === 'map') {
        if (mapElement) mapElement.style.display = 'block';
        if (globusElement) globusElement.style.display = 'none';
        if (babylonCanvas) babylonCanvas.style.display = 'none'; // Hide Babylon canvas
        if (map) map.updateSize();
        if (globus) globus.planet.renderer.active = false; // Deactivate globe renderer
    } else {
        if (mapElement) mapElement.style.display = 'none';
        if (globusElement) globusElement.style.display = 'block'; // Show globe
        if (babylonCanvas) babylonCanvas.style.display = 'none'; // Hide Babylon canvas
        if (globus) globus.planet.renderer.active = true; // Activate globe renderer
    }
    if (mapElement) mapElement.style.cursor = 'crosshair';
    // TODO: Add back other logic incrementally:
    // - Add Custom Base Layer logic
    // - Z21 Grid Update logic + listener
    // - User Layer Visibility logic + listener
    // - Tile Selection logic (toggleTileSelection, clickSelectHandler, dragBoxInteraction)
    // - User Layer/Tileset Management (populate*, add*, delete*, edit*, select*, listeners)
    // - Terrain Provider logic
    // Initialize Selection Sync
    (0, _syncJs.initializeSelectionSync)();
    console.log("Mundial Main Script Initialized.");
    // --- Trigger Initial Updates ---
    console.log("Triggering initial grid and layer visibility updates...");
    const initialMapInstance = (0, _mapJs.getMap)();
    if (initialMapInstance) {
        updateZ21Grid(); // Initial grid calculation
        const initialZoom = Math.floor(initialMapInstance.getView().getZoom());
        const showInitially = initialZoom >= (0, _mapJs.GRID_VISIBILITY_MIN_ZOOM);
        updateUserLayerVisibility(initialMapInstance, showInitially); // Initial user layer visibility
        // Ensure selection layer visibility matches initial state
        const selectionLayer = initialMapInstance.getLayers().getArray().find((l)=>l.get('title') === 'selection');
        if (selectionLayer) selectionLayer.setVisible(showInitially);
    } else console.error("Map instance not available for initial updates.");
}); // End DOMContentLoaded

},{"./ui.js":"eQTlu","./map.js":"jKMnl","./globe.js":"lF63g","./state.js":"fjjqC","./rete-editor.js":"foGCt","./sync.js":"hX0Nu"}],"eQTlu":[function(require,module,exports,__globalThis) {
// ui.js - UI element management, DOM manipulation, UI event listeners
// --- Draggable Panels Functionality ---
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "makeDraggable", ()=>makeDraggable);
parcelHelpers.export(exports, "uiElements", ()=>uiElements);
function makeDraggable(elmnt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    // Use the header if available, otherwise the element itself
    const dragHandle = elmnt.querySelector('.panel-header') || elmnt.querySelector('h2') || elmnt;
    if (dragHandle) {
        dragHandle.style.cursor = 'move';
        dragHandle.onmousedown = dragMouseDown;
    } else {
        // Fallback if no header found (less ideal)
        elmnt.style.cursor = 'move';
        elmnt.onmousedown = dragMouseDown;
    }
    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // Get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // Call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }
    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // Calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // Set the element's new position:
        // Ensure element stays within viewport bounds (simple check)
        const newTop = Math.max(0, Math.min(window.innerHeight - elmnt.offsetHeight, elmnt.offsetTop - pos2));
        const newLeft = Math.max(0, Math.min(window.innerWidth - elmnt.offsetWidth, elmnt.offsetLeft - pos1));
        elmnt.style.top = newTop + "px";
        elmnt.style.left = newLeft + "px";
        // Clear bottom/right if setting top/left
        elmnt.style.bottom = '';
        elmnt.style.right = '';
    }
    function closeDragElement() {
        // Stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}
const uiElements = {
    baseLayerSelect: document.getElementById('base-layer-select'),
    customLayerInputsDiv: document.getElementById('custom-layer-inputs'),
    customLayerNameInput: document.getElementById('custom-layer-name'),
    customLayerUrlInput: document.getElementById('custom-layer-url'),
    addCustomLayerBtn: document.getElementById('add-custom-layer-btn'),
    userLayersPanel: document.getElementById('user-layers-panel'),
    userLayerList: document.getElementById('user-layer-list'),
    createLayerBtn: document.getElementById('create-layer-btn'),
    tilesetListDiv: document.getElementById('tileset-list'),
    selectionActionsDiv: document.getElementById('selection-actions'),
    clearSelectionBtn: document.getElementById('clear-selection-btn'),
    saveSelectionBtn: document.getElementById('save-selection-btn'),
    tilesetNameInput: document.getElementById('tileset-name-input'),
    appControlsPanel: document.getElementById('app-controls'),
    interactionModeBtn: document.getElementById('interaction-mode-btn'),
    selectedTileCountDisplay: document.getElementById('selected-tile-count-display'),
    // Removed references for old inline color picker
    dimensionSwitch: document.getElementById('toggle-3d-btn'),
    viewModeSwitch: document.getElementById('toggle-globe-btn'),
    terrainProviderSelect: document.getElementById('terrain-provider-select'),
    customTerrainInputsDiv: document.getElementById('custom-terrain-inputs'),
    customTerrainNameInput: document.getElementById('custom-terrain-name'),
    customTerrainUrlInput: document.getElementById('custom-terrain-url'),
    addCustomTerrainBtn: document.getElementById('add-custom-terrain-btn'),
    // const terrainProviderListDiv = document.getElementById('terrain-provider-list'); // Removed element
    // const terrainProviderListDiv = document.getElementById('terrain-provider-list'); // Element removed from HTML
    // --- Tileset Details Modal Element References ---
    tilesetDetailsModal: document.getElementById('tileset-details-modal'),
    closeTilesetDetailsModalBtn: document.getElementById('close-tileset-details-modal'),
    detailsTilesetNameInput: document.getElementById('details-tileset-name'),
    detailsTilesetCoordsSpan: document.getElementById('details-tileset-coords'),
    detailsLocationInfoSpan: document.getElementById('details-location-info'),
    detailsTilesetImage: document.getElementById('details-tileset-image'),
    detailsTilesetImageUrlInput: document.getElementById('details-tileset-image-url'),
    detailsTilesetLinkInput: document.getElementById('details-tileset-link'),
    detailsTilesetTagsTextarea: document.getElementById('details-tileset-tags'),
    detailsColorPicker: document.getElementById('details-color-picker'),
    detailsSaveBtn: document.getElementById('details-save-btn'),
    detailsMoreSettingsBtn: document.getElementById('details-more-settings-btn') // Reference kept for removal check
};

},{"@parcel/transformer-js/src/esmodule-helpers.js":"jnFvT"}],"jnFvT":[function(require,module,exports,__globalThis) {
exports.interopDefault = function(a) {
    return a && a.__esModule ? a : {
        default: a
    };
};
exports.defineInteropFlag = function(a) {
    Object.defineProperty(a, '__esModule', {
        value: true
    });
};
exports.exportAll = function(source, dest) {
    Object.keys(source).forEach(function(key) {
        if (key === 'default' || key === '__esModule' || Object.prototype.hasOwnProperty.call(dest, key)) return;
        Object.defineProperty(dest, key, {
            enumerable: true,
            get: function() {
                return source[key];
            }
        });
    });
    return dest;
};
exports.export = function(dest, destName, get) {
    Object.defineProperty(dest, destName, {
        enumerable: true,
        get: get
    });
};

},{}],"jKMnl":[function(require,module,exports,__globalThis) {
// map.js - OpenLayers setup and map-specific interactions
// Assuming 'ol' is globally available or will be imported
// --- Constants ---
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "TILE_SELECTION_ZOOM", ()=>TILE_SELECTION_ZOOM);
parcelHelpers.export(exports, "GRID_VISIBILITY_MIN_ZOOM", ()=>GRID_VISIBILITY_MIN_ZOOM);
parcelHelpers.export(exports, "baseLayers", ()=>baseLayers);
parcelHelpers.export(exports, "selectionSource", ()=>selectionSource);
parcelHelpers.export(exports, "highlightSource", ()=>highlightSource);
parcelHelpers.export(exports, "gridSourceZ21", ()=>gridSourceZ21);
parcelHelpers.export(exports, "selectionTileGrid", ()=>selectionTileGrid);
parcelHelpers.export(exports, "layer0Source", ()=>layer0Source);
parcelHelpers.export(exports, "layer0Layer", ()=>layer0Layer);
parcelHelpers.export(exports, "userLayers", ()=>userLayers);
parcelHelpers.export(exports, "initializeMap", ()=>initializeMap);
// Export the map instance getter
parcelHelpers.export(exports, "getMap", ()=>getMap);
parcelHelpers.export(exports, "mapElement", ()=>mapElement);
parcelHelpers.export(exports, "previouslySelectedLayerValue", ()=>previouslySelectedLayerValue);
// Function to update the selected layer value (needed if moved from main.js)
parcelHelpers.export(exports, "setPreviouslySelectedLayerValue", ()=>setPreviouslySelectedLayerValue);
const TILE_SELECTION_ZOOM = 21;
const GRID_VISIBILITY_MIN_ZOOM = 16;
// --- Layer Definitions ---
const osmLayer = new ol.layer.Tile({
    source: new ol.source.OSM(),
    visible: false,
    title: 'osm'
});
const satelliteLayer = new ol.layer.Tile({
    source: new ol.source.XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attributions: "Tiles \xa9 ArcGIS",
        maxZoom: 19
    }),
    visible: true,
    title: 'satellite'
});
const topoLayer = new ol.layer.Tile({
    source: new ol.source.XYZ({
        url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attributions: "Map data \xa9 OSM contributors, SRTM | Map style \xa9 OpenTopoMap (CC-BY-SA)",
        maxZoom: 17
    }),
    visible: false,
    title: 'topo'
});
const baseLayers = [
    osmLayer,
    satelliteLayer,
    topoLayer
]; // Export for base layer switcher UI
const selectionStyle = new ol.style.Style({
    fill: new ol.style.Fill({
        color: 'rgba(200, 200, 200, 0.5)'
    })
});
const selectionSource = new ol.source.Vector(); // Export for selection logic
const selectionLayer = new ol.layer.Vector({
    source: selectionSource,
    style: selectionStyle,
    title: 'selection',
    zIndex: 3
});
const highlightStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'rgba(255, 255, 0, 0.8)',
        width: 4
    }),
    fill: new ol.style.Fill({
        color: 'rgba(255, 255, 0, 0.2)'
    }),
    zIndex: 4
});
const highlightSource = new ol.source.Vector(); // Export for highlight logic
const highlightLayer = new ol.layer.Vector({
    source: highlightSource,
    style: highlightStyle,
    title: 'highlight'
});
const gridStyleZ21 = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'rgba(0, 0, 0, 1)',
        width: 1
    })
});
const gridSourceZ21 = new ol.source.Vector(); // Export for grid update logic
const gridLayerZ21 = new ol.layer.Vector({
    source: gridSourceZ21,
    style: gridStyleZ21,
    title: 'grid-z21',
    visible: false,
    zIndex: 1
});
const selectionTileGrid = ol.tilegrid.createXYZ({
    maxZoom: TILE_SELECTION_ZOOM
}); // Export if needed elsewhere
// --- Initial User Layer Setup ---
const layer0Id = 'layer-0';
const layer0Name = 'Layer 0';
const layer0Source = new ol.source.Vector(); // Export if needed directly
const tilesetFeatureStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'rgba(0, 128, 128, 0.9)',
        width: 3
    })
});
const layer0Layer = new ol.layer.Vector({
    source: layer0Source,
    style: tilesetFeatureStyle,
    title: layer0Id,
    zIndex: 2,
    visible: true
});
layer0Layer.set('userLayerName', layer0Name);
const userLayers = {
    [layer0Id]: {
        name: layer0Name,
        layer: layer0Layer,
        ogLayer: null,
        tilesetCount: 0
    }
};
// --- Map Instance ---
let mapInstance = null; // Use let for the instance
function initializeMap(targetElementId = 'map') {
    if (mapInstance) {
        console.warn("Map already initialized.");
        return mapInstance;
    }
    mapInstance = new ol.Map({
        target: targetElementId,
        layers: [
            ...baseLayers,
            layer0Layer,
            gridLayerZ21,
            selectionLayer,
            highlightLayer
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat([
                166.52424,
                -11.26175
            ]),
            zoom: 12,
            maxZoom: TILE_SELECTION_ZOOM + 1,
            minZoom: 0
        }),
        controls: []
    });
    console.log("OpenLayers Map Initialized");
    return mapInstance;
}
function getMap() {
    if (!mapInstance) console.error("Map accessed before initialization!");
    return mapInstance;
}
const mapElement = document.getElementById('map'); // Keep reference if needed
let previouslySelectedLayerValue = 'satellite';
function setPreviouslySelectedLayerValue(value) {
    previouslySelectedLayerValue = value;
}

},{"@parcel/transformer-js/src/esmodule-helpers.js":"jnFvT"}],"lF63g":[function(require,module,exports,__globalThis) {
// globe.js - OpenGlobus setup and globe-specific interactions
// Assuming 'og' (OpenGlobus) is globally available or will be imported
// Assuming helper functions like lonLatToTileXYZ, hexToRgba are available or imported
// Assuming constants like GRID_VISIBILITY_MIN_ZOOM, TILE_SELECTION_ZOOM are available or imported
// Assuming state variables like currentInteractionMode, userLayers are available or imported
// Assuming functions like toggleTileSelection, syncOlLayerToOgLayer are available or imported
// --- Globe Instance and State ---
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "globusElement", ()=>globusElement);
// TODO: These might also belong in state.js or be passed in
// let currentViewMode = 'globe'; // Managed in main.js for now
// let is3D = true; // Managed in main.js for now
// --- Initialization Function ---
parcelHelpers.export(exports, "initializeOpenGlobus", ()=>initializeOpenGlobus) // End of initializeOpenGlobus
;
// Export the globe instance getter
parcelHelpers.export(exports, "getGlobus", ()=>getGlobus);
let globus = null;
const globusElement = document.getElementById('globus'); // Assuming this element exists
// TODO: These state variables might belong in state.js
let isShiftDown = false;
let isDraggingSelection = false;
let dragStartCoords = null; // Screen coordinates [x, y]
let dragCurrentCoords = null; // Screen coordinates [x, y]
let tempHighlightRect = null; // To store the temporary highlight entity
function initializeOpenGlobus() {
    // Check if library loaded
    if (typeof og === 'undefined') {
        console.error("OpenGlobus library (og) not loaded.");
        // TODO: Need access to viewModeSwitch from ui.js
        // if (viewModeSwitch) viewModeSwitch.disabled = true;
        // if (viewModeSwitch) viewModeSwitch.title = "OpenGlobus library not loaded";
        return;
    }
    // Check if already initialized
    if (globus) return;
    console.log("Initializing OpenGlobus...");
    try {
        // Initialize Globe with EMPTY layers array
        globus = new og.Globe({
            resourcesSrc: "../packages/openglobus/res",
            target: "globus",
            name: "Mundial Globe View",
            layers: [],
            terrain: new og.terrain.GlobusTerrain(),
            lon: 166.52424,
            lat: -11.26175,
            alt: 150000
        });
        // --- Add Layers AFTER Construction ---
        // 1. Base Layers
        const ogSatelliteLayer = new og.layer.XYZ("og_satellite", {
            isBaseLayer: true,
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            visibility: true,
            attribution: "Tiles \xa9 ArcGIS"
        });
        const ogOsmLayer = new og.layer.XYZ("og_osm", {
            isBaseLayer: true,
            url: "//a.tile.openstreetmap.org/{z}/{x}/{y}.png",
            visibility: false,
            attribution: "\xa9 OpenStreetMap contributors"
        });
        const ogTopoLayer = new og.layer.XYZ("og_topo", {
            isBaseLayer: true,
            url: "https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png",
            visibility: false,
            attribution: "Map data \xa9 OSM contributors, SRTM | Map style \xa9 OpenTopoMap (CC-BY-SA)"
        });
        globus.planet.addLayer(ogSatelliteLayer);
        globus.planet.addLayer(ogOsmLayer);
        globus.planet.addLayer(ogTopoLayer);
        console.log("Added OpenGlobus base layers.");
        // 2. Grid Layer
        // Create grid layer using standard CanvasTiles and providing drawTile function
        const ogGridLayer = new og.layer.CanvasTiles("og_grid", {
            visibility: true,
            isBaseLayer: false,
            minZoom: 16,
            maxZoom: 30,
            zIndex: 5,
            drawTile: function(material, applyTexture) {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext('2d');
                const size = 256;
                canvas.width = size;
                canvas.height = size;
                ctx.clearRect(0, 0, size, size); // Start empty
                const segment = material.segment;
                const currentTileZoom = segment.tileZoom;
                const targetGridZoom = 21; // TODO: Import TILE_SELECTION_ZOOM
                // Use the layer's minZoom option directly if available, otherwise default to global constant
                const layerMinZoom = this.options?.minZoom ?? 16; // TODO: Import GRID_VISIBILITY_MIN_ZOOM
                // Only draw if current zoom is >= layer's minZoom (e.g., 16)
                if (currentTileZoom >= layerMinZoom) {
                    if (currentTileZoom === targetGridZoom) {
                        // Exactly at Z21: Draw the border of this Z21 tile
                        ctx.beginPath();
                        ctx.rect(0, 0, size, size);
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = 'rgba(0, 0, 0, 1)'; // Z21 grid line color
                        ctx.stroke();
                    } else if (currentTileZoom < targetGridZoom) {
                        // Between Z16 and Z20: Draw the Z21 sub-grid lines
                        const zoomDiff = targetGridZoom - currentTileZoom;
                        const numTiles = Math.pow(2, zoomDiff);
                        const subTileSize = size / numTiles;
                        ctx.beginPath();
                        ctx.lineWidth = 1; // Z21 grid line width
                        ctx.strokeStyle = 'rgba(0, 0, 0, 1)'; // Z21 grid line color
                        // Draw vertical sub-grid lines
                        for(let i = 1; i < numTiles; i++){
                            const x = i * subTileSize;
                            ctx.moveTo(x, 0);
                            ctx.lineTo(x, size);
                        }
                        // Draw horizontal sub-grid lines
                        for(let j = 1; j < numTiles; j++){
                            const y = j * subTileSize;
                            ctx.moveTo(0, y);
                            ctx.lineTo(size, y);
                        }
                        // Also draw the outer border of the current (lower zoom) tile
                        ctx.rect(0, 0, size, size);
                        ctx.stroke();
                    }
                // else: If currentTileZoom > targetGridZoom, draw nothing (empty canvas)
                }
                // else: If currentTileZoom < layerMinZoom, draw nothing (empty canvas)
                applyTexture(canvas);
            }
        });
        globus.planet.addLayer(ogGridLayer);
        console.log("Added OpenGlobus grid layer.");
        // 3. Selection Layer (Define variable accessible to click handler)
        const ogSelectionLayer = new og.layer.Vector("og_selection", {
            style: {
                fillColor: "rgba(200, 200, 200, 0.5)",
                lineColor: "rgba(100, 100, 100, 0.8)",
                lineWidth: 1
            },
            visibility: true,
            zIndex: 15
        });
        globus.planet.addLayer(ogSelectionLayer);
        console.log("Added OpenGlobus selection layer.");
        // 3b. Highlight Layer (for Globe)
        const ogHighlightLayer = new og.layer.Vector("og_highlight", {
            style: {
                fillColor: "rgba(255, 255, 0, 0.2)",
                lineColor: "rgba(255, 255, 0, 0.8)",
                lineWidth: 4 // Match OL highlight stroke width
            },
            visibility: true,
            zIndex: 20 // Ensure it's above selection and user layers
        });
        globus.planet.addLayer(ogHighlightLayer);
        // --- Shift Key Listeners (Attached after globus init) ---
        globus.planet.events.on("lshiftkeydown", ()=>{
            isShiftDown = true;
        });
        globus.planet.events.on("lshiftkeyup", ()=>{
            isShiftDown = false;
            // If a drag was in progress, cancel it on shift key up
            if (isDraggingSelection) {
                isDraggingSelection = false;
                dragStartCoords = null;
                dragCurrentCoords = null;
                const ogHighlightLayer = globus.planet.getLayerByName("og_highlight");
                if (ogHighlightLayer && tempHighlightRect) {
                    ogHighlightLayer.removeEntity(tempHighlightRect);
                    tempHighlightRect = null;
                }
                globus.planet.camera.enableDefaultNavigation(); // Re-enable navigation
                console.log("Globe drag selection cancelled by Shift key up.");
            }
        });
        // --- Globe Drag Selection Mouse Listeners ---
        globus.planet.events.on("ldown", (e)=>{
            // TODO: Need access to currentInteractionMode from state.js
            if (isShiftDown /* && currentInteractionMode === 'select' */ ) {
                // Start potential drag selection
                // --- Globe Drag Selection Mouse Listeners ---
                globus.planet.events.on("ldown", (e)=>{
                    // Start drag selection ONLY if Shift is down and in select mode
                    // TODO: Need access to currentInteractionMode from state.js
                    if (isShiftDown /* && currentInteractionMode === 'select' */ ) {
                        // Check zoom level before starting drag
                        const cam = globus.planet.camera;
                        const pos = cam.getLonLat();
                        const altitude = cam.getHeight();
                        const approxZoom = Math.log2(40075000 * Math.cos(pos.lat * Math.PI / 180) / (altitude * 2)) + 1;
                        // TODO: Import GRID_VISIBILITY_MIN_ZOOM
                        if (approxZoom < 16 /* GRID_VISIBILITY_MIN_ZOOM */ ) {
                            console.log(`Globe drag ignored: Zoom ${approxZoom.toFixed(2)} < ${16 /* GRID_VISIBILITY_MIN_ZOOM */ }`);
                            return; // Don't start drag if too zoomed out
                        }
                        isDraggingSelection = true;
                        dragStartCoords = [
                            e.x,
                            e.y
                        ];
                        dragCurrentCoords = [
                            e.x,
                            e.y
                        ];
                        globus.planet.camera.disableDefaultNavigation(); // Prevent panning/zooming
                        console.log("Globe drag selection started (Shift+Down).");
                    }
                });
                globus.planet.events.on("mousemove", (e)=>{
                    if (isDraggingSelection) {
                        // Update current coordinates
                        dragCurrentCoords = [
                            e.x,
                            e.y
                        ];
                        // Update temporary highlight rectangle
                        const ogHighlightLayer = globus.planet.getLayerByName("og_highlight");
                        if (ogHighlightLayer) {
                            if (tempHighlightRect) ogHighlightLayer.removeEntity(tempHighlightRect);
                            // Create screen rectangle coordinates
                            const minX = Math.min(dragStartCoords[0], dragCurrentCoords[0]);
                            const minY = Math.min(dragStartCoords[1], dragCurrentCoords[1]);
                            const maxX = Math.max(dragStartCoords[0], dragCurrentCoords[0]);
                            const maxY = Math.max(dragStartCoords[1], dragCurrentCoords[1]);
                            // Convert screen corners to LonLat for a *rough* extent visualization
                            const sw = globus.planet.getLonLatFromPixelTerrain({
                                x: minX,
                                y: maxY
                            }, true);
                            const ne = globus.planet.getLonLatFromPixelTerrain({
                                x: maxX,
                                y: minY
                            }, true);
                            if (sw && ne) {
                                const rectVertices = [
                                    [
                                        sw.lon,
                                        sw.lat
                                    ],
                                    [
                                        ne.lon,
                                        sw.lat
                                    ],
                                    [
                                        ne.lon,
                                        ne.lat
                                    ],
                                    [
                                        sw.lon,
                                        ne.lat
                                    ],
                                    [
                                        sw.lon,
                                        sw.lat
                                    ]
                                ];
                                tempHighlightRect = new og.Entity({
                                    'polygon': {
                                        'vertices': rectVertices
                                    }
                                });
                                ogHighlightLayer.addEntity(tempHighlightRect);
                            } else tempHighlightRect = null; // Couldn't get coords, clear rect
                        }
                    }
                });
                globus.planet.events.on("lup", (e)=>{
                    if (isDraggingSelection) {
                        console.log("Globe drag selection finished (Up).");
                        isDraggingSelection = false;
                        globus.planet.camera.enableDefaultNavigation(); // Re-enable navigation
                        // Clear temporary highlight
                        const ogHighlightLayer = globus.planet.getLayerByName("og_highlight");
                        if (ogHighlightLayer && tempHighlightRect) {
                            ogHighlightLayer.removeEntity(tempHighlightRect);
                            tempHighlightRect = null;
                        }
                        // Get final screen coordinates
                        const finalDragEndCoords = [
                            e.x,
                            e.y
                        ];
                        const minX = Math.min(dragStartCoords[0], finalDragEndCoords[0]);
                        const minY = Math.min(dragStartCoords[1], finalDragEndCoords[1]);
                        const maxX = Math.max(dragStartCoords[0], finalDragEndCoords[0]);
                        const maxY = Math.max(dragStartCoords[1], finalDragEndCoords[1]);
                        // Convert screen corners to geographic coordinates
                        const sw = globus.planet.getLonLatFromPixelTerrain({
                            x: minX,
                            y: maxY
                        }, true);
                        const ne = globus.planet.getLonLatFromPixelTerrain({
                            x: maxX,
                            y: minY
                        }, true);
                        if (sw && ne) {
                            // Define the geographic extent
                            const extentLonLat = [
                                sw.lon,
                                sw.lat,
                                ne.lon,
                                ne.lat
                            ]; // minLon, minLat, maxLon, maxLat
                            // Calculate tiles within the geographic extent
                            const featuresToAdd = [];
                            const targetZoom = 21; // TODO: Import TILE_SELECTION_ZOOM
                            // TODO: Implement robust tile calculation within LonLat extent for OpenGlobus
                            console.log("Globe drag extent (LonLat):", extentLonLat);
                            alert("Globe drag selection complete. Tile calculation within extent not yet implemented.");
                        // --- Placeholder for future tile calculation logic ---
                        /*
                    try {
                        // ... [Conceptual tile calculation logic as before] ...
                        if (featuresToAdd.length > 0) {
                            selectionSource.addFeatures(featuresToAdd);
                            console.log(`Added ${featuresToAdd.length} tiles via globe drag box.`);
                        }
                    } catch (error) {
                        console.error("Error during globe drag box tile calculation:", error);
                    }
                    */ // --- End Placeholder ---
                        } else console.error("Could not determine geographic extent for globe drag selection.");
                        // Reset drag coordinates
                        dragStartCoords = null;
                        dragCurrentCoords = null;
                    }
                });
                isDraggingSelection = true;
                dragStartCoords = [
                    e.x,
                    e.y
                ];
                dragCurrentCoords = [
                    e.x,
                    e.y
                ]; // Initialize current coords
                globus.planet.camera.disableDefaultNavigation(); // Prevent panning/zooming
                console.log("Globe drag selection started (Shift+Down).");
            }
        });
        globus.planet.events.on("mousemove", (e)=>{
            if (isDraggingSelection) {
                // Update current coordinates
                dragCurrentCoords = [
                    e.x,
                    e.y
                ];
                // Update temporary highlight rectangle
                const ogHighlightLayer = globus.planet.getLayerByName("og_highlight");
                if (ogHighlightLayer) {
                    if (tempHighlightRect) ogHighlightLayer.removeEntity(tempHighlightRect);
                    // Create screen rectangle coordinates
                    const minX = Math.min(dragStartCoords[0], dragCurrentCoords[0]);
                    const minY = Math.min(dragStartCoords[1], dragCurrentCoords[1]);
                    const maxX = Math.max(dragStartCoords[0], dragCurrentCoords[0]);
                    const maxY = Math.max(dragStartCoords[1], dragCurrentCoords[1]);
                    // Convert screen corners to LonLat for a *rough* extent visualization
                    // Note: This screen rect doesn't perfectly map to a geographic rect, 
                    // but it's good enough for visual feedback during drag.
                    const sw = globus.planet.getLonLatFromPixelTerrain({
                        x: minX,
                        y: maxY
                    }, true);
                    const ne = globus.planet.getLonLatFromPixelTerrain({
                        x: maxX,
                        y: minY
                    }, true);
                    if (sw && ne) {
                        const rectVertices = [
                            [
                                sw.lon,
                                sw.lat
                            ],
                            [
                                ne.lon,
                                sw.lat
                            ],
                            [
                                ne.lon,
                                ne.lat
                            ],
                            [
                                sw.lon,
                                ne.lat
                            ],
                            [
                                sw.lon,
                                sw.lat
                            ]
                        ];
                        tempHighlightRect = new og.Entity({
                            'polygon': {
                                'vertices': rectVertices
                            }
                        });
                        ogHighlightLayer.addEntity(tempHighlightRect);
                    } else tempHighlightRect = null; // Couldn't get coords, clear rect
                }
            }
        });
        globus.planet.events.on("lup", (e)=>{
            if (isDraggingSelection) {
                console.log("Globe drag selection finished (Up).");
                isDraggingSelection = false;
                globus.planet.camera.enableDefaultNavigation(); // Re-enable navigation
                // Clear temporary highlight
                const ogHighlightLayer = globus.planet.getLayerByName("og_highlight");
                if (ogHighlightLayer && tempHighlightRect) {
                    ogHighlightLayer.removeEntity(tempHighlightRect);
                    tempHighlightRect = null;
                }
                // Get final screen coordinates
                const finalDragEndCoords = [
                    e.x,
                    e.y
                ];
                const minX = Math.min(dragStartCoords[0], finalDragEndCoords[0]);
                const minY = Math.min(dragStartCoords[1], finalDragEndCoords[1]);
                const maxX = Math.max(dragStartCoords[0], finalDragEndCoords[0]);
                const maxY = Math.max(dragStartCoords[1], finalDragEndCoords[1]);
                // Convert screen corners to geographic coordinates
                const sw = globus.planet.getLonLatFromPixelTerrain({
                    x: minX,
                    y: maxY
                }, true);
                const ne = globus.planet.getLonLatFromPixelTerrain({
                    x: maxX,
                    y: minY
                }, true);
                if (sw && ne) {
                    // Define the geographic extent
                    const extentLonLat = [
                        sw.lon,
                        sw.lat,
                        ne.lon,
                        ne.lat
                    ]; // minLon, minLat, maxLon, maxLat
                    // Calculate tiles within the geographic extent
                    const featuresToAdd = [];
                    const targetZoom = 21; // TODO: Import TILE_SELECTION_ZOOM
                    // Need a way to iterate tiles within a LonLat extent - this is complex!
                    // OpenGlobus doesn't have a direct equivalent to OL's forEachTileCoordInExtent.
                    // We might need to approximate or use a different strategy.
                    // For now, let's just log the extent and skip tile calculation.
                    console.log("Globe drag extent (LonLat):", extentLonLat);
                    alert("Globe drag selection complete. Tile calculation within extent not yet implemented.");
                // --- Placeholder for future tile calculation logic ---
                /*
                    try {
                        // TODO: Implement logic to find all Z21 tiles intersecting extentLonLat
                        // This might involve converting extent to tile ranges or iterating potential tiles
                        // and checking for intersection.
                        
                        // Example (Conceptual - Needs actual implementation):
                        // const minTile = lonLatToTileXYZ(sw.lon, ne.lat, targetZoom); // Top-left tile
                        // const maxTile = lonLatToTileXYZ(ne.lon, sw.lat, targetZoom); // Bottom-right tile
                        // if (minTile && maxTile) {
                        //     for (let x = minTile.x; x <= maxTile.x; x++) {
                        //         for (let y = minTile.y; y <= maxTile.y; y++) {
                        //             const tileCoord = [targetZoom, x, y];
                        //             const tileId = getTileId(tileCoord);
                        //             // Check if already selected or saved (similar to OL dragbox)
                        //             if (!selectionSource.getFeatureById(tileId)) {
                        //                  let alreadySaved = false;
                        //                  // ... [check saved layers] ...
                        //                  if (!alreadySaved) {
                        //                      const tileExtent = selectionTileGrid.getTileCoordExtent(tileCoord);
                        //                      const newFeature = new ol.Feature({ geometry: ol.geom.Polygon.fromExtent(tileExtent) });
                        //                      newFeature.setId(tileId);
                        //                      featuresToAdd.push(newFeature);
                        //                  }
                        //             }
                        //         }
                        //     }
                        // }

                        if (featuresToAdd.length > 0) {
                            selectionSource.addFeatures(featuresToAdd);
                            console.log(`Added ${featuresToAdd.length} tiles via globe drag box.`);
                        }
                    } catch (error) {
                        console.error("Error during globe drag box tile calculation:", error);
                    }
                    */ // --- End Placeholder ---
                } else console.error("Could not determine geographic extent for globe drag selection.");
                // Reset drag coordinates
                dragStartCoords = null;
                dragCurrentCoords = null;
            }
        });
        console.log("Added OpenGlobus highlight layer.");
        // 4. Initial User Vector Layer (for layer-0)
        // TODO: Need access to userLayers from state.js or map.js
        const layer0Id = 'layer-0'; // Assuming this ID
        // if (userLayers[layer0Id]) {
        const ogLayer0 = new og.layer.Vector(`og_${layer0Id}`, {
            style: {
                fillColor: "rgba(0, 128, 128, 0.5)",
                lineColor: "rgba(0, 128, 128, 1.0)",
                lineWidth: 2
            },
            // visibility: userLayers[layer0Id].layer.getVisible(), // TODO: Need access to userLayers
            visibility: true,
            zIndex: 10
        });
        globus.planet.addLayer(ogLayer0);
        // userLayers[layer0Id].ogLayer = ogLayer0; // Store reference // TODO: Need access to userLayers
        console.log('Globe ldblclick event fired.'); // DEBUG: Confirm event
        console.log(`Added OpenGlobus vector layer for ${layer0Id}`);
        // Initial sync for default layer
        // TODO: Need access to userLayers and syncOlLayerToOgLayer
        // syncOlLayerToOgLayer(userLayers[layer0Id].layer.getSource(), ogLayer0);
        // } else {
        //     console.error("Default user layer layer-0 not found during OG init.");
        // }
        // --- Add Controls ---
        globus.planet.addControl(new og.control.ZoomControl());
        globus.planet.addControl(new og.control.KeyboardNavigation());
        // --- Add Globe Click Handler ---
        console.log('Globe click ignored due to zoom level.'); // DEBUG: Zoom check failed
        globus.planet.events.on("ldblclick", function(e) {
            // TODO: Need access to currentViewMode and currentInteractionMode from state.js
            // if (currentViewMode !== 'globe' || currentInteractionMode !== 'select') return;
            // Calculate approximate zoom level from altitude
            const cam = globus.planet.camera;
            const pos = cam.getLonLat(); // Need position for latitude correction
            const altitude = cam.getHeight();
            // Rough approximation matching getGlobeViewParameters
            const approxZoom = Math.log2(40075000 * Math.cos(pos.lat * Math.PI / 180) / (altitude * 2)) + 1;
            console.log('Calculated tileXYZ:', tileXYZ); // DEBUG: Check tile coords
            // Only allow selection if approximate zoom meets the grid visibility threshold
            // TODO: Import GRID_VISIBILITY_MIN_ZOOM
            if (approxZoom < 16 /* GRID_VISIBILITY_MIN_ZOOM */ ) // console.log(`Globe click ignored: Zoom ${approxZoom.toFixed(2)} < ${GRID_VISIBILITY_MIN_ZOOM}`);
            return;
            const lonLat = globus.planet.getLonLatFromPixelTerrain(e, true);
            console.log('Calling toggleTileSelection with:', [
                tileXYZ.z,
                tileXYZ.x,
                tileXYZ.y
            ]); // DEBUG: Confirm call
            if (!lonLat) return;
            // Calculate the Z21 tile coordinates for the clicked location
            const targetZoom = 21; // TODO: Import TILE_SELECTION_ZOOM
            // TODO: Need access to lonLatToTileXYZ helper
            const tileXYZ = null; // lonLatToTileXYZ(lonLat.lon, lonLat.lat, targetZoom);
            if (!tileXYZ) {
                console.error("Failed to calculate tile XYZ from clicked LonLat.");
                return;
            }
        // Use the existing OpenLayers toggle function, passing the OL-style tile coordinate array [z, x, y]
        // This keeps selection state management centralized in OL's selectionSource
        // TODO: Need access to toggleTileSelection function
        // toggleTileSelection([tileXYZ.z, tileXYZ.x, tileXYZ.y]);
        // Note: We now need a listener on selectionSource to update ogSelectionLayer
        }); // End lclick handler
        console.log("OpenGlobus initialized.");
    } catch (error) {
        console.error("Error initializing OpenGlobus:", error);
        if (globusElement) globusElement.innerHTML = "<p style='color:red; padding: 10px;'>Error initializing OpenGlobus.</p>";
    // TODO: Need access to viewModeSwitch from ui.js
    // if (viewModeSwitch) viewModeSwitch.disabled = true;
    // if (viewModeSwitch) viewModeSwitch.title = "Error initializing OpenGlobus";
    }
}
function getGlobus() {
    globus;
    return globus;
}

},{"@parcel/transformer-js/src/esmodule-helpers.js":"jnFvT"}],"fjjqC":[function(require,module,exports,__globalThis) {
// state.js - Centralized application state management
// TODO: Import initial values if needed (e.g., layer0Id from map.js)
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "getSelectedLayerId", ()=>getSelectedLayerId);
parcelHelpers.export(exports, "setSelectedLayerId", ()=>setSelectedLayerId);
parcelHelpers.export(exports, "getCurrentEditingGroupId", ()=>getCurrentEditingGroupId);
parcelHelpers.export(exports, "getNextLayerId", ()=>getNextLayerId);
parcelHelpers.export(exports, "getNextTilesetFeatureId", ()=>getNextTilesetFeatureId);
parcelHelpers.export(exports, "getCurrentViewMode", ()=>getCurrentViewMode);
parcelHelpers.export(exports, "setCurrentViewMode", ()=>setCurrentViewMode);
parcelHelpers.export(exports, "getIs3D", ()=>getIs3D);
parcelHelpers.export(exports, "setIs3D", ()=>setIs3D);
parcelHelpers.export(exports, "setCurrentEditingGroupId", ()=>setCurrentEditingGroupId);
let selectedLayerId = 'layer-0'; // Default to Layer0 initially
let currentEditingGroupId = null;
function getSelectedLayerId() {
    return selectedLayerId;
}
function setSelectedLayerId(layerId) {
    selectedLayerId = layerId;
// TODO: Potentially trigger events or updates when state changes
}
function getCurrentEditingGroupId() {
    return currentEditingGroupId;
}
let layerCounter = 1;
let tilesetFeatureCounter = 0;
function getNextLayerId() {
    return `layer-${layerCounter++}`;
}
function getNextTilesetFeatureId() {
    return `tileset-tile-${tilesetFeatureCounter++}`;
}
let currentViewMode = 'map'; // 'map' or 'globe' - Default to map
let is3D = true; // Default to 3D
function getCurrentViewMode() {
    return currentViewMode;
}
function setCurrentViewMode(mode) {
    if (mode === 'map' || mode === 'globe') currentViewMode = mode;
    else console.warn(`Invalid view mode set: ${mode}`);
}
function getIs3D() {
    return is3D;
}
function setIs3D(isThreeD) {
    is3D = !!isThreeD; // Coerce to boolean
}
function setCurrentEditingGroupId(groupId) {
    currentEditingGroupId = groupId;
// TODO: Potentially trigger events or updates when state changes
}

},{"@parcel/transformer-js/src/esmodule-helpers.js":"jnFvT"}],"foGCt":[function(require,module,exports,__globalThis) {
// rete-editor.js - Rete.js setup and node editor logic
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "initializeReteEditor", ()=>initializeReteEditor);
// Function to get the editor instance
parcelHelpers.export(exports, "getReteEditor", ()=>getReteEditor);
var _rete = require("rete");
var _reteAreaPlugin = require("rete-area-plugin");
var _reteConnectionPlugin = require("rete-connection-plugin");
let editor = null;
async function initializeReteEditor(container) {
    if (editor) {
        console.warn("Rete editor already initialized.");
        return editor;
    }
    if (!container) {
        console.error("Rete editor container not found.");
        return null;
    }
    console.log("Initializing Rete.js editor...");
    editor = new (0, _rete.NodeEditor)();
    const area = new (0, _reteAreaPlugin.AreaPlugin)(container);
    const connection = new (0, _reteConnectionPlugin.ConnectionPlugin)();
    // Add presets
    connection.addPreset((0, _reteConnectionPlugin.Presets).classic.setup());
    editor.use(area);
    area.use(connection);
    // Simple example nodes
    const nodeA = new (0, _rete.ClassicPreset).Node('Node A');
    nodeA.addControl('a', new (0, _rete.ClassicPreset).InputControl('text', {
        initial: 'Hello'
    }));
    nodeA.addOutput('a', new (0, _rete.ClassicPreset).Output(new (0, _rete.ClassicPreset).Socket('socket')));
    await editor.addNode(nodeA);
    const nodeB = new (0, _rete.ClassicPreset).Node('Node B');
    nodeB.addInput('b', new (0, _rete.ClassicPreset).Input(new (0, _rete.ClassicPreset).Socket('socket')));
    nodeB.addControl('b', new (0, _rete.ClassicPreset).InputControl('text', {
        initial: 'World'
    }));
    await editor.addNode(nodeB);
    await area.translate(nodeA.id, {
        x: 100,
        y: 100
    });
    await area.translate(nodeB.id, {
        x: 400,
        y: 100
    });
    // Add connection example
    await editor.addConnection(new (0, _rete.ClassicPreset).Connection(nodeA, 'a', nodeB, 'b'));
    // Zoom at origin
    (0, _reteAreaPlugin.AreaExtensions).zoomAt(area, editor.getNodes());
    // Make editor available globally for debugging (optional)
    window.reteEditor = editor;
    window.reteArea = area;
    console.log("Rete.js editor initialized.");
    return {
        editor,
        area
    };
}
function getReteEditor() {
    return editor;
}

},{"rete":"3aYez","rete-area-plugin":"lMdR6","rete-connection-plugin":"8QGGI","@parcel/transformer-js/src/esmodule-helpers.js":"jnFvT"}],"3aYez":[function(require,module,exports,__globalThis) {
/*!
* rete v2.0.4
* (c) 2024 Vitaliy Stoliarov
* Released under the MIT license.
* */ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "ClassicPreset", ()=>classic);
parcelHelpers.export(exports, "NodeEditor", ()=>NodeEditor);
parcelHelpers.export(exports, "Scope", ()=>Scope);
parcelHelpers.export(exports, "Signal", ()=>Signal);
parcelHelpers.export(exports, "getUID", ()=>getUID);
var _asyncToGenerator = require("@babel/runtime/helpers/asyncToGenerator");
var _asyncToGeneratorDefault = parcelHelpers.interopDefault(_asyncToGenerator);
var _classCallCheck = require("@babel/runtime/helpers/classCallCheck");
var _classCallCheckDefault = parcelHelpers.interopDefault(_classCallCheck);
var _createClass = require("@babel/runtime/helpers/createClass");
var _createClassDefault = parcelHelpers.interopDefault(_createClass);
var _possibleConstructorReturn = require("@babel/runtime/helpers/possibleConstructorReturn");
var _possibleConstructorReturnDefault = parcelHelpers.interopDefault(_possibleConstructorReturn);
var _getPrototypeOf = require("@babel/runtime/helpers/getPrototypeOf");
var _getPrototypeOfDefault = parcelHelpers.interopDefault(_getPrototypeOf);
var _inherits = require("@babel/runtime/helpers/inherits");
var _inheritsDefault = parcelHelpers.interopDefault(_inherits);
var _defineProperty = require("@babel/runtime/helpers/defineProperty");
var _definePropertyDefault = parcelHelpers.interopDefault(_defineProperty);
var _regenerator = require("@babel/runtime/regenerator");
var _regeneratorDefault = parcelHelpers.interopDefault(_regenerator);
function _createForOfIteratorHelper$1(r, e) {
    var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (!t) {
        if (Array.isArray(r) || (t = _unsupportedIterableToArray$1(r)) || e && r && "number" == typeof r.length) {
            t && (r = t);
            var _n = 0, F = function F() {};
            return {
                s: F,
                n: function n() {
                    return _n >= r.length ? {
                        done: !0
                    } : {
                        done: !1,
                        value: r[_n++]
                    };
                },
                e: function e(r) {
                    throw r;
                },
                f: F
            };
        }
        throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var o, a = !0, u = !1;
    return {
        s: function s() {
            t = t.call(r);
        },
        n: function n() {
            var r = t.next();
            return a = r.done, r;
        },
        e: function e(r) {
            u = !0, o = r;
        },
        f: function f() {
            try {
                a || null == t["return"] || t["return"]();
            } finally{
                if (u) throw o;
            }
        }
    };
}
function _unsupportedIterableToArray$1(r, a) {
    if (r) {
        if ("string" == typeof r) return _arrayLikeToArray$1(r, a);
        var t = ({}).toString.call(r).slice(8, -1);
        return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray$1(r, a) : void 0;
    }
}
function _arrayLikeToArray$1(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for(var e = 0, n = Array(a); e < a; e++)n[e] = r[e];
    return n;
}
/* eslint-disable @typescript-eslint/no-explicit-any */ /* eslint-disable @typescript-eslint/naming-convention */ /**
 * A middleware type that can modify the data
 * @typeParam T - The data type
 * @param data - The data to be modified
 * @returns The modified data or undefined
 * @example (data) => data + 1
 * @example (data) => undefined // will stop the execution
 * @internal
 */ /**
 * Validate the Scope signals and replace the parameter type with an error message if they are not assignable
 * @internal
 */ /**
 * Provides 'debug' method to check the detailed assignment error message
 * @example .debug($ => $)
 * @internal
 */ function useHelper() {
    return {
        debug: function debug(_f) {
        /* placeholder */ }
    };
}
/**
 * A signal is a middleware chain that can be used to modify the data
 * @typeParam T - The data type
 * @internal
 */ var Signal = /*#__PURE__*/ function() {
    function Signal() {
        (0, _classCallCheckDefault.default)(this, Signal);
        (0, _definePropertyDefault.default)(this, "pipes", []);
    }
    return (0, _createClassDefault.default)(Signal, [
        {
            key: "addPipe",
            value: function addPipe(pipe) {
                this.pipes.push(pipe);
            }
        },
        {
            key: "emit",
            value: function() {
                var _emit = (0, _asyncToGeneratorDefault.default)(/*#__PURE__*/ (0, _regeneratorDefault.default).mark(function _callee(context) {
                    var current, _iterator, _step, pipe;
                    return (0, _regeneratorDefault.default).wrap(function _callee$(_context) {
                        while(true)switch(_context.prev = _context.next){
                            case 0:
                                current = context;
                                _iterator = _createForOfIteratorHelper$1(this.pipes);
                                _context.prev = 2;
                                _iterator.s();
                            case 4:
                                if ((_step = _iterator.n()).done) {
                                    _context.next = 13;
                                    break;
                                }
                                pipe = _step.value;
                                _context.next = 8;
                                return pipe(current);
                            case 8:
                                current = _context.sent;
                                if (!(typeof current === 'undefined')) {
                                    _context.next = 11;
                                    break;
                                }
                                return _context.abrupt("return");
                            case 11:
                                _context.next = 4;
                                break;
                            case 13:
                                _context.next = 18;
                                break;
                            case 15:
                                _context.prev = 15;
                                _context.t0 = _context["catch"](2);
                                _iterator.e(_context.t0);
                            case 18:
                                _context.prev = 18;
                                _iterator.f();
                                return _context.finish(18);
                            case 21:
                                return _context.abrupt("return", current);
                            case 22:
                            case "end":
                                return _context.stop();
                        }
                    }, _callee, this, [
                        [
                            2,
                            15,
                            18,
                            21
                        ]
                    ]);
                }));
                function emit(_x) {
                    return _emit.apply(this, arguments);
                }
                return emit;
            }()
        }
    ]);
}();
/**
 * Base class for all plugins and the core. Provides a signals mechanism to modify the data
 */ var Scope = /*#__PURE__*/ function() {
    // Parents['length'] extends 0 ? undefined : Scope<Parents[0], Tail<Parents>>
    function Scope(name) {
        (0, _classCallCheckDefault.default)(this, Scope);
        (0, _definePropertyDefault.default)(this, "signal", new Signal());
        this.name = name;
    }
    return (0, _createClassDefault.default)(Scope, [
        {
            key: "addPipe",
            value: function addPipe(middleware) {
                this.signal.addPipe(middleware);
            }
        },
        {
            key: "use",
            value: function use(scope) {
                if (!(scope instanceof Scope)) throw new Error('cannot use non-Scope instance');
                scope.setParent(this);
                this.addPipe(function(context) {
                    return scope.signal.emit(context);
                });
                return useHelper();
            }
        },
        {
            key: "setParent",
            value: function setParent(scope) {
                this.parent = scope;
            }
        },
        {
            key: "emit",
            value: function emit(context) {
                return this.signal.emit(context);
            }
        },
        {
            key: "hasParent",
            value: function hasParent() {
                return Boolean(this.parent);
            }
        },
        {
            key: "parentScope",
            value: function parentScope(type) {
                if (!this.parent) throw new Error('cannot find parent');
                if (type && this.parent instanceof type) return this.parent;
                if (type) throw new Error('actual parent is not instance of type');
                return this.parent;
            }
        }
    ]);
}();
function _createForOfIteratorHelper(r, e) {
    var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (!t) {
        if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {
            t && (r = t);
            var _n = 0, F = function F() {};
            return {
                s: F,
                n: function n() {
                    return _n >= r.length ? {
                        done: !0
                    } : {
                        done: !1,
                        value: r[_n++]
                    };
                },
                e: function e(r) {
                    throw r;
                },
                f: F
            };
        }
        throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var o, a = !0, u = !1;
    return {
        s: function s() {
            t = t.call(r);
        },
        n: function n() {
            var r = t.next();
            return a = r.done, r;
        },
        e: function e(r) {
            u = !0, o = r;
        },
        f: function f() {
            try {
                a || null == t["return"] || t["return"]();
            } finally{
                if (u) throw o;
            }
        }
    };
}
function _unsupportedIterableToArray(r, a) {
    if (r) {
        if ("string" == typeof r) return _arrayLikeToArray(r, a);
        var t = ({}).toString.call(r).slice(8, -1);
        return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
}
function _arrayLikeToArray(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for(var e = 0, n = Array(a); e < a; e++)n[e] = r[e];
    return n;
}
function _callSuper$1(t, o, e) {
    return o = (0, _getPrototypeOfDefault.default)(o), (0, _possibleConstructorReturnDefault.default)(t, _isNativeReflectConstruct$1() ? Reflect.construct(o, e || [], (0, _getPrototypeOfDefault.default)(t).constructor) : o.apply(t, e));
}
function _isNativeReflectConstruct$1() {
    try {
        var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
    } catch (t) {}
    return (_isNativeReflectConstruct$1 = function _isNativeReflectConstruct() {
        return !!t;
    })();
}
/**
 * Signal types produced by NodeEditor instance
 * @typeParam Scheme - The scheme type
 * @priority 10
 * @group Primary
 */ /**
 * The NodeEditor class is the entry class. It is used to create and manage nodes and connections.
 * @typeParam Scheme - The scheme type
 * @priority 7
 * @group Primary
 */ var NodeEditor = /*#__PURE__*/ function(_Scope) {
    function NodeEditor() {
        var _this;
        (0, _classCallCheckDefault.default)(this, NodeEditor);
        _this = _callSuper$1(this, NodeEditor, [
            'NodeEditor'
        ]);
        (0, _definePropertyDefault.default)(_this, "nodes", []);
        (0, _definePropertyDefault.default)(_this, "connections", []);
        return _this;
    }
    /**
   * Get a node by id
   * @param id - The node id
   * @returns The node or undefined
   */ (0, _inheritsDefault.default)(NodeEditor, _Scope);
    return (0, _createClassDefault.default)(NodeEditor, [
        {
            key: "getNode",
            value: function getNode(id) {
                return this.nodes.find(function(node) {
                    return node.id === id;
                });
            }
        },
        {
            key: "getNodes",
            value: function getNodes() {
                return this.nodes.slice();
            }
        },
        {
            key: "getConnections",
            value: function getConnections() {
                return this.connections.slice();
            }
        },
        {
            key: "getConnection",
            value: function getConnection(id) {
                return this.connections.find(function(connection) {
                    return connection.id === id;
                });
            }
        },
        {
            key: "addNode",
            value: function() {
                var _addNode = (0, _asyncToGeneratorDefault.default)(/*#__PURE__*/ (0, _regeneratorDefault.default).mark(function _callee(data) {
                    return (0, _regeneratorDefault.default).wrap(function _callee$(_context) {
                        while(true)switch(_context.prev = _context.next){
                            case 0:
                                if (!this.getNode(data.id)) {
                                    _context.next = 2;
                                    break;
                                }
                                throw new Error('node has already been added');
                            case 2:
                                _context.next = 4;
                                return this.emit({
                                    type: 'nodecreate',
                                    data: data
                                });
                            case 4:
                                if (_context.sent) {
                                    _context.next = 6;
                                    break;
                                }
                                return _context.abrupt("return", false);
                            case 6:
                                this.nodes.push(data);
                                _context.next = 9;
                                return this.emit({
                                    type: 'nodecreated',
                                    data: data
                                });
                            case 9:
                                return _context.abrupt("return", true);
                            case 10:
                            case "end":
                                return _context.stop();
                        }
                    }, _callee, this);
                }));
                function addNode(_x) {
                    return _addNode.apply(this, arguments);
                }
                return addNode;
            }()
        },
        {
            key: "addConnection",
            value: function() {
                var _addConnection = (0, _asyncToGeneratorDefault.default)(/*#__PURE__*/ (0, _regeneratorDefault.default).mark(function _callee2(data) {
                    return (0, _regeneratorDefault.default).wrap(function _callee2$(_context2) {
                        while(true)switch(_context2.prev = _context2.next){
                            case 0:
                                if (!this.getConnection(data.id)) {
                                    _context2.next = 2;
                                    break;
                                }
                                throw new Error('connection has already been added');
                            case 2:
                                _context2.next = 4;
                                return this.emit({
                                    type: 'connectioncreate',
                                    data: data
                                });
                            case 4:
                                if (_context2.sent) {
                                    _context2.next = 6;
                                    break;
                                }
                                return _context2.abrupt("return", false);
                            case 6:
                                this.connections.push(data);
                                _context2.next = 9;
                                return this.emit({
                                    type: 'connectioncreated',
                                    data: data
                                });
                            case 9:
                                return _context2.abrupt("return", true);
                            case 10:
                            case "end":
                                return _context2.stop();
                        }
                    }, _callee2, this);
                }));
                function addConnection(_x2) {
                    return _addConnection.apply(this, arguments);
                }
                return addConnection;
            }()
        },
        {
            key: "removeNode",
            value: function() {
                var _removeNode = (0, _asyncToGeneratorDefault.default)(/*#__PURE__*/ (0, _regeneratorDefault.default).mark(function _callee3(id) {
                    var index, node;
                    return (0, _regeneratorDefault.default).wrap(function _callee3$(_context3) {
                        while(true)switch(_context3.prev = _context3.next){
                            case 0:
                                index = this.nodes.findIndex(function(n) {
                                    return n.id === id;
                                });
                                node = this.nodes[index];
                                if (!(index < 0)) {
                                    _context3.next = 4;
                                    break;
                                }
                                throw new Error('cannot find node');
                            case 4:
                                _context3.next = 6;
                                return this.emit({
                                    type: 'noderemove',
                                    data: node
                                });
                            case 6:
                                if (_context3.sent) {
                                    _context3.next = 8;
                                    break;
                                }
                                return _context3.abrupt("return", false);
                            case 8:
                                this.nodes.splice(index, 1);
                                _context3.next = 11;
                                return this.emit({
                                    type: 'noderemoved',
                                    data: node
                                });
                            case 11:
                                return _context3.abrupt("return", true);
                            case 12:
                            case "end":
                                return _context3.stop();
                        }
                    }, _callee3, this);
                }));
                function removeNode(_x3) {
                    return _removeNode.apply(this, arguments);
                }
                return removeNode;
            }()
        },
        {
            key: "removeConnection",
            value: function() {
                var _removeConnection = (0, _asyncToGeneratorDefault.default)(/*#__PURE__*/ (0, _regeneratorDefault.default).mark(function _callee4(id) {
                    var index, connection;
                    return (0, _regeneratorDefault.default).wrap(function _callee4$(_context4) {
                        while(true)switch(_context4.prev = _context4.next){
                            case 0:
                                index = this.connections.findIndex(function(n) {
                                    return n.id === id;
                                });
                                connection = this.connections[index];
                                if (!(index < 0)) {
                                    _context4.next = 4;
                                    break;
                                }
                                throw new Error('cannot find connection');
                            case 4:
                                _context4.next = 6;
                                return this.emit({
                                    type: 'connectionremove',
                                    data: connection
                                });
                            case 6:
                                if (_context4.sent) {
                                    _context4.next = 8;
                                    break;
                                }
                                return _context4.abrupt("return", false);
                            case 8:
                                this.connections.splice(index, 1);
                                _context4.next = 11;
                                return this.emit({
                                    type: 'connectionremoved',
                                    data: connection
                                });
                            case 11:
                                return _context4.abrupt("return", true);
                            case 12:
                            case "end":
                                return _context4.stop();
                        }
                    }, _callee4, this);
                }));
                function removeConnection(_x4) {
                    return _removeConnection.apply(this, arguments);
                }
                return removeConnection;
            }()
        },
        {
            key: "clear",
            value: function() {
                var _clear = (0, _asyncToGeneratorDefault.default)(/*#__PURE__*/ (0, _regeneratorDefault.default).mark(function _callee5() {
                    var _iterator, _step, connection, _iterator2, _step2, node;
                    return (0, _regeneratorDefault.default).wrap(function _callee5$(_context5) {
                        while(true)switch(_context5.prev = _context5.next){
                            case 0:
                                _context5.next = 2;
                                return this.emit({
                                    type: 'clear'
                                });
                            case 2:
                                if (_context5.sent) {
                                    _context5.next = 6;
                                    break;
                                }
                                _context5.next = 5;
                                return this.emit({
                                    type: 'clearcancelled'
                                });
                            case 5:
                                return _context5.abrupt("return", false);
                            case 6:
                                _iterator = _createForOfIteratorHelper(this.connections.slice());
                                _context5.prev = 7;
                                _iterator.s();
                            case 9:
                                if ((_step = _iterator.n()).done) {
                                    _context5.next = 15;
                                    break;
                                }
                                connection = _step.value;
                                _context5.next = 13;
                                return this.removeConnection(connection.id);
                            case 13:
                                _context5.next = 9;
                                break;
                            case 15:
                                _context5.next = 20;
                                break;
                            case 17:
                                _context5.prev = 17;
                                _context5.t0 = _context5["catch"](7);
                                _iterator.e(_context5.t0);
                            case 20:
                                _context5.prev = 20;
                                _iterator.f();
                                return _context5.finish(20);
                            case 23:
                                _iterator2 = _createForOfIteratorHelper(this.nodes.slice());
                                _context5.prev = 24;
                                _iterator2.s();
                            case 26:
                                if ((_step2 = _iterator2.n()).done) {
                                    _context5.next = 32;
                                    break;
                                }
                                node = _step2.value;
                                _context5.next = 30;
                                return this.removeNode(node.id);
                            case 30:
                                _context5.next = 26;
                                break;
                            case 32:
                                _context5.next = 37;
                                break;
                            case 34:
                                _context5.prev = 34;
                                _context5.t1 = _context5["catch"](24);
                                _iterator2.e(_context5.t1);
                            case 37:
                                _context5.prev = 37;
                                _iterator2.f();
                                return _context5.finish(37);
                            case 40:
                                _context5.next = 42;
                                return this.emit({
                                    type: 'cleared'
                                });
                            case 42:
                                return _context5.abrupt("return", true);
                            case 43:
                            case "end":
                                return _context5.stop();
                        }
                    }, _callee5, this, [
                        [
                            7,
                            17,
                            20,
                            23
                        ],
                        [
                            24,
                            34,
                            37,
                            40
                        ]
                    ]);
                }));
                function clear() {
                    return _clear.apply(this, arguments);
                }
                return clear;
            }()
        }
    ]);
}(Scope);
var crypto = globalThis.crypto;
/**
 * @returns A unique id
 */ function getUID() {
    if ('randomBytes' in crypto) return crypto.randomBytes(8).toString('hex');
    var bytes = crypto.getRandomValues(new Uint8Array(8));
    var array = Array.from(bytes);
    var hexPairs = array.map(function(b) {
        return b.toString(16).padStart(2, '0');
    });
    return hexPairs.join('');
}
function _callSuper(t, o, e) {
    return o = (0, _getPrototypeOfDefault.default)(o), (0, _possibleConstructorReturnDefault.default)(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], (0, _getPrototypeOfDefault.default)(t).constructor) : o.apply(t, e));
}
function _isNativeReflectConstruct() {
    try {
        var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
    } catch (t) {}
    return (_isNativeReflectConstruct = function _isNativeReflectConstruct() {
        return !!t;
    })();
}
/**
 * The socket class
 * @priority 7
 */ var Socket = /*#__PURE__*/ (0, _createClassDefault.default)(/**
 * @constructor
 * @param name Name of the socket
 */ function Socket(name) {
    (0, _classCallCheckDefault.default)(this, Socket);
    this.name = name;
});
/**
 * General port class
 */ var Port = /*#__PURE__*/ (0, _createClassDefault.default)(/**
 * Port id, unique string generated by `getUID` function
 */ /**
 * Port index, used for sorting ports. Default is `0`
 */ /**
 * @constructor
 * @param socket Socket instance
 * @param label Label of the port
 * @param multipleConnections Whether the output port can have multiple connections
 */ function Port(socket, label, multipleConnections) {
    (0, _classCallCheckDefault.default)(this, Port);
    this.socket = socket;
    this.label = label;
    this.multipleConnections = multipleConnections;
    this.id = getUID();
});
/**
 * The input port class
 * @priority 6
 */ var Input = /*#__PURE__*/ function(_Port) {
    /**
   * @constructor
   * @param socket Socket instance
   * @param label Label of the input port
   * @param multipleConnections Whether the output port can have multiple connections. Default is `false`
   */ function Input(socket, label, multipleConnections) {
        var _this;
        (0, _classCallCheckDefault.default)(this, Input);
        _this = _callSuper(this, Input, [
            socket,
            label,
            multipleConnections
        ]);
        /**
     * Control instance
     */ (0, _definePropertyDefault.default)(_this, "control", null);
        /**
     * Whether the control is visible. Can be managed dynamically by extensions. Default is `true`
     */ (0, _definePropertyDefault.default)(_this, "showControl", true);
        _this.socket = socket;
        _this.label = label;
        _this.multipleConnections = multipleConnections;
        return _this;
    }
    /**
   * Add control to the input port
   * @param control Control instance
   */ (0, _inheritsDefault.default)(Input, _Port);
    return (0, _createClassDefault.default)(Input, [
        {
            key: "addControl",
            value: function addControl(control) {
                if (this.control) throw new Error('control already added for this input');
                this.control = control;
            }
        },
        {
            key: "removeControl",
            value: function removeControl() {
                this.control = null;
            }
        }
    ]);
}(Port);
/**
 * The output port class
 * @priority 5
 */ var Output = /*#__PURE__*/ function(_Port2) {
    /**
   * @constructor
   * @param socket Socket instance
   * @param label Label of the output port
   * @param multipleConnections Whether the output port can have multiple connections. Default is `true`
   */ function Output(socket, label, multipleConnections) {
        (0, _classCallCheckDefault.default)(this, Output);
        return _callSuper(this, Output, [
            socket,
            label,
            multipleConnections !== false
        ]);
    }
    (0, _inheritsDefault.default)(Output, _Port2);
    return (0, _createClassDefault.default)(Output);
}(Port);
/**
 * General control class
 * @priority 5
 */ var Control = /*#__PURE__*/ (0, _createClassDefault.default)(/**
 * Control id, unique string generated by `getUID` function
 */ /**
 * Control index, used for sorting controls. Default is `0`
 */ function Control() {
    (0, _classCallCheckDefault.default)(this, Control);
    this.id = getUID();
});
/**
 * Input control options
 */ /**
 * The input control class
 * @example new InputControl('text', { readonly: true, initial: 'hello' })
 */ var InputControl = /*#__PURE__*/ function(_Control) {
    /**
   * @constructor
   * @param type Type of the control: `text` or `number`
   * @param options Control options
   */ function InputControl(type, options) {
        var _options$readonly;
        var _this2;
        (0, _classCallCheckDefault.default)(this, InputControl);
        _this2 = _callSuper(this, InputControl);
        _this2.type = type;
        _this2.options = options;
        _this2.id = getUID();
        _this2.readonly = (_options$readonly = options === null || options === void 0 ? void 0 : options.readonly) !== null && _options$readonly !== void 0 ? _options$readonly : false;
        if (typeof (options === null || options === void 0 ? void 0 : options.initial) !== 'undefined') _this2.value = options.initial;
        return _this2;
    }
    /**
   * Set control value
   * @param value Value to set
   */ (0, _inheritsDefault.default)(InputControl, _Control);
    return (0, _createClassDefault.default)(InputControl, [
        {
            key: "setValue",
            value: function setValue(value) {
                var _this$options;
                this.value = value;
                if ((_this$options = this.options) !== null && _this$options !== void 0 && _this$options.change) this.options.change(value);
            }
        }
    ]);
}(Control);
/**
 * The node class
 * @priority 10
 * @example new Node('math')
 */ var Node = /*#__PURE__*/ function() {
    /**
   * Whether the node is selected. Default is `false`
   */ function Node(label) {
        (0, _classCallCheckDefault.default)(this, Node);
        /**
     * Node id, unique string generated by `getUID` function
     */ /**
     * Node inputs
     */ (0, _definePropertyDefault.default)(this, "inputs", {});
        /**
     * Node outputs
     */ (0, _definePropertyDefault.default)(this, "outputs", {});
        /**
     * Node controls
     */ (0, _definePropertyDefault.default)(this, "controls", {});
        this.label = label;
        this.id = getUID();
    }
    return (0, _createClassDefault.default)(Node, [
        {
            key: "hasInput",
            value: function hasInput(key) {
                return Object.prototype.hasOwnProperty.call(this.inputs, key);
            }
        },
        {
            key: "addInput",
            value: function addInput(key, input) {
                if (this.hasInput(key)) throw new Error("input with key '".concat(String(key), "' already added"));
                Object.defineProperty(this.inputs, key, {
                    value: input,
                    enumerable: true,
                    configurable: true
                });
            }
        },
        {
            key: "removeInput",
            value: function removeInput(key) {
                delete this.inputs[key];
            }
        },
        {
            key: "hasOutput",
            value: function hasOutput(key) {
                return Object.prototype.hasOwnProperty.call(this.outputs, key);
            }
        },
        {
            key: "addOutput",
            value: function addOutput(key, output) {
                if (this.hasOutput(key)) throw new Error("output with key '".concat(String(key), "' already added"));
                Object.defineProperty(this.outputs, key, {
                    value: output,
                    enumerable: true,
                    configurable: true
                });
            }
        },
        {
            key: "removeOutput",
            value: function removeOutput(key) {
                delete this.outputs[key];
            }
        },
        {
            key: "hasControl",
            value: function hasControl(key) {
                return Object.prototype.hasOwnProperty.call(this.controls, key);
            }
        },
        {
            key: "addControl",
            value: function addControl(key, control) {
                if (this.hasControl(key)) throw new Error("control with key '".concat(String(key), "' already added"));
                Object.defineProperty(this.controls, key, {
                    value: control,
                    enumerable: true,
                    configurable: true
                });
            }
        },
        {
            key: "removeControl",
            value: function removeControl(key) {
                delete this.controls[key];
            }
        }
    ]);
}();
/**
 * The connection class
 * @priority 9
 */ var Connection = /*#__PURE__*/ (0, _createClassDefault.default)(/**
 * Connection id, unique string generated by `getUID` function
 */ /**
 * Source node id
 */ /**
 * Target node id
 */ /**
 * @constructor
 * @param source Source node instance
 * @param sourceOutput Source node output key
 * @param target Target node instance
 * @param targetInput Target node input key
 */ function Connection(source, sourceOutput, target, targetInput) {
    (0, _classCallCheckDefault.default)(this, Connection);
    this.sourceOutput = sourceOutput;
    this.targetInput = targetInput;
    if (!source.outputs[sourceOutput]) throw new Error("source node doesn't have output with a key ".concat(String(sourceOutput)));
    if (!target.inputs[targetInput]) throw new Error("target node doesn't have input with a key ".concat(String(targetInput)));
    this.id = getUID();
    this.source = source.id;
    this.target = target.id;
});
var classic = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    Socket: Socket,
    Port: Port,
    Input: Input,
    Output: Output,
    Control: Control,
    InputControl: InputControl,
    Node: Node,
    Connection: Connection
});

},{"@babel/runtime/helpers/asyncToGenerator":"3sxrH","@babel/runtime/helpers/classCallCheck":"fbbZA","@babel/runtime/helpers/createClass":"lr6gv","@babel/runtime/helpers/possibleConstructorReturn":"3sko5","@babel/runtime/helpers/getPrototypeOf":"aGuV6","@babel/runtime/helpers/inherits":"8CbKS","@babel/runtime/helpers/defineProperty":"azbUC","@babel/runtime/regenerator":"baIBJ","@parcel/transformer-js/src/esmodule-helpers.js":"jnFvT"}],"3sxrH":[function(require,module,exports,__globalThis) {
function asyncGeneratorStep(n, t, e, r, o, a, c) {
    try {
        var i = n[a](c), u = i.value;
    } catch (n) {
        return void e(n);
    }
    i.done ? t(u) : Promise.resolve(u).then(r, o);
}
function _asyncToGenerator(n) {
    return function() {
        var t = this, e = arguments;
        return new Promise(function(r, o) {
            var a = n.apply(t, e);
            function _next(n) {
                asyncGeneratorStep(a, r, o, _next, _throw, "next", n);
            }
            function _throw(n) {
                asyncGeneratorStep(a, r, o, _next, _throw, "throw", n);
            }
            _next(void 0);
        });
    };
}
module.exports = _asyncToGenerator, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{}],"fbbZA":[function(require,module,exports,__globalThis) {
function _classCallCheck(a, n) {
    if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
}
module.exports = _classCallCheck, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{}],"lr6gv":[function(require,module,exports,__globalThis) {
var toPropertyKey = require("b03a9e1e96a7e901");
function _defineProperties(e, r) {
    for(var t = 0; t < r.length; t++){
        var o = r[t];
        o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, toPropertyKey(o.key), o);
    }
}
function _createClass(e, r, t) {
    return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", {
        writable: !1
    }), e;
}
module.exports = _createClass, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{"b03a9e1e96a7e901":"9dbMY"}],"9dbMY":[function(require,module,exports,__globalThis) {
var _typeof = require("a14bd529aa4ac1cd")["default"];
var toPrimitive = require("2713647ce51d8c75");
function toPropertyKey(t) {
    var i = toPrimitive(t, "string");
    return "symbol" == _typeof(i) ? i : i + "";
}
module.exports = toPropertyKey, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{"a14bd529aa4ac1cd":"7EL9t","2713647ce51d8c75":"i9rZS"}],"7EL9t":[function(require,module,exports,__globalThis) {
function _typeof(o) {
    "@babel/helpers - typeof";
    return module.exports = _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
        return typeof o;
    } : function(o) {
        return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
    }, module.exports.__esModule = true, module.exports["default"] = module.exports, _typeof(o);
}
module.exports = _typeof, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{}],"i9rZS":[function(require,module,exports,__globalThis) {
var _typeof = require("e0211298897b2d31")["default"];
function toPrimitive(t, r) {
    if ("object" != _typeof(t) || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
        var i = e.call(t, r || "default");
        if ("object" != _typeof(i)) return i;
        throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
}
module.exports = toPrimitive, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{"e0211298897b2d31":"7EL9t"}],"3sko5":[function(require,module,exports,__globalThis) {
var _typeof = require("52fa942c15a57b36")["default"];
var assertThisInitialized = require("ca3744a9acc8b6f9");
function _possibleConstructorReturn(t, e) {
    if (e && ("object" == _typeof(e) || "function" == typeof e)) return e;
    if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
    return assertThisInitialized(t);
}
module.exports = _possibleConstructorReturn, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{"52fa942c15a57b36":"7EL9t","ca3744a9acc8b6f9":"kW34G"}],"kW34G":[function(require,module,exports,__globalThis) {
function _assertThisInitialized(e) {
    if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    return e;
}
module.exports = _assertThisInitialized, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{}],"aGuV6":[function(require,module,exports,__globalThis) {
function _getPrototypeOf(t) {
    return module.exports = _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(t) {
        return t.__proto__ || Object.getPrototypeOf(t);
    }, module.exports.__esModule = true, module.exports["default"] = module.exports, _getPrototypeOf(t);
}
module.exports = _getPrototypeOf, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{}],"8CbKS":[function(require,module,exports,__globalThis) {
var setPrototypeOf = require("f41396146170672b");
function _inherits(t, e) {
    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
    t.prototype = Object.create(e && e.prototype, {
        constructor: {
            value: t,
            writable: !0,
            configurable: !0
        }
    }), Object.defineProperty(t, "prototype", {
        writable: !1
    }), e && setPrototypeOf(t, e);
}
module.exports = _inherits, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{"f41396146170672b":"bin2t"}],"bin2t":[function(require,module,exports,__globalThis) {
function _setPrototypeOf(t, e) {
    return module.exports = _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(t, e) {
        return t.__proto__ = e, t;
    }, module.exports.__esModule = true, module.exports["default"] = module.exports, _setPrototypeOf(t, e);
}
module.exports = _setPrototypeOf, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{}],"azbUC":[function(require,module,exports,__globalThis) {
var toPropertyKey = require("29ac19868e7f119");
function _defineProperty(e, r, t) {
    return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
        value: t,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[r] = t, e;
}
module.exports = _defineProperty, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{"29ac19868e7f119":"9dbMY"}],"baIBJ":[function(require,module,exports,__globalThis) {
// TODO(Babel 8): Remove this file.
var runtime = require("1716bf03fd9b86cf")();
module.exports = runtime;
// Copied from https://github.com/facebook/regenerator/blob/main/packages/runtime/runtime.js#L736=
try {
    regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
    if (typeof globalThis === "object") globalThis.regeneratorRuntime = runtime;
    else Function("r", "regeneratorRuntime = r")(runtime);
}

},{"1716bf03fd9b86cf":"6RVg1"}],"6RVg1":[function(require,module,exports,__globalThis) {
var _typeof = require("921e792370458e88")["default"];
function _regeneratorRuntime() {
    "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ 
    module.exports = _regeneratorRuntime = function _regeneratorRuntime() {
        return e;
    }, module.exports.__esModule = true, module.exports["default"] = module.exports;
    var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function(t, e, r) {
        t[e] = r.value;
    }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag";
    function define(t, e, r) {
        return Object.defineProperty(t, e, {
            value: r,
            enumerable: !0,
            configurable: !0,
            writable: !0
        }), t[e];
    }
    try {
        define({}, "");
    } catch (t) {
        define = function define(t, e, r) {
            return t[e] = r;
        };
    }
    function wrap(t, e, r, n) {
        var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []);
        return o(a, "_invoke", {
            value: makeInvokeMethod(t, r, c)
        }), a;
    }
    function tryCatch(t, e, r) {
        try {
            return {
                type: "normal",
                arg: t.call(e, r)
            };
        } catch (t) {
            return {
                type: "throw",
                arg: t
            };
        }
    }
    e.wrap = wrap;
    var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {};
    function Generator() {}
    function GeneratorFunction() {}
    function GeneratorFunctionPrototype() {}
    var p = {};
    define(p, a, function() {
        return this;
    });
    var d = Object.getPrototypeOf, v = d && d(d(values([])));
    v && v !== r && n.call(v, a) && (p = v);
    var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p);
    function defineIteratorMethods(t) {
        [
            "next",
            "throw",
            "return"
        ].forEach(function(e) {
            define(t, e, function(t) {
                return this._invoke(e, t);
            });
        });
    }
    function AsyncIterator(t, e) {
        function invoke(r, o, i, a) {
            var c = tryCatch(t[r], t, o);
            if ("throw" !== c.type) {
                var u = c.arg, h = u.value;
                return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function(t) {
                    invoke("next", t, i, a);
                }, function(t) {
                    invoke("throw", t, i, a);
                }) : e.resolve(h).then(function(t) {
                    u.value = t, i(u);
                }, function(t) {
                    return invoke("throw", t, i, a);
                });
            }
            a(c.arg);
        }
        var r;
        o(this, "_invoke", {
            value: function value(t, n) {
                function callInvokeWithMethodAndArg() {
                    return new e(function(e, r) {
                        invoke(t, n, e, r);
                    });
                }
                return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
            }
        });
    }
    function makeInvokeMethod(e, r, n) {
        var o = h;
        return function(i, a) {
            if (o === f) throw Error("Generator is already running");
            if (o === s) {
                if ("throw" === i) throw a;
                return {
                    value: t,
                    done: !0
                };
            }
            for(n.method = i, n.arg = a;;){
                var c = n.delegate;
                if (c) {
                    var u = maybeInvokeDelegate(c, n);
                    if (u) {
                        if (u === y) continue;
                        return u;
                    }
                }
                if ("next" === n.method) n.sent = n._sent = n.arg;
                else if ("throw" === n.method) {
                    if (o === h) throw o = s, n.arg;
                    n.dispatchException(n.arg);
                } else "return" === n.method && n.abrupt("return", n.arg);
                o = f;
                var p = tryCatch(e, r, n);
                if ("normal" === p.type) {
                    if (o = n.done ? s : l, p.arg === y) continue;
                    return {
                        value: p.arg,
                        done: n.done
                    };
                }
                "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg);
            }
        };
    }
    function maybeInvokeDelegate(e, r) {
        var n = r.method, o = e.iterator[n];
        if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y;
        var i = tryCatch(o, e.iterator, r.arg);
        if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y;
        var a = i.arg;
        return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y);
    }
    function pushTryEntry(t) {
        var e = {
            tryLoc: t[0]
        };
        1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e);
    }
    function resetTryEntry(t) {
        var e = t.completion || {};
        e.type = "normal", delete e.arg, t.completion = e;
    }
    function Context(t) {
        this.tryEntries = [
            {
                tryLoc: "root"
            }
        ], t.forEach(pushTryEntry, this), this.reset(!0);
    }
    function values(e) {
        if (e || "" === e) {
            var r = e[a];
            if (r) return r.call(e);
            if ("function" == typeof e.next) return e;
            if (!isNaN(e.length)) {
                var o = -1, i = function next() {
                    for(; ++o < e.length;)if (n.call(e, o)) return next.value = e[o], next.done = !1, next;
                    return next.value = t, next.done = !0, next;
                };
                return i.next = i;
            }
        }
        throw new TypeError(_typeof(e) + " is not iterable");
    }
    return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", {
        value: GeneratorFunctionPrototype,
        configurable: !0
    }), o(GeneratorFunctionPrototype, "constructor", {
        value: GeneratorFunction,
        configurable: !0
    }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function(t) {
        var e = "function" == typeof t && t.constructor;
        return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name));
    }, e.mark = function(t) {
        return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t;
    }, e.awrap = function(t) {
        return {
            __await: t
        };
    }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function() {
        return this;
    }), e.AsyncIterator = AsyncIterator, e.async = function(t, r, n, o, i) {
        void 0 === i && (i = Promise);
        var a = new AsyncIterator(wrap(t, r, n, o), i);
        return e.isGeneratorFunction(r) ? a : a.next().then(function(t) {
            return t.done ? t.value : a.next();
        });
    }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function() {
        return this;
    }), define(g, "toString", function() {
        return "[object Generator]";
    }), e.keys = function(t) {
        var e = Object(t), r = [];
        for(var n in e)r.push(n);
        return r.reverse(), function next() {
            for(; r.length;){
                var t = r.pop();
                if (t in e) return next.value = t, next.done = !1, next;
            }
            return next.done = !0, next;
        };
    }, e.values = values, Context.prototype = {
        constructor: Context,
        reset: function reset(e) {
            if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for(var r in this)"t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t);
        },
        stop: function stop() {
            this.done = !0;
            var t = this.tryEntries[0].completion;
            if ("throw" === t.type) throw t.arg;
            return this.rval;
        },
        dispatchException: function dispatchException(e) {
            if (this.done) throw e;
            var r = this;
            function handle(n, o) {
                return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o;
            }
            for(var o = this.tryEntries.length - 1; o >= 0; --o){
                var i = this.tryEntries[o], a = i.completion;
                if ("root" === i.tryLoc) return handle("end");
                if (i.tryLoc <= this.prev) {
                    var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc");
                    if (c && u) {
                        if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
                        if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
                    } else if (c) {
                        if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
                    } else {
                        if (!u) throw Error("try statement without catch or finally");
                        if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
                    }
                }
            }
        },
        abrupt: function abrupt(t, e) {
            for(var r = this.tryEntries.length - 1; r >= 0; --r){
                var o = this.tryEntries[r];
                if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) {
                    var i = o;
                    break;
                }
            }
            i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null);
            var a = i ? i.completion : {};
            return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a);
        },
        complete: function complete(t, e) {
            if ("throw" === t.type) throw t.arg;
            return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y;
        },
        finish: function finish(t) {
            for(var e = this.tryEntries.length - 1; e >= 0; --e){
                var r = this.tryEntries[e];
                if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y;
            }
        },
        "catch": function _catch(t) {
            for(var e = this.tryEntries.length - 1; e >= 0; --e){
                var r = this.tryEntries[e];
                if (r.tryLoc === t) {
                    var n = r.completion;
                    if ("throw" === n.type) {
                        var o = n.arg;
                        resetTryEntry(r);
                    }
                    return o;
                }
            }
            throw Error("illegal catch attempt");
        },
        delegateYield: function delegateYield(e, r, n) {
            return this.delegate = {
                iterator: values(e),
                resultName: r,
                nextLoc: n
            }, "next" === this.method && (this.arg = t), y;
        }
    }, e;
}
module.exports = _regeneratorRuntime, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{"921e792370458e88":"7EL9t"}],"lMdR6":[function(require,module,exports,__globalThis) {
/*!
* rete-area-plugin v2.1.2
* (c) 2024 Vitaliy Stoliarov
* Released under the MIT license.
* */ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Area", ()=>Area);
parcelHelpers.export(exports, "AreaExtensions", ()=>index);
parcelHelpers.export(exports, "AreaPlugin", ()=>AreaPlugin);
parcelHelpers.export(exports, "BaseAreaPlugin", ()=>BaseAreaPlugin);
parcelHelpers.export(exports, "Drag", ()=>Drag);
parcelHelpers.export(exports, "NodeView", ()=>NodeView);
parcelHelpers.export(exports, "Zoom", ()=>Zoom);
parcelHelpers.export(exports, "usePointerListener", ()=>usePointerListener);
var _asyncToGenerator = require("@babel/runtime/helpers/asyncToGenerator");
var _asyncToGeneratorDefault = parcelHelpers.interopDefault(_asyncToGenerator);
var _typeof = require("@babel/runtime/helpers/typeof");
var _typeofDefault = parcelHelpers.interopDefault(_typeof);
var _classCallCheck = require("@babel/runtime/helpers/classCallCheck");
var _classCallCheckDefault = parcelHelpers.interopDefault(_classCallCheck);
var _createClass = require("@babel/runtime/helpers/createClass");
var _createClassDefault = parcelHelpers.interopDefault(_createClass);
var _possibleConstructorReturn = require("@babel/runtime/helpers/possibleConstructorReturn");
var _possibleConstructorReturnDefault = parcelHelpers.interopDefault(_possibleConstructorReturn);
var _getPrototypeOf = require("@babel/runtime/helpers/getPrototypeOf");
var _getPrototypeOfDefault = parcelHelpers.interopDefault(_getPrototypeOf);
var _inherits = require("@babel/runtime/helpers/inherits");
var _inheritsDefault = parcelHelpers.interopDefault(_inherits);
var _defineProperty = require("@babel/runtime/helpers/defineProperty");
var _definePropertyDefault = parcelHelpers.interopDefault(_defineProperty);
var _regenerator = require("@babel/runtime/regenerator");
var _regeneratorDefault = parcelHelpers.interopDefault(_regenerator);
var _toConsumableArray = require("@babel/runtime/helpers/toConsumableArray");
var _toConsumableArrayDefault = parcelHelpers.interopDefault(_toConsumableArray);
var _rete = require("rete");
function ___$insertStyle(css) {
    if (!css) return;
    if (typeof window === 'undefined') return;
    var style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.innerHTML = css;
    document.head.appendChild(style);
    return css;
}
var Content = /*#__PURE__*/ function() {
    function Content(reordered) {
        (0, _classCallCheckDefault.default)(this, Content);
        this.reordered = reordered;
        this.holder = document.createElement('div');
        this.holder.style.transformOrigin = '0 0';
    }
    return (0, _createClassDefault.default)(Content, [
        {
            key: "getPointerFrom",
            value: function getPointerFrom(event) {
                var _this$holder$getBound = this.holder.getBoundingClientRect(), left = _this$holder$getBound.left, top = _this$holder$getBound.top;
                var x = event.clientX - left;
                var y = event.clientY - top;
                return {
                    x: x,
                    y: y
                };
            }
        },
        {
            key: "add",
            value: function add(element) {
                this.holder.appendChild(element);
            }
        },
        {
            key: "reorder",
            value: function() {
                var _reorder = (0, _asyncToGeneratorDefault.default)(/*#__PURE__*/ (0, _regeneratorDefault.default).mark(function _callee(target, next) {
                    return (0, _regeneratorDefault.default).wrap(function _callee$(_context) {
                        while(true)switch(_context.prev = _context.next){
                            case 0:
                                if (this.holder.contains(target)) {
                                    _context.next = 2;
                                    break;
                                }
                                throw new Error("content doesn't have 'target' for reordering");
                            case 2:
                                if (!(next !== null && !this.holder.contains(next))) {
                                    _context.next = 4;
                                    break;
                                }
                                throw new Error("content doesn't have 'next' for reordering");
                            case 4:
                                this.holder.insertBefore(target, next);
                                _context.next = 7;
                                return this.reordered(target);
                            case 7:
                            case "end":
                                return _context.stop();
                        }
                    }, _callee, this);
                }));
                function reorder(_x, _x2) {
                    return _reorder.apply(this, arguments);
                }
                return reorder;
            }()
        },
        {
            key: "remove",
            value: function remove(element) {
                if (this.holder.contains(element)) this.holder.removeChild(element);
            }
        }
    ]);
}();
/**
 * listen to pointerdown, window's pointermove and pointerup events,
 * where last two not active before pointerdown triggered for performance reasons
 */ function usePointerListener(element, handlers) {
    var move = function move(event) {
        handlers.move(event);
    };
    var _up = function up(event) {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', _up);
        window.removeEventListener('pointercancel', _up);
        handlers.up(event);
    };
    var down = function down(event) {
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', _up);
        window.addEventListener('pointercancel', _up);
        handlers.down(event);
    };
    element.addEventListener('pointerdown', down);
    return {
        destroy: function destroy() {
            element.removeEventListener('pointerdown', down);
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', _up);
            window.removeEventListener('pointercancel', _up);
        }
    };
}
/**
 * Bounding box
 */ var min = function min(arr) {
    return arr.length === 0 ? 0 : Math.min.apply(Math, (0, _toConsumableArrayDefault.default)(arr));
};
var max = function max(arr) {
    return arr.length === 0 ? 0 : Math.max.apply(Math, (0, _toConsumableArrayDefault.default)(arr));
};
function getBoundingBox$1(rects) {
    var left = min(rects.map(function(rect) {
        return rect.position.x;
    }));
    var top = min(rects.map(function(rect) {
        return rect.position.y;
    }));
    var right = max(rects.map(function(rect) {
        return rect.position.x + rect.width;
    }));
    var bottom = max(rects.map(function(rect) {
        return rect.position.y + rect.height;
    }));
    return {
        left: left,
        right: right,
        top: top,
        bottom: bottom,
        width: Math.abs(left - right),
        height: Math.abs(top - bottom),
        center: {
            x: (left + right) / 2,
            y: (top + bottom) / 2
        }
    };
}
function ownKeys$4(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r && (o = o.filter(function(r) {
            return Object.getOwnPropertyDescriptor(e, r).enumerable;
        })), t.push.apply(t, o);
    }
    return t;
}
function _objectSpread$4(e) {
    for(var r = 1; r < arguments.length; r++){
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2 ? ownKeys$4(Object(t), !0).forEach(function(r) {
            (0, _definePropertyDefault.default)(e, r, t[r]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$4(Object(t)).forEach(function(r) {
            Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
        });
    }
    return e;
}
/**
 * Drag handler, used to handle dragging of the area and nodes. Can be extended to add custom behavior.
 */ var Drag = /*#__PURE__*/ function() {
    function Drag(guards) {
        var _this = this;
        (0, _classCallCheckDefault.default)(this, Drag);
        (0, _definePropertyDefault.default)(this, "down", function(e) {
            if (!_this.guards.down(e)) return;
            e.stopPropagation();
            _this.pointerStart = {
                x: e.pageX,
                y: e.pageY
            };
            _this.startPosition = _objectSpread$4({}, _this.config.getCurrentPosition());
            _this.events.start(e);
        });
        (0, _definePropertyDefault.default)(this, "move", function(e) {
            if (!_this.pointerStart || !_this.startPosition) return;
            if (!_this.guards.move(e)) return;
            e.preventDefault();
            var delta = {
                x: e.pageX - _this.pointerStart.x,
                y: e.pageY - _this.pointerStart.y
            };
            var zoom = _this.config.getZoom();
            var x = _this.startPosition.x + delta.x / zoom;
            var y = _this.startPosition.y + delta.y / zoom;
            _this.events.translate(x, y, e);
        });
        (0, _definePropertyDefault.default)(this, "up", function(e) {
            if (!_this.pointerStart) return;
            delete _this.pointerStart;
            _this.events.drag(e);
        });
        this.guards = guards || {
            down: function down(e) {
                return !(e.pointerType === 'mouse' && e.button !== 0);
            },
            move: function move() {
                return true;
            }
        };
    }
    return (0, _createClassDefault.default)(Drag, [
        {
            key: "initialize",
            value: function initialize(element, config, events) {
                this.config = config;
                this.events = events;
                element.style.touchAction = 'none';
                this.pointerListener = usePointerListener(element, {
                    down: this.down,
                    move: this.move,
                    up: this.up
                });
            }
        },
        {
            key: "destroy",
            value: function destroy() {
                this.pointerListener.destroy();
            }
        }
    ]);
}();
/**
 * Zoom source
 */ /**
 * Zoom class, used to handle zooming of the area. Can be extended to add custom behavior.
 * @internal
 */ var Zoom = /*#__PURE__*/ function() {
    function Zoom(intensity) {
        var _this = this;
        (0, _classCallCheckDefault.default)(this, Zoom);
        (0, _definePropertyDefault.default)(this, "previous", null);
        (0, _definePropertyDefault.default)(this, "pointers", []);
        (0, _definePropertyDefault.default)(this, "wheel", function(e) {
            e.preventDefault();
            var _this$element$getBoun = _this.element.getBoundingClientRect(), left = _this$element$getBoun.left, top = _this$element$getBoun.top;
            var isNegative = e.deltaY < 0;
            var delta = isNegative ? _this.intensity : -_this.intensity;
            var ox = (left - e.clientX) * delta;
            var oy = (top - e.clientY) * delta;
            _this.onzoom(delta, ox, oy, 'wheel');
        });
        (0, _definePropertyDefault.default)(this, "down", function(e) {
            _this.pointers.push(e);
        });
        (0, _definePropertyDefault.default)(this, "move", function(e) {
            _this.pointers = _this.pointers.map(function(p) {
                return p.pointerId === e.pointerId ? e : p;
            });
            if (!_this.isTranslating()) return;
            var _this$element$getBoun2 = _this.element.getBoundingClientRect(), left = _this$element$getBoun2.left, top = _this$element$getBoun2.top;
            var _this$getTouches = _this.getTouches(), cx = _this$getTouches.cx, cy = _this$getTouches.cy, distance = _this$getTouches.distance;
            if (_this.previous !== null && _this.previous.distance > 0) {
                var _delta = distance / _this.previous.distance - 1;
                var _ox = (left - cx) * _delta;
                var _oy = (top - cy) * _delta;
                _this.onzoom(_delta, _ox - (_this.previous.cx - cx), _oy - (_this.previous.cy - cy), 'touch');
            }
            _this.previous = {
                cx: cx,
                cy: cy,
                distance: distance
            };
        });
        (0, _definePropertyDefault.default)(this, "contextmenu", function() {
            _this.pointers = [];
        });
        (0, _definePropertyDefault.default)(this, "up", function(e) {
            _this.previous = null;
            _this.pointers = _this.pointers.filter(function(p) {
                return p.pointerId !== e.pointerId;
            });
        });
        (0, _definePropertyDefault.default)(this, "dblclick", function(e) {
            e.preventDefault();
            var _this$element$getBoun3 = _this.element.getBoundingClientRect(), left = _this$element$getBoun3.left, top = _this$element$getBoun3.top;
            var delta = 4 * _this.intensity;
            var ox = (left - e.clientX) * delta;
            var oy = (top - e.clientY) * delta;
            _this.onzoom(delta, ox, oy, 'dblclick');
        });
        this.intensity = intensity;
    }
    return (0, _createClassDefault.default)(Zoom, [
        {
            key: "initialize",
            value: function initialize(container, element, onzoom) {
                this.container = container;
                this.element = element;
                this.onzoom = onzoom;
                this.container.addEventListener('wheel', this.wheel);
                this.container.addEventListener('pointerdown', this.down);
                this.container.addEventListener('dblclick', this.dblclick);
                window.addEventListener('pointermove', this.move);
                window.addEventListener('pointerup', this.up);
                window.addEventListener('pointercancel', this.up);
                window.addEventListener('contextmenu', this.contextmenu);
            }
        },
        {
            key: "getTouches",
            value: function getTouches() {
                var e = {
                    touches: this.pointers
                };
                var _ref = [
                    e.touches[0].clientX,
                    e.touches[0].clientY
                ], x1 = _ref[0], y1 = _ref[1];
                var _ref2 = [
                    e.touches[1].clientX,
                    e.touches[1].clientY
                ], x2 = _ref2[0], y2 = _ref2[1];
                var distance = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
                return {
                    cx: (x1 + x2) / 2,
                    cy: (y1 + y2) / 2,
                    distance: distance
                };
            }
        },
        {
            key: "isTranslating",
            value: function isTranslating() {
                // is translating while zoom (works on multitouch)
                return this.pointers.length >= 2;
            }
        },
        {
            key: "destroy",
            value: function destroy() {
                this.container.removeEventListener('wheel', this.wheel);
                this.container.removeEventListener('pointerdown', this.down);
                this.container.removeEventListener('dblclick', this.dblclick);
                window.removeEventListener('pointermove', this.move);
                window.removeEventListener('pointerup', this.up);
                window.removeEventListener('pointercancel', this.up);
                window.removeEventListener('contextmenu', this.contextmenu);
            }
        }
    ]);
}();
var Area = /*#__PURE__*/ function() {
    function Area(container, events, guards) {
        var _this = this;
        (0, _classCallCheckDefault.default)(this, Area);
        (0, _definePropertyDefault.default)(this, "transform", {
            k: 1,
            x: 0,
            y: 0
        });
        (0, _definePropertyDefault.default)(this, "pointer", {
            x: 0,
            y: 0
        });
        (0, _definePropertyDefault.default)(this, "zoomHandler", null);
        (0, _definePropertyDefault.default)(this, "dragHandler", null);
        (0, _definePropertyDefault.default)(this, "pointerdown", function(event) {
            _this.setPointerFrom(event);
            _this.events.pointerDown(_this.pointer, event);
        });
        (0, _definePropertyDefault.default)(this, "pointermove", function(event) {
            _this.setPointerFrom(event);
            _this.events.pointerMove(_this.pointer, event);
        });
        (0, _definePropertyDefault.default)(this, "pointerup", function(event) {
            _this.setPointerFrom(event);
            _this.events.pointerUp(_this.pointer, event);
        });
        (0, _definePropertyDefault.default)(this, "resize", function(event) {
            _this.events.resize(event);
        });
        (0, _definePropertyDefault.default)(this, "onTranslate", function(x, y) {
            var _this$zoomHandler;
            if ((_this$zoomHandler = _this.zoomHandler) !== null && _this$zoomHandler !== void 0 && _this$zoomHandler.isTranslating()) return; // lock translation while zoom on multitouch
            _this.translate(x, y);
        });
        (0, _definePropertyDefault.default)(this, "onZoom", function(delta, ox, oy, source) {
            _this.zoom(_this.transform.k * (1 + delta), ox, oy, source);
            _this.update();
        });
        this.container = container;
        this.events = events;
        this.guards = guards;
        this.content = new Content(function(element) {
            return _this.events.reordered(element);
        });
        this.content.holder.style.transformOrigin = '0 0';
        this.setZoomHandler(new Zoom(0.1));
        this.setDragHandler(new Drag());
        this.container.addEventListener('pointerdown', this.pointerdown);
        this.container.addEventListener('pointermove', this.pointermove);
        window.addEventListener('pointerup', this.pointerup);
        window.addEventListener('resize', this.resize);
        container.appendChild(this.content.holder);
        this.update();
    }
    return (0, _createClassDefault.default)(Area, [
        {
            key: "update",
            value: function update() {
                var _this$transform = this.transform, x = _this$transform.x, y = _this$transform.y, k = _this$transform.k;
                this.content.holder.style.transform = "translate(".concat(x, "px, ").concat(y, "px) scale(").concat(k, ")");
            }
        },
        {
            key: "setDragHandler",
            value: function setDragHandler(drag) {
                var _this2 = this;
                if (this.dragHandler) this.dragHandler.destroy();
                this.dragHandler = drag;
                if (this.dragHandler) this.dragHandler.initialize(this.container, {
                    getCurrentPosition: function getCurrentPosition() {
                        return _this2.transform;
                    },
                    getZoom: function getZoom() {
                        return 1;
                    }
                }, {
                    start: function start() {
                        return null;
                    },
                    translate: this.onTranslate,
                    drag: function drag() {
                        return null;
                    }
                });
            }
        },
        {
            key: "setZoomHandler",
            value: function setZoomHandler(zoom) {
                if (this.zoomHandler) this.zoomHandler.destroy();
                this.zoomHandler = zoom;
                if (this.zoomHandler) this.zoomHandler.initialize(this.container, this.content.holder, this.onZoom);
            }
        },
        {
            key: "setPointerFrom",
            value: function setPointerFrom(event) {
                var _this$content$getPoin = this.content.getPointerFrom(event), x = _this$content$getPoin.x, y = _this$content$getPoin.y;
                var k = this.transform.k;
                this.pointer = {
                    x: x / k,
                    y: y / k
                };
            }
        },
        {
            key: "translate",
            value: /**
     * Change position of the area
     * @param x desired x coordinate
     * @param y desired y coordinate
     * @returns true if the translation was successful, false otherwise
     * @emits translate
     * @emits translated
     */ function() {
                var _translate = (0, _asyncToGeneratorDefault.default)(/*#__PURE__*/ (0, _regeneratorDefault.default).mark(function _callee(x, y) {
                    var position, result;
                    return (0, _regeneratorDefault.default).wrap(function _callee$(_context) {
                        while(true)switch(_context.prev = _context.next){
                            case 0:
                                position = {
                                    x: x,
                                    y: y
                                };
                                _context.next = 3;
                                return this.guards.translate({
                                    previous: this.transform,
                                    position: position
                                });
                            case 3:
                                result = _context.sent;
                                if (result) {
                                    _context.next = 6;
                                    break;
                                }
                                return _context.abrupt("return", false);
                            case 6:
                                this.transform.x = result.data.position.x;
                                this.transform.y = result.data.position.y;
                                this.update();
                                _context.next = 11;
                                return this.events.translated(result.data);
                            case 11:
                                return _context.abrupt("return", true);
                            case 12:
                            case "end":
                                return _context.stop();
                        }
                    }, _callee, this);
                }));
                function translate(_x, _x2) {
                    return _translate.apply(this, arguments);
                }
                return translate;
            }()
        },
        {
            key: "zoom",
            value: function() {
                var _zoom2 = (0, _asyncToGeneratorDefault.default)(/*#__PURE__*/ (0, _regeneratorDefault.default).mark(function _callee2(_zoom) {
                    var ox, oy, source, k, result, d, _args2 = arguments;
                    return (0, _regeneratorDefault.default).wrap(function _callee2$(_context2) {
                        while(true)switch(_context2.prev = _context2.next){
                            case 0:
                                ox = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : 0;
                                oy = _args2.length > 2 && _args2[2] !== undefined ? _args2[2] : 0;
                                source = _args2.length > 3 ? _args2[3] : undefined;
                                k = this.transform.k;
                                _context2.next = 6;
                                return this.guards.zoom({
                                    previous: this.transform,
                                    zoom: _zoom,
                                    source: source
                                });
                            case 6:
                                result = _context2.sent;
                                if (result) {
                                    _context2.next = 9;
                                    break;
                                }
                                return _context2.abrupt("return", true);
                            case 9:
                                d = (k - result.data.zoom) / (k - _zoom || 1);
                                this.transform.k = result.data.zoom || 1;
                                this.transform.x += ox * d;
                                this.transform.y += oy * d;
                                this.update();
                                _context2.next = 16;
                                return this.events.zoomed(result.data);
                            case 16:
                                return _context2.abrupt("return", false);
                            case 17:
                            case "end":
                                return _context2.stop();
                        }
                    }, _callee2, this);
                }));
                function zoom(_x3) {
                    return _zoom2.apply(this, arguments);
                }
                return zoom;
            }()
        },
        {
            key: "destroy",
            value: function destroy() {
                this.container.removeEventListener('pointerdown', this.pointerdown);
                this.container.removeEventListener('pointermove', this.pointermove);
                window.removeEventListener('pointerup', this.pointerup);
                window.removeEventListener('resize', this.resize);
                if (this.dragHandler) this.dragHandler.destroy();
                if (this.zoomHandler) this.zoomHandler.destroy();
                this.content.holder.innerHTML = '';
            }
        }
    ]);
}();
function _callSuper$1(t, o, e) {
    return o = (0, _getPrototypeOfDefault.default)(o), (0, _possibleConstructorReturnDefault.default)(t, _isNativeReflectConstruct$1() ? Reflect.construct(o, e || [], (0, _getPrototypeOfDefault.default)(t).constructor) : o.apply(t, e));
}
function _isNativeReflectConstruct$1() {
    try {
        var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
    } catch (t) {}
    return (_isNativeReflectConstruct$1 = function _isNativeReflectConstruct() {
        return !!t;
    })();
}
/**
 * A union of all possible signals that can be emitted by any area plugin
 * @priority 10
 */ /**
 * Base abstract class for area plugins that provides a common interface
 * @abstract
 */ var BaseAreaPlugin = /*#__PURE__*/ function(_Scope) {
    function BaseAreaPlugin() {
        (0, _classCallCheckDefault.default)(this, BaseAreaPlugin);
        return _callSuper$1(this, BaseAreaPlugin, arguments);
    }
    (0, _inheritsDefault.default)(BaseAreaPlugin, _Scope);
    return (0, _createClassDefault.default)(BaseAreaPlugin);
}((0, _rete.Scope));
var ConnectionView = /*#__PURE__*/ (0, _createClassDefault.default)(function ConnectionView(events) {
    (0, _classCallCheckDefault.default)(this, ConnectionView);
    this.element = document.createElement('div');
    this.element.style.position = 'absolute';
    this.element.style.left = '0';
    this.element.style.top = '0';
    this.element.addEventListener('contextmenu', function(event) {
        return events.contextmenu(event);
    });
});
var ElementsHolder = /*#__PURE__*/ function() {
    function ElementsHolder() {
        (0, _classCallCheckDefault.default)(this, ElementsHolder);
        (0, _definePropertyDefault.default)(this, "views", new WeakMap());
        (0, _definePropertyDefault.default)(this, "viewsElements", new Map());
    }
    return (0, _createClassDefault.default)(ElementsHolder, [
        {
            key: "set",
            value: function set(context) {
                var element = context.element, type = context.type, payload = context.payload;
                if (payload !== null && payload !== void 0 && payload.id) {
                    this.views.set(element, context);
                    this.viewsElements.set("".concat(type, "_").concat(payload.id), element);
                }
            }
        },
        {
            key: "get",
            value: function get(type, id) {
                var element = this.viewsElements.get("".concat(type, "_").concat(id));
                return element && this.views.get(element);
            }
        },
        {
            key: "delete",
            value: function _delete(element) {
                var _view$payload;
                var view = this.views.get(element);
                if (view && (_view$payload = view.payload) !== null && _view$payload !== void 0 && _view$payload.id) {
                    this.views["delete"](element);
                    this.viewsElements["delete"]("".concat(view.type, "_").concat(view.payload.id));
                }
            }
        }
    ]);
}();
function ownKeys$3(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r && (o = o.filter(function(r) {
            return Object.getOwnPropertyDescriptor(e, r).enumerable;
        })), t.push.apply(t, o);
    }
    return t;
}
function _objectSpread$3(e) {
    for(var r = 1; r < arguments.length; r++){
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2 ? ownKeys$3(Object(t), !0).forEach(function(r) {
            (0, _definePropertyDefault.default)(e, r, t[r]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$3(Object(t)).forEach(function(r) {
            Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
        });
    }
    return e;
}
var NodeView = /*#__PURE__*/ function() {
    function NodeView(getZoom, events, guards) {
        var _this = this;
        (0, _classCallCheckDefault.default)(this, NodeView);
        (0, _definePropertyDefault.default)(this, "translate", /*#__PURE__*/ function() {
            var _ref = (0, _asyncToGeneratorDefault.default)(/*#__PURE__*/ (0, _regeneratorDefault.default).mark(function _callee(x, y) {
                var previous, translation;
                return (0, _regeneratorDefault.default).wrap(function _callee$(_context) {
                    while(true)switch(_context.prev = _context.next){
                        case 0:
                            previous = _objectSpread$3({}, _this.position);
                            _context.next = 3;
                            return _this.guards.translate({
                                previous: previous,
                                position: {
                                    x: x,
                                    y: y
                                }
                            });
                        case 3:
                            translation = _context.sent;
                            if (translation) {
                                _context.next = 6;
                                break;
                            }
                            return _context.abrupt("return", false);
                        case 6:
                            _this.position = _objectSpread$3({}, translation.data.position);
                            _this.element.style.transform = "translate(".concat(_this.position.x, "px, ").concat(_this.position.y, "px)");
                            _context.next = 10;
                            return _this.events.translated({
                                position: _this.position,
                                previous: previous
                            });
                        case 10:
                            return _context.abrupt("return", true);
                        case 11:
                        case "end":
                            return _context.stop();
                    }
                }, _callee);
            }));
            return function(_x, _x2) {
                return _ref.apply(this, arguments);
            };
        }());
        (0, _definePropertyDefault.default)(this, "resize", /*#__PURE__*/ function() {
            var _ref2 = (0, _asyncToGeneratorDefault.default)(/*#__PURE__*/ (0, _regeneratorDefault.default).mark(function _callee2(width, height) {
                var size, el;
                return (0, _regeneratorDefault.default).wrap(function _callee2$(_context2) {
                    while(true)switch(_context2.prev = _context2.next){
                        case 0:
                            size = {
                                width: width,
                                height: height
                            };
                            _context2.next = 3;
                            return _this.guards.resize({
                                size: size
                            });
                        case 3:
                            if (_context2.sent) {
                                _context2.next = 5;
                                break;
                            }
                            return _context2.abrupt("return", false);
                        case 5:
                            el = _this.element.querySelector('*:not(span):not([fragment])');
                            if (!(!el || !(el instanceof HTMLElement))) {
                                _context2.next = 8;
                                break;
                            }
                            return _context2.abrupt("return", false);
                        case 8:
                            el.style.width = "".concat(width, "px");
                            el.style.height = "".concat(height, "px");
                            _context2.next = 12;
                            return _this.events.resized({
                                size: size
                            });
                        case 12:
                            return _context2.abrupt("return", true);
                        case 13:
                        case "end":
                            return _context2.stop();
                    }
                }, _callee2);
            }));
            return function(_x3, _x4) {
                return _ref2.apply(this, arguments);
            };
        }());
        this.getZoom = getZoom;
        this.events = events;
        this.guards = guards;
        this.element = document.createElement('div');
        this.element.style.position = 'absolute';
        this.position = {
            x: 0,
            y: 0
        };
        this.translate(0, 0);
        this.element.addEventListener('contextmenu', function(event) {
            return _this.events.contextmenu(event);
        });
        this.dragHandler = new Drag();
        this.dragHandler.initialize(this.element, {
            getCurrentPosition: function getCurrentPosition() {
                return _this.position;
            },
            getZoom: function getZoom() {
                return _this.getZoom();
            }
        }, {
            start: this.events.picked,
            translate: this.translate,
            drag: this.events.dragged
        });
    }
    return (0, _createClassDefault.default)(NodeView, [
        {
            key: "destroy",
            value: function destroy() {
                this.dragHandler.destroy();
            }
        }
    ]);
}();
function getNodesRect(nodes, views) {
    return nodes.map(function(node) {
        return {
            view: views.get(node.id),
            node: node
        };
    }).filter(function(item) {
        return item.view;
    }).map(function(_ref) {
        var view = _ref.view, node = _ref.node;
        var width = node.width, height = node.height;
        if (typeof width !== 'undefined' && typeof height !== 'undefined') return {
            position: view.position,
            width: width,
            height: height
        };
        return {
            position: view.position,
            width: view.element.clientWidth,
            height: view.element.clientHeight
        };
    });
}
/**
 * Get the bounding box of the given nodes
 * @param plugin The area plugin
 * @param nodes The nodes to get the bounding box of
 * @returns The bounding box
 */ function getBoundingBox(plugin, nodes) {
    var editor = plugin.parentScope((0, _rete.NodeEditor));
    var list = nodes.map(function(node) {
        return (0, _typeofDefault.default)(node) === 'object' ? node : editor.getNode(node);
    });
    var rects = getNodesRect(list, plugin.nodeViews);
    return getBoundingBox$1(rects);
}
/**
 * Simple nodes order extension
 * @param base The base area plugin
 * @listens nodepicked
 * @listens connectioncreated
 */ function simpleNodesOrder(base) {
    var area = base;
    area.addPipe(function(context) {
        if (!context || (0, _typeofDefault.default)(context) !== 'object' || !('type' in context)) return context;
        if (context.type === 'nodepicked') {
            var view = area.nodeViews.get(context.data.id);
            var content = area.area.content;
            if (view) content.reorder(view.element, null);
        }
        if (context.type === 'connectioncreated') {
            var _view = area.connectionViews.get(context.data.id);
            var _content = area.area.content;
            if (_view) _content.reorder(_view.element, _content.holder.firstChild);
        }
        return context;
    });
}
function ownKeys$2(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r && (o = o.filter(function(r) {
            return Object.getOwnPropertyDescriptor(e, r).enumerable;
        })), t.push.apply(t, o);
    }
    return t;
}
function _objectSpread$2(e) {
    for(var r = 1; r < arguments.length; r++){
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2 ? ownKeys$2(Object(t), !0).forEach(function(r) {
            (0, _definePropertyDefault.default)(e, r, t[r]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$2(Object(t)).forEach(function(r) {
            Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
        });
    }
    return e;
}
/**
 * Restrictor extension parameters
 */ /**
 * Restrictor extension. Restricts the area zoom and position
 * @param plugin The area plugin
 * @param params The restrictor parameters
 * @listens zoom
 * @listens zoomed
 * @listens translated
 */ function restrictor(plugin, params) {
    var scaling = params !== null && params !== void 0 && params.scaling ? params.scaling === true ? {
        min: 0.1,
        max: 1
    } : params.scaling : false;
    var translation = params !== null && params !== void 0 && params.translation ? params.translation === true ? {
        left: 0,
        top: 0,
        right: 1000,
        bottom: 1000
    } : params.translation : false;
    function restrictZoom(zoom) {
        if (!scaling) throw new Error('scaling param isnt defined');
        var _ref = typeof scaling === 'function' ? scaling() : scaling, min = _ref.min, max = _ref.max;
        if (zoom < min) return min;
        else if (zoom > max) return max;
        return zoom;
    }
    // eslint-disable-next-line max-statements
    function restrictPosition(position) {
        if (!translation) throw new Error('translation param isnt defined');
        var nextPosition = _objectSpread$2({}, position);
        var _ref2 = typeof translation === 'function' ? translation() : translation, left = _ref2.left, top = _ref2.top, right = _ref2.right, bottom = _ref2.bottom;
        if (nextPosition.x < left) nextPosition.x = left;
        if (nextPosition.x > right) nextPosition.x = right;
        if (nextPosition.y < top) nextPosition.y = top;
        if (nextPosition.y > bottom) nextPosition.y = bottom;
        return nextPosition;
    }
    plugin.addPipe(function(context) {
        if (!context || (0, _typeofDefault.default)(context) !== 'object' || !('type' in context)) return context;
        if (scaling && context.type === 'zoom') return _objectSpread$2(_objectSpread$2({}, context), {}, {
            data: _objectSpread$2(_objectSpread$2({}, context.data), {}, {
                zoom: restrictZoom(context.data.zoom)
            })
        });
        if (translation && context.type === 'zoomed') {
            var position = restrictPosition(plugin.area.transform);
            plugin.area.translate(position.x, position.y);
        }
        if (translation && context.type === 'translate') return _objectSpread$2(_objectSpread$2({}, context), {}, {
            data: _objectSpread$2(_objectSpread$2({}, context.data), {}, {
                position: restrictPosition(context.data.position)
            })
        });
        return context;
    });
}
/**
 * Selector's accumulate function, activated when the ctrl key is pressed
 */ function accumulateOnCtrl() {
    var pressed = false;
    function keydown(e) {
        if (e.key === 'Control' || e.key === 'Meta') pressed = true;
    }
    function keyup(e) {
        if (e.key === 'Control' || e.key === 'Meta') pressed = false;
    }
    document.addEventListener('keydown', keydown);
    document.addEventListener('keyup', keyup);
    return {
        active: function active() {
            return pressed;
        },
        destroy: function destroy() {
            document.removeEventListener('keydown', keydown);
            document.removeEventListener('keyup', keyup);
        }
    };
}
/**
 * Selector class. Used to collect selected entities (nodes, connections, etc.) and synchronize them (select, unselect, translate, etc.).
 * Can be extended to add custom functionality.
 */ var Selector = /*#__PURE__*/ function() {
    function Selector() {
        (0, _classCallCheckDefault.default)(this, Selector);
        (0, _definePropertyDefault.default)(this, "entities", new Map());
        (0, _definePropertyDefault.default)(this, "pickId", null);
    }
    return (0, _createClassDefault.default)(Selector, [
        {
            key: "isSelected",
            value: function isSelected(entity) {
                return this.entities.has("".concat(entity.label, "_").concat(entity.id));
            }
        },
        {
            key: "add",
            value: function add(entity, accumulate) {
                if (!accumulate) this.unselectAll();
                this.entities.set("".concat(entity.label, "_").concat(entity.id), entity);
            }
        },
        {
            key: "remove",
            value: function remove(entity) {
                var id = "".concat(entity.label, "_").concat(entity.id);
                var item = this.entities.get(id);
                if (item) {
                    this.entities["delete"](id);
                    item.unselect();
                }
            }
        },
        {
            key: "unselectAll",
            value: function unselectAll() {
                var _this = this;
                (0, _toConsumableArrayDefault.default)(Array.from(this.entities.values())).forEach(function(item) {
                    return _this.remove(item);
                });
            }
        },
        {
            key: "translate",
            value: function translate(dx, dy) {
                var _this2 = this;
                this.entities.forEach(function(item) {
                    return !_this2.isPicked(item) && item.translate(dx, dy);
                });
            }
        },
        {
            key: "pick",
            value: function pick(entity) {
                this.pickId = "".concat(entity.label, "_").concat(entity.id);
            }
        },
        {
            key: "release",
            value: function release() {
                this.pickId = null;
            }
        },
        {
            key: "isPicked",
            value: function isPicked(entity) {
                return this.pickId === "".concat(entity.label, "_").concat(entity.id);
            }
        }
    ]);
}();
/**
 * Selector factory, uses default Selector class
 * @returns Selector instance
 */ function selector() {
    return new Selector();
}
/**
 * Accumulating interface, used to determine whether to accumulate entities on selection
 */ /**
 * Selectable nodes extension. Adds the ability to select nodes in the area.
 * @param base BaseAreaPlugin instance
 * @param core Selectable instance
 * @param options.accumulating Accumulating interface
 * @listens nodepicked
 * @listens nodetranslated
 * @listens pointerdown
 * @listens pointermove
 * @listens pointerup
 */ function selectableNodes(base, core, options) {
    var editor = null;
    var area = base;
    var getEditor = function getEditor() {
        return editor || (editor = area.parentScope((0, _rete.NodeEditor)));
    };
    var twitch = 0;
    function selectNode(node) {
        if (!node.selected) {
            node.selected = true;
            area.update('node', node.id);
        }
    }
    function unselectNode(node) {
        if (node.selected) {
            node.selected = false;
            area.update('node', node.id);
        }
    }
    /**
   * Select node programmatically
   * @param nodeId Node id
   * @param accumulate Whether to accumulate nodes on selection
   */ function add(nodeId, accumulate) {
        var node = getEditor().getNode(nodeId);
        if (!node) return;
        core.add({
            label: 'node',
            id: node.id,
            translate: function translate(dx, dy) {
                var view = area.nodeViews.get(node.id);
                var current = view === null || view === void 0 ? void 0 : view.position;
                if (current) view.translate(current.x + dx, current.y + dy);
            },
            unselect: function unselect() {
                unselectNode(node);
            }
        }, accumulate);
        selectNode(node);
    }
    /**
   * Unselect node programmatically
   * @param nodeId Node id
   */ function remove(nodeId) {
        core.remove({
            id: nodeId,
            label: 'node'
        });
    }
    // eslint-disable-next-line max-statements, complexity
    area.addPipe(function(context) {
        if (!context || (0, _typeofDefault.default)(context) !== 'object' || !('type' in context)) return context;
        if (context.type === 'nodepicked') {
            var pickedId = context.data.id;
            var accumulate = options.accumulating.active();
            core.pick({
                id: pickedId,
                label: 'node'
            });
            twitch = null;
            add(pickedId, accumulate);
        } else if (context.type === 'nodetranslated') {
            var _context$data = context.data, id = _context$data.id, position = _context$data.position, previous = _context$data.previous;
            var _dx = position.x - previous.x;
            var _dy = position.y - previous.y;
            if (core.isPicked({
                id: id,
                label: 'node'
            })) core.translate(_dx, _dy);
        } else if (context.type === 'pointerdown') twitch = 0;
        else if (context.type === 'pointermove') {
            if (twitch !== null) twitch++;
        } else if (context.type === 'pointerup') {
            if (twitch !== null && twitch < 4) core.unselectAll();
            twitch = null;
        }
        return context;
    });
    return {
        select: add,
        unselect: remove
    };
}
/**
 * Show input control extension. It will show the input's control when there is no connection and hide it when there is a connection.
 * @param area The base area plugin
 * @param visible The visible function
 * @listens connectioncreated
 * @listens connectionremoved
 */ function showInputControl(area, visible) {
    var editor = null;
    var getEditor = function getEditor() {
        return editor || (editor = area.parentScope((0, _rete.NodeEditor)));
    };
    function updateInputControlVisibility(target, targetInput) {
        var node = getEditor().getNode(target);
        if (!node) return;
        var input = node.inputs[targetInput];
        if (!input) throw new Error('cannot find input');
        var previous = input.showControl;
        var connections = getEditor().getConnections();
        var hasAnyConnection = Boolean(connections.find(function(connection) {
            return connection.target === target && connection.targetInput === targetInput;
        }));
        input.showControl = visible ? visible({
            hasAnyConnection: hasAnyConnection,
            input: input
        }) : !hasAnyConnection;
        if (input.showControl !== previous) area.update('node', node.id);
    }
    area.addPipe(function(context) {
        if (context.type === 'connectioncreated' || context.type === 'connectionremoved') updateInputControlVisibility(context.data.target, context.data.targetInput);
        return context;
    });
}
function ownKeys$1(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r && (o = o.filter(function(r) {
            return Object.getOwnPropertyDescriptor(e, r).enumerable;
        })), t.push.apply(t, o);
    }
    return t;
}
function _objectSpread$1(e) {
    for(var r = 1; r < arguments.length; r++){
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2 ? ownKeys$1(Object(t), !0).forEach(function(r) {
            (0, _definePropertyDefault.default)(e, r, t[r]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$1(Object(t)).forEach(function(r) {
            Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
        });
    }
    return e;
}
/**
 * Snap grid extension parameters
 */ /**
 * Snap grid extension
 * @param base The base area plugin
 * @param params The snap parameters
 * @listens nodetranslate
 * @listens nodedragged
 */ function snapGrid(base, params) {
    var area = base;
    var size = typeof (params === null || params === void 0 ? void 0 : params.size) === 'undefined' ? 16 : params.size;
    var dynamic = typeof (params === null || params === void 0 ? void 0 : params.dynamic) === 'undefined' ? true : params.dynamic;
    function snap(value) {
        return Math.round(value / size) * size;
    }
    area.addPipe(function(context) {
        if (!context || (0, _typeofDefault.default)(context) !== 'object' || !('type' in context)) return context;
        if (dynamic && context.type === 'nodetranslate') {
            var position = context.data.position;
            var x = snap(position.x);
            var y = snap(position.y);
            return _objectSpread$1(_objectSpread$1({}, context), {}, {
                data: _objectSpread$1(_objectSpread$1({}, context.data), {}, {
                    position: {
                        x: x,
                        y: y
                    }
                })
            });
        }
        if (!dynamic && context.type === 'nodedragged') {
            var view = area.nodeViews.get(context.data.id);
            if (view) {
                var _view$position = view.position, _x = _view$position.x, _y = _view$position.y;
                view.translate(snap(_x), snap(_y));
            }
        }
        return context;
    });
}
/**
 * Zoom extension parameters
 */ /**
 * Zooms the area to fit the given nodes
 * @param plugin The area plugin
 * @param nodes The nodes to fit
 * @param params The zoom parameters
 */ // eslint-disable-next-line max-statements, max-len
function zoomAt(_x, _x2, _x3) {
    return _zoomAt.apply(this, arguments);
}
function _zoomAt() {
    _zoomAt = (0, _asyncToGeneratorDefault.default)(/*#__PURE__*/ (0, _regeneratorDefault.default).mark(function _callee(plugin, nodes, params) {
        var _ref, _ref$scale, scale, editor, list, rects, boundingBox, _ref2, w, h, kw, kh, k;
        return (0, _regeneratorDefault.default).wrap(function _callee$(_context) {
            while(true)switch(_context.prev = _context.next){
                case 0:
                    _ref = params || {}, _ref$scale = _ref.scale, scale = _ref$scale === void 0 ? 0.9 : _ref$scale;
                    editor = plugin.parentScope((0, _rete.NodeEditor));
                    list = nodes.map(function(node) {
                        return (0, _typeofDefault.default)(node) === 'object' ? node : editor.getNode(node);
                    });
                    rects = getNodesRect(list, plugin.nodeViews);
                    boundingBox = getBoundingBox$1(rects);
                    _ref2 = [
                        plugin.container.clientWidth,
                        plugin.container.clientHeight
                    ], w = _ref2[0], h = _ref2[1];
                    kw = w / boundingBox.width, kh = h / boundingBox.height;
                    k = Math.min(kh * scale, kw * scale, 1);
                    plugin.area.transform.x = w / 2 - boundingBox.center.x * k;
                    plugin.area.transform.y = h / 2 - boundingBox.center.y * k;
                    _context.next = 12;
                    return plugin.area.zoom(k, 0, 0);
                case 12:
                case "end":
                    return _context.stop();
            }
        }, _callee);
    }));
    return _zoomAt.apply(this, arguments);
}
/**
 * Area extensions
 * @priority 7
 * @module Extensions
 */ var index = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    getBoundingBox: getBoundingBox,
    simpleNodesOrder: simpleNodesOrder,
    restrictor: restrictor,
    accumulateOnCtrl: accumulateOnCtrl,
    selectableNodes: selectableNodes,
    Selector: Selector,
    selector: selector,
    showInputControl: showInputControl,
    snapGrid: snapGrid,
    zoomAt: zoomAt
});
function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r && (o = o.filter(function(r) {
            return Object.getOwnPropertyDescriptor(e, r).enumerable;
        })), t.push.apply(t, o);
    }
    return t;
}
function _objectSpread(e) {
    for(var r = 1; r < arguments.length; r++){
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
            (0, _definePropertyDefault.default)(e, r, t[r]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
            Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
        });
    }
    return e;
}
function _callSuper(t, o, e) {
    return o = (0, _getPrototypeOfDefault.default)(o), (0, _possibleConstructorReturnDefault.default)(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], (0, _getPrototypeOfDefault.default)(t).constructor) : o.apply(t, e));
}
function _isNativeReflectConstruct() {
    try {
        var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
    } catch (t) {}
    return (_isNativeReflectConstruct = function _isNativeReflectConstruct() {
        return !!t;
    })();
}
/**
 * A union of all possible signals that can be emitted by the area
 * @priority 9
 */ /**
 * A plugin that provides a 2D area for nodes and connections
 * @priority 8
 * @emits render
 * @emits rendered
 * @emits unmount
 * @listens nodecreated
 * @listens noderemoved
 * @listens connectioncreated
 * @listens connectionremoved
 */ var AreaPlugin = /*#__PURE__*/ function(_BaseAreaPlugin) {
    function AreaPlugin(container) {
        var _this;
        (0, _classCallCheckDefault.default)(this, AreaPlugin);
        _this = _callSuper(this, AreaPlugin, [
            'area'
        ]);
        (0, _definePropertyDefault.default)(_this, "nodeViews", new Map());
        (0, _definePropertyDefault.default)(_this, "connectionViews", new Map());
        (0, _definePropertyDefault.default)(_this, "elements", new ElementsHolder());
        (0, _definePropertyDefault.default)(_this, "onContextMenu", function(event) {
            _this.emit({
                type: 'contextmenu',
                data: {
                    event: event,
                    context: 'root'
                }
            });
        });
        _this.container = container;
        container.style.overflow = 'hidden';
        container.addEventListener('contextmenu', _this.onContextMenu);
        // eslint-disable-next-line max-statements
        _this.addPipe(function(context) {
            if (!context || !((0, _typeofDefault.default)(context) === 'object' && 'type' in context)) return context;
            if (context.type === 'nodecreated') _this.addNodeView(context.data);
            if (context.type === 'noderemoved') _this.removeNodeView(context.data.id);
            if (context.type === 'connectioncreated') _this.addConnectionView(context.data);
            if (context.type === 'connectionremoved') _this.removeConnectionView(context.data.id);
            if (context.type === 'render') _this.elements.set(context.data);
            if (context.type === 'unmount') _this.elements["delete"](context.data.element);
            return context;
        });
        _this.area = new Area(container, {
            zoomed: function zoomed(params) {
                return _this.emit({
                    type: 'zoomed',
                    data: params
                });
            },
            pointerDown: function pointerDown(position, event) {
                return void _this.emit({
                    type: 'pointerdown',
                    data: {
                        position: position,
                        event: event
                    }
                });
            },
            pointerMove: function pointerMove(position, event) {
                return void _this.emit({
                    type: 'pointermove',
                    data: {
                        position: position,
                        event: event
                    }
                });
            },
            pointerUp: function pointerUp(position, event) {
                return void _this.emit({
                    type: 'pointerup',
                    data: {
                        position: position,
                        event: event
                    }
                });
            },
            resize: function resize(event) {
                return void _this.emit({
                    type: 'resized',
                    data: {
                        event: event
                    }
                });
            },
            translated: function translated(params) {
                return _this.emit({
                    type: 'translated',
                    data: params
                });
            },
            reordered: function reordered(element) {
                return _this.emit({
                    type: 'reordered',
                    data: {
                        element: element
                    }
                });
            }
        }, {
            translate: function translate(params) {
                return _this.emit({
                    type: 'translate',
                    data: params
                });
            },
            zoom: function zoom(params) {
                return _this.emit({
                    type: 'zoom',
                    data: params
                });
            }
        });
        return _this;
    }
    (0, _inheritsDefault.default)(AreaPlugin, _BaseAreaPlugin);
    return (0, _createClassDefault.default)(AreaPlugin, [
        {
            key: "addNodeView",
            value: function addNodeView(node) {
                var _this2 = this;
                var id = node.id;
                var view = new NodeView(function() {
                    return _this2.area.transform.k;
                }, {
                    picked: function picked() {
                        return void _this2.emit({
                            type: 'nodepicked',
                            data: {
                                id: id
                            }
                        });
                    },
                    translated: function translated(data) {
                        return _this2.emit({
                            type: 'nodetranslated',
                            data: _objectSpread({
                                id: id
                            }, data)
                        });
                    },
                    dragged: function dragged() {
                        return void _this2.emit({
                            type: 'nodedragged',
                            data: node
                        });
                    },
                    contextmenu: function contextmenu(event) {
                        return void _this2.emit({
                            type: 'contextmenu',
                            data: {
                                event: event,
                                context: node
                            }
                        });
                    },
                    resized: function resized(_ref) {
                        var size = _ref.size;
                        return _this2.emit({
                            type: 'noderesized',
                            data: {
                                id: node.id,
                                size: size
                            }
                        });
                    }
                }, {
                    translate: function translate(data) {
                        return _this2.emit({
                            type: 'nodetranslate',
                            data: _objectSpread({
                                id: id
                            }, data)
                        });
                    },
                    resize: function resize(_ref2) {
                        var size = _ref2.size;
                        return _this2.emit({
                            type: 'noderesize',
                            data: {
                                id: node.id,
                                size: size
                            }
                        });
                    }
                });
                this.nodeViews.set(id, view);
                this.area.content.add(view.element);
                this.emit({
                    type: 'render',
                    data: {
                        element: view.element,
                        type: 'node',
                        payload: node
                    }
                });
                return view;
            }
        },
        {
            key: "removeNodeView",
            value: function removeNodeView(id) {
                var view = this.nodeViews.get(id);
                if (view) {
                    this.emit({
                        type: 'unmount',
                        data: {
                            element: view.element
                        }
                    });
                    this.nodeViews["delete"](id);
                    this.area.content.remove(view.element);
                }
            }
        },
        {
            key: "addConnectionView",
            value: function addConnectionView(connection) {
                var _this3 = this;
                var view = new ConnectionView({
                    contextmenu: function contextmenu(event) {
                        return void _this3.emit({
                            type: 'contextmenu',
                            data: {
                                event: event,
                                context: connection
                            }
                        });
                    }
                });
                this.connectionViews.set(connection.id, view);
                this.area.content.add(view.element);
                this.emit({
                    type: 'render',
                    data: {
                        element: view.element,
                        type: 'connection',
                        payload: connection
                    }
                });
                return view;
            }
        },
        {
            key: "removeConnectionView",
            value: function removeConnectionView(id) {
                var view = this.connectionViews.get(id);
                if (view) {
                    this.emit({
                        type: 'unmount',
                        data: {
                            element: view.element
                        }
                    });
                    this.connectionViews["delete"](id);
                    this.area.content.remove(view.element);
                }
            }
        },
        {
            key: "update",
            value: function() {
                var _update = (0, _asyncToGeneratorDefault.default)(/*#__PURE__*/ (0, _regeneratorDefault.default).mark(function _callee(type, id) {
                    var data;
                    return (0, _regeneratorDefault.default).wrap(function _callee$(_context) {
                        while(true)switch(_context.prev = _context.next){
                            case 0:
                                data = this.elements.get(type, id);
                                if (!data) {
                                    _context.next = 4;
                                    break;
                                }
                                _context.next = 4;
                                return this.emit({
                                    type: 'render',
                                    data: data
                                });
                            case 4:
                            case "end":
                                return _context.stop();
                        }
                    }, _callee, this);
                }));
                function update(_x, _x2) {
                    return _update.apply(this, arguments);
                }
                return update;
            }()
        },
        {
            key: "resize",
            value: function() {
                var _resize = (0, _asyncToGeneratorDefault.default)(/*#__PURE__*/ (0, _regeneratorDefault.default).mark(function _callee2(id, width, height) {
                    var view;
                    return (0, _regeneratorDefault.default).wrap(function _callee2$(_context2) {
                        while(true)switch(_context2.prev = _context2.next){
                            case 0:
                                view = this.nodeViews.get(id);
                                if (!view) {
                                    _context2.next = 5;
                                    break;
                                }
                                _context2.next = 4;
                                return view.resize(width, height);
                            case 4:
                                return _context2.abrupt("return", _context2.sent);
                            case 5:
                            case "end":
                                return _context2.stop();
                        }
                    }, _callee2, this);
                }));
                function resize(_x3, _x4, _x5) {
                    return _resize.apply(this, arguments);
                }
                return resize;
            }()
        },
        {
            key: "translate",
            value: function() {
                var _translate = (0, _asyncToGeneratorDefault.default)(/*#__PURE__*/ (0, _regeneratorDefault.default).mark(function _callee3(id, _ref3) {
                    var x, y, view;
                    return (0, _regeneratorDefault.default).wrap(function _callee3$(_context3) {
                        while(true)switch(_context3.prev = _context3.next){
                            case 0:
                                x = _ref3.x, y = _ref3.y;
                                view = this.nodeViews.get(id);
                                if (!view) {
                                    _context3.next = 6;
                                    break;
                                }
                                _context3.next = 5;
                                return view.translate(x, y);
                            case 5:
                                return _context3.abrupt("return", _context3.sent);
                            case 6:
                            case "end":
                                return _context3.stop();
                        }
                    }, _callee3, this);
                }));
                function translate(_x6, _x7) {
                    return _translate.apply(this, arguments);
                }
                return translate;
            }()
        },
        {
            key: "destroy",
            value: function destroy() {
                var _this4 = this;
                this.container.removeEventListener('contextmenu', this.onContextMenu);
                Array.from(this.connectionViews.keys()).forEach(function(id) {
                    return _this4.removeConnectionView(id);
                });
                Array.from(this.nodeViews.keys()).forEach(function(id) {
                    return _this4.removeNodeView(id);
                });
                this.area.destroy();
            }
        }
    ]);
}(BaseAreaPlugin);

},{"@babel/runtime/helpers/asyncToGenerator":"3sxrH","@babel/runtime/helpers/typeof":"7EL9t","@babel/runtime/helpers/classCallCheck":"fbbZA","@babel/runtime/helpers/createClass":"lr6gv","@babel/runtime/helpers/possibleConstructorReturn":"3sko5","@babel/runtime/helpers/getPrototypeOf":"aGuV6","@babel/runtime/helpers/inherits":"8CbKS","@babel/runtime/helpers/defineProperty":"azbUC","@babel/runtime/regenerator":"baIBJ","@babel/runtime/helpers/toConsumableArray":"lkYCr","rete":"3aYez","@parcel/transformer-js/src/esmodule-helpers.js":"jnFvT"}],"lkYCr":[function(require,module,exports,__globalThis) {
var arrayWithoutHoles = require("80b438c8f11ca70e");
var iterableToArray = require("4f1268a27b81f1fd");
var unsupportedIterableToArray = require("bfa7725fe5f724b");
var nonIterableSpread = require("24ae2b6222a85da6");
function _toConsumableArray(r) {
    return arrayWithoutHoles(r) || iterableToArray(r) || unsupportedIterableToArray(r) || nonIterableSpread();
}
module.exports = _toConsumableArray, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{"80b438c8f11ca70e":"ayRz2","4f1268a27b81f1fd":"fNMvm","bfa7725fe5f724b":"klYG5","24ae2b6222a85da6":"bHwaQ"}],"ayRz2":[function(require,module,exports,__globalThis) {
var arrayLikeToArray = require("d3a23041cb0f1512");
function _arrayWithoutHoles(r) {
    if (Array.isArray(r)) return arrayLikeToArray(r);
}
module.exports = _arrayWithoutHoles, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{"d3a23041cb0f1512":"J34FZ"}],"J34FZ":[function(require,module,exports,__globalThis) {
function _arrayLikeToArray(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for(var e = 0, n = Array(a); e < a; e++)n[e] = r[e];
    return n;
}
module.exports = _arrayLikeToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{}],"fNMvm":[function(require,module,exports,__globalThis) {
function _iterableToArray(r) {
    if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
}
module.exports = _iterableToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{}],"klYG5":[function(require,module,exports,__globalThis) {
var arrayLikeToArray = require("f8ccc0353f5f3746");
function _unsupportedIterableToArray(r, a) {
    if (r) {
        if ("string" == typeof r) return arrayLikeToArray(r, a);
        var t = ({}).toString.call(r).slice(8, -1);
        return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? arrayLikeToArray(r, a) : void 0;
    }
}
module.exports = _unsupportedIterableToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{"f8ccc0353f5f3746":"J34FZ"}],"bHwaQ":[function(require,module,exports,__globalThis) {
function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
module.exports = _nonIterableSpread, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{}],"8QGGI":[function(require,module,exports,__globalThis) {
/*!
* rete-connection-plugin v2.0.4
* (c) 2024 Vitaliy Stoliarov
* Released under the MIT license.
* */ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "BidirectFlow", ()=>BidirectFlow);
parcelHelpers.export(exports, "ClassicFlow", ()=>ClassicFlow);
parcelHelpers.export(exports, "ConnectionPlugin", ()=>ConnectionPlugin);
parcelHelpers.export(exports, "Flow", ()=>Flow);
parcelHelpers.export(exports, "Presets", ()=>index);
parcelHelpers.export(exports, "State", ()=>State);
parcelHelpers.export(exports, "canMakeConnection", ()=>canMakeConnection);
parcelHelpers.export(exports, "createPseudoconnection", ()=>createPseudoconnection);
parcelHelpers.export(exports, "getSourceTarget", ()=>getSourceTarget);
parcelHelpers.export(exports, "makeConnection", ()=>makeConnection);
var _typeof = require("@babel/runtime/helpers/typeof");
var _typeofDefault = parcelHelpers.interopDefault(_typeof);
var _asyncToGenerator = require("@babel/runtime/helpers/asyncToGenerator");
var _asyncToGeneratorDefault = parcelHelpers.interopDefault(_asyncToGenerator);
var _classCallCheck = require("@babel/runtime/helpers/classCallCheck");
var _classCallCheckDefault = parcelHelpers.interopDefault(_classCallCheck);
var _createClass = require("@babel/runtime/helpers/createClass");
var _createClassDefault = parcelHelpers.interopDefault(_createClass);
var _possibleConstructorReturn = require("@babel/runtime/helpers/possibleConstructorReturn");
var _possibleConstructorReturnDefault = parcelHelpers.interopDefault(_possibleConstructorReturn);
var _getPrototypeOf = require("@babel/runtime/helpers/getPrototypeOf");
var _getPrototypeOfDefault = parcelHelpers.interopDefault(_getPrototypeOf);
var _get = require("@babel/runtime/helpers/get");
var _getDefault = parcelHelpers.interopDefault(_get);
var _inherits = require("@babel/runtime/helpers/inherits");
var _inheritsDefault = parcelHelpers.interopDefault(_inherits);
var _defineProperty = require("@babel/runtime/helpers/defineProperty");
var _definePropertyDefault = parcelHelpers.interopDefault(_defineProperty);
var _regenerator = require("@babel/runtime/regenerator");
var _regeneratorDefault = parcelHelpers.interopDefault(_regenerator);
var _rete = require("rete");
var _reteAreaPlugin = require("rete-area-plugin");
var _toConsumableArray = require("@babel/runtime/helpers/toConsumableArray");
var _toConsumableArrayDefault = parcelHelpers.interopDefault(_toConsumableArray);
var _slicedToArray = require("@babel/runtime/helpers/slicedToArray");
var _slicedToArrayDefault = parcelHelpers.interopDefault(_slicedToArray);
function ___$insertStyle(css) {
    if (!css) return;
    if (typeof window === 'undefined') return;
    var style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.innerHTML = css;
    document.head.appendChild(style);
    return css;
}
function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r && (o = o.filter(function(r) {
            return Object.getOwnPropertyDescriptor(e, r).enumerable;
        })), t.push.apply(t, o);
    }
    return t;
}
function _objectSpread(e) {
    for(var r = 1; r < arguments.length; r++){
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
            (0, _definePropertyDefault.default)(e, r, t[r]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
            Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
        });
    }
    return e;
}
/**
 * Create pseudoconnection. Used to trigger rendering of connection that is being created by user.
 * Has additional `isPseudo` property in payload.
 * @param extra Extra payload to add to connection
 */ function createPseudoconnection(extra) {
    var element = null;
    var id = null;
    function unmount(areaPlugin) {
        if (id) areaPlugin.removeConnectionView(id);
        element = null;
        id = null;
    }
    function mount(areaPlugin) {
        unmount(areaPlugin);
        id = "pseudo_".concat((0, _rete.getUID)());
    }
    return {
        isMounted: function isMounted() {
            return Boolean(id);
        },
        mount: mount,
        render: function render(areaPlugin, _ref, data) {
            var x = _ref.x, y = _ref.y;
            var isOutput = data.side === 'output';
            var pointer = {
                x: x + (isOutput ? -3 : 3),
                y: y
            }; // fix hover of underlying elements
            if (!id) throw new Error('pseudo connection id wasn\'t generated');
            var payload = isOutput ? _objectSpread({
                id: id,
                source: data.nodeId,
                sourceOutput: data.key,
                target: '',
                targetInput: ''
            }, extra !== null && extra !== void 0 ? extra : {}) : _objectSpread({
                id: id,
                target: data.nodeId,
                targetInput: data.key,
                source: '',
                sourceOutput: ''
            }, extra !== null && extra !== void 0 ? extra : {});
            if (!element) {
                var view = areaPlugin.addConnectionView(payload);
                element = view.element;
            }
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (!element) return;
            areaPlugin.emit({
                type: 'render',
                data: _objectSpread({
                    element: element,
                    type: 'connection',
                    payload: payload
                }, isOutput ? {
                    end: pointer
                } : {
                    start: pointer
                })
            });
        },
        unmount: unmount
    };
}
function _createForOfIteratorHelper$1(r, e) {
    var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (!t) {
        if (Array.isArray(r) || (t = _unsupportedIterableToArray$1(r)) || e && r && "number" == typeof r.length) {
            t && (r = t);
            var _n = 0, F = function F() {};
            return {
                s: F,
                n: function n() {
                    return _n >= r.length ? {
                        done: !0
                    } : {
                        done: !1,
                        value: r[_n++]
                    };
                },
                e: function e(r) {
                    throw r;
                },
                f: F
            };
        }
        throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var o, a = !0, u = !1;
    return {
        s: function s() {
            t = t.call(r);
        },
        n: function n() {
            var r = t.next();
            return a = r.done, r;
        },
        e: function e(r) {
            u = !0, o = r;
        },
        f: function f() {
            try {
                a || null == t["return"] || t["return"]();
            } finally{
                if (u) throw o;
            }
        }
    };
}
function _unsupportedIterableToArray$1(r, a) {
    if (r) {
        if ("string" == typeof r) return _arrayLikeToArray$1(r, a);
        var t = ({}).toString.call(r).slice(8, -1);
        return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray$1(r, a) : void 0;
    }
}
function _arrayLikeToArray$1(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for(var e = 0, n = Array(a); e < a; e++)n[e] = r[e];
    return n;
}
/**
 * @param elements list of Element returned by document.elementsFromPoint
 */ function findSocket(socketsCache, elements) {
    var _iterator = _createForOfIteratorHelper$1(elements), _step;
    try {
        for(_iterator.s(); !(_step = _iterator.n()).done;){
            var element = _step.value;
            var found = socketsCache.get(element);
            if (found) return found;
        }
    } catch (err) {
        _iterator.e(err);
    } finally{
        _iterator.f();
    }
}
/**
 * Alternative to document.elementsFromPoint that traverses shadow roots
 * @param x x coordinate
 * @param y y coordinate
 * @param root root element to search in
 */ function elementsFromPoint(x, y) {
    var _elements$;
    var root = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : document;
    var elements = root.elementsFromPoint(x, y);
    var shadowRoot = (_elements$ = elements[0]) === null || _elements$ === void 0 ? void 0 : _elements$.shadowRoot;
    if (shadowRoot && shadowRoot !== root) elements.unshift.apply(elements, (0, _toConsumableArrayDefault.default)(elementsFromPoint(x, y, shadowRoot)));
    return elements;
}
var Flow = /*#__PURE__*/ (0, _createClassDefault.default)(function Flow() {
    (0, _classCallCheckDefault.default)(this, Flow);
});
var State = /*#__PURE__*/ function() {
    function State() {
        (0, _classCallCheckDefault.default)(this, State);
    }
    return (0, _createClassDefault.default)(State, [
        {
            key: "setContext",
            value: function setContext(context) {
                this.context = context;
            }
        }
    ]);
}();
function getSourceTarget(initial, socket) {
    var forward = initial.side === 'output' && socket.side === 'input';
    var backward = initial.side === 'input' && socket.side === 'output';
    var _ref = forward ? [
        initial,
        socket
    ] : backward ? [
        socket,
        initial
    ] : [], _ref2 = (0, _slicedToArrayDefault.default)(_ref, 2), source = _ref2[0], target = _ref2[1];
    if (source && target) return [
        source,
        target
    ];
}
function canMakeConnection(initial, socket) {
    return Boolean(getSourceTarget(initial, socket));
}
function makeConnection(initial, socket, context) {
    var _ref3 = getSourceTarget(initial, socket) || [
        null,
        null
    ], _ref4 = (0, _slicedToArrayDefault.default)(_ref3, 2), source = _ref4[0], target = _ref4[1];
    if (source && target) {
        context.editor.addConnection({
            id: (0, _rete.getUID)(),
            source: source.nodeId,
            sourceOutput: source.key,
            target: target.nodeId,
            targetInput: target.key
        });
        return true;
    }
}
function _callSuper$2(t, o, e) {
    return o = (0, _getPrototypeOfDefault.default)(o), (0, _possibleConstructorReturnDefault.default)(t, _isNativeReflectConstruct$2() ? Reflect.construct(o, e || [], (0, _getPrototypeOfDefault.default)(t).constructor) : o.apply(t, e));
}
function _isNativeReflectConstruct$2() {
    try {
        var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
    } catch (t) {}
    return (_isNativeReflectConstruct$2 = function _isNativeReflectConstruct() {
        return !!t;
    })();
}
/**
 * Bidirect flow params
 */ var Picked$1 = /*#__PURE__*/ function(_State) {
    function Picked(initial, params) {
        var _this;
        (0, _classCallCheckDefault.default)(this, Picked);
        _this = _callSuper$2(this, Picked);
        _this.initial = initial;
        _this.params = params;
        return _this;
    }
    (0, _inheritsDefault.default)(Picked, _State);
    return (0, _createClassDefault.default)(Picked, [
        {
            key: "pick",
            value: function() {
                var _pick = (0, _asyncToGeneratorDefault.default)(/*#__PURE__*/ (0, _regeneratorDefault.default).mark(function _callee(_ref, context) {
                    var socket;
                    return (0, _regeneratorDefault.default).wrap(function _callee$(_context) {
                        while(true)switch(_context.prev = _context.next){
                            case 0:
                                socket = _ref.socket;
                                if (this.params.makeConnection(this.initial, socket, context)) this.drop(context, socket, true);
                                else if (!this.params.pickByClick) this.drop(context, socket);
                            case 2:
                            case "end":
                                return _context.stop();
                        }
                    }, _callee, this);
                }));
                function pick(_x, _x2) {
                    return _pick.apply(this, arguments);
                }
                return pick;
            }()
        },
        {
            key: "drop",
            value: function drop(context) {
                var socket = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
                var created = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
                if (this.initial) context.scope.emit({
                    type: 'connectiondrop',
                    data: {
                        initial: this.initial,
                        socket: socket,
                        created: created
                    }
                });
                this.context.switchTo(new Idle$1(this.params));
            }
        }
    ]);
}(State);
var Idle$1 = /*#__PURE__*/ function(_State2) {
    function Idle(params) {
        var _this2;
        (0, _classCallCheckDefault.default)(this, Idle);
        _this2 = _callSuper$2(this, Idle);
        _this2.params = params;
        return _this2;
    }
    (0, _inheritsDefault.default)(Idle, _State2);
    return (0, _createClassDefault.default)(Idle, [
        {
            key: "pick",
            value: function() {
                var _pick2 = (0, _asyncToGeneratorDefault.default)(/*#__PURE__*/ (0, _regeneratorDefault.default).mark(function _callee2(_ref2, context) {
                    var socket, event;
                    return (0, _regeneratorDefault.default).wrap(function _callee2$(_context2) {
                        while(true)switch(_context2.prev = _context2.next){
                            case 0:
                                socket = _ref2.socket, event = _ref2.event;
                                if (!(event === 'down')) {
                                    _context2.next = 9;
                                    break;
                                }
                                _context2.next = 4;
                                return context.scope.emit({
                                    type: 'connectionpick',
                                    data: {
                                        socket: socket
                                    }
                                });
                            case 4:
                                if (!_context2.sent) {
                                    _context2.next = 8;
                                    break;
                                }
                                this.context.switchTo(new Picked$1(socket, this.params));
                                _context2.next = 9;
                                break;
                            case 8:
                                this.drop(context);
                            case 9:
                            case "end":
                                return _context2.stop();
                        }
                    }, _callee2, this);
                }));
                function pick(_x3, _x4) {
                    return _pick2.apply(this, arguments);
                }
                return pick;
            }()
        },
        {
            key: "drop",
            value: function drop(context) {
                var socket = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
                var created = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
                if (this.initial) context.scope.emit({
                    type: 'connectiondrop',
                    data: {
                        initial: this.initial,
                        socket: socket,
                        created: created
                    }
                });
                delete this.initial;
            }
        }
    ]);
}(State);
/**
 * Bidirect flow. User can pick a socket and connect it by releasing mouse button.
 * More simple than classic flow, but less functional (can't remove connection by clicking on input socket).
 */ var BidirectFlow = /*#__PURE__*/ function() {
    function BidirectFlow(params) {
        (0, _classCallCheckDefault.default)(this, BidirectFlow);
        var pickByClick = Boolean(params === null || params === void 0 ? void 0 : params.pickByClick);
        var makeConnection$1 = (params === null || params === void 0 ? void 0 : params.makeConnection) || makeConnection;
        this.switchTo(new Idle$1({
            pickByClick: pickByClick,
            makeConnection: makeConnection$1
        }));
    }
    return (0, _createClassDefault.default)(BidirectFlow, [
        {
            key: "pick",
            value: function() {
                var _pick3 = (0, _asyncToGeneratorDefault.default)(/*#__PURE__*/ (0, _regeneratorDefault.default).mark(function _callee3(params, context) {
                    return (0, _regeneratorDefault.default).wrap(function _callee3$(_context3) {
                        while(true)switch(_context3.prev = _context3.next){
                            case 0:
                                _context3.next = 2;
                                return this.currentState.pick(params, context);
                            case 2:
                            case "end":
                                return _context3.stop();
                        }
                    }, _callee3, this);
                }));
                function pick(_x5, _x6) {
                    return _pick3.apply(this, arguments);
                }
                return pick;
            }()
        },
        {
            key: "getPickedSocket",
            value: function getPickedSocket() {
                return this.currentState.initial;
            }
        },
        {
            key: "drop",
            value: function drop(context) {
                this.currentState.drop(context);
            }
        },
        {
            key: "switchTo",
            value: function switchTo(state) {
                state.setContext(this);
                this.currentState = state;
            }
        }
    ]);
}();
function findPort(socket, editor) {
    var node = editor.getNode(socket.nodeId);
    if (!node) throw new Error('cannot find node');
    var list = socket.side === 'input' ? node.inputs : node.outputs;
    return list[socket.key];
}
function findConnections(socket, editor) {
    var nodeId = socket.nodeId, side = socket.side, key = socket.key;
    return editor.getConnections().filter(function(connection) {
        if (side === 'input') return connection.target === nodeId && connection.targetInput === key;
        if (side === 'output') return connection.source === nodeId && connection.sourceOutput === key;
    });
}
/**
 * Remove existing connections if Port doesnt allow multiple connections
 */ function syncConnections(sockets, editor) {
    var connections = sockets.map(function(socket) {
        var port = findPort(socket, editor);
        var multiple = port === null || port === void 0 ? void 0 : port.multipleConnections;
        if (multiple) return [];
        return findConnections(socket, editor);
    }).flat();
    return {
        commit: function commit() {
            var uniqueIds = Array.from(new Set(connections.map(function(_ref) {
                var id = _ref.id;
                return id;
            })));
            uniqueIds.forEach(function(id) {
                return void editor.removeConnection(id);
            });
        }
    };
}
function _callSuper$1(t, o, e) {
    return o = (0, _getPrototypeOfDefault.default)(o), (0, _possibleConstructorReturnDefault.default)(t, _isNativeReflectConstruct$1() ? Reflect.construct(o, e || [], (0, _getPrototypeOfDefault.default)(t).constructor) : o.apply(t, e));
}
function _isNativeReflectConstruct$1() {
    try {
        var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
    } catch (t) {}
    return (_isNativeReflectConstruct$1 = function _isNativeReflectConstruct() {
        return !!t;
    })();
}
/**
 * Classic flow params
 */ var Picked = /*#__PURE__*/ function(_State) {
    function Picked(initial, params) {
        var _this;
        (0, _classCallCheckDefault.default)(this, Picked);
        _this = _callSuper$1(this, Picked);
        _this.initial = initial;
        _this.params = params;
        return _this;
    }
    (0, _inheritsDefault.default)(Picked, _State);
    return (0, _createClassDefault.default)(Picked, [
        {
            key: "pick",
            value: function() {
                var _pick = (0, _asyncToGeneratorDefault.default)(/*#__PURE__*/ (0, _regeneratorDefault.default).mark(function _callee(_ref, context) {
                    var socket, created;
                    return (0, _regeneratorDefault.default).wrap(function _callee$(_context) {
                        while(true)switch(_context.prev = _context.next){
                            case 0:
                                socket = _ref.socket;
                                if (this.params.canMakeConnection(this.initial, socket)) {
                                    syncConnections([
                                        this.initial,
                                        socket
                                    ], context.editor).commit();
                                    created = this.params.makeConnection(this.initial, socket, context);
                                    this.drop(context, created ? socket : null, created);
                                }
                            case 2:
                            case "end":
                                return _context.stop();
                        }
                    }, _callee, this);
                }));
                function pick(_x, _x2) {
                    return _pick.apply(this, arguments);
                }
                return pick;
            }()
        },
        {
            key: "drop",
            value: function drop(context) {
                var socket = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
                var created = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
                if (this.initial) context.scope.emit({
                    type: 'connectiondrop',
                    data: {
                        initial: this.initial,
                        socket: socket,
                        created: created
                    }
                });
                this.context.switchTo(new Idle(this.params));
            }
        }
    ]);
}(State);
var PickedExisting = /*#__PURE__*/ function(_State2) {
    function PickedExisting(connection, params, context) {
        var _this2;
        (0, _classCallCheckDefault.default)(this, PickedExisting);
        _this2 = _callSuper$1(this, PickedExisting);
        _this2.connection = connection;
        _this2.params = params;
        var outputSocket = Array.from(context.socketsCache.values()).find(function(data) {
            return data.nodeId === _this2.connection.source && data.side === 'output' && data.key === _this2.connection.sourceOutput;
        });
        if (!outputSocket) throw new Error('cannot find output socket');
        _this2.outputSocket = outputSocket;
        return _this2;
    }
    (0, _inheritsDefault.default)(PickedExisting, _State2);
    return (0, _createClassDefault.default)(PickedExisting, [
        {
            key: "init",
            value: function() {
                var _init = (0, _asyncToGeneratorDefault.default)(/*#__PURE__*/ (0, _regeneratorDefault.default).mark(function _callee2(context) {
                    var _this3 = this;
                    return (0, _regeneratorDefault.default).wrap(function _callee2$(_context2) {
                        while(true)switch(_context2.prev = _context2.next){
                            case 0:
                                context.scope.emit({
                                    type: 'connectionpick',
                                    data: {
                                        socket: this.outputSocket
                                    }
                                }).then(function(response) {
                                    if (response) {
                                        context.editor.removeConnection(_this3.connection.id);
                                        _this3.initial = _this3.outputSocket;
                                    } else _this3.drop(context);
                                });
                            case 1:
                            case "end":
                                return _context2.stop();
                        }
                    }, _callee2, this);
                }));
                function init(_x3) {
                    return _init.apply(this, arguments);
                }
                return init;
            }()
        },
        {
            key: "pick",
            value: function() {
                var _pick2 = (0, _asyncToGeneratorDefault.default)(/*#__PURE__*/ (0, _regeneratorDefault.default).mark(function _callee3(_ref2, context) {
                    var socket, event, created, droppedSocket, _created, _droppedSocket;
                    return (0, _regeneratorDefault.default).wrap(function _callee3$(_context3) {
                        while(true)switch(_context3.prev = _context3.next){
                            case 0:
                                socket = _ref2.socket, event = _ref2.event;
                                if (this.initial && !(socket.side === 'input' && this.connection.target === socket.nodeId && this.connection.targetInput === socket.key)) {
                                    if (this.params.canMakeConnection(this.initial, socket)) {
                                        syncConnections([
                                            this.initial,
                                            socket
                                        ], context.editor).commit();
                                        created = this.params.makeConnection(this.initial, socket, context);
                                        droppedSocket = created ? socket : null;
                                        this.drop(context, droppedSocket, created);
                                    }
                                } else if (event === 'down') {
                                    if (this.initial) {
                                        syncConnections([
                                            this.initial,
                                            socket
                                        ], context.editor).commit();
                                        _created = this.params.makeConnection(this.initial, socket, context);
                                        _droppedSocket = _created ? null : socket;
                                        this.drop(context, _droppedSocket, _created);
                                    }
                                }
                            case 2:
                            case "end":
                                return _context3.stop();
                        }
                    }, _callee3, this);
                }));
                function pick(_x4, _x5) {
                    return _pick2.apply(this, arguments);
                }
                return pick;
            }()
        },
        {
            key: "drop",
            value: function drop(context) {
                var socket = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
                var created = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
                if (this.initial) context.scope.emit({
                    type: 'connectiondrop',
                    data: {
                        initial: this.initial,
                        socket: socket,
                        created: created
                    }
                });
                this.context.switchTo(new Idle(this.params));
            }
        }
    ]);
}(State);
var Idle = /*#__PURE__*/ function(_State3) {
    function Idle(params) {
        var _this4;
        (0, _classCallCheckDefault.default)(this, Idle);
        _this4 = _callSuper$1(this, Idle);
        _this4.params = params;
        return _this4;
    }
    (0, _inheritsDefault.default)(Idle, _State3);
    return (0, _createClassDefault.default)(Idle, [
        {
            key: "pick",
            value: function() {
                var _pick3 = (0, _asyncToGeneratorDefault.default)(/*#__PURE__*/ (0, _regeneratorDefault.default).mark(function _callee4(_ref3, context) {
                    var socket, event, _connection, state;
                    return (0, _regeneratorDefault.default).wrap(function _callee4$(_context4) {
                        while(true)switch(_context4.prev = _context4.next){
                            case 0:
                                socket = _ref3.socket, event = _ref3.event;
                                if (!(event !== 'down')) {
                                    _context4.next = 3;
                                    break;
                                }
                                return _context4.abrupt("return");
                            case 3:
                                if (!(socket.side === 'input')) {
                                    _context4.next = 11;
                                    break;
                                }
                                _connection = context.editor.getConnections().find(function(item) {
                                    return item.target === socket.nodeId && item.targetInput === socket.key;
                                });
                                if (!_connection) {
                                    _context4.next = 11;
                                    break;
                                }
                                state = new PickedExisting(_connection, this.params, context);
                                _context4.next = 9;
                                return state.init(context);
                            case 9:
                                this.context.switchTo(state);
                                return _context4.abrupt("return");
                            case 11:
                                _context4.next = 13;
                                return context.scope.emit({
                                    type: 'connectionpick',
                                    data: {
                                        socket: socket
                                    }
                                });
                            case 13:
                                if (!_context4.sent) {
                                    _context4.next = 17;
                                    break;
                                }
                                this.context.switchTo(new Picked(socket, this.params));
                                _context4.next = 18;
                                break;
                            case 17:
                                this.drop(context);
                            case 18:
                            case "end":
                                return _context4.stop();
                        }
                    }, _callee4, this);
                }));
                function pick(_x6, _x7) {
                    return _pick3.apply(this, arguments);
                }
                return pick;
            }()
        },
        {
            key: "drop",
            value: function drop(context) {
                var socket = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
                var created = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
                if (this.initial) context.scope.emit({
                    type: 'connectiondrop',
                    data: {
                        initial: this.initial,
                        socket: socket,
                        created: created
                    }
                });
                delete this.initial;
            }
        }
    ]);
}(State);
/**
 * Classic flow. User can pick/click a socket and connect it by releasing/clicking on another socket.
 * If connection already exists and user clicks on input socket, connection will be removed.
 */ var ClassicFlow = /*#__PURE__*/ function() {
    function ClassicFlow(params) {
        (0, _classCallCheckDefault.default)(this, ClassicFlow);
        var canMakeConnection$1 = (params === null || params === void 0 ? void 0 : params.canMakeConnection) || canMakeConnection;
        var makeConnection$1 = (params === null || params === void 0 ? void 0 : params.makeConnection) || makeConnection;
        this.switchTo(new Idle({
            canMakeConnection: canMakeConnection$1,
            makeConnection: makeConnection$1
        }));
    }
    return (0, _createClassDefault.default)(ClassicFlow, [
        {
            key: "pick",
            value: function() {
                var _pick4 = (0, _asyncToGeneratorDefault.default)(/*#__PURE__*/ (0, _regeneratorDefault.default).mark(function _callee5(params, context) {
                    return (0, _regeneratorDefault.default).wrap(function _callee5$(_context5) {
                        while(true)switch(_context5.prev = _context5.next){
                            case 0:
                                _context5.next = 2;
                                return this.currentState.pick(params, context);
                            case 2:
                            case "end":
                                return _context5.stop();
                        }
                    }, _callee5, this);
                }));
                function pick(_x8, _x9) {
                    return _pick4.apply(this, arguments);
                }
                return pick;
            }()
        },
        {
            key: "getPickedSocket",
            value: function getPickedSocket() {
                return this.currentState.initial;
            }
        },
        {
            key: "switchTo",
            value: function switchTo(state) {
                state.setContext(this);
                this.currentState = state;
            }
        },
        {
            key: "drop",
            value: function drop(context) {
                this.currentState.drop(context);
            }
        }
    ]);
}();
/**
 * Classic preset. Uses `ClassicFlow` for managing connections by user
 */ function setup() {
    return function() {
        return new ClassicFlow();
    };
}
var classic = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    setup: setup
});
/**
 * Built-in presets
 * @module
 */ var index = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    classic: classic
});
function _createForOfIteratorHelper(r, e) {
    var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (!t) {
        if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {
            t && (r = t);
            var _n = 0, F = function F() {};
            return {
                s: F,
                n: function n() {
                    return _n >= r.length ? {
                        done: !0
                    } : {
                        done: !1,
                        value: r[_n++]
                    };
                },
                e: function e(r) {
                    throw r;
                },
                f: F
            };
        }
        throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var o, a = !0, u = !1;
    return {
        s: function s() {
            t = t.call(r);
        },
        n: function n() {
            var r = t.next();
            return a = r.done, r;
        },
        e: function e(r) {
            u = !0, o = r;
        },
        f: function f() {
            try {
                a || null == t["return"] || t["return"]();
            } finally{
                if (u) throw o;
            }
        }
    };
}
function _unsupportedIterableToArray(r, a) {
    if (r) {
        if ("string" == typeof r) return _arrayLikeToArray(r, a);
        var t = ({}).toString.call(r).slice(8, -1);
        return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
}
function _arrayLikeToArray(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for(var e = 0, n = Array(a); e < a; e++)n[e] = r[e];
    return n;
}
function _callSuper(t, o, e) {
    return o = (0, _getPrototypeOfDefault.default)(o), (0, _possibleConstructorReturnDefault.default)(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], (0, _getPrototypeOfDefault.default)(t).constructor) : o.apply(t, e));
}
function _isNativeReflectConstruct() {
    try {
        var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
    } catch (t) {}
    return (_isNativeReflectConstruct = function _isNativeReflectConstruct() {
        return !!t;
    })();
}
function _superPropGet(t, e, o, r) {
    var p = (0, _getDefault.default)((0, _getPrototypeOfDefault.default)(1 & r ? t.prototype : t), e, o);
    return 2 & r && "function" == typeof p ? function(t) {
        return p.apply(o, t);
    } : p;
}
/**
 * Connection plugin. Responsible for user interaction with connections (creation, deletion)
 * @priority 9
 * @emits connectionpick
 * @emits connectiondrop
 * @listens pointermove
 * @listens pointerup
 * @listens render
 * @listens unmount
 */ var ConnectionPlugin = /*#__PURE__*/ function(_Scope) {
    function ConnectionPlugin() {
        var _this;
        (0, _classCallCheckDefault.default)(this, ConnectionPlugin);
        _this = _callSuper(this, ConnectionPlugin, [
            'connection'
        ]);
        (0, _definePropertyDefault.default)(_this, "presets", []);
        (0, _definePropertyDefault.default)(_this, "currentFlow", null);
        (0, _definePropertyDefault.default)(_this, "preudoconnection", createPseudoconnection({
            isPseudo: true
        }));
        (0, _definePropertyDefault.default)(_this, "socketsCache", new Map());
        return _this;
    }
    /**
   * Add preset to the plugin
   * @param preset Preset to add
   */ (0, _inheritsDefault.default)(ConnectionPlugin, _Scope);
    return (0, _createClassDefault.default)(ConnectionPlugin, [
        {
            key: "addPreset",
            value: function addPreset(preset) {
                this.presets.push(preset);
            }
        },
        {
            key: "findPreset",
            value: function findPreset(data) {
                var _iterator = _createForOfIteratorHelper(this.presets), _step;
                try {
                    for(_iterator.s(); !(_step = _iterator.n()).done;){
                        var preset = _step.value;
                        var flow = preset(data);
                        if (flow) return flow;
                    }
                } catch (err) {
                    _iterator.e(err);
                } finally{
                    _iterator.f();
                }
                return null;
            }
        },
        {
            key: "update",
            value: function update() {
                if (!this.currentFlow) return;
                var socket = this.currentFlow.getPickedSocket();
                if (socket) this.preudoconnection.render(this.areaPlugin, this.areaPlugin.area.pointer, socket);
            }
        },
        {
            key: "drop",
            value: function drop() {
                var flowContext = {
                    editor: this.editor,
                    scope: this,
                    socketsCache: this.socketsCache
                };
                if (this.currentFlow) {
                    this.currentFlow.drop(flowContext);
                    this.preudoconnection.unmount(this.areaPlugin);
                    this.currentFlow = null;
                }
            }
        },
        {
            key: "pick",
            value: function() {
                var _pick = (0, _asyncToGeneratorDefault.default)(/*#__PURE__*/ (0, _regeneratorDefault.default).mark(function _callee(event, type) {
                    var flowContext, pointedElements, pickedSocket;
                    return (0, _regeneratorDefault.default).wrap(function _callee$(_context) {
                        while(true)switch(_context.prev = _context.next){
                            case 0:
                                flowContext = {
                                    editor: this.editor,
                                    scope: this,
                                    socketsCache: this.socketsCache
                                };
                                pointedElements = elementsFromPoint(event.clientX, event.clientY);
                                pickedSocket = findSocket(this.socketsCache, pointedElements);
                                if (!pickedSocket) {
                                    _context.next = 13;
                                    break;
                                }
                                event.preventDefault();
                                event.stopPropagation();
                                this.currentFlow = this.currentFlow || this.findPreset(pickedSocket);
                                if (!this.currentFlow) {
                                    _context.next = 11;
                                    break;
                                }
                                _context.next = 10;
                                return this.currentFlow.pick({
                                    socket: pickedSocket,
                                    event: type
                                }, flowContext);
                            case 10:
                                this.preudoconnection.mount(this.areaPlugin);
                            case 11:
                                _context.next = 14;
                                break;
                            case 13:
                                if (this.currentFlow) this.currentFlow.drop(flowContext);
                            case 14:
                                if (this.currentFlow && !this.currentFlow.getPickedSocket()) {
                                    this.preudoconnection.unmount(this.areaPlugin);
                                    this.currentFlow = null;
                                }
                                this.update();
                            case 16:
                            case "end":
                                return _context.stop();
                        }
                    }, _callee, this);
                }));
                function pick(_x, _x2) {
                    return _pick.apply(this, arguments);
                }
                return pick;
            }()
        },
        {
            key: "setParent",
            value: function setParent(scope) {
                var _this2 = this;
                _superPropGet(ConnectionPlugin, "setParent", this, 3)([
                    scope
                ]);
                this.areaPlugin = this.parentScope((0, _reteAreaPlugin.BaseAreaPlugin));
                this.editor = this.areaPlugin.parentScope((0, _rete.NodeEditor));
                var pointerdownSocket = function pointerdownSocket(e) {
                    _this2.pick(e, 'down');
                };
                this.addPipe(function(context) {
                    if (!context || (0, _typeofDefault.default)(context) !== 'object' || !('type' in context)) return context;
                    if (context.type === 'pointermove') _this2.update();
                    else if (context.type === 'pointerup') _this2.pick(context.data.event, 'up');
                    else if (context.type === 'render') {
                        if (context.data.type === 'socket') {
                            var element = context.data.element;
                            element.addEventListener('pointerdown', pointerdownSocket);
                            _this2.socketsCache.set(element, context.data);
                        }
                    } else if (context.type === 'unmount') {
                        var _element = context.data.element;
                        _element.removeEventListener('pointerdown', pointerdownSocket);
                        _this2.socketsCache["delete"](_element);
                    }
                    return context;
                });
            }
        }
    ]);
}((0, _rete.Scope));

},{"@babel/runtime/helpers/typeof":"7EL9t","@babel/runtime/helpers/asyncToGenerator":"3sxrH","@babel/runtime/helpers/classCallCheck":"fbbZA","@babel/runtime/helpers/createClass":"lr6gv","@babel/runtime/helpers/possibleConstructorReturn":"3sko5","@babel/runtime/helpers/getPrototypeOf":"aGuV6","@babel/runtime/helpers/get":"fueqV","@babel/runtime/helpers/inherits":"8CbKS","@babel/runtime/helpers/defineProperty":"azbUC","@babel/runtime/regenerator":"baIBJ","rete":"3aYez","rete-area-plugin":"lMdR6","@babel/runtime/helpers/toConsumableArray":"lkYCr","@babel/runtime/helpers/slicedToArray":"lvO5K","@parcel/transformer-js/src/esmodule-helpers.js":"jnFvT"}],"fueqV":[function(require,module,exports,__globalThis) {
var superPropBase = require("6e537077e7e3a1c2");
function _get() {
    return module.exports = _get = "undefined" != typeof Reflect && Reflect.get ? Reflect.get.bind() : function(e, t, r) {
        var p = superPropBase(e, t);
        if (p) {
            var n = Object.getOwnPropertyDescriptor(p, t);
            return n.get ? n.get.call(arguments.length < 3 ? e : r) : n.value;
        }
    }, module.exports.__esModule = true, module.exports["default"] = module.exports, _get.apply(null, arguments);
}
module.exports = _get, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{"6e537077e7e3a1c2":"kTxL3"}],"kTxL3":[function(require,module,exports,__globalThis) {
var getPrototypeOf = require("b50b8ab32046070");
function _superPropBase(t, o) {
    for(; !({}).hasOwnProperty.call(t, o) && null !== (t = getPrototypeOf(t)););
    return t;
}
module.exports = _superPropBase, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{"b50b8ab32046070":"aGuV6"}],"lvO5K":[function(require,module,exports,__globalThis) {
var arrayWithHoles = require("a3af206dbd14b1b5");
var iterableToArrayLimit = require("c109e0e3b1a7ef05");
var unsupportedIterableToArray = require("6782568c4383bd49");
var nonIterableRest = require("1e06d43f4bd6e532");
function _slicedToArray(r, e) {
    return arrayWithHoles(r) || iterableToArrayLimit(r, e) || unsupportedIterableToArray(r, e) || nonIterableRest();
}
module.exports = _slicedToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{"a3af206dbd14b1b5":"ikHM3","c109e0e3b1a7ef05":"4M9hz","6782568c4383bd49":"klYG5","1e06d43f4bd6e532":"4xd1q"}],"ikHM3":[function(require,module,exports,__globalThis) {
function _arrayWithHoles(r) {
    if (Array.isArray(r)) return r;
}
module.exports = _arrayWithHoles, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{}],"4M9hz":[function(require,module,exports,__globalThis) {
function _iterableToArrayLimit(r, l) {
    var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (null != t) {
        var e, n, i, u, a = [], f = !0, o = !1;
        try {
            if (i = (t = t.call(r)).next, 0 === l) {
                if (Object(t) !== t) return;
                f = !1;
            } else for(; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
        } catch (r) {
            o = !0, n = r;
        } finally{
            try {
                if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return;
            } finally{
                if (o) throw n;
            }
        }
        return a;
    }
}
module.exports = _iterableToArrayLimit, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{}],"4xd1q":[function(require,module,exports,__globalThis) {
function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
module.exports = _nonIterableRest, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{}],"hX0Nu":[function(require,module,exports,__globalThis) {
// sync.js - Logic for synchronizing map/globe views and layer representations
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
// --- Selection Synchronization --- 
parcelHelpers.export(exports, "syncSelectionToGlobe", ()=>syncSelectionToGlobe);
// Function to initialize selection listeners (call this from main.js)
parcelHelpers.export(exports, "initializeSelectionSync", ()=>initializeSelectionSync);
// --- Feature Synchronization --- 
parcelHelpers.export(exports, "syncOlLayerToOgLayer", ()=>syncOlLayerToOgLayer) // End of syncOlLayerToOgLayer
;
// --- View Synchronization --- 
parcelHelpers.export(exports, "getMapViewParameters", ()=>getMapViewParameters);
parcelHelpers.export(exports, "getGlobeViewParameters", ()=>getGlobeViewParameters);
parcelHelpers.export(exports, "setMapView", ()=>setMapView);
parcelHelpers.export(exports, "setGlobeView", ()=>setGlobeView);
var _mapJs = require("./map.js");
var _globeJs = require("./globe.js");
// Helper functions from main.js
const hexToRgba = (hex, alpha = 1.0)=>{
    if (!hex || typeof hex !== 'string') return [
        0,
        0,
        0,
        alpha
    ];
    hex = hex.replace('#', '');
    let r, g, b;
    if (hex.length === 3) {
        r = parseInt(hex.substring(0, 1).repeat(2), 16);
        g = parseInt(hex.substring(1, 2).repeat(2), 16);
        b = parseInt(hex.substring(2, 3).repeat(2), 16);
    } else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    } else return [
        0,
        0,
        0,
        alpha
    ];
    return [
        r / 255,
        g / 255,
        b / 255,
        alpha
    ];
};
const tileBoundsToLonLat = (tileX, tileY, tileZ)=>{
    const n = Math.pow(2, tileZ);
    const lon_deg_min = tileX / n * 360.0 - 180.0;
    const lat_rad_min = Math.atan(Math.sinh(Math.PI * (1 - 2 * (tileY + 1) / n)));
    const lat_deg_min = lat_rad_min * 180.0 / Math.PI;
    const lon_deg_max = (tileX + 1) / n * 360.0 - 180.0;
    const lat_rad_max = Math.atan(Math.sinh(Math.PI * (1 - 2 * tileY / n)));
    const lat_deg_max = lat_rad_max * 180.0 / Math.PI;
    return [
        [
            lon_deg_min,
            lat_deg_min
        ],
        [
            lon_deg_max,
            lat_deg_min
        ],
        [
            lon_deg_max,
            lat_deg_max
        ],
        [
            lon_deg_min,
            lat_deg_max
        ],
        [
            lon_deg_min,
            lat_deg_min
        ]
    ];
};
function syncSelectionToGlobe() {
    const globus = (0, _globeJs.getGlobus)(); // Need to get instance
    if (!globus) return; // Don't sync if globe isn't initialized
    const ogSelectionLayer = globus.planet.getLayerByName("og_selection");
    if (!ogSelectionLayer) {
        console.warn("syncSelectionToGlobe: OpenGlobus selection layer not found.");
        return;
    }
    ogSelectionLayer.clear(); // Clear existing globe selection visuals
    const selectedFeatures = (0, _mapJs.selectionSource).getFeatures(); // Need selectionSource from map.js
    const entitiesToAdd = [];
    selectedFeatures.forEach((olFeature)=>{
        const tileId = olFeature.getId();
        if (!tileId) return; // Should have an ID
        // Parse tileId (assuming 'z-x-y' format)
        const parts = tileId.split('-');
        if (parts.length !== 3) return;
        const tileZ = parseInt(parts[0], 10);
        const tileX = parseInt(parts[1], 10);
        const tileY = parseInt(parts[2], 10);
        // Calculate bounds using the helper
        const ogCoordinates = tileBoundsToLonLat(tileX, tileY, tileZ);
        if (!ogCoordinates) {
            console.error(`Failed to get bounds for tile ${tileId}`);
            return;
        }
        const selectionEntity = new og.Entity({
            'properties': {
                tileId: tileId
            },
            'polygon': {
                'vertices': ogCoordinates
            }
        });
        entitiesToAdd.push(selectionEntity);
    });
    if (entitiesToAdd.length > 0) ogSelectionLayer.addEntities(entitiesToAdd);
// console.log(`Synced ${entitiesToAdd.length} selected features to globe.`); // Optional debug log
}
function initializeSelectionSync() {
    (0, _mapJs.selectionSource).on('addfeature', syncSelectionToGlobe);
    (0, _mapJs.selectionSource).on('removefeature', syncSelectionToGlobe);
    (0, _mapJs.selectionSource).on('clear', syncSelectionToGlobe);
    console.log("Selection sync listeners initialized.");
}
function syncOlLayerToOgLayer(olSource, ogLayer) {
    const globus = (0, _globeJs.getGlobus)(); // Need to get instance
    // Safety checks
    if (!globus || !ogLayer) return; // Exit if globe or target OG layer isn't ready
    // Original check for valid source/layer arguments
    if (!olSource) {
        console.warn("syncOlLayerToOgLayer: Invalid OpenLayers source provided.");
        return;
    }
    ogLayer.clear();
    const olFeatures = olSource.getFeatures();
    const entitiesToAdd = [];
    olFeatures.forEach((olFeature)=>{
        const geometry = olFeature.getGeometry();
        if (!geometry || typeof geometry.getCoordinates !== 'function') return;
        const olCoordinates = geometry.getCoordinates()[0];
        if (!olCoordinates || olCoordinates.length === 0) return;
        const ogCoordinates = olCoordinates.map((coord)=>ol.proj.toLonLat(coord));
        const properties = olFeature.getProperties();
        const color = properties.color || '#008080';
        const isVisible = properties.isVisible !== false;
        const name = properties.tilesetName || 'Unnamed Tileset';
        const groupId = properties.tilesetGroupId || null;
        const entity = new og.Entity({
            'name': name,
            'properties': {
                ...properties,
                tilesetGroupId: groupId,
                tilesetName: name,
                color: color,
                isVisible: isVisible
            },
            'polygon': {
                'vertices': ogCoordinates,
                'style': {
                    'fillColor': isVisible ? hexToRgba(color, 0.5) : [
                        0,
                        0,
                        0,
                        0
                    ],
                    'lineColor': isVisible ? hexToRgba(color, 1.0) : [
                        0,
                        0,
                        0,
                        0
                    ],
                    'lineWidth': 2
                } // End style
            } // End polygon
        }); // End Entity
        entitiesToAdd.push(entity);
    }); // End forEach
    if (entitiesToAdd.length > 0) ogLayer.addEntities(entitiesToAdd);
}
function getMapViewParameters() {
    const map = (0, _mapJs.getMap)(); // Need to get instance
    if (!map) return null;
    const view = map.getView();
    const centerLonLat = ol.proj.toLonLat(view.getCenter());
    const zoom = view.getZoom();
    return {
        center: centerLonLat,
        zoom: zoom
    };
}
function getGlobeViewParameters() {
    const globus = (0, _globeJs.getGlobus)(); // Need to get instance
    if (!globus) return null;
    const cam = globus.planet.camera;
    const pos = cam.getLonLat();
    // Approximate zoom based on altitude - needs refinement!
    // This is a very rough approximation and might not translate well.
    const altitude = cam.getHeight();
    const zoom = Math.log2(40075000 * Math.cos(pos.lat * Math.PI / 180) / (altitude * 2)) + 1;
    return {
        center: [
            pos.lon,
            pos.lat
        ],
        zoom: zoom
    }; // Lon, Lat
}
function setMapView(params) {
    const map = (0, _mapJs.getMap)(); // Need to get instance
    if (!map || !params) return;
    const view = map.getView();
    view.setCenter(ol.proj.fromLonLat(params.center));
    view.setZoom(params.zoom);
}
function setGlobeView(params) {
    const globus = (0, _globeJs.getGlobus)(); // Need to get instance
    if (!globus || !params) return;
    globus.planet.flyLonLat(new og.LonLat(params.center[0], params.center[1]), null, null, params.zoom);
// Alternative: Set altitude based on zoom (inverse of approximation)
// const altitude = 40075000 * Math.cos(params.center[1] * Math.PI / 180) / (Math.pow(2, params.zoom - 1) * 2);
// globus.planet.camera.setLonLat(new og.LonLat(params.center[0], params.center[1]), altitude);
}

},{"./map.js":"jKMnl","./globe.js":"lF63g","@parcel/transformer-js/src/esmodule-helpers.js":"jnFvT"}]},["io2N8","bNJxx"], "bNJxx", "parcelRequire4e10", {})

//# sourceMappingURL=mundial.36960861.js.map
