import axios, { AxiosResponse } from 'axios';
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
    private fileSeversStack: FileServer[];
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
            this.failServers = [];
            let promiseArray = this.getPromiseArray(url);
            axios.all(promiseArray).then((res: any[]) => {
                let allData: any[] = [];
                if (res && res.length > 0) {
                    res.forEach((r: any, i) => {
                        if (r && r.data) {
                            allData.push(r.data);
                        } else {
                            // this.failServers.push(config.fileServers[i]);
                        }
                    });
                    this.checkFailServers(url, allData, resolve, reject);
                }
            }).catch(err => reject(err));
        });
    }

    private checkFailServers(url: string, allData: File[], resolve, reject) {
        if (this.failServers.length > 0) {
            console.log("failserver: ", this.failServers);
            axios.all(this.getFailServerPromiseArray(url)).then((res: any[]) => {
                res.forEach((r: any) => {
                    if (r && r.data) {
                        allData.push(r.data);
                    }
                });
                resolve(allData);
            }).catch(err => reject(err));
        } else {
            console.log("not calling fail server!");
            resolve(allData);
        }
    }

    private getPromiseArray(url) {

        return config.fileServers.map((fileServer: FileServer) => {
            return axios.get(fileServer.address + url).catch(err => { this.failServers.push(fileServer) })
        })
    }
    private getFailServerPromiseArray(url) {

        return this.failServers.map((fileServer: FileServer) => {
            return axios.get(fileServer.replica_address + url).catch(err => { console.error("error on: ", fileServer.serverName) })
        })
    }

    public getRemoteFile(file: File) {
        return new Promise((resolve, reject) => {
            axios.get(file.url).then((res: AxiosResponse<any>) => {
                if (res && res.data) {
                    resolve(res.data);
                } else {
                    reject("error in getting file");
                }

            }).catch((err) => {
                axios.get(file.replicaUrl).then((res: AxiosResponse<any>) => {
                    if (res && res.data) {
                        resolve(res.data);
                    } else {
                        reject("error in getting file");
                    }

                }).catch(err => reject("file not available"));
            });
        });
    }

    public isAlive(url) {
        return new Promise((resolve, reject) => {
            axios.get(url).then((res: AxiosResponse<any>) => {
                if (res && res.data) {
                    if (res.data.alive) {
                        resolve();
                    } else {
                        reject()
                    }

                } else {
                    reject();
                }
            }).catch(err => reject())
        });
    }

    /* public createRemoteFile(reqBody: any) {
        for (let i = 0; i < config.fileServers.length; i++){
            let fileServer = config.fileServers[i];
            axios.post(fileServer.address, reqBody).then((res: AxiosResponse<any>) => {
                if (res && res.data) {
                    if (res.data.result === "ok") {
                        
                    } else {
                        
                    }
                    
                }
            });
        }
        
    } */

    public testCreateFile(reqBody: any, callBack: (file?: File) => void) {
        let fileServer = this.fileSeversStack.pop();
        let url = "dfs/createLocalFile"
        if (fileServer) {
            axios.post(fileServer.address + url, reqBody).then((res: AxiosResponse<any>) => {
                if (res && res.data) {
                    if (res.data.result === "ok") {
                        let file: File = res.data.file;
                        axios.post(fileServer.replica_address + url, reqBody).then((res: AxiosResponse<any>) => {
                            callBack(file);
                        }).catch(e => callBack(file));
                    } else {
                        this.testCreateFile(reqBody, callBack);
                    }
                }
            }).catch(err => this.testCreateFile(reqBody, callBack));
        } else {
            callBack();
        }
    }

    public initFileServerStack() {
        this.fileSeversStack = [];
        config.fileServers.forEach((fileServer) => {
            this.fileSeversStack.push(fileServer);
        });
        this.fileSeversStack.reverse();
    }
}

export default new RemoteServer();