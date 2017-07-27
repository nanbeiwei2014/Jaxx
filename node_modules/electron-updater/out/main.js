"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.UpdaterSignal = exports.UPDATE_DOWNLOADED = exports.DOWNLOAD_PROGRESS = exports.Provider = exports.AppUpdater = exports.NET_SESSION_NAME = undefined;

var _electronHttpExecutor;

function _load_electronHttpExecutor() {
    return _electronHttpExecutor = require("./electronHttpExecutor");
}

Object.defineProperty(exports, "NET_SESSION_NAME", {
    enumerable: true,
    get: function () {
        return (_electronHttpExecutor || _load_electronHttpExecutor()).NET_SESSION_NAME;
    }
});

var _AppUpdater;

function _load_AppUpdater() {
    return _AppUpdater = require("./AppUpdater");
}

Object.defineProperty(exports, "AppUpdater", {
    enumerable: true,
    get: function () {
        return (_AppUpdater || _load_AppUpdater()).AppUpdater;
    }
});
exports.getDefaultChannelName = getDefaultChannelName;
exports.getCustomChannelName = getCustomChannelName;
exports.getCurrentPlatform = getCurrentPlatform;
exports.isUseOldMacProvider = isUseOldMacProvider;
exports.getChannelFilename = getChannelFilename;
exports.formatUrl = formatUrl;

var _url;

function _load_url() {
    return _url = require("url");
}

// autoUpdater to mimic electron bundled autoUpdater
let _autoUpdater;
function _load_autoUpdater() {
    // tslint:disable:prefer-conditional-expression
    if (process.platform === "win32") {
        _autoUpdater = new (require("./NsisUpdater").NsisUpdater)();
    } else if (process.platform === "darwin") {
        _autoUpdater = new (require("./MacUpdater").MacUpdater)();
    } else {
        _autoUpdater = require("electron").autoUpdater;
    }
    return _autoUpdater;
}
Object.defineProperty(exports, "autoUpdater", {
    enumerable: true,
    get: () => {
        return _autoUpdater || _load_autoUpdater();
    }
});
class Provider {
    setRequestHeaders(value) {
        this.requestHeaders = value;
    }
    static validateUpdateInfo(info) {
        if (isUseOldMacProvider()) {
            if (info.url == null) {
                throw new Error("Update info doesn't contain url");
            }
            return;
        }
        if (info.sha2 == null && info.sha512 == null) {
            throw new Error(`Update info doesn't contain sha2 or sha512 checksum: ${JSON.stringify(info, null, 2)}`);
        }
        if (info.path == null) {
            throw new Error(`Update info doesn't contain file path: ${JSON.stringify(info, null, 2)}`);
        }
    }
}
exports.Provider = Provider; // due to historical reasons for windows we use channel name without platform specifier

function getDefaultChannelName() {
    return `latest${getChannelFilePrefix()}`;
}
function getChannelFilePrefix() {
    return getCurrentPlatform() === "darwin" ? "-mac" : "";
}
function getCustomChannelName(channel) {
    return `${channel}${getChannelFilePrefix()}`;
}
function getCurrentPlatform() {
    return process.env.TEST_UPDATER_PLATFORM || process.platform;
}
function isUseOldMacProvider() {
    // getCurrentPlatform() === "darwin"
    return false;
}
function getChannelFilename(channel) {
    return `${channel}.yml`;
}
const DOWNLOAD_PROGRESS = exports.DOWNLOAD_PROGRESS = "download-progress";
const UPDATE_DOWNLOADED = exports.UPDATE_DOWNLOADED = "update-downloaded";
class UpdaterSignal {
    constructor(emitter) {
        this.emitter = emitter;
    }
    /**
     * Emitted when an authenticating proxy is asking for user credentials.
     * @see [Electron docs](https://github.com/electron/electron/blob/master/docs/api/client-request.md#event-login)
     */
    login(handler) {
        addHandler(this.emitter, "login", handler);
    }
    progress(handler) {
        addHandler(this.emitter, DOWNLOAD_PROGRESS, handler);
    }
    updateDownloaded(handler) {
        addHandler(this.emitter, UPDATE_DOWNLOADED, handler);
    }
    updateCancelled(handler) {
        addHandler(this.emitter, "update-cancelled", handler);
    }
}
exports.UpdaterSignal = UpdaterSignal;
const isLogEvent = false;
function addHandler(emitter, event, handler) {
    if (isLogEvent) {
        emitter.on(event, function () {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            console.log("%s %s", event, args);
            handler.apply(null, args);
        });
    } else {
        emitter.on(event, handler);
    }
}
// url.format doesn't correctly use path and requires explicit pathname
function formatUrl(url) {
    if (url.path != null && url.pathname == null) {
        url.pathname = url.path;
    }
    return (0, (_url || _load_url()).format)(url);
}
//# sourceMappingURL=main.js.map