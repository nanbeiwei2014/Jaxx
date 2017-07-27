/**
 * Created by Vlad on 2017-02-01.
 */
var jaxx;
(function (jaxx) {
    var MainConnector = (function () {
        function MainConnector(config) {
            this.config = config;
        }
        MainConnector.prototype._downloadBalaceUnconfirmed = function (address) {
            var url = this.urlBalanceUnconfirmed.replace('{{address}}', address);
            return $.getJSON(url).then(function (result) {
                console.log(result);
                return result;
            });
        };
        MainConnector.prototype.downloadBalaceUnconfirmed = function (address) {
            var d = $.Deferred();
            this._downloadBalaceUnconfirmed(address).done(function (res) { return d.resolve(res); }).fail(function (err) { return d.reject(err); });
            return d;
        };
        return MainConnector;
    }());
    jaxx.MainConnector = MainConnector;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=main-connector.js.map