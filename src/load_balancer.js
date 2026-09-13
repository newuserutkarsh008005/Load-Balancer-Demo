import express from "express";
import axios from "axios";

const app = express();
app.use(express.json())
const PORT = 3000;
const BASE_URL_API = "/req/user/check";
const api = `${BASE_URL_API}/`;

const servers = [
    {
        id: 1,
        url: "http://localhost:4001/s1",
        healthCheck: "http://localhost:4001/s1/req/user/check/health",
        healthy: false,
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        lastCheckTime: null,
        responseTime: null
    },
    {
        id: 2,
        url: "http://localhost:4002/s2",
        healthCheck: "http://localhost:4002/s2/req/user/check/health",
        healthy: false,
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        lastCheckTime: null,
        responseTime: null
    },
    {
        id: 3,
        url: "http://localhost:4003/s3",
        healthCheck: "http://localhost:4003/s3/req/user/check/health",
        healthy: false,
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        lastCheckTime: null,
        responseTime: null
    },
    {
        id: 4,
        url: "http://localhost:4004/s4",
        healthCheck: "http://localhost:4004/s4/req/user/check/health",
        healthy: false,
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        lastCheckTime: null,
        responseTime: null
    }
];

async function checkStatus(servers) {
    await Promise.all(
        servers.map(async (server) => {
            const start = Date.now();

            try {
                await axios.get(server.healthCheck,{
                    timeout:2000
                });

                const end = Date.now();

                server.consecutiveSuccesses += 1;
                server.consecutiveFailures = 0;
                server.healthy = true;
                server.lastCheckTime = end;
                server.responseTime = end - start;

                console.log(
                    `Server ${server.id} ✅ ${server.responseTime}ms`
                );

            } catch (error) {
                const end = Date.now();

                server.consecutiveFailures += 1;
                server.consecutiveSuccesses = 0;
                server.lastCheckTime = end;
                server.responseTime = end - start;

                if (server.consecutiveFailures >= 3) {
                    server.healthy = false;
                }

                console.log(
                    `Server ${server.id} ❌ ${server.responseTime}ms`
                );
            }
        })
    );
}

async function runEvery20Seconds() {
    await checkStatus(servers);

    console.log("Current servers:", servers);

    setTimeout(runEvery20Seconds, 5_000);
}

let currentIndex = 0;

function getServer(servers) {
    let checked = 0;

    while (checked < servers.length) {
        const server = servers[currentIndex];

        currentIndex = (currentIndex + 1) % servers.length;
        checked++;

        if (server.healthy) {
            return server;
        }
    }

    return null;
}

runEvery20Seconds();

app.get(`${api}`, (req, res) => {
    res.status(200).json({
        message: "Load Balancer"
    });
});

app.get(`${api}health`, (req, res) => {
    return res.status(200).json({
        message: "Healthy Load Balancer"
    });
});
app.all('/req/user/check/*path',async(req,res)=>{
    const server=getServer(servers);

    if(!server){
        return res.status(503).json({
            "message":"No Possible Server"
        })
    
    }
    const meth=req.method;
    const path=server.url+req.path
    const query=req.query;
    const body=req.body
    console.log(path)
    const response=await axios({
        method:meth,
        url:path,
        params:query,
        data:body
    })
    console.log(req.method);
console.log(req.body);
console.log(req.query);
console.log(req.path)
    
    return res.status(response.status).json({
        "message":"Server Selected",
        "ServerId":server.id,
        "server_message":response.data
    })
})
app.listen(PORT, () => {
    console.log(
        `Server is Running on Port ${PORT} at http://localhost:${PORT}${api}`
    );
});
