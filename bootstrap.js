const {classes: Cc, interfaces: Ci, manager: Cm, utils: Cu} = Components;

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const XUL_NS = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';

function loadIntoWindow(win) {
  // load the CSS into the document. not using the stylesheet service.
  const stylesheet = win.document.createElementNS('http://www.w3.org/1999/xhtml', 'h:link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = 'chrome://hboxy-root/content/skin/binding.css';
  stylesheet.type = 'text/css';
  stylesheet.style.display = 'none';
  win.document.documentElement.appendChild(stylesheet);


  // 1. get a pointer to the popup
  const oldPopup = win.document.getElementById('PopupAutoCompleteRichResult')

  // 2. create our popup
  const popup = win.document.createElementNS(XUL_NS, 'panel');
  popup.setAttribute('type', 'autocomplete-richlistbox');
  popup.setAttribute('id', 'HboxyPopupAutoCompleteRichResult');
  popup.setAttribute('noautofocus', 'true');

  // 3. replace the old popup with our popup
  oldPopup.parentElement.replaceChild(popup, oldPopup);

  // 4. tell the urlbar about our popup
  const urlbar = win.gURLBar;
  urlbar.setAttribute('autocompletepopup', 'HboxyPopupAutoCompleteRichResult');

  // 5. pop the *urlbar* in and out of the XUL DOM to connect our popup
  urlbar.parentNode.insertBefore(urlbar, urlbar.nextSibling);

  // let's try inserting an item into the search results after a timeout.
  urlbar.popup.addEventListener('popupshown', () => {
    console.log('popupshown timer started, result arriving in 150 msec');
    win.setTimeout(() => {
      // messing with anonymous content is so weirdly painful
      const box = win.document.getAnonymousElementByAttribute(urlbar.popup, 'anonid', 'richlistbox');

      // create an item
      const item = win.document.createElementNS(XUL_NS, 'richlistitem');
      item.setAttribute('image', 'chrome://mozapps/skin/places/defaultFavicon.png');
      item.setAttribute('url', 'https://mozilla.com/');
      item.setAttribute('title', 'This looks better, but doesn\'t work properly');
      item.setAttribute('type', 'favicon'); // the style is a guess
      item.setAttribute('text', 'mozilla.com');
      item.className = 'autocomplete-richlistitem';

      // shove it in there
      box.insertBefore(item, box.firstChild);
      // TODO: remove the last item from the list, to retain the overall list length

      // adjust focus to focus on the item we just inserted
      // this is just for the demo, we'd need to be more careful in real life,
      // because the user could already be keying through the results. in that
      // case, the focus would be > 0, and I guess we'd just do nothing.
      urlbar.popup.selectedIndex = 0;

      console.log('just inserted a new result into the box');
    }, 150);
  });
  
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

