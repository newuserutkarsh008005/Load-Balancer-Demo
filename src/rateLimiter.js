const mp = new Map();

const BUCKET_CAPACITY = 200;
const INITIAL_TOKENS = 100;
const REFILL_RATE = 3; 
const COST_PER_REQUEST = 1;

function checkStatus(ip, mp) {
    return mp.has(ip);
}

function checkIpStatus(ip, mp) {
    const obj = mp.get(ip);

    const currentTime = Date.now();

    const elapsedSeconds =
        (currentTime - obj.lastRefill) / 1000;

    let newTokens =
        obj.token + (elapsedSeconds * REFILL_RATE);

    if (newTokens > BUCKET_CAPACITY) {
        newTokens = BUCKET_CAPACITY;
    }

    obj.lastRefill = currentTime;

    if (newTokens >= COST_PER_REQUEST) {

        obj.token = newTokens - COST_PER_REQUEST;

        return true;
    }

    obj.token = newTokens;

    return false;
}
function mapPrint(ip){
    console.log(mp.has(ip))
}
function rateLimiter(ip) {
    
    if (!checkStatus(ip, mp)) {

        mp.set(ip, {
            token: INITIAL_TOKENS - COST_PER_REQUEST,
            lastRefill: Date.now()
        });

        return true;
    }
    mapPrint(ip);
    return checkIpStatus(ip, mp);


}export  {rateLimiter,mp};

