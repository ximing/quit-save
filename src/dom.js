/**
 * Created by ximing on 3/8/18.
 */
'use strict';
export function addEvent(element, event, callback) {
    if (window.addEventListener) {
        element.addEventListener(event, callback, false);
    } else {
        element.attachEvent('on' + event, callback);
    }
}
export function removeEvent(element, event, callback) {
    if (window.removeEventListener) {
        element.removeEventListener(event, callback, false);
    } else {
        element.detachEvent('on' + event, callback);
    }
}
