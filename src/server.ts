import * as path from 'path';
import * as express from 'express';
import * as logger from 'morgan';
import * as bodyParser from 'body-parser';

import dfsRouter from './router/DFSRouter';

class Server {
    // ref to Express instance
  public express: express.Application;

    constructor() {
        this.express = express();
        this.config();
        this.routes();
    }

    private config(): void {
        // express middleware
        this.express.use(logger('dev'));
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({ extended: false }));
    }

    private routes(): void {
        this.express.use('/dfs', dfsRouter);
        this.express.use((err, req, res, next) => {
            res.json(err);
        });
    }
}

export default new Server().express;