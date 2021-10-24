import axios from "axios";
import * as fs from "fs";

async function runMe() {
    console.log("Loading system names");
    const systemIds = (await axios.get(`https://esi.evetech.net/v1/universe/systems/`)).data;
    const promises = [];
    for (const chunk of chunks(systemIds, 900)) {
        console.log({chunk});
        if (chunk.length > 0) {
            promises.push(axios.post(`https://esi.evetech.net/v3/universe/names/`, chunk));
        }
    }
    const systemNames = (await Promise.all(promises))
        .map((r) => r.data)
        .flatMap(x => x)
        .filter((n) => n.category === "solar_system")
        .map((n) => n.name);

    console.log(`Writing ${systemNames.length} names.`);
    fs.writeFileSync('system-names.json', JSON.stringify(systemNames));
    console.log('Done');
}

function* chunks(arr, n) {
    for (let i = 0; i < arr.length; i += n) {
        yield arr.slice(i, i + n);
    }
}

runMe().catch(console.error);