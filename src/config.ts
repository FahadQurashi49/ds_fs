import { FileServer } from "./model/FileServer";

class Config {
    public fileServers: FileServer[] = [
        new FileServer("server1", "http://192.168.150.128:3000/", "http://localhost:8081/"),
        new FileServer("server2", "http://localhost:5000/", "http://localhost:5002/"),
    ]
    public replica_map = {
        "http://192.168.150.128:3000/": "http://localhost:8081/",
        "http://localhost:5000/": "http://localhost:5002/"
    };
    public dir = './fs';
    public replica_dir = './replication';
    public isMaster = process.env.MASTER || false;
    public serverName = process.env.NAME || "server";
}

const config = new Config();
export default config;
