/**
 * Created by yeanzhi on 17/4/12.
 */
"use strict";
import localforage from "localforage";
import { addEvent, removeEvent } from "./dom";

export default class QS {
    constructor({
        tableName,
        storeName,
        prefix = "",
        suffix = "",
        driver = localforage.INDEXEDDB,
        beforeUnload,
        maxLength = 500
    } = {}) {
        this.store = localforage.createInstance({
            name: tableName,
            driver: driver,
            version: 1.0,
            storeName: storeName
        });
        this.prefix = prefix;
        this.suffix = suffix;
        this.beforeUnloadFn = beforeUnload;
        this.maxLength = maxLength;
    }

    getKey(key) {
        return `${this.prefix}${key}${this.suffix}`;
    }

    compress(res) {
        if (res.length > this.maxLength) {
            res = res.slice(res.length - this.maxLength);
        }
        return res;
    }

    static nearest(arr) {
        if (!arr || !Array.isArray(arr) || arr.length > 0) {
            return null;
        }
        return arr[arr.length - 1];
    }

    async setItem(key, value) {
        let t = Date.now();
        let res = await this.store.getItem(key);
        if (!res) {
            res = [];
        }
        res = this.compress(res);
        let nearestItem = QS.nearest(res);
        let item = {
            cts: t,
            uts: t,
            content: value
        };
        if (JSON.stringify(nearestItem) !== JSON.stringify(item)) {
            res.push(item);
            await this.store.setItem(this.getKey(key), res);
        }
        return item;
    }

    getItem(key) {
        return this.store.getItem(this.getKey(key));
    }

    removeItem(key) {
        return this.store.removeItem(this.getKey(key));
    }

    clear() {
        return this.store.clear();
    }

    keys() {
        return this.store.keys();
    }

    beforeUnload = () => {
        if (this.beforeUnloadFn) {
            let { data, key } = this.beforeUnloadFn();
            window.localStorage.setItem(
                this.getKey(key),
                JSON.stringify({
                    data,
                    qsCache: true
                })
            );
        }
    };

    unListen() {
        removeEvent(window, "beforeunload", this.beforeUnload);
    }

    listen() {
        addEvent(window, "beforeunload", this.beforeUnload);
    }

    gc() {
        let keys = window.localStorage.keys() || [];
        keys.forEach(async key => {
            let data = window.localStorage.getItem(key);
            try {
                data = JSON.parse(data);
                if (data && data.qsCache) {
                    await this.setItem(key, data.data);
                }
            } catch (err) {
                console.log(err);
            }
        });
    }
}
