"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.PrivateGitHubProvider = undefined;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

var _electron;

function _load_electron() {
    return _electron = require("electron");
}

var _electronBuilderHttp;

function _load_electronBuilderHttp() {
    return _electronBuilderHttp = require("electron-builder-http");
}

var _jsYaml;

function _load_jsYaml() {
    return _jsYaml = require("js-yaml");
}

var _path = _interopRequireWildcard(require("path"));

var _url;

function _load_url() {
    return _url = require("url");
}

var _electronHttpExecutor;

function _load_electronHttpExecutor() {
    return _electronHttpExecutor = require("./electronHttpExecutor");
}

var _GitHubProvider;

function _load_GitHubProvider() {
    return _GitHubProvider = require("./GitHubProvider");
}

var _main;

function _load_main() {
    return _main = require("./main");
}

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

class PrivateGitHubProvider extends (_GitHubProvider || _load_GitHubProvider()).BaseGitHubProvider {
    constructor(options, token, executor) {
        super(options, "api.github.com");
        this.token = token;
        this.executor = executor;
        this.netSession = (_electron || _load_electron()).session.fromPartition((_electronHttpExecutor || _load_electronHttpExecutor()).NET_SESSION_NAME);
        this.registerHeaderRemovalListener();
    }
    getLatestVersion() {
        var _this = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            const basePath = _this.basePath;
            const cancellationToken = new (_electronBuilderHttp || _load_electronBuilderHttp()).CancellationToken();
            const channelFile = (0, (_main || _load_main()).getChannelFilename)((0, (_main || _load_main()).getDefaultChannelName)());
            const assets = yield _this.getLatestVersionInfo(basePath, cancellationToken);
            const requestOptions = Object.assign({ headers: _this.configureHeaders("application/octet-stream"), session: _this.netSession }, (0, (_url || _load_url()).parse)(assets.find(function (it) {
                return it.name === channelFile;
            }).url));
            let result;
            try {
                result = (0, (_jsYaml || _load_jsYaml()).safeLoad)((yield _this.executor.request(requestOptions, cancellationToken)));
            } catch (e) {
                if (e instanceof (_electronBuilderHttp || _load_electronBuilderHttp()).HttpError && e.response.statusCode === 404) {
                    throw new Error(`Cannot find ${channelFile} in the latest release artifacts (${(0, (_main || _load_main()).formatUrl)(requestOptions)}): ${e.stack || e.message}`);
                }
                throw e;
            }
            (_main || _load_main()).Provider.validateUpdateInfo(result);
            result.assets = assets;
            return result;
        })();
    }
    registerHeaderRemovalListener() {
        const filter = {
            urls: ["*://*.amazonaws.com/*"]
        };
        this.netSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
            if (details.requestHeaders.Authorization != null) {
                delete details.requestHeaders.Authorization;
            }
            callback({ cancel: false, requestHeaders: details.requestHeaders });
        });
    }
    configureHeaders(accept) {
        return Object.assign({ Accept: accept, Authorization: `token ${this.token}` }, this.requestHeaders);
    }
    getLatestVersionInfo(basePath, cancellationToken) {
        var _this2 = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            const requestOptions = Object.assign({ path: `${basePath}/latest`, headers: _this2.configureHeaders("application/vnd.github.v3+json") }, _this2.baseUrl, { isParseJson: false });
            try {
                return JSON.parse((yield _this2.executor.request(requestOptions, cancellationToken))).assets;
            } catch (e) {
                throw new Error(`Unable to find latest version on GitHub (${(0, (_main || _load_main()).formatUrl)(requestOptions)}), please ensure a production release exists: ${e.stack || e.message}`);
            }
        })();
    }
    get basePath() {
        return `/repos/${this.options.owner}/${this.options.repo}/releases`;
    }
    getUpdateFile(versionInfo) {
        var _this3 = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            const headers = {
                Accept: "application/octet-stream",
                Authorization: `token ${_this3.token}`
            };
            const name = versionInfo.githubArtifactName || _path.posix.basename(versionInfo.path).replace(/ /g, "-");
            return {
                name,
                url: versionInfo.assets.find(function (it) {
                    return it.name === name;
                }).url,
                sha2: versionInfo.sha2,
                sha512: versionInfo.sha512,
                headers,
                session: _this3.netSession
            };
        })();
    }
}
exports.PrivateGitHubProvider = PrivateGitHubProvider; //# sourceMappingURL=PrivateGitHubProvider.js.map