/**
 * Created by Daniel on 2017-03-02.
 */

var JaxxInitializer = function() {

}

JaxxInitializer.prototype.initialize = function(){

}

JaxxInitializer.prototype.startJaxx = function(){
    g_JaxxApp.getUI().showApplicationLoadingScreen(); // splash
    g_JaxxApp.getUI().fetchAndStoreCoinBulletinData();
    this.startJaxxWithReleaseNotesPage();
}

JaxxInitializer.prototype.startJaxxWithReleaseNotesPage = function() {
    // Consider
    g_JaxxApp.getUI().getReleaseBulletin(function() {
        //g_JaxxApp.getUI().hideApplicationLoadingScreen(); // splash
        g_JaxxApp.getUI().displayJaxxReleaseBulletinIfUnseen();
    });
    
    // 
    setTimeout(function(){
        g_JaxxApp.getUI().startJaxxIfNoReleaseNotesAreShown();
    }, 2000);
}

JaxxInitializer.prototype.startJaxxWithTermsOfServicePage = function() {
    // This is run when the user clicks 'Continue' on release notes.
    g_JaxxApp.getUser().setupWithWallet(null);
    g_JaxxApp.getUI().setStartJaxxWithTermsOfServicePageWasRun(true);
    if (getStoredData('hasShownTermsOfService')){
        initializeJaxx(function() { // Initialize Jaxx is certain to get called at least one before the main wallet screen.
            g_JaxxApp.getUI().hideApplicationLoadingScreen(); // splash
        });
    } else {
        g_JaxxApp.getUI().hideApplicationLoadingScreen(); // splash
        g_JaxxApp.getUI().getIntro().startJaxxFromTermsOfServicePage();
    }
}