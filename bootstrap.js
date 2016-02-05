const {classes: Cc, interfaces: Ci, manager: Cm, utils: Cu} = Components;

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

function loadIntoWindow(win) {
  // 1. get a pointer to the popup
  const oldPopup = win.document.getElementById('PopupAutoCompleteRichResult')

  // 2. create our popup
  const ns = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
  const popup = win.document.createElementNS(ns, 'panel');
  popup.setAttribute('type', 'autocomplete');
  popup.setAttribute('id', 'HboxyPopupAutoCompleteRichResult');
  popup.setAttribute('noautofocus', 'true');

  // 3. replace the old popup with our popup
  oldPopup.parentElement.replaceChild(popup, oldPopup);

  // 4. tell the urlbar about our popup
  const urlbar = win.gURLBar;
  urlbar.setAttribute('autocompletepopup', 'HboxyPopupAutoCompleteRichResult');

  // 5. pop the *urlbar* in and out of the XUL DOM to connect our popup
  urlbar.parentNode.insertBefore(urlbar, urlbar.nextSibling);
}

function unloadFromWindow(win) {
  // URGENT TODO :-)
}

function onWindowLoaded(evt) {
  const win = evt.target.ownerGlobal;
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
  const enumerator = Services.wm.getEnumerator('navigator:browser');
  while (enumerator.hasMoreElements()) {
    const win = enumerator.getNext();
    try {
      loadIntoWindow(win);
    } catch (ex) {
      console.error('loadIntoWindow failed: ', ex);
    }
  }

  Services.ww.registerNotification(onWindowNotification);
}

function shutdown(data, reason) {
  // clean up on uninstall or deactivation, but not for normal shutdown
  if (reason == APP_SHUTDOWN) {
    return;
  }

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

