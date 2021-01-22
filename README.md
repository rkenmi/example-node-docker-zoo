# Load Balancer Example 
### Nginx with 3 Application Servers and 3 Zookeeper Instances

## How to use
1. `docker-compose up`
2. Observe the output of all containers
3. Note that watchers are set for `/election` path and each zNode it finds will trigger a watcher notification

## List Zookeeper health
1. Open http://localhost/list or `curl http://localhost:80/list`

## Terminate an instance
1. `curl -X POST http://localhost/terminate` will send a request to one of the application servers
2. Nginx will round robin and select one of the application servers available (3 initially)
3. The application server that receives the request will close the Zookeeper client, terminating the ephemeral zNode that is placed under `/election`
4. Verify via container output that all of the other Zookeeper instances have gotten the notification. 
 - It might look something like: `Got watcher event: NODE_CHILDREN_CHANGED[4]@/election`
5. You should now see that the number of zNode children under `/election` is fewer than before
