import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import { File } from '../model/File';
import config from '../config';
import remoteServer from './RemoteServer'

class FileSystem {

    public FileTable: { [key:string]:File; } = {};
    
    public listFiles = (req: Request, res: Response, next: NextFunction) => {
        try {
            if (config.isMaster) {
                remoteServer.getFromRemote('dfs/list/').then((allData: any[]) => {
                    let allFileData: File[] = [];
                    allData.forEach((data:any) => {
                        allFileData = allFileData.concat(data.files);
                    });
                    allFileData.forEach((file:File) => this.FileTable[file.fileId] = file);
                    console.table(this.FileTable);
                    res.json({ "files": allFileData });
                }).catch(err => { console.error("err", err); next(); });
            } else {
                let serverName = req.protocol + '://' + req.get('host');
                this.readLocalDir(serverName, config.dir, (localFileDir: File[], err?: any) => {
                    res.json({ "files": localFileDir });
                })
            }
        } catch (err) {
            console.error(err);
            next();
        }
    }

    public readLocalDir(serverName: string, dirPath: string, callback: (localFileDir: File[], err?: any) => void) {
        dirPath +='/'; 
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
                            let fileId = file + "" + fileStats.birthtimeMs;
                            let fileUrl = serverName + config.dir.substring(1) + "/" + file;
                            fileDir.push(
                                new File(fileId, file, 
                                    fileUrl, fileStats.birthtime.toDateString(), 
                                    fileStats.mtime.toDateString(), fileStats.size.toString()));
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

    public createFile = (req: Request, res: Response, next: NextFunction) => {    
        fs.writeFile(config.dir + "/" + req.body.filename, "", (err) => {
            if (err) {
                res.status(500).json({"error": err})
                return;
            } 
            res.json({"result": "ok"});
        })
    };

    public isAlive(req: Request, res: Response, next: NextFunction) {
        res.json({"alive": true});
    }
}

export default new FileSystem()