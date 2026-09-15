const URL = 'http://localhost:3000/req/user/check/user/det';

async function sendRequests(totalRequests) {
    let allowed = 0;
    let rejected = 0;

    const requests = [];

    for (let i = 0; i < totalRequests; i++) {
        requests.push(
            fetch(URL)
                .then(res => {
                    if (res.status === 429) {
                        rejected++;
                    } else {
                        allowed++;
                    }
                })
                .catch(err => {
                    console.log("Request error:", err.message);
                })
        );
    }

    await Promise.all(requests);

    console.log(`Total Requests : ${totalRequests}`);
    console.log(`Allowed        : ${allowed}`);
    console.log(`Rejected       : ${rejected}`);
}

async function testRefill() {

    console.log("========== BURST TEST ==========");

    // Empty the initial 100-token bucket
    await sendRequests(120);

    console.log("\nBucket should now be almost empty.");

    console.log("\nWaiting 10 seconds for refill...");

    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log("\n========== REFILL TEST ==========");

    // 10 sec × 3 tokens/sec = ~30 tokens
    await sendRequests(40);
}

testRefill();