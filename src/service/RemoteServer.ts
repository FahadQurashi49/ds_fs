import axios from 'axios';
import * as Promise from 'promise';
import config from '../config';
import { resolve } from 'path';
import { rejects } from 'assert';


class RemoteServer {
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
                res.forEach((r: any) => {
                    if (r && r.data) {
                        allData.push(r.data);
                    }
                });
                resolve(allData);
            }).catch(err => reject(err));
        });
    }

    private getPromiseArray(url) {
        return config.servers.map(server =>
            axios.get(server + url).catch(err => { /* ignore */ }));
    }
}

export default new RemoteServer();