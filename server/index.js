// index.js
const express = require('express');
const app = express();
const zookeeper = require('node-zookeeper-client');
const CreateMode = require("node-zookeeper-client/lib/CreateMode");
const {NODE_EXISTS} = require("node-zookeeper-client/lib/Exception");

const ZOO_MY_ID = 'ZOO_MY_ID';
const zkId = process.env[ZOO_MY_ID];
const ZK_WORKERS = [
    'zoo1:2181',
    'zoo2:2181',
    'zoo3:2181',
];

let client = zookeeper.createClient(ZK_WORKERS.join());

function createZnode(client, path) {
    client.create(path, undefined, CreateMode.EPHEMERAL_SEQUENTIAL, function (error) {
        if (error) {
            console.log('Failed to create node: %s due to: %s.', path, error);
        } else {
            console.log('Node: %s is successfully created.', path);
        }
    });
}

function listChildren(client, path) {
    client.getChildren(
        path,
        function (event) {
            console.log('Got watcher event: %s', event);
            listChildren(client, path);
        },
        function (error, children, stat) {
            if (error) {
                console.log('Failed to list children of %s due to: %s.', path, error);
                return;
            }
            console.log('Children of %s are: %j.', path, children);
        }
    );
}
client.once('connected', async function () {
    console.log('Connected to ZooKeeper.');

    client.create('/election',undefined, CreateMode.PERSISTENT, (error) => {
        if (!error) {
            console.log('Parent Node "election" is successfully created.');
        }
        if (error && error.getCode() !== NODE_EXISTS) {
            console.log('Failed to create election parent node due to: %s.', error);
            return;
        }
        listChildren(client, '/election')
        createZnode(client, `/election/worker`);
    });

});

// Wait until all Zookeeper instances are up,
// since docker-compose spins everything up concurrently by default
setTimeout(() => {
    client.connect();
}, 10000)

app.post('/terminate', (req, res) => {
    client.close();
    res.status(200).send(`Terminated instance ${zkId}`).end();
})

app.get('/list', (req, res) => {
    client.getChildren(`/election`, null, (err, children, stats) => {
        res.send(`${zkId}: ${children}`)
    });
})

app.listen(5000, () => console.log('Application Server is up'));