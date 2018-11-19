import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import { File } from '../model/File';
import config from '../config';
import remoteServer from './RemoteServer'

class FileSystem {
    public listFiles = (req: Request, res: Response, next: NextFunction) => {
        try {
            this.readLocalDir((localFileDir: File[], err?: any) => {
                if (config.isMaster) {
                    remoteServer.getFromRemote('dfs/list/').then((allData: any[]) => {
                        allData.forEach((data => {
                            localFileDir = localFileDir.concat(data.files);
                        }));
                        res.json({"files": localFileDir });
                    }).catch(err => {console.error("err", err); next();});
                } else {
                    res.json({"files": localFileDir });
                }
            })
            
        } catch (err) {
            console.error(err);
            next();
        }
    }

    public createFile = (req: Request, res: Response, next: NextFunction) => {    
        fs.writeFile(config.dir + "/" + req.body.filename, "", (err) => {
            if (err) {
                res.status(500).json({"error": err})
                return;
            } 
            res.json({"result": "ok"});
        })
    };

    private readLocalDir(callback: (localFileDir: File[], err?: any) => void) {
        let dirPath = config.dir + '/'; 
            let fileDir: File[] = [];
            fs.readdir(dirPath, (err: any, files: string[]) => {
                if (err) {
                    // res.status(500).json({"error": err});
                    console.log("error:", err);
                    callback(fileDir, err);
                }
                
                if (files) {
                    for (let file of files) {
                        let fileStats = fs.statSync(dirPath + file);
                        if (fileStats) {
                            fileDir.push(new File(file, fileStats.birthtime.toDateString(), fileStats.mtime.toDateString(), fileStats.size.toString()));
                        } else {
                            fileDir.push(new File(file));
                        }
                    }
                    callback(fileDir);
                    // res.json({"files": fileDir });
                } else {
                    callback(fileDir);
                    // res.json({"error": "some unknown error occurs" });
                }
                
            });
    }
    public isAlive(req: Request, res: Response, next: NextFunction) {
        res.json({"alive": true});
    }
}

export default new FileSystem()