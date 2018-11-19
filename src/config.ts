class Config {
    public servers = [
        "http://192.168.150.128:3000/"
    ];
    public dir = './fs';
    public isMaster = false;
}

const config = new Config();
export default config;
