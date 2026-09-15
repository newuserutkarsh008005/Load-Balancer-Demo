import express from "express";
import axios from "axios";
import { rateLimiter, mp } from "./rateLimiter.js";

const app = express();

app.use(express.json());

const PORT = 3000;
const BASE_URL_API = "/req/user/check";
const api = `${BASE_URL_API}/`;

let curreq = 0;
let shutdown = false;
let healthCheckTimer;
let sersel=0
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

                await axios.get(server.healthCheck, {
                    timeout: 2000
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

    // Don't start another health check after shutdown
    if (shutdown) {
        return;
    }

    await checkStatus(servers);

    console.log("Current servers:", servers);

    healthCheckTimer = setTimeout(
        runEvery20Seconds,
        25_000
    );
}

let currentIndex = 0;

function getServer(servers) {

    let checked = 0;

    while (checked < servers.length) {

        const server = servers[currentIndex];

        currentIndex =
            (currentIndex + 1) % servers.length;

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
app.all("/req/user/check/*path", async (req, res) => {

    // Reject new requests when shutdown has started
    if (shutdown) {

        return res.status(503).json({
            message: "LB is Closing"
        });

    }

    const ip = req.ip;

    // Rate limiting
    if (!rateLimiter(ip)) {

        return res.status(429).json({
            message: "Too Many Req Try Again"
        });

    }

    console.log(mp);

    curreq++;
    let server;


    try {

         server = getServer(servers);

        if (!server) {

            return res.status(503).json({
                message: "No Possible Server"
            });

        }
        console.log(server)
        const meth = req.method;
        const path = server.url + req.path;
        const query = req.query;
        const body = req.body;

        console.log(path);

        const response = await axios({
            method: meth,
            url: path,
            params: query,
            data: body
        });

        console.log(req.method);
        console.log(req.body);
        console.log(req.query);
        console.log(req.path);

        return res.status(response.status).json({
            message: "Server Selected",
            ServerId: server.id,
            server_message: response.data
        });

    } 
   catch (e) {

    if (server && (e.code === "ECONNREFUSED" ||
                   e.code === "ECONNABORTED" ||
                   e.code === "ETIMEDOUT" ||
                   !e.response)) {

        server.healthy = false;
    }

    return res.status(502).json({
        message: "Bad Gateway",
        ServerId: server?.id ?? null
    });

}
    finally {

        // Always remove request from active count
        curreq--;
console.log(`Request finished. Active requests: ${curreq}`);
    }
});
function wait(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}
async function gracefulShutdown() {

    if (shutdown) {
        return;
    }

    console.log("Shutdown signal received");

    shutdown = true;

    console.log("LB is now draining...");

    clearTimeout(healthCheckTimer);

    // Stop accepting new connections immediately
    server.close();

    console.log(`Active requests: ${curreq}`);

    const curTime = Date.now();

    while (curreq > 0) {

        if (Date.now() - curTime >= 10_000) {
            console.log("Grace period expired");
            break;
        }

        await wait(100);
    }

    if (curreq > 0) {
        console.log("Force closing remaining connections...");
        server.closeAllConnections();
    }

    console.log(`Remaining active requests: ${curreq}`);

    process.exit(0);
}
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

const server = app.listen(PORT, () => {

    console.log(
        `Server is Running on Port ${PORT} at http://localhost:${PORT}${api}`
    );

});