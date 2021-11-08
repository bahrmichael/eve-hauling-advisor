import {api, data, params} from "@serverless/cloud";
import axios from 'axios';
import systemNames from './system-names';

api.get("/api/systems", async (req, res) => {
    const version = '20211018';
    if (req.query.version !== version) {
        res.send({systemNames, version});
    } else {
        res.send({systemNames: [], version});
    }
});

api.get("/api/mainland", async (req, res) => {
    const {systemName, systemId} = req.query as any;
    const result = systemName ? await isMainland(systemName.toLowerCase()) : await isMainlandWithId(systemId);
    res.send({isMainland: result});
});

async function isMainlandWithId(systemId: number): Promise<boolean> {
    const systemInfo = await getSystemInfo(systemId);
    if (systemInfo.securityStatus < 0.45) {
        return false;
    }
    return isMainland(systemInfo.name.toLowerCase());
}

async function isMainland(origin: string): Promise<boolean> {
    const mainlandKey = `mainland:${origin}`;
    const existing: any = await data.get(mainlandKey);
    if (existing) {
        return existing.isMainland;
    }
    try {
        await axios.get(`https://red-frog.org/api/public/v1/calculator/red/?origin=${origin}&destination=Jita`);
        await data.set(mainlandKey, {isMainland: true});
        return true;
    } catch (e) {
        const result = {
            error: mapFrogError(e),
        };
        if (result.error === 'Route must be in contiguous Highsec.' || result.error === 'System does not exist.') {
            await data.set(mainlandKey, {isMainland: false});
            return false;
        } else {
            throw e;
        }
    }
}

api.get("/api/route", async (req, res) => {
    const routeParams: RouteParameters = req.query as any;
    console.log({routeParams});

    if (!routeParams.volume || !routeParams.collateral || !routeParams.origin || !routeParams.destination) {
        res.status(400).send({
            error: 'Missing parameter.'
        });
    }

    let pf;
    if (routeParams.providers) {
        pf = routeParams.providers.split(',').map((p) => {
            switch (p) {
                case "redfrog": return getRedFrog;
                case "purplefrog": return getPurpleFrog;
                case "blackfrog": return getBlackFrog;
                case "pushx": return getPushX;
                case "ghsol": return getGhsol;
                default: return null
            }
        }).filter((x) => x);
    } else {
        pf = providerFunctions;
    }
    const providers = (await Promise.all(pf.map((provider) => provider(routeParams)))).flatMap(x => x);

    let distances;
    try {
        const distances = await data.get(`distance:${routeParams.origin}:${routeParams.destination}:*`);
        if (!distances?.items?.length) {
            await data.set(`distance_job_gates:${routeParams.origin}:${routeParams.destination}`, {
                origin: routeParams.origin,
                destination: routeParams.destination,
            });
            await data.set(`distance_job_lightyears:${routeParams.origin}:${routeParams.destination}`, {
                origin: routeParams.origin,
                destination: routeParams.destination,
            });
        }
    } catch (e) {
        console.error('Failed to resolve distances', e);
    }
    console.log({routeParams, providers});

    const response: any = {
        providers
    }
    if (distances) {
        response.distances = {
            gates: distances?.items.map((i) => i.value).find((i: any) => i.type === 'gates'),
            lightyears: distances?.items.map((i) => i.value).find((i: any) => i.type === 'lightyears'),
        }
    }

    try {
        // feeling confident enough that there won't be multiple requests per millisecond
        // even if, dropping one or two results is fine
        await data.set(`results:${new Date().getTime()}`, response);
    } catch (e) {
        console.warn('Failed to persist result', e);
    }

    res.send(response);
});

const providerFunctions = [getRedFrog, getPurpleFrog, getBlackFrog, getGhsol, getPushX];

const providerDetails = {
    push: {
        provider: 'Push Industries',
        url: 'https://www.pushx.net/'
    },
    ghsol: {
        provider: 'Galactic Hauling Solutions Inc.',
        url: 'https://forums.eveonline.com/t/service-ghsol-a-simple-flat-rate-low-sec-jf-courier-service-moving-your-cargo-for-the-last-6-years'
    },
    redFrog: {
        provider: 'Red Frog Freight',
        url: 'https://red-frog.org/'
    },
    purpleFrog: {
        provider: 'Purple Frog Transport',
        url: 'https://red-frog.org/purple_calculator'
    },
    blackFrog: {
        provider: 'Black Frog Logistics',
        url: 'https://red-frog.org/black_calculator'
    },
    haulersChannel: {
        provider: 'Haulers Channel',
        url: 'https://forums.eveonline.com/t/haulers-channel'
    },
}

type ProviderResult = RouteResult | RouteResult[] | RouteError;

interface RouteParameters {
    origin: string;
    destination: string;
    volume: number;
    collateral: number;
    providers?: string;
}

interface RouteResult {
    reward: number;
    daysToComplete: number;
    daysExpiration: number;
    provider: string;
    rushDurationHours?: number;
    cached?: boolean;
}

interface RouteError {
    provider: string;
    error: string;
    cached?: boolean;
}

function collateralString(collateral: number): string {
    if (collateral < 1_000_000) {
        return collateral + '';
    } else if (collateral < 1_000_000_000) {
        return Math.ceil(collateral / 1_000_000) + 'm';
    } else {
        return Math.ceil(collateral / 1_000_000_000) + 'b';
    }
}

function volumeString(volume: number): string {
    if (volume < 1_000) {
        return volume + '';
    } else if (volume < 1_000_000) {
        return Math.ceil(volume / 1_000) + 'k';
    } else {
        return Math.ceil(volume / 1_000_000) + 'm';
    }
}

function getRouteKey(provider: string, params: RouteParameters): string {
    return `routes:${provider}:${params.origin}:${params.destination}:${volumeString(params.volume)}:${collateralString(params.collateral)}`;
}

function returnExistingRecord(existingRecord) {
    if (existingRecord instanceof Array) {
        return existingRecord.map((r) => {
            return {
                ...r,
                cached: true,
            }
        });
    } else {
        return {
            ...existingRecord,
            cached: true,
        };
    }
}

async function getPushX(params: RouteParameters): Promise<ProviderResult> {
    if (params.volume > 1_126_500) {
        return {
            ...providerDetails.push,
            error: 'Too much volume.'
        }
    }
    if (params.collateral > 50_000_000_000) {
        return {
            ...providerDetails.push,
            error: 'Too much collateral.'
        }
    }

    const routeKey = getRouteKey('push', params);
    const existingRecord = await data.get(routeKey) as any;
    if (existingRecord) {
        return returnExistingRecord(existingRecord);
    }

    let previousRequests = (await data.get(`apirate:push:*`, {limit: 90}))?.items?.length ?? 0;
    console.log({previousRequests});
    if (previousRequests >= 90) {
        return {
            ...providerDetails.push,
            error: "API rate limit exhausted. Try again later.",
        };
    }

    try {
        const apiRateKey = `apirate:push:${Math.ceil(new Date().getTime() / 1_000)}`;
        await data.set(apiRateKey, {date: new Date().toISOString()}, {ttl: 600});

        const response = (await axios.get(`https://api.pushx.net/api/quote/json/?startSystemName=${params.origin}&endSystemName=${params.destination}&volume=${params.volume}&collateral=${params.collateral}&apiClient=hauling-advisor`)).data as any;
        let result: RouteResult[] | RouteError;
        if (response.PriceError) {
            result = {
                ...providerDetails.push,
                error: response.PriceError,
            };
        } else {
            const daysToExpiration = +response.DaysToAccept.split(' ')[0];
            const daysToComplete = +response.DaysToComplete.split(' ')[0];
            const daysToExpirationRush = +response.DaysToAccept.split(' ')[2].replace("(", "");
            const daysToCompleteRush = +response.DaysToComplete.split(' ')[2].replace("(", "");
            result = [{
                reward: response.PriceNormal,
                daysToComplete: daysToComplete,
                daysExpiration: daysToExpiration,
                ...providerDetails.push,
            }, {
                reward: response.PriceRush,
                daysToComplete: daysToCompleteRush,
                daysExpiration: daysToExpirationRush,
                rushDurationHours: 24 * daysToCompleteRush,
                ...providerDetails.push,
            }];
        }
        await data.set(routeKey, result, {ttl: Math.floor(Math.random() * HALF_DAY) + HALF_DAY});
        return result;
    } catch (e) {
        console.warn(e);
        return {
            ...providerDetails.push,
            error: "Failed to get quote for Push Industries.",
        }
    }
}

async function getGhsol(params: RouteParameters): Promise<ProviderResult> {
    if (params.volume > 360_000) {
        return {
            ...providerDetails.ghsol,
            error: 'Too much volume.'
        }
    }
    if (params.collateral > 7_000_000_000) {
        return {
            ...providerDetails.ghsol,
            error: 'Too much collateral.'
        }
    }

    const routeKey = getRouteKey('ghsol', params);
    const existingRecord: RouteResult | RouteError = await data.get(routeKey) as any;
    if (existingRecord) {
        return returnExistingRecord(existingRecord);
    }

    // todo: replace this with distance gates result
    const systemIds = ((await axios.post(`https://esi.evetech.net/latest/universe/ids/`, [params.origin, params.destination]))
        .data as any).systems.map((s) => s.id);

    const systemInfos: { name: string, securityStatus: number, systemId: number }[] = await Promise.all(systemIds.map(getSystemInfo));
    if (systemInfos.find(({securityStatus}) => securityStatus < 0)) {
        const result = {
            ...providerDetails.ghsol,
            error: 'Only highsec and lowsec allowed.'
        };
        await data.set(routeKey, result);
        return result;
    }

    const result = [];

    if (params.collateral <= 4_000_000_000) {
        result.push({
            reward: 210_000_000,
            daysToComplete: 3,
            daysExpiration: 3,
            ...providerDetails.ghsol,
        });
    }
    result.push({
        reward: 300_000_000,
        daysToComplete: 1,
        daysExpiration: 3,
        rushDurationHours: 24,
        ...providerDetails.ghsol,
    });

    await data.set(routeKey, result);

    return result;
}

async function getBlackFrog(params: RouteParameters): Promise<ProviderResult> {
    if (params.volume > 320_000) {
        return {
            ...providerDetails.blackFrog,
            error: 'Too much volume.'
        }
    }
    if (params.collateral > 25_000_000_000) {
        return {
            ...providerDetails.blackFrog,
            error: 'Too much collateral.'
        }
    }

    const routeKey = getRouteKey('blackfrog', params);
    const existingRecord: RouteResult | RouteError = await data.get(routeKey) as any;
    if (existingRecord) {
        return returnExistingRecord(existingRecord);
    }

    try {
        const response = (await axios.get(`https://red-frog.org/api/public/v1/calculator/black/?origin=${params.origin}&destination=${params.destination}&collateral=${params.collateral}`)).data as any;
        const result: RouteResult = {
            reward: response.reward_base,
            daysToComplete: response.days_to_complete,
            daysExpiration: response.days_expiration,
            ...providerDetails.blackFrog,
        };
        await data.set(routeKey, result, {ttl: Math.floor(Math.random() * 7 * DAY) + DAY});
        return result;
    } catch (e) {
        return {
            ...providerDetails.blackFrog,
            error: mapFrogError(e),
        }
    }
}

const DAY = 24 * 60 * 60;
const HALF_DAY = 12 * 60 * 60;

async function getRedFrog(params: RouteParameters): Promise<ProviderResult> {
    if (params.volume > 845_000) {
        return {
            ...providerDetails.redFrog,
            error: 'Too much volume.'
        }
    }
    if (params.collateral > 1_500_000_000) {
        return {
            ...providerDetails.redFrog,
            error: 'Too much collateral.'
        }
    }

    const routeKey = getRouteKey('redfrog', params);
    const existingRecord: RouteResult | RouteError = await data.get(routeKey) as any;
    if (existingRecord) {
        return returnExistingRecord(existingRecord);
    }

    try {
        const response = (await axios.get(`https://red-frog.org/api/public/v1/calculator/red/?origin=${params.origin}&destination=${params.destination}`)).data as any;
        const result: RouteResult[] = [{
            reward: response.reward_base,
            daysToComplete: response.days_to_complete,
            daysExpiration: response.days_expiration,
            ...providerDetails.redFrog,
        }, {
            reward: response.reward_rush,
            daysToComplete: 1,
            daysExpiration: response.days_expiration,
            ...providerDetails.redFrog,
            rushDurationHours: 4,
        }];
        await data.set(routeKey, result, {ttl: Math.floor(Math.random() * 7 * DAY) + DAY});
        return result;
    } catch (e) {
        const result = {
            ...providerDetails.redFrog,
            error: mapFrogError(e),
        };
        if (result.error === 'Route must be in contiguous Highsec.') {
            await data.set(routeKey, result, {ttl: Math.floor(Math.random() * 30 * DAY) + 30 * DAY});
        }
        return result;
    }
}

async function getPurpleFrog(params: RouteParameters): Promise<ProviderResult> {
    if (params.volume > 62_500) {
        return {
            ...providerDetails.purpleFrog,
            error: 'Too much volume.'
        }
    }
    if (params.collateral > 10_000_000_000) {
        return {
            ...providerDetails.purpleFrog,
            error: 'Too much collateral.'
        }
    }

    const routeKey = getRouteKey('purplefrog', params);
    const existingRecord: RouteResult | RouteError = await data.get(routeKey) as any;
    if (existingRecord) {
        console.log(routeKey, {cached: true});
        return {
            ...existingRecord,
            cached: true,
        };
    }

    try {
        const response = (await axios.get(`https://red-frog.org/api/public/v1/calculator/purple/?origin=${params.origin}&destination=${params.destination}&collateral=${params.collateral}`)).data as any;
        const result = {
            reward: response.reward_base,
            hasRush: false,
            rewardRush: response.reward_rush,
            daysToComplete: response.days_to_complete,
            daysExpiration: response.days_expiration,
            ...providerDetails.purpleFrog,
        };
        await data.set(routeKey, result, {ttl: Math.floor(Math.random() * 7 * DAY) + DAY});
        return result;
    } catch (e) {
        const result = {
            ...providerDetails.purpleFrog,
            error: mapFrogError(e),
        };
        if (result.error === 'Route must be in contiguous Highsec.') {
            await data.set(routeKey, result, {ttl: Math.floor(Math.random() * 30 * DAY) + 30 * DAY});
        }
        return result;
    }
}

function mapFrogError(e) {
    const isContiguousHighsecError = e.response?.data?.error?.startsWith('No contiguous High Sec route found');
    const systemDoesntExist = e.response?.data?.error?.includes('not found in our database');
    if (isContiguousHighsecError) {
        return 'Route must be in contiguous Highsec.';
    } else if (systemDoesntExist) {
        return 'System does not exist.';
    } else {
        console.warn(e);
        return 'Route not available.';
    }
}

data.on("created:distance_job_lightyears:*", async (event) => {
    const {origin, destination} = event.item.value;
    const response = (await axios.get(`https://red-frog.org/api/public/v1/calculator/black/?origin=${origin}&destination=${destination}&collateral=100000000`)).data as any;
    const result = {
        origin,
        destination,
        distance: response.distance,
        type: 'lightyears',
    };
    console.log({result});
    await data.set(`distance:${origin}:${destination}:lightyears`, result);
});

async function getSystemInfo(systemId: number): Promise<{ name: string, securityStatus: number, systemId: number }> {
    const existing = (await data.get(`systemInfo:${systemId}`)) as any;
    if (existing) {
        return existing;
    }
    const systemInfo = (await axios.get(`https://esi.evetech.net/latest/universe/systems/${systemId}/`)).data as any;
    await data.set(`systemInfo:${systemId}`, {
        name: systemInfo.name,
        constellationId: systemInfo.constellation_id,
        securityStatus: systemInfo.security_status,
        systemId: systemInfo.system_id,
    });
    return systemInfo;
}

data.on("created:distance_job_gates:*", async (event) => {
    const {origin, destination} = event.item.value;

    console.log({origin, destination, event});

    const ids = ((await axios.post(`https://esi.evetech.net/latest/universe/ids/`, [origin, destination]))
        .data as any).systems.map((s) => s.id);

    console.log({origin, destination, ids});

    const systemIds = (await axios.get(`https://esi.evetech.net/latest/route/${ids[0]}/${ids[1]}/`)).data as number[];
    const systemResults = await Promise.all(systemIds.map(getSystemInfo));
    const securityMap: Map<number, number> = new Map<number, number>();
    for (const {systemId, securityStatus} of systemResults) {
        securityMap.set(systemId, securityStatus);
    }
    const systemSecurities = [];
    for (const routeId of systemIds) {
        systemSecurities.push(securityMap.get(routeId));
    }

    const result = {
        origin,
        destination,
        systems: systemIds.length,
        systemSecurities,
        type: 'gates',
    };
    console.log({result});
    await data.set(`distance:${origin}:${destination}:gates`, result);
});

async function getHaulersChannel({origin, destination, volume, collateral}: RouteParameters): Promise<ProviderResult> {
    const distance = await data.get(`distance:${origin}:${destination}:gates`);
    console.log({distance});
    if (!distance) {
        await data.set(`distance_job_gates:${origin}:${destination}`, {
            origin: origin,
            destination: destination,
        });
        return [];
    }

    const isHighsecOnly = !distance['systemSecurities'].find((s) => s < 0.45);
    const jumps = distance['systems'];

    const rush = haulersChannelCalc(volume, jumps, collateral, true, isHighsecOnly);
    const standard = haulersChannelCalc(volume, jumps, collateral, false, isHighsecOnly);

    console.log({rush, standard});

    const result = [];
    if (typeof rush === 'string' || rush == null) {
        result.push({
            ...providerDetails.haulersChannel,
            error: rush ?? 'Not available.'
        });
    } else {
        result.push({
            reward: rush,
            daysToComplete: 1,
            daysExpiration: 7,
            rushDurationHours: 24,
            ...providerDetails.haulersChannel,
        });
    }
    if (typeof standard === 'string' || rush == null) {
        result.push({
            ...providerDetails.haulersChannel,
            error: rush ?? 'Not available.'
        });
    } else {
        result.push({
            reward: standard,
            daysToComplete: 3,
            daysExpiration: 7,
            ...providerDetails.haulersChannel,
        });
    }
    return result;
}


function haulersChannelCalc(volume: number, jumps: number, collateral: number, isRush: boolean, isHighsecOnly: boolean) {
    if (!volume || !jumps || !collateral) {
        return "Missing parameter.";
    }

    let base = 1e6;
    let add = 0;
    let multiplier = 1;
    if (volume <= 12e3) {
        multiplier *= 1;
    } else if (volume <= 60e3) {
        multiplier *= 1;
    }
    if (volume > 62500 && collateral < 1e9) {
        collateral = (3e9 + collateral) / 4;
    }//low freighter collat pays more
    if (volume <= 60000 && volume > 12000 && collateral < 1e9) {
        collateral = (1e9 + collateral) / 2;
    }//low DST collat pays more
    if (volume <= 12000 && collateral < 1e9) {
        collateral = (100e6 + collateral) / 1.1;
    }//low BR/t1 collat pays more

    if (jumps < 1) {
        jumps = 1;
    }//same system counts as 1 jump
    if (jumps < 5) {//low jumps pay more.
        jumps = (5 + jumps) * 0.5;
    }
    /*
    if (collat >1e9 && volume <= 60e3){//progressive rebate for very high collats
        mult /= Math.max(1.0,Math.log( collat/1e8)/Math.log(10));
    }
    */
    if (collateral > 3e9 && volume > 60e3) {
        multiplier *= Math.max(1.0, Math.log(collateral / 15e7) / Math.log(15));
    }

    if (volume > 1050e3) {
        add += 250e3;
        if (collateral > 2e9) {
            add += 200e3;
        }
    } else if (volume > 880e3) {
        if (collateral > 1.5e9) {
            add += 100e3;
        }
        if (collateral > 2.5e9) {
            add += 100e3;
        }
        if (collateral > 3e9) {
            add += 200e3;
        }
    } else if (volume > 750e3) {
        if (collateral > 2.5e9) {
            add += 100e3;
        }
        if (collateral > 3e9) {
            add += 200e3;
        }
    } else if (volume > 500e3) {
        if (collateral > 2.0e9) {
            add += 100e3;
        }
        if (collateral > 3.5e9) {
            add += 100e3;
        }
    }

    if (isRush) {
        if (collateral > 2e9) {
            multiplier *= 2.0 * Math.max(1.0, Math.log(collateral / 1e8) / Math.log(20));
        } else {
            multiplier *= 2.0;
        }
        if (!isHighsecOnly) {
            multiplier *= 2;
        }
    }
    if (!isHighsecOnly) {
        multiplier *= 2;
        //Non JF lowsec pays double.
    }
    if (isHighsecOnly || volume <= 62500) {//highsec or non JF lowsec
        return ((multiplier * base * collateral / 1e9) + add) * jumps;
    } else if (!isHighsecOnly && volume > 386e3) {
        return "Does not fit";
    } else {//null, JF
        base = 60e6;
        if (volume < 100) {
            multiplier = 0.25;
        } else if (volume <= 12e3) {
            multiplier = 0.5;
        } else if (volume <= 60e3) {
            multiplier = 0.75;
        } else if (volume <= 340e3) {
            multiplier = 1;
        } else {
            multiplier = 4;
        }
        if (isRush) {
            multiplier *= 2;
        }
        return (multiplier * base * (Math.max(1.0, jumps / 7)) + collateral * 0.01);
    }
}