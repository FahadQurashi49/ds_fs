# Distribute File System
## Steps to run
1. install node js
2. run in root folder:
```
npm install
```
3. to run master:
```
npm run master
```
4. to run slave servers, run on each server respectively:
```
npm run server1
npm run server2
npm run server1_replica
npm run server2_replica
```
5. you should request to only master derver on port 3000 
6. server end points:
    a. http://<servername>:<port>/dfs/list - list all files
    b. http://<servername>:<port>/dfs/getFile/:id - get a file from server
    c. http://<servername>:<port>/dfs/createFile - create file on server (post data)
    d. http://<servername>:<port>/dfs/saveFile/:id - 
    save file on server (post data)