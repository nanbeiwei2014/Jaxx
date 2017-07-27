/**
 * Created by Vlad on 10/11/2016.
 */
///<reference path="../com/models.ts"/>
///<reference path="../com/Utils2.ts"/>
///<reference path="./datastore_controller.ts"/>
///<reference path="./balance.ts"/>
var jaxx;
(function (jaxx) {
    var Application = (function () {
        function Application() {
            // this.sendAmmountController = new SendAmmountController($('.tabContent.cssTabContent').first());
            this.init();
        }
        Application.prototype.init = function () {
        };
        Application.prototype.setSendButtonState = function (state) {
            switch (state) {
                case 'active':
                    $('.tabContent .amount .button').addClass('cssEnabled').addClass('enabled');
                case 'disabled':
                    $('.tabContent .amount .button').removeClass('cssEnabled').removeClass('enabled');
            }
        };
        Application.prototype.isValidInput = function (value, coinType) {
            // console.log(value, coinType);
            switch (coinType) {
                case COIN_ETHEREUM_CLASSIC:
                case COIN_ETHEREUM:
                case COIN_AUGUR_ETHEREUM:
                // case COIN_TESTNET_ROOTSTOCK:
                case COIN_ICONOMI_ETHEREUM:
                case COIN_GOLEM_ETHEREUM:
                case COIN_GNOSIS_ETHEREUM:
                case COIN_SINGULARDTV_ETHEREUM:
                case COIN_DIGIX_ETHEREUM:
                case COIN_BLOCKCHAINCAPITAL_ETHEREUM:
                case COIN_CIVIC_ETHEREUM:
                    if (value > 999.99999999) {
                        jaxx.Registry.application$.triggerHandler(jaxx.Registry.AMOUNT_TOO_BIG_ETHEREUM);
                        return false;
                    }
            }
            return true;
        };
        return Application;
    }());
    jaxx.Application = Application;
    $(document).ready(function () {
        var app = new Application();
        jaxx.Registry.application = app;
    });
})(jaxx || (jaxx = {}));
//# sourceMappingURL=Application.js.map