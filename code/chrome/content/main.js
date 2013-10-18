
// Make a namespace.
if (typeof Trackman == 'undefined') {
  var Trackman = {};
}

/**
 * UI controller that is loaded into the main player window
 */
Trackman.Controller = {

  /**
   * Called when the window finishes loading
   */
  onLoad: function() {

    // initialization code
    this._initialized = true;
    this._strings = document.getElementById("trackman-strings");
    
    // Perform extra actions the first time the extension is run
    if (Application.prefs.get("extensions.trackman.firstrun").value) {
      Application.prefs.setValue("extensions.trackman.firstrun", false);
      this._firstRunSetup();
    }


    

  },
  

  /**
   * Called when the window is about to close
   */
  onUnLoad: function() {
    this._initialized = false;
  },
  

  
  /**
   * Perform extra setup the first time the extension is run
   */
  _firstRunSetup : function() {
  
    // Call this.doHelloWorld() after a 3 second timeout
    setTimeout(function(controller) { controller.doHelloWorld(); }, 3000, this); 
  
  },
  
  

  
};

window.addEventListener("load", function(e) { Trackman.Controller.onLoad(e); }, false);
window.addEventListener("unload", function(e) { Trackman.Controller.onUnLoad(e); }, false);
