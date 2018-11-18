import { Router, Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import { File } from '../model/File';
import config from '../config';


class DFSRouter {
    public router: Router;
    constructor() {
        this.router = Router();
        this.routes();
    }
    private listFiles(req: Request, res: Response, next: NextFunction) {
        try {
            let dirPath = config.dir + '/';
            let fileDir: File[] = [];
            fs.readdir(dirPath, (err: any, files: string[]) => {
                if (err) {
                    res.status(500).json({"error": err});
                    return;
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
                    res.json({"files": fileDir });
                } else {
                    res.json({"error": "some unknown error occurs" });
                }
                
            });
        } catch (err) {
            console.error(err);
            next();
        }
    }
    public routes() {
        this.router.get("/", this.listFiles);
    }
}

const dfsRouter = new DFSRouter();
dfsRouter.routes();

export default dfsRouter.router;