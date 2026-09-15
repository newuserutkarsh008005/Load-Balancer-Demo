# Load Balancer Demo

A lightweight **Node.js HTTP Load Balancer** built from scratch to understand the core concepts behind backend traffic distribution, health checking, rate limiting, failure detection, and graceful shutdown.

The project currently supports:

* Health-aware Round Robin load balancing
* Proactive backend health checks
* Reactive backend failure detection
* Token Bucket rate limiting
* Graceful shutdown with request draining
* Multiple backend servers for testing

---

## Architecture

```text
                         Client
                           |
                           v
                 +-------------------+
                 |   Load Balancer   |
                 |    Port: 3000     |
                 +---------+---------+
                           |
              +------------+------------+
              |            |            |
              v            v            v
       +-----------+ +-----------+ +-----------+ +-----------+
       | Server 1  | | Server 2  | | Server 3  | | Server 4  |
       |   :4001   | |   :4002   | |   :4003   | |   :4004   |
       +-----------+ +-----------+ +-----------+ +-----------+
```

### Request Flow

```text
Client Request
      |
      v
Rate Limiter
      |
      | Allowed
      v
Find Healthy Backend
      |
      v
Health-aware Round Robin
      |
      v
Proxy Request
      |
      v
Backend Server
      |
      v
Response
      |
      v
Client
```

---

# Features

## 1. Health-Aware Round Robin

The load balancer distributes requests using a Round Robin strategy.

Example:

```text
Server 1
   ↓
Server 2
   ↓
Server 3
   ↓
Server 4
   ↓
Server 1
   ↓
...
```

However, only **healthy servers** participate in request routing.

If Server 2 becomes unhealthy:

```text
Server 1 → Server 3 → Server 4 → Server 1 → ...
```

Server 2 is temporarily removed from the rotation.

---

## 2. Backend Health Checking

The load balancer periodically checks the health of all backend servers.

Health checks are performed concurrently using `Promise.all()`.

```text
                Load Balancer
                     |
          +----------+----------+
          |          |          |
          v          v          v
         S1         S2         S3       S4
          |          |          |        |
          +----------+----------+--------+
                     |
               Health Status
```

Each backend maintains information such as:

```text
healthy
consecutiveFailures
consecutiveSuccesses
lastCheckTime
responseTime
```

### Failure Threshold

A backend is marked unhealthy after:

```text
3 consecutive health-check failures
```

Once unhealthy, the server is excluded from load balancing.

---

## 3. Reactive Proxy Failure Detection

Health checks are proactive, but a backend can fail between two health checks.

The load balancer therefore also reacts to failures observed while proxying real requests.

```text
Client
   |
   v
Load Balancer
   |
   v
Backend
   |
   X
Request Failure
   |
   v
Backend marked unhealthy
```

The next request will skip that backend.

The periodic health checker can later detect that the backend has recovered and return it to the rotation.

This provides two layers of failure detection:

```text
Proactive:
Periodic Health Check

Reactive:
Real Request / Proxy Failure
```

---

# 4. Token Bucket Rate Limiting

The load balancer implements a **Token Bucket** rate limiter.

Each client IP receives its own bucket.

### Configuration

| Parameter       |        Value |
| --------------- | -----------: |
| Bucket Capacity |   200 tokens |
| Initial Tokens  |          100 |
| Refill Rate     | 3 tokens/sec |
| Request Cost    |      1 token |

### Example

Initially:

```text
100 tokens
```

If 120 requests arrive immediately:

```text
100 requests → Allowed
 20 requests → Rejected
```

Rejected requests receive:

```text
HTTP 429 Too Many Requests
```

After 10 seconds:

```text
10 × 3 = 30 new tokens
```

Therefore, approximately 30 additional requests can be served.

### Rate Limiter Flow

```text
Request
   |
   v
Identify Client IP
   |
   v
Token Bucket
   |
   +------ Token Available ------> Forward Request
   |
   +------ No Token -------------> HTTP 429
```

The rate limiter uses **lazy token refill**, meaning tokens are recalculated when a request arrives instead of using a timer for every bucket.

---

# 5. Graceful Shutdown

The load balancer supports graceful shutdown through:

```text
SIGINT
SIGTERM
```

For example:

```bash
Ctrl + C
```

When shutdown begins:

```text
Shutdown Signal
      |
      v
Stop Accepting New Connections
      |
      v
Drain Active Requests
      |
      v
Wait up to 10 seconds
      |
      +---- Requests Finished ----> Exit
      |
      +---- Still Running --------> Force Close
                                      |
                                      v
                                     Exit
```

This prevents the load balancer from immediately terminating requests that are already being processed.

A hard timeout prevents the process from waiting indefinitely for a stuck request.

---

# Project Structure

```text
Load-Balancer-Demo/
│
├── src/
│   ├── load_balancer.js
│   ├── rateLimiter.js
│   ├── test.js
│   │
│   └── server/
│       ├── server1.js
│       ├── server2.js
│       ├── server3.js
│       └── server4.js
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── basicLoadBalancer.excalidraw
```

---

# Technologies

* Node.js
* Express
* Axios
* dotenv
* JavaScript
* HTTP
* Token Bucket algorithm

---

# Installation

Clone the repository:

```bash
git clone https://github.com/newuserutkarsh008005/Load-Balancer-Demo.git
```

Move into the project:

```bash
cd Load-Balancer-Demo
```

Install dependencies:

```bash
npm install
```

---

# Configuration

Create a `.env` file based on `.env.example`.

Example:

```env
PORT_LOAD=3000

PORT_S1=4001
PORT_S2=4002
PORT_S3=4003
PORT_S4=4004

BASE_URL_API=/req/user/check
```

The `.env` file should not be committed to the repository.

---

# Running the Project

Start the backend servers.

For example:

```bash
node src/server/server1.js
node src/server/server2.js
node src/server/server3.js
node src/server/server4.js
```

Then start the load balancer:

```bash
npm start
```

For development:

```bash
npm run dev
```

The load balancer runs on:

```text
http://localhost:3000
```

---

# API

## Load Balancer Health

```http
GET /req/user/check/health
```

Example:

```bash
curl http://localhost:3000/req/user/check/health
```

---

## Proxied Requests

Requests under:

```text
/req/user/check/*
```

are forwarded to a healthy backend server.

Example:

```bash
curl http://localhost:3000/req/user/check/user/det
```

The load balancer selects a healthy backend and forwards the request.

---

# Testing

The project includes a request-based test for the token bucket rate limiter.

Run:

```bash
npm test
```

Example result:

```text
========== BURST TEST ==========
Total Requests : 120
Allowed        : 100
Rejected       : 20

Bucket should now be almost empty.

Waiting 10 seconds for refill...

========== REFILL TEST ==========
Total Requests : 40
Allowed        : 30
Rejected       : 10
```

This demonstrates:

```text
120 requests
    |
    +---- 100 allowed
    |
    +---- 20 rejected


After 10 seconds

40 requests
    |
    +---- 30 allowed
    |
    +---- 10 rejected
```

The behavior matches the configured refill rate:

```text
3 tokens/sec × 10 sec = 30 tokens
```

---

# Failure Testing

The project can also be tested by stopping individual backend servers.

For example, if Server 2 is stopped:

```text
Server 1 → Healthy
Server 2 → Unhealthy
Server 3 → Healthy
Server 4 → Healthy
```

The load balancer skips Server 2.

```text
S1 → S3 → S4 → S1 → S3 → S4
```

After Server 2 is restarted and passes health checks:

```text
S1 → S2 → S3 → S4 → ...
```

Server 2 re-enters the rotation.

---

# Graceful Shutdown Testing

A slow backend endpoint can be used to test request draining.

Start a long-running request and then send:

```text
Ctrl + C
```

The load balancer:

1. Stops accepting new connections.
2. Allows active requests to finish.
3. Waits for the configured grace period.
4. Force closes remaining connections if necessary.
5. Terminates the process.

---

# Design Decisions

## Why Round Robin?

Round Robin is simple and predictable.

It is useful for demonstrating the basic concept of distributing requests across multiple backend servers.

The implementation is also health-aware, so unavailable servers are excluded.

---

## Why Token Bucket?

Token Bucket allows controlled bursts while maintaining a long-term request rate.

It provides:

* Burst capacity
* Configurable refill rate
* Per-client limiting
* Constant-time request evaluation

---

## Why Health Checks?

A load balancer should avoid sending traffic to unavailable servers.

Periodic health checks provide a proactive way to detect backend failures and recover servers when they become healthy again.

---

## Why Reactive Failure Detection?

A backend may fail between periodic health checks.

Reactive detection allows the load balancer to respond immediately when an actual proxied request encounters a backend connectivity failure.

---

## Why Graceful Shutdown?

Immediately terminating a load balancer can interrupt active requests.

Graceful shutdown allows currently processing requests to finish before the process exits, while still providing a maximum shutdown deadline.

---

# Current Scope

This project intentionally focuses on the core concepts of a load balancer.

### Included

* [x] HTTP request forwarding
* [x] Round Robin load balancing
* [x] Health-aware server selection
* [x] Periodic health checks
* [x] Reactive proxy failure detection
* [x] Token Bucket rate limiting
* [x] Graceful shutdown
* [x] Multiple backend servers
* [x] Failure and load testing

### Not Included

This is intentionally not a production-grade distributed load balancer.

The project does not currently implement:

* Distributed rate limiting
* Redis-based state
* Service discovery
* Kubernetes integration
* Connection pooling
* Automatic retries
* Circuit breakers
* Persistent state
* Distributed coordination

These are outside the current scope of the project.

---

# Future Improvements

Possible future improvements include:

* Metrics and observability
* Configuration-driven backend discovery
* More comprehensive automated tests
* Distributed rate limiting
* Containerized deployment
* More sophisticated health-check policies

These are intentionally kept outside the current V1 implementation.

---

# Learning Goals

This project was built to understand the internal mechanics of a load balancer rather than relying entirely on an existing load-balancing solution.

The main concepts explored are:

```text
Request Routing
      ↓
Load Distribution
      ↓
Health Detection
      ↓
Failure Handling
      ↓
Rate Limiting
      ↓
Graceful Shutdown
```

---

# License

This project is intended primarily as a learning and portfolio project.
