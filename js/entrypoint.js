$( document ).ready(function() {
 	var action = parseGETparam('action');
 	var getRequestOK = false;
	//console.log('Entrypoint ready!')

 	var action,address,amount;
 	if(action!='-1'){
 		//console.log('action required :'+action)

 		if(action=='send'){
 			//console.log('Requested send... Checking address');
 			 address = parseGETparam('address');
		 	if(address!='-1'){
		 		if(validateAddress(address)){
 					//console.log('Address valid:'+address);
 					getRequestOK = true;
 					//console.log('Checking balance, if declared...');
 					amount = parseGETparam('amount');
					 	if(amount!='-1'){
					 		amount = amount.replace(",", ".");
					 		if(validateAmount(amount)){
					 			//console.log('Amount valid:'+amount);
					 		}
					 		else{
					 			getRequestOK = false;
					 			//console.log('Amount non valid:'+amount);
					 		}
						}
						else{
		 					//console.log('Amount non declared.');
						}
		 		}
		 		else{
		 			//console.log('Address non valid:'+address);
		 		}
		 	}
		 	else{
 				//console.log('Missing address.');
		 	}	
 		}
 		else{
 			//console.log('Action unknown. Only \'send\' allowed');
 		}
 	}
 	else{
 		//console.log('No actions required. Proceed as usual');
 		getRequestOK = false;
 	}

 	//Update the view
 	//console.log('getRequestOK:'+getRequestOK);
 	if(getRequestOK){
 		showSend(address,amount); 	
 	}

});



function showSend(address,amount)
{

    Navigation.showTab('send');
    if (amount!=-1) {
    	$('.tabContent .amount input').val(amount).trigger('keyup');
	}
 	$('.tabContent .address input').val(address).trigger('keyup');

 	//give it the time to read fiat value
	setTimeout(function(){     	
		$('.tabContent .amount input').trigger('keyup'); }, 
	2500);

}

function parseGETparam(val) {
    var result = "-1",
        tmp = [];
    location.search
    //.replace ( "?", "" ) 
    // this is better, there might be a question mark inside
    .substr(1)
        .split("&")
        .forEach(function (item) {
        tmp = item.split("=");
        if (tmp[0] === val) result = decodeURIComponent(tmp[1]);
    });
    return result;
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function validateAddress(address)
{
	var valid = true;
	valid = isAddress(address);
	return valid;
}


function validateAmount(amount)
{
	var valid = true;
	if(isNumeric(amount)){
		if(amount>0){
			if(decimalPlaces(amount) <=8){
				valid = true;
			}
			else{
				valid=false;
			}
		}
		else{
			valid=false;
		}
	}
	else{
		valid = false;
	}
	return valid;
}

function decimalPlaces(num) {
  var match = (''+num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
  if (!match) { return 0; }
  return Math.max(
       0,
       // Number of digits right of decimal point.
       (match[1] ? match[1].length : 0)
       // Adjust for scientific notation.
       - (match[2] ? +match[2] : 0));
}