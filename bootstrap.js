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
  // 1. get a pointer to the popup
  const oldPopup = win.document.getElementById('PopupAutoCompleteRichResult')

  // 2. create our popup
  let popup;
  const ns = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
  popup = win.document.createElementNS(ns, 'panel');
  popup.setAttribute('type', 'autocomplete-richlistbox');
  popup.setAttribute('id', 'PopupAutoCompleteRichResult');
  popup.setAttribute('noautofocus', 'true');
  // we'll probably want a pointer to this later
  win.wut.popup = popup;

  // 3. replace the old popup with our popup
  oldPopup.parentElement.replaceChild(popup, oldPopup);

  // oh, and you need to tell the urlbar about our popup:
  const urlbar = win.gURLBar;
  urlbar.setAttribute('autocompletepopup', 'PopupAutoCompleteRichResult');
  // and then you have to pop the *urlbar* in and out of the DOM for the change
  // to be picked up correctly
  urlbar.parentNode.insertBefore(urlbar, urlbar.nextSibling);
  
  
  // 2. listen to the urlbar for keys
  // 3. when key events occur, fire an xhr at the rec server.
  // 4. cancel the xhr if another key event is fired (singleton)
  // 5. when the xhr returns, render it into the XUL object.
  // 6. on keydown, we should probably empty out the recommendation.
  // 7. if no recommendation comes back, hide the node?
}

function unloadFromWindow(win) {
  // URGENT TODO :-)
}

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

