"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.NsisUpdater = undefined;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

var _bluebirdLst2;

function _load_bluebirdLst2() {
    return _bluebirdLst2 = _interopRequireDefault(require("bluebird-lst"));
}

var _child_process;

function _load_child_process() {
    return _child_process = require("child_process");
}

var _electronBuilderHttp;

function _load_electronBuilderHttp() {
    return _electronBuilderHttp = require("electron-builder-http");
}

var _rfc2253Parser;

function _load_rfc2253Parser() {
    return _rfc2253Parser = require("electron-builder-http/out/rfc2253Parser");
}

var _fsExtraP;

function _load_fsExtraP() {
    return _fsExtraP = require("fs-extra-p");
}

var _os;

function _load_os() {
    return _os = require("os");
}

var _path = _interopRequireWildcard(require("path"));

require("source-map-support/register");

var _AppUpdater;

function _load_AppUpdater() {
    return _AppUpdater = require("./AppUpdater");
}

var _DownloadedUpdateHelper;

function _load_DownloadedUpdateHelper() {
    return _DownloadedUpdateHelper = require("./DownloadedUpdateHelper");
}

var _main;

function _load_main() {
    return _main = require("./main");
}

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class NsisUpdater extends (_AppUpdater || _load_AppUpdater()).AppUpdater {
    constructor(options, app) {
        super(options, app);
        this.downloadedUpdateHelper = new (_DownloadedUpdateHelper || _load_DownloadedUpdateHelper()).DownloadedUpdateHelper();
        this.quitAndInstallCalled = false;
        this.quitHandlerAdded = false;
    }
    /*** @private */
    doDownloadUpdate(versionInfo, fileInfo, cancellationToken) {
        var _this = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            const downloadOptions = {
                skipDirCreation: true,
                headers: _this.computeRequestHeaders(fileInfo),
                cancellationToken,
                sha2: fileInfo == null ? null : fileInfo.sha2,
                sha512: fileInfo == null ? null : fileInfo.sha512
            };
            const downloadedFile = _this.downloadedUpdateHelper.getDownloadedFile(versionInfo, fileInfo);
            if (downloadedFile != null) {
                return downloadedFile;
            }
            if (_this.listenerCount((_main || _load_main()).DOWNLOAD_PROGRESS) > 0) {
                downloadOptions.onProgress = function (it) {
                    return _this.emit((_main || _load_main()).DOWNLOAD_PROGRESS, it);
                };
            }
            const tempDir = yield (0, (_fsExtraP || _load_fsExtraP()).mkdtemp)(`${_path.join((0, (_os || _load_os()).tmpdir)(), "up")}-`);
            const tempFile = _path.join(tempDir, fileInfo.name);
            const removeTempDirIfAny = function () {
                _this.downloadedUpdateHelper.clear();
                return (0, (_fsExtraP || _load_fsExtraP()).remove)(tempDir).catch(function (error) {
                    // ignored
                });
            };
            let signatureVerificationStatus;
            try {
                yield _this.httpExecutor.download(fileInfo.url, tempFile, downloadOptions);
                signatureVerificationStatus = yield _this.verifySignature(tempFile);
            } catch (e) {
                yield removeTempDirIfAny();
                if (e instanceof (_electronBuilderHttp || _load_electronBuilderHttp()).CancellationError) {
                    _this.emit("update-cancelled", _this.versionInfo);
                    _this._logger.info("Cancelled");
                }
                throw e;
            }
            if (signatureVerificationStatus != null) {
                yield removeTempDirIfAny();
                // noinspection ThrowInsideFinallyBlockJS
                throw new Error(`New version ${_this.versionInfo.version} is not signed by the application owner: ${signatureVerificationStatus}`);
            }
            _this._logger.info(`New version ${_this.versionInfo.version} has been downloaded to ${tempFile}`);
            _this.downloadedUpdateHelper.setDownloadedFile(tempFile, versionInfo, fileInfo);
            _this.addQuitHandler();
            _this.emit((_main || _load_main()).UPDATE_DOWNLOADED, _this.versionInfo);
            return tempFile;
        })();
    }
    // $certificateInfo = (Get-AuthenticodeSignature 'xxx\yyy.exe'
    // | where {$_.Status.Equals([System.Management.Automation.SignatureStatus]::Valid) -and $_.SignerCertificate.Subject.Contains("CN=siemens.com")})
    // | Out-String ; if ($certificateInfo) { exit 0 } else { exit 1 }
    verifySignature(tempUpdateFile) {
        var _this2 = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            let publisherName;
            try {
                publisherName = (yield _this2.configOnDisk.value).publisherName;
                if (publisherName == null) {
                    return null;
                }
            } catch (e) {
                if (e.code === "ENOENT") {
                    // no app-update.yml
                    return null;
                }
                throw e;
            }
            return yield new (_bluebirdLst2 || _load_bluebirdLst2()).default(function (resolve, reject) {
                (0, (_child_process || _load_child_process()).execFile)("powershell.exe", [`Get-AuthenticodeSignature '${tempUpdateFile}' | ConvertTo-Json -Compress`], { maxBuffer: 4 * 1024000, timeout: 60 * 1000 }, function (error, stdout, stderr) {
                    if (error != null || stderr) {
                        try {
                            (0, (_child_process || _load_child_process()).execFileSync)("powershell.exe", ["ConvertTo-Json test"], { timeout: 10 * 1000 });
                        } catch (testError) {
                            _this2._logger.warn(`Cannot execute ConvertTo-Json: ${testError.message}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
                            resolve(null);
                            return;
                        }
                        if (error != null) {
                            reject(error);
                            return;
                        }
                        if (stderr) {
                            reject(new Error(`Cannot execute Get-AuthenticodeSignature: ${stderr}`));
                            return;
                        }
                    }
                    const data = JSON.parse(stdout);
                    delete data.PrivateKey;
                    delete data.IsOSBinary;
                    delete data.SignatureType;
                    const signerCertificate = data.SignerCertificate;
                    if (signerCertificate != null) {
                        delete signerCertificate.Archived;
                        delete signerCertificate.Extensions;
                        delete signerCertificate.Handle;
                        delete signerCertificate.HasPrivateKey;
                        // duplicates data.SignerCertificate (contains RawData)
                        delete signerCertificate.SubjectName;
                    }
                    delete data.Path;
                    if (data.Status === 0) {
                        const name = (0, (_rfc2253Parser || _load_rfc2253Parser()).parseDn)(data.SignerCertificate.Subject).get("CN");
                        if ((Array.isArray(publisherName) ? publisherName : [publisherName]).indexOf(name) !== -1) {
                            resolve(null);
                            return;
                        }
                    }
                    const result = JSON.stringify(data, function (name, value) {
                        return name === "RawData" ? undefined : value;
                    }, 2);
                    _this2._logger.info(`Sign verification failed, installer signed with incorrect certificate: ${result}`);
                    resolve(result);
                });
            });
        })();
    }
    addQuitHandler() {
        if (this.quitHandlerAdded) {
            return;
        }
        this.quitHandlerAdded = true;
        this.app.on("quit", () => {
            this._logger.info("Auto install update on quit");
            this.install(true, false);
        });
    }
    quitAndInstall() {
        let isSilent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
        let isForceRunAfter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

        if (this.install(isSilent, isForceRunAfter)) {
            this.app.quit();
        }
    }
    install(isSilent, isForceRunAfter) {
        if (this.quitAndInstallCalled) {
            return false;
        }
        const setupPath = this.downloadedUpdateHelper.file;
        if (!this.updateAvailable || setupPath == null) {
            const message = "No update available, can't quit and install";
            this.emit("error", new Error(message), message);
            return false;
        }
        // prevent calling several times
        this.quitAndInstallCalled = true;
        const args = ["--updated"];
        if (isSilent) {
            args.push("/S");
        }
        if (isForceRunAfter) {
            args.push("--force-run");
        }
        const spawnOptions = {
            detached: true,
            stdio: "ignore"
        };
        try {
            (0, (_child_process || _load_child_process()).spawn)(setupPath, args, spawnOptions).unref();
        } catch (e) {
            // yes, such errors dispatched not as error event
            // https://github.com/electron-userland/electron-builder/issues/1129
            if (e.code === "UNKNOWN" || e.code === "EACCES") {
                this._logger.info("Access denied or UNKNOWN error code on spawn, will be executed again using elevate");
                try {
                    (0, (_child_process || _load_child_process()).spawn)(_path.join(process.resourcesPath, "elevate.exe"), [setupPath].concat(args), spawnOptions).unref();
                } catch (e) {
                    this.dispatchError(e);
                }
            } else {
                this.dispatchError(e);
            }
        }
        return true;
    }
}
exports.NsisUpdater = NsisUpdater; //# sourceMappingURL=NsisUpdater.js.map