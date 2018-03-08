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
        beforeUnload
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
    }

    getKey(key) {
        return `${this.prefix}${key}${this.suffix}`;
    }

    compress(res) {
        if (res.length > 100) {
            res = res.slice(res.length - 100);
        }
        return res;
    }

    async setItem(key, value) {
        let t = Date.now();
        let res = await this.store.getItem(key);
        if (!res) {
            res = [];
        }
        res = this.compress(res);
        res.push({
            cts: t,
            uts: t,
            content: value
        });
        return this.store.setItem(this.getKey(key), res);
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
