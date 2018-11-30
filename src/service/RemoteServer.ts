import axios from 'axios';
import * as Promise from 'promise';
import config from '../config';
import * as fs from 'fs';
import { resolve } from 'path';
import { rejects } from 'assert';
import { FileServer } from '../model/FileServer';
import FileSystem from './FileSystem';
import { File } from '../model/File';
import { RSA_NO_PADDING } from 'constants';


class RemoteServer {
    private failServers: FileServer[];
    public isAnyAlive() {
        return new Promise((resolve, reject) => {
            let isAlive = false;
            let promiseArray = this.getPromiseArray('dfs/is_alive');

            axios.all(promiseArray).then((res: any[]) => {
                res.forEach((r: any) => {
                    if (r && r.data && r.data.alive) {
                        console.log("one server is alive");
                        isAlive = true;
                    }
                })
                resolve(isAlive);
            }).catch(err => reject(err));
        });
    }
    public getFromRemote(url: string) {
        return new Promise((resolve, reject) => {
            let promiseArray = this.getPromiseArray(url);
            axios.all(promiseArray).then((res: any[]) => {
                let allData: File[] = [];
                if (res && res.length > 0) {
                    res.forEach((r: any, i) => {
                        if (r && r.data) {
                            allData.push(r.data);
                        } else {
                            this.failServers.push(config.fileServers[i]);
                        }
                    });
                    this.checkFailServers(url, allData, resolve, reject);
                }
            }).catch(err => reject(err));
        });
    }

    private checkFailServers(url: string, allData: File[], resolve, reject) {
        if (this.failServers.length > 0) {
            axios.all(this.getFailServerPromiseArray(url)).then((res: any[]) => {
                res.forEach((r: any) => {
                    if (r && r.data) {
                        allData.push(r.data);
                    }
                });
                resolve(allData);
            }).catch(err => reject(err));
        } else {
            resolve(allData);
        }
    }

    private getPromiseArray(url) {
        this.failServers = [];

        return config.fileServers.map((fileServer: FileServer) => {
            axios.get(fileServer.address + url).catch(err => { })
        })
    }
    private getFailServerPromiseArray(url) {
        this.failServers = [];

        return this.failServers.map((fileServer: FileServer) => {
            axios.get(fileServer.replica_address + url).catch(err => { })
        })
    }
}

export default new RemoteServer();