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
                let serverName = req.protocol + '://' + req.get('host') + "/";
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
                            fileDir.push(
                                new File(fileId, file, serverName,
                                    fileStats.birthtime.toDateString(), 
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

    public getFile = (req: Request, res: Response, next: NextFunction) => {
        let fileId = req.params.id;
        let file: File = this.FileTable[fileId];
        if (file) {
            if (file.extension === ".txt") {
                remoteServer.getRemoteFile(file).then((resp: any) => {
                    res.json(resp);
                }).catch(err => { console.error("err", err); res.json({ "err": err }) });
            } else {
                remoteServer.isAlive(file.serverName + 'dfs/is_alive').then(()=>{
                    res.redirect(file.url);
                }).catch((err) => {
                    console.log("getting from replica");
                    remoteServer.isAlive(config.replica_map[file.serverName] + 'dfs/is_alive').then(()=>{
                        res.redirect(file.replicaUrl);
                    }).catch((err) => {
                        res.json({ "err": "file not available!" })
                    
                    });
                });
                
            }

        } else {
            res.json({ "status": "file table not ready" })
        }
    };

    public downloadTextFile = (req: Request, res: Response, next: NextFunction) => {
        let fileName = req.params.file;
        let filePath = config.dir + '/' + fileName;
        
        fs.readFile(filePath, (err, data: Buffer) => {
            if (err) {
                res.send("error in reading file");
            }
            res.json({"content": data.toString()});
        });
    };

    public downloadFile = (req: Request, res: Response, next: NextFunction) => {
        let fileName = req.params.file;
        let filePath = config.dir + '/' + fileName;
        res.download(filePath);
    };

    public createLocalFile = (req: Request, res: Response, next: NextFunction) => {
        let fileName = req.body.filename;
        let filePath = config.dir + "/" + req.body.filename;
        fs.writeFile(filePath, "", (err) => {
            if (err) {
                res.status(500).json({"error": err})
                return;
            }
            let fileStats = fs.statSync(filePath);
            let file;
            if (fileStats) {
                let fileId = fileName + "" + fileStats.birthtimeMs;
                let serverName = req.protocol + '://' + req.get('host') + "/";
                file =
                    new File(fileId, fileName, serverName,
                        fileStats.birthtime.toDateString(), 
                        fileStats.mtime.toDateString(), fileStats.size.toString());
            }

            res.json({"result": "ok", "file": file});
        })
    };

    public createFile = (req: Request, res: Response, next: NextFunction) => {
        remoteServer.testCreateFile(req.body, (file: File) => {
            if (file) {
                this.FileTable[file.fileId] = file;
                res.json({"file": file});
            } else {
                res.json("failed to create file!");
            }
        })
    };

    public isAlive(req: Request, res: Response, next: NextFunction) {
        res.json({"alive": true});
    }
}

export default new FileSystem()