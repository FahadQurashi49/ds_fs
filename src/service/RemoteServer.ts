import axios from 'axios';
import * as Promise from 'promise';
import config from '../config';


class RemoteServer {
    public isAnyAlive() {
        return new Promise((resolve, reject) => {
            let isAlive = false;
            let promiseArray = config.servers.map(server =>
                axios.get(server + "dfs/is_alive").catch(err => { /* ignore */ }));

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
}

export default new RemoteServer();