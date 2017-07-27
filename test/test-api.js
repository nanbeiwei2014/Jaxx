/**
 * Created by Vlad on 2017-03-03.
 */
///<reference path="../typings/jquery/jquery.d.ts"/>
///<reference path="../typings/lodash/lodash.d.ts"/>
var api;
(function (api) {
    var Transaction = (function () {
        function Transaction(obj) {
            for (var str in obj)
                this[str] = obj[str];
        }
        return Transaction;
    }());
    var TestTransactions = (function () {
        function TestTransactions(addressesStr) {
            this.addresses = [];
            this.urlAPI = 'http://52.40.138.237:2052/insight-api-dash/';
            this.urlTransactions = 'transactions/{{addresses}}';
            this.addresses = addressesStr.split(',');
            this.urlTransactions = this.urlAPI + this.urlTransactions;
        }
        TestTransactions.prototype.downloadTransactions = function (callBack) {
            var url = this.urlTransactions.replace('{{addresses}}', this.addresses.toString());
            $.getJSON(url).done(function (res) {
                var data = res.data;
                var out = data.map(function (item) {
                    return new Transaction(item);
                });
                console.log(out);
            }).fail(function (err) { return console.error(err); });
        };
        return TestTransactions;
    }());
    api.TestTransactions = TestTransactions;
})(api || (api = {}));
//# sourceMappingURL=test-api.js.map