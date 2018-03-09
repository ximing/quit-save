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
        maxLength = 500,
        gc = true
    } = {}) {
        this.store = localforage.createInstance({
            name: tableName,
            driver: driver,
            storeName: storeName
        });
        this.store
            .ready()
            .then(() => {
                console.log(localforage.driver());
                if (gc) {
                    this.gc();
                }
            })
            .catch(function(e) {
                console.error(e);
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
        if (!arr || !Array.isArray(arr) || arr.length <= 0) {
            return null;
        }
        return arr[arr.length - 1];
    }

    setItem = async (key, value) => {
        let t = Date.now();
        let res = await this.getItem(key);
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
        if (
            !nearestItem ||
            (nearestItem && JSON.stringify(nearestItem.content) !== JSON.stringify(item.content))
        ) {
            res.push(item);
            await this.store.setItem(this.getKey(key), res);
        }
        return item;
    };

    getItem = async key => {
        try {
            let item = await this.store.getItem(this.getKey(key));
            return item;
        } catch (err) {
            console.error(err);
            return null;
        }
    };

    removeItem = async key => {
        await this.store.removeItem(this.getKey(key));
    };

    clear = async () => {
        await this.store.clear();
    };

    keys = async () => {
        await this.store.keys();
    };

    beforeUnload = () => {
        if (this.beforeUnloadFn) {
            let saveData = this.beforeUnloadFn();
            if (saveData) {
                let { data, key } = saveData;
                window.localStorage.setItem(
                    key,
                    JSON.stringify({
                        data,
                        qsCache: true
                    })
                );
            }
        }
    };

    unListen() {
        removeEvent(window, "beforeunload", this.beforeUnload);
    }

    listen() {
        addEvent(window, "beforeunload", this.beforeUnload);
    }

    async gc() {
        if (window.localStorage) {
            for (let i = 0, len = localStorage.length; i < len; ++i) {
                let key = localStorage.key(i);
                let value = localStorage.getItem(key);
                try {
                    value = JSON.parse(value);
                    if (value && value.qsCache) {
                        await this.setItem(key, value.data);
                        localStorage.removeItem(key);
                    }
                } catch (err) {
                    console.error(err);
                }
            }
        }
    }
}
