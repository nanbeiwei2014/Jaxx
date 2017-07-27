/**
 * Created by Daniel on 2017-02-03.
 */
function test_getSumOfUTXOsForAllCoins(){
    var results = [];
    for (var coinType = 0; coinType < COIN_NUMCOINTYPES; coinType++) {
        // use test_getSumOfUTXOs(coinType) here
    }
    return results;
}

function test_getSumOfUTXOs(coinType){
    var utxos = wallet.getPouchFold(coinType).getDataStorageController().getUTXOs();
    var sum = 0;
    for (var i = 0; i < utxos.length; i++) {
        sum += utxos[i].amount;
    }
    return {
      "utxo sum": sum,
      "spendable from utxos": sum - wallet.getPouchFold(coinType).getCurrentMiningFee(),
      "spendable balance": wallet.getPouchFold(coinType).getSpendableBalance()
    };
}