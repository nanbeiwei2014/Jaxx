/**
 * Created by Vlad on 2017-02-06.
 */
module jaxx{

    export class BalancesTest{
        balanceDOGE:string = 'https://api.jaxx.io/api/doge/balance/';

       addressesDOGE:string[] = [
           'DMfaZexazS2EYMUkiVc8Z9rZzzGAXsRftr','DSHYpqsqeaMNt9AhBStyr4fAM5nC3wQzPM',
           'DCADFU45h1e9zD8VfEDeoJq51HL6GBe77M','D8ckcauXtUQ5QipHhYGAr9hSbrmBvqimTz',
           'DFRwLyHYxhjvWupZ9VWT9Sq5vzQQAWutKy','DFM8vRLThaYYkTpEKHnKm6cSiBNmsb5k8h',
           'DAi2CuWJUiybpFNRwLHQjrwBXgvPjW6b9t','D7zogMqPVjayJ2hYuqoeKkhanV7ZDSZMby'
       ];

       balanceLTC:string = 'https://api.jaxx.io/api/ltc/balance/';
       addressesLTC:string[] = [
           'LawCEUanTDwkBQXEeGSSCkTvXnhQchVK3i','Lc6H28uZRAwvFvxC47nQ4pbmkoHQer6KVd','LVABXQ49xT3rhnfuEu5DCjtjAJodZmQuHy','LRiSNUDnaaWSrs9ZNhM34d2xrjHGT5TfwC',
           'LVrAZVwFdoVBeo4pt7wZG4McBVhnrpQhro','LhLD1i5ECViJhvKt7Ui3GyAnCLSBbCTpCe','LNon4MYhFY8ngyvt4iN44vKUxrhajZ2Psc','LduCKWkEKnCDVFBJ6B68km5kVBM9Hb9B62',
           'LLfqGrPyZaXjTKyxTpHa7zpn2ksaNUnfo9','LeCXZUGgwkzxVP4eLLjbFCMvfpcrgXbRyP','Lhdws2K2ZVuw6ebM5Bw3ow71AiY6ELHn84','LVoJmQZe8hTDbPwHgSRiyGgyDp7a6ERqpV',
           'LaN4CHQDvTHW2Bhtdq5oxwgbozSMoHy82Y','LXfeXXzEHJJpEZTqZZNNKt8zSgi8MTzAon','LMjz4LtZy1RNobGwcmxXtjfcuhGmr9z7BC','LKsmeTV6hXbc9Js9m2KWTbKPLt39o3HQQK',
           'LXkVydKw945DZsxLA6ruFrYg68QhqQQmKo','LdaJzK6LZMhhQ63kBJjJEiH5BDS7UHSihx','LRFNnyxZPM9xfMLe52qZRjbEXPea5ERnVe','LNSTDvcoxc8mKLyd23hUGPke4WZCE6dMZC',
           'LRhKSNHFTAssuwKvr9GMfRo4B35DJi7dZb','Lafi8rwpaPE5Qrm1bBwkj6EMA6fM6WRtRA','LYdnDGe5CWBoWTfzc2bHAJ34o1krJ79KXH','LT42VY7xy3kJj6J47rzhsavMgUhaqWNLa3',
           'LaqULyZp59chrmTiCEP6dLL42qnyvagJt2','LiNi6hc57gvc2zbvr97T4wDSaVhAVXSCiF','LfVoX9SMu1gnV1o2XroLSrdZ4jzPorQKvK','LPKbG7fi987oFNbzJwtN9vRpUhQYnELjQy',
           'LVehGigzYPrdpMzZmbBdRKe1NssQxErceD','LYHqLUhSwmxsWeFBwrxMLA2KpZgEwBqsme','LLCv6dxxCrrbe7QGU6Tgawxi9VXqXMo7nT','LcQQ57UPPJC5sLTLNsLUPQ4gbWdg9ijsVH',
           'LLmYgu8CQfXA6t5LDVnAF6cq3tzwABdzkR','LStz53PHhfj4PLytc1YgRNZ9tsTKZTHZMb','LdojRUokVhHhYHPv2TbuqRomYgKMJnmXuA','Ld6sRNcH43x8Xiy65o55wwKeoS465cjfQ9',
           'LiWyXRLHDzaFr9zZDjjaehJdkA7bEC4fVL','LM8EQGrpU5ALrjsYG2q7ehJetFCC4YQi7e','LbgwWiWh98BPGUotz8VQ5i1PioaaWbQqgr','LUDj73b1qVSCJ9q5dhVBymSsAC3Gd3YgVH',
           'LMrREA9D5qvefyK5ez3dyWThKHkH6CMT69','LL5jNFFAtULe3MfUarWMMo8ez3oz3tDEqh','LLZp8nQ9ZtRMyEQ1NUVEiNeo9Nzi2janhH','LRHzg3ZhLKU8ePGZEjuqoEP58AwQsDhcU9',
           'Lgmu7L9AnYvZZ3P5xfzyxHgeeAMmHuuVbw','LhnN4N7UeB1UqfwYC5oJ6t5UQLCTs82csc','LWYR8btsdScaCj4XUocDQjFAtQNYC46RDp','LWfnceb4SGMj98kuLi1KicNSRKvHU1e8KJ',
           'LLg5irpYMmXBzfmRWZqd85WzKCDzLZV2Fv','LaBAdJeMjZ2iGozxBFPShDD3SqjibjMi1t','LVH8RXbTLBp4151kYyHNL98JdcVxYPtrxy','LdrULBwm4pAdHkwRpzekoapyo3JBv5RvrF',
           'LSN733UXM1EbMJ2p4mS9kmKNCJQCJM4vVP','LcLXxkNyqdV3kMp6uhEF2YKpjb7KHBoXm4','Li72Pkjjrx6iXJhdHhjSYn9JLSkDcDn4AX','LegvFSFC2ktDkSXxFB4X5f6TMD7KSjoKHk',
           'LeYDfgF9N1vF8EzGoHxfDjEUkKwLzM8RiE','LQ4o75SWPFT2r3E8yLs9b7oNJLi3emtYgV','LhbHUW4Rf8aKikMXWHTmzy5qV4YHt6Yo5g','Lg7haoMFfA5LybPsgMboxk2Z93Qs9bgN2s',
           'LhRxvp4JyoGyU7rKQXDUQbZU7jV11AWgV8','LMiwxkAJPfwWEJ7pT7ni3Q8kdCfqej5tTi','LVGxiuWYadmDZtxPazMvzWMBDojkyQa7Sq','LgkhydGTuVTwxKdaZUJWvY3peGJHBFY6js',
           'LU67J5851CEprkkD127MXXHbmTRDBcR27w','LLFEqGJFfoCf7xKeXgB5A2S6kX6jTzQriK','LgPdQw5kwZfEr3PFm8UjdaFWEn8XA112sz','LYmbuziLbdk5X7P4Tz6hELRp9L46JWwBrs',
           'Lfjjngw4hTrbtUvb32RDzha8e4FrMbUp71'
       ]
        constructor(){

            setInterval(()=>this.downloadBalances(),2000);

        }


        logBalances(res):void{

            for(let str in res){
                let item = res[str];
                let confirmed = item.confirmed;

                let prev = this.previous[str].confirmed;

                if(prev.amount !== confirmed.amount){

                    console.log(str + ' prev: ' + prev.amount);
                    console.log(str + ' now: ' + confirmed.amount);
                }

               // let unconfirmed = item.unconfirmed;
                //console.log(str + ' unconfirmed '  + Number(unconfirmed.amount));
            }
        }
        currentbalance = -1;
        previous:any;

        downloadBalances():void{
            let url = this.balanceLTC + this.addressesLTC;
            console.log(url);
            $.getJSON(url).done(res=>{

                let amount:number = 0;
                for(let str in res){
                   let item = res[str];
                   let confirmed = item.confirmed;
                   amount += +confirmed.amount
                   let unconfirmed = item.unconfirmed;
                   amount+= +unconfirmed.amount;
                }
                if(this.currentbalance ===-1){
                    this.currentbalance = amount;
                    return;
                }
                if(this.currentbalance !==amount){
                    console.error(' balances not equal old: '+ this.currentbalance + '  new: ' + amount);

                    if(this.previous)this.logBalances(res);
                    this.currentbalance = amount;

                }
                this.previous = res;
                console.log(res);
                console.log(this.currentbalance);
            })
        }

    }

}

$(document).ready(function () {
    var test= new jaxx.BalancesTest();

})