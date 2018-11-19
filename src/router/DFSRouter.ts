import { Router, Request, Response, NextFunction } from 'express';
import * as fs from 'fs';

import { File } from '../model/File';
import config from '../config';
import fileSystem from '../service/FileSystem';


class DFSRouter {
    public router: Router;
    constructor() {
        this.router = Router();
        this.routes();
    }
    public routes() {
        this.router.get("/list", fileSystem.listFiles);
        this.router.get("/is_alive", fileSystem.isAlive);
        this.router.post("/create", fileSystem.createFile);
    }
}

const dfsRouter = new DFSRouter();
dfsRouter.routes();

export default dfsRouter.router;