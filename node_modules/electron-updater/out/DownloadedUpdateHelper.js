"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
let isEqual;
/** @private **/
class DownloadedUpdateHelper {
    get file() {
        return this.setupPath;
    }
    getDownloadedFile(versionInfo, fileInfo) {
        if (this.setupPath == null) {
            return null;
        }
        if (isEqual == null) {
            isEqual = require("lodash.isequal");
        }
        if (isEqual(this.versionInfo, versionInfo) && isEqual(this.fileInfo, fileInfo)) {
            return this.setupPath;
        }
        return null;
    }
    setDownloadedFile(file, versionInfo, fileInfo) {
        this.setupPath = file;
        this.versionInfo = versionInfo;
        this.fileInfo = fileInfo;
    }
    clear() {
        this.setupPath = null;
        this.versionInfo = null;
        this.fileInfo = null;
    }
}
exports.DownloadedUpdateHelper = DownloadedUpdateHelper; //# sourceMappingURL=DownloadedUpdateHelper.js.map