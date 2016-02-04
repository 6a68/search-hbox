const {classes: Cc, interfaces: Ci, manager: Cm, utils: Cu} = Components;

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

// actual order of execution:
// 1. startup loops over existing windows, calls loadIntoWindow on each
// 2. when new windows open, onWindowNotification calls onWindowLoaded calls loadIntoWindow

function loadIntoWindow(win) {
  // what do we do here?
  // XBL has already attached.
  // 0. namespace our stuff under some global on window
  if (typeof win.wut === 'undefined') {
    win.wut = {};
  }
  /* all these steps should actually be handled by XBL for us, magically
    // 1. get a pointer to the popup
    let popup = win.document.getElementById('PopupAutoCompleteRichResult')
    win.wut.popup = popup;
    // 2. get a pointer to the anonymous content inside it
    let results = win.document.getAnonymousElementByAttribute(popup, 'anonid', 'richlistbox');
    // 3. create the hbox
    const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
    var boxy = win.document.createElementNS(XUL_NS, "hbox");
    boxy.setAttribute("description", "we all, us three, will ride");
    // 4. insert it between anonymous nodes?
    results.insertBefore(boxy, results); // note, we insert it below the other hbox in real life
  */

  // it seems like XBL isn't getting applied.
  // let's try pulling the node out of the DOM, then reinserting,
  // to force the binding to be applied.
  let popup = win.document.getElementById('PopupAutoCompleteRichResult')
  popup.parentElement.replaceChild(popup, popup);
  
  
  // 2. listen to the urlbar for keys
  // 3. when key events occur, fire an xhr at the rec server.
  // 4. cancel the xhr if another key event is fired (singleton)
  // 5. when the xhr returns, render it into the XUL object.
  // 6. on keydown, we should probably empty out the recommendation.
  // 7. if no recommendation comes back, hide the node?
}

function unloadFromWindow(win) {}

function onWindowLoaded(evt) {
  let win = evt.target.ownerGlobal;
  win.removeEventListener('load', onWindowLoaded, false);
  if (win.location.href === 'chrome://browser/content/browser.xul') {
    loadIntoWindow(win);
  }
}

function onWindowNotification(win, topic) {
  if (topic != 'domwindowopened') {
    return;
  }
  win.addEventListener('load', onWindowLoaded, false);
}

function startup(data, reason) {
  // iterate over all windows, load code into each
  let enumerator = Services.wm.getEnumerator('navigator:browser');
  while (enumerator.hasMoreElements()) {
    let win = enumerator.getNext();
    try {
      loadIntoWindow(win);
    } catch (ex) {
      console.error('loadIntoWindow failed: ', ex);
    }
  }
  // register with window watcher
  Services.ww.registerNotification(onWindowNotification);

  // attach window listener to attach to new windows.
}
function shutdown(data, reason) {
  // clean up on uninstall or deactivation, but not for normal shutdown
  if (reason == APP_SHUTDOWN) {
    return;
  }

  // detach from windows
  // unload code
  const enumerator = Services.wm.getEnumerator('navigator:browser');
  while (enumerator.hasMoreElements()) {
    const win = enumerator.getNext();
    try {
      unloadFromWindow(win);
    } catch (ex) {
      console.log('unload from window failed: ', ex);
    }
  } 
  Services.ww.unregisterNotification(onWindowNotification);

}
function install(data, reason) {}
function uninstall(data, reason) {}

