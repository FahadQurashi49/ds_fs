import * as path from 'path';

export class File {
    public extension: string;
    public url: string;
    constructor(public fileId: string, public name, public serverName, public dateCreated?: string, 
        public dateModified?: string, public size?: string) {            
            this.size = this.formatBytes(size);
            this.extension = path.extname(name);
            this.url = serverName + this.extension === ".txt"? "/dfs/downloadText/": "/dfs/download/" + name;
    }
    private formatBytes(bytes, decimals?) {
        if(bytes == 0) return '0 Bytes';
        var k = 1024,
            dm = decimals <= 0 ? 0 : decimals || 2,
            sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
     }

}