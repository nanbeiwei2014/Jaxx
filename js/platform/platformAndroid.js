if (window.JaxxAndroid) {
    window.native = {};
    if (JaxxAndroid.scanCode) {
        window.native.scanCode = function(processScanData){
            JaxxAndroid.scanCode();
            window.native_gotScan = function (data) {
                processScanData(data);
            }
        };
    }
    if (JaxxAndroid.getWindowWidth) {
        window.native.getWindowWidth = function() {
            return JaxxAndroid.getWindowWidth();
        }
    }
    if (JaxxAndroid.getWindowHeight) {
        window.native.getWindowHeight = function() {
            return JaxxAndroid.getWindowHeight();
        }
    }  

    if (JaxxAndroid.getSoftNavbarHeight) {
        window.native.getAndroidSoftNavbarHeight = function() {
            return JaxxAndroid.getSoftNavbarHeight();
        }
    }  

    if (JaxxAndroid.openExternalURL) {
        window.native.openExternalURL = function(url){
            JaxxAndroid.openExternalURL(url);
        };
    }

    if (JaxxAndroid.copyToClipboard) {
        window.native.copyToClipboard = function(textToCopy) {
            JaxxAndroid.copyToClipboard(textToCopy);
        }
    }
    
    if (JaxxAndroid.hideSplashScreen) {
        window.native.hideSplashScreen = function() {
            JaxxAndroid.hideSplashScreen(true);
        }
    }

    if (JaxxAndroid.setMainMenuOpenStatus) {
        window.native.setMainMenuOpenStatus = function(isMainMenuOpenStatus) {
            JaxxAndroid.setMainMenuOpenStatus(isMainMenuOpenStatus);
        }

        window.native_setMainMenuOpen = function(statusString) {
            if (statusString === 'false') {
                Navigation.setMainMenuOpen(false);
            } else if (statusString === 'true') {
                Navigation.setMainMenuOpen(true);
            }
        }
    }
	
	if (JaxxAndroid.setIsModalOpenStatus) { // True if this function is defined.
		window.native.setIsModalOpenStatus = function(isModalOpenStatus){ // Responds to calls in the webapp.
			JaxxAndroid.setIsModalOpenStatus(isModalOpenStatus);
		}
		window.native_closeModal = function(){ // Responds to calls from the Android front end.
			Navigation.closeModal();
		}
		
	}
	
	if (JaxxAndroid.createLogMessage) { // Sends messages to the Android Studio Console.
		window.native.createLogMessage = function(pStrMessage){
			JaxxAndroid.createLogMessage(pStrMessage);
		}
	}
	
	if (JaxxAndroid.setSettingsStackStatusSize || JaxxAndroid.createLogMessage) {
		JaxxAndroid.createLogMessage("getSettingsStackStatusSize method has been initialized by the Android App.");
		// @TODO: Re-implement this logic when the program needs access to the stackSettingsContent
		//		window.native_setSettingsStackStatus = function(){
		//			window.native.setSettingsStackStatus();
		//		}
		//		
		//		window.native.setSettingsStackStatus = function(){
		//			// Functionality: Push settingsStackStatus to Android App.
		//			// Note: One client for this function is getSettingsStackStatus in the Android App.	
		//			JaxxAndroid.setSettingsStackStatus(Navigation.getSettingsStack().join(',')); // Change Navigation settingsStack to String.
		//		}
		window.native_popSettings = function(){
			//if (Navigation.getSettingsStack().length > 0) {
			JaxxAndroid.createLogMessage("In window.native_popSettings, the settings stack in the web app is " + Navigation.getSettingsStack().join(','));
			Navigation.popSettings();
			JaxxAndroid.setSettingsStackStatusSize(Navigation.getSettingsStack().length);
			//}
		}
		
		window.native.setSettingsStackStatusSize = function(pSize) {
			JaxxAndroid.setSettingsStackStatusSize(pSize);
		}
	}
	
//    console.log("setup profile");
    
    window.native.setProfileMode = function(newProfileMode) {
        Navigation.setProfileMode(newProfileMode);
    }

	if (JaxxAndroid.setTabName || JaxxAndroid.createLogMessage) {
		JaxxAndroid.createLogMessage("setTabName method has been initialized by the Android App.");
		window.native.setTabName = function(pStrTabName){ // Sets the tab name in the Android file.
			if (!pStrTabName) {
				pStrTabName = "";
			}
			JaxxAndroid.setTabName(pStrTabName);
			JaxxAndroid.createLogMessage("Setting tab name in Android App to " + pStrTabName);
		}
		window.native_pullTabName = function(){ // Called from Android file
			window.native.setTabName(Navigation.getTab());
		}
		window.native_collapseTabs = function(){ // Called from Android file to respond to back button
			Navigation.collapseTabs();
		}
	}
    
    window.native_runBackButtonBusinessLogicInJavascript = function(){
        //@Add in modal closing functionality
        console.log("Running back button business logic.")
        var strTopOfSettingsStack = Navigation.getTopOfSettingsStack();
        if (strTopOfSettingsStack === null){
            console.log("The settings stack is empty.")
            if (g_JaxxApp.getUI().isMainMenuOpen()) {
                console.log("Closing the main menu.")
                g_JaxxApp.getUI().closeMainMenu();
            } else {
                if (JaxxAndroid.exitApplication && JaxxAndroid.createLogMessage) {
                    console.log("Exiting Application Location BBB.");
                    JaxxAndroid.exitApplication();
                }
            }
        } else {
            console.log("The top of the settings stack is " + strTopOfSettingsStack);
            if (g_JaxxApp.getSettings().isBackButtonDisabledOnPage(strTopOfSettingsStack)) {
                
            } else if (g_JaxxApp.getSettings().isBackButtonExitApplication(strTopOfSettingsStack)) {
                if (JaxxAndroid.exitApplication && JaxxAndroid.createLogMessage) {
                    console.log("Exiting Application Location AAA.");
                    JaxxAndroid.exitApplication();
                }               
            } else {
                console.log("Popping Settings.");
                Navigation.popSettings();
            }
        }
    }
//    console.log("setup :: " + window.native.setProfileMode);

}

$(function() {
    var userAgent = parseGETparam('userAgent');
    storeData('userAgent',userAgent);
});

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