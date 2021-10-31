import type {NextPage} from 'next'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import {useEffect, useState} from "react";

const nf = new Intl.NumberFormat('en-EN');

const colorMap = [
    '#F00000',
    '#D73000',
    '#F04800',
    '#F06000',
    '#D77700',
    '#EFEF00',
    '#8FEF2F',
    '#00F000',
    '#00EF47',
    '#48F0C0',
    '#2FEFEF',
];

function getSpaces(securities: number[]) {
    const spaces = [];
    let contiguous = true;
    if (securities.find((s) => s >= 0.45)) {
        spaces.push('highsec');
    }
    if (securities.find((s) => s > 0 && s < 0.45)) {
        spaces.push('lowsec');
        contiguous = false;
    }
    if (securities.find((s) => s <= 0)) {
        spaces.push('nullsec');
        contiguous = false;
    }
    return spaces.join(', ') + (contiguous ? '' : '. Some providers take a safer, but longer route');
}

const Home: NextPage = () => {
    const [result, setResult] = useState<any[]>();
    const [copiedElement, setCopiedElement] = useState<string>();

    return (
        <div className={'container mx-auto relative h-screen'}>
            <Head>
                <title>EVE Hauling Advisor</title>
                <link rel="icon" href="/favicon.ico"/>
            </Head>

            <main className={styles.main}>
                <Intro/>

                <Form onResult={(providers) => {
                    setResult(providers);
                }} resetCopiedElement={() => setCopiedElement(undefined)}/>

                <Result copiedElement={copiedElement} setCopiedElement={setCopiedElement}
                        result={result}/>
            </main>

            <Footer/>
        </div>
    )
}

export default Home;

function Result({
                    copiedElement,
                    setCopiedElement,
                    result
                }: { setCopiedElement: (key: string) => void, copiedElement?: string, result?: any[] }) {
    if (!result) {
        return null;
    }
    return (
        <>
            <Table result={result} copiedElement={copiedElement} setCopiedElement={setCopiedElement}/>
        </>
    )
}

function Table({
                   copiedElement,
                   setCopiedElement,
                   result
               }: { copiedElement?: string, setCopiedElement: (key: string) => void, result: any[] }) {
    return (
        <div className="flex flex-col mt-10" data-cy={'result-table'}>
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Provider
                                </th>
                                <th scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price
                                </th>
                                <th scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Days to Complete
                                </th>
                                <th scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Days to Expiration
                                </th>

                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">

                            {result?.filter((p) => !p.error).sort((a, b) => (a.reward) - (b.reward)).map((r) => {
                                const key = `active-${r.provider}-${r.rushDurationHours ? 'rush' : 'standard'}`;
                                return (
                                    <tr key={key}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center">
                                                <div>
                                                    <div>{r.url ? <a className={'text-blue-600'}
                                                                     href={r.url}>{r.provider}</a> : r.provider}</div>
                                                    <div
                                                        className="text-gray-500">{r.rushDurationHours ? `Rush (${r.rushDurationHours} hours)` : 'Standard'}</div>
                                                </div>
                                                <div className="border-l-2 ml-2 pl-2">
                                                    <button onClick={async () => {
                                                        await navigator.clipboard.writeText(r.provider);
                                                        setCopiedElement(`name-${key}`);
                                                    }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg"
                                                             className="h-6 w-6" fill="none"
                                                             viewBox="0 0 24 24"
                                                             stroke={copiedElement === `name-${key}` ? 'green' : 'black'}>
                                                            <path strokeLinecap="round"
                                                                  strokeLinejoin="round"
                                                                  strokeWidth={2}
                                                                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center">
                                                <div>
                                                    <div>{new Intl.NumberFormat('en-US').format(r.reward)} ISK</div>
                                                </div>
                                                <div className="border-l-2 ml-2 pl-2">
                                                    <button onClick={async () => {
                                                        await navigator.clipboard.writeText(r.reward);
                                                        setCopiedElement(`price-${key}`);
                                                    }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg"
                                                             className="h-6 w-6" fill="none"
                                                             viewBox="0 0 24 24"
                                                             stroke={copiedElement === `price-${key}` ? 'green' : 'black'}>
                                                            <path strokeLinecap="round"
                                                                  strokeLinejoin="round"
                                                                  strokeWidth={2}
                                                                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {r.daysToComplete}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {r.daysExpiration}
                                        </td>
                                    </tr>
                                )
                            })}
                            {result?.filter((p) => p.error).sort((a, b) => a.provider.localeCompare(b.provider)).map((r) => {
                                return (
                                    <tr key={`${r.provider}${r.rushDurationHours && ' (rush)'}`}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div>{r.url ? <a className={'text-blue-600'}
                                                             href={r.url}>{r.provider}</a> : r.provider}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap" colSpan={3}>
                                                    <span
                                                        className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                      {r.error.length > 83 ? r.error.slice(0, 80) + '...' : r.error}
                                                    </span>
                                        </td>
                                    </tr>
                                )
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Intro() {
    return (
        <>
            <h1 className={styles.title}>
                Welcome to your <span className={'text-blue-600'}>EVE Hauling Advisor</span>!
            </h1>
            <p className="text-xl mt-10 uppercase">
                Public Preview
            </p>
            <p className="text-xl my-10">
                We help you find the best hauling provider for your package. Simply fill out the form below, and
                click on Calculate.
            </p>
        </>
    )
}

const fetchQuotes = (setFailureReason: any, setLoading: any, origin: any, destination: any, volume: any, collateral: any, onResult: any, resetCopiedElement: any) => {
    setFailureReason(undefined);
    setLoading(true);
    const sanitizedVolume = Math.ceil(+volume.replaceAll(',', ''));
    const sanitizedCollateral = Math.ceil(+collateral.replaceAll(',', ''));
    fetch(`./api/route?origin=${origin}&destination=${destination}&volume=${sanitizedVolume}&collateral=${sanitizedCollateral}`)
        .then(function (response) {
            if (!response.ok) {
                throw Error(response.statusText);
            }
            return response;
        })
        .then((res) => res.json())
        .then((data) => {
            if (data.distanceGates) {
                onResult(data.providers, data.distances?.gates);
            } else {
                onResult(data.providers);
            }
        })
        .catch((e) => {
            console.log(e);
            setFailureReason('Request failed. Please try again.');
        })
        .finally(() => {
            setLoading(false);
            resetCopiedElement();
        });
}

function Form({
                  onResult,
                  resetCopiedElement
              }: { onResult: (providers: any[]) => void, resetCopiedElement: () => void }) {
    const [failureReason, setFailureReason] = useState<string>();
    const [loading, setLoading] = useState<boolean>();

    const [systemNames, setSystemNames] = useState<string[]>([]);
    const [systemNamesMap, setSystemNamesMap] = useState<any>([]);

    const [isOriginMainland, setOriginMainland] = useState<boolean | undefined>();
    const [isDestinationMainland, setDestinationMainland] = useState<boolean>();

    useEffect(() => {
        fetch(`./api/systems?version=${localStorage.getItem('systems-version') ?? 'fresh'}`)
            .then(function (response) {
                if (!response.ok) {
                    throw Error(response.statusText);
                }
                return response;
            })
            .then((res) => res.json())
            .then(({systemNames, version}) => {
                let names: string[];
                if (systemNames.length > 0) {
                    localStorage.setItem('systems-version', version);
                    localStorage.setItem('system-names', JSON.stringify(systemNames))
                    names = systemNames;
                } else {
                    names = JSON.parse(localStorage.getItem('system-names')!);
                }
                setSystemNames(names);
                const m: any = {};
                for (const name of names) {
                    m[name.toLowerCase()] = 1;
                }
                setSystemNamesMap(m);
            })
            .catch((e) => {
                console.log(e);
                setFailureReason('Loading system names failed. Please refresh the page.');
            });
    }, []);

    return (
        <div className="mt-5 md:mt-0 md:col-span-2">
            <form onSubmit={(e) => {
                e.preventDefault();
                const targets: { value: string }[] = e.target as unknown as { value: string }[];
                console.log({targets});
                fetchQuotes(setFailureReason, setLoading, targets[0].value, targets[1].value, targets[2].value, targets[5].value, onResult, resetCopiedElement);
            }}>
                <div className="shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 bg-white sm:p-6">
                        <div className="grid grid-cols-6 gap-y-3 gap-x-6">
                            <div className="col-span-6 sm:col-span-3">
                                <Origin systemNames={systemNames} systemNamesMap={systemNamesMap}
                                        setOriginMainland={setOriginMainland}/>
                            </div>

                            <div className="col-span-6 sm:col-span-3">
                                <Destination systemNames={systemNames} systemNamesMap={systemNamesMap}
                                             setDestinationMainland={setDestinationMainland}/>
                            </div>

                            <div className="col-span-6 sm:col-span-6">
                                <p className={'h-2 text-center'}>
                                    {
                                        (isOriginMainland !== undefined && isDestinationMainland !== undefined)
                                        && <span
                                            className={'text-gray-500 text-sm'}>Contingent highsec: {(isOriginMainland && isDestinationMainland) ?
                                            <span className={'text-green-600'} data-cy={'contingent-highsec-yes'}>Yes</span> :
                                            <span className={'text-red-600'} data-cy={'contingent-highsec-no'}>No</span>}</span>
                                    }

                                </p>
                            </div>

                            <div className="col-span-6 sm:col-span-3 mt-4">
                                <Volume/>
                            </div>

                            <div className="col-span-6 sm:col-span-3 mt-4">
                                <Collateral/>
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-3 bg-gray-50 text-center sm:px-6">
                        <button type="submit"
                                data-cy={'calculate-button'}
                                disabled={loading || systemNames?.length === 0}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            {loading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                             xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                        strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>}
                            Calculate
                        </button>
                        {failureReason && <p className="text-red-600 mt-3">{failureReason}</p>}
                    </div>
                </div>
            </form>
        </div>
    )
}

function setMainland({name, setMainland}: {name: string, setMainland: (mainland: boolean) => void}) {
    fetch(`./api/mainland?systemName=${name}`)
        .then(function (response) {
            if (!response.ok) {
                throw Error(response.statusText);
            }
            return response;
        })
        .then((res) => res.json())
        .then(({isMainland}) => {
            setMainland(isMainland);
        })
        .catch((e) => {
            console.log(e);
        });
}

function Destination({
                         systemNames,
                         systemNamesMap,
                         setDestinationMainland
                     }: { systemNames: string[], systemNamesMap: any, setDestinationMainland: (isMainland?: boolean) => void }) {
    const [destination, setDestination] = useState<string>();

    useEffect(() => {
        const params: any = new URLSearchParams(window.location.search);
        // get may return null, but react doesn't like that
        if (params.has('destination')) {
            const d = params.get("destination");
            setDestination(d);
            setMainland({name: d, setMainland: setDestinationMainland});
        }
    }, []);

    useEffect(() => {
        if (systemNamesMap[destination?.toLowerCase() ?? "none"]) {
            setMainland({name: destination!, setMainland: setDestinationMainland});
        } else {
            setDestinationMainland(undefined);
        }
    }, [destination]);

    return (
        <>
            <label htmlFor="destination"
                   className="block text-xs font-medium text-gray-500 uppercase">Destination</label>
            <input list="destination-systems" name="destination" id="destination"
                   value={destination} onChange={(e) => setDestination(e.target.value)}
                   disabled={systemNames?.length === 0}
                   placeholder={systemNames?.length > 0 ? 'Select a destination' : 'Loading ...'}
                   className="mt-1 p-2 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-md sm:text-sm border-gray-300 rounded-md"
                   data-cy="destination-input"/>
            <datalist id="destination-systems" data-cy={'destination-systems'}>
                {
                    systemNames?.map((name) => <option key={`destination-${name}`} data-cy={`destination-${name}`}>{name}</option>)
                }
            </datalist>
        </>
    )
}

function Origin({
                    systemNames,
                    systemNamesMap,
                    setOriginMainland
                }: { systemNames: string[], systemNamesMap: any, setOriginMainland: (isMainland?: boolean) => void }) {
    const [origin, setOrigin] = useState<string>();

    useEffect(() => {
        const params: any = new URLSearchParams(window.location.search);
        if (params.has('origin')) {
            const d = params.get("origin");
            setOrigin(d);
            setMainland({name: d, setMainland: setOriginMainland});
        }
    }, []);

    useEffect(() => {
        if (systemNamesMap[origin?.toLowerCase() ?? "none"]) {
            setMainland({name: origin!, setMainland: setOriginMainland});
        } else {
            setOriginMainland(undefined);
        }
    }, [origin]);

    return (
        <>
            <label htmlFor="origin"
                   className="block text-xs font-medium text-gray-500 uppercase">Origin</label>
            <input list="origin-systems" name="origin" id="origin" value={origin}
                   disabled={systemNames?.length === 0}
                   onChange={(e) => setOrigin(e.target.value)}
                   placeholder={systemNames?.length > 0 ? 'Select an origin' : 'Loading ...'}
                   className="mt-1 p-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-md sm:text-sm border-gray-300 rounded-md"
                   data-cy="origin-input"/>
            <datalist id="origin-systems" data-cy="origin-systems">
                {
                    systemNames?.map((name) => <option key={`origin-${name}`} data-cy={`origin-${name}`}>{name}</option>)
                }
            </datalist>
        </>
    )
}

function Volume() {
    const [volume, setVolume] = useState<string>();
    const [error, setError] = useState<string>();

    useEffect(() => {
        const params: any = new URLSearchParams(window.location.search);
        if (params.has("volume")) {
            onChange(params.get("volume"));
        }
    }, []);

    const onChange = (value: string, factor: number = 1) => {
        if (value.endsWith('.')) {
            if (value.match(/\./g)?.length === 1) {
                setVolume(value);
            }
            // don't accept input with more than 1 dot
            return;
        }
        if (value.length === 0) {
            setVolume('');
            return;
        }
        if (value.length > 0 && value.match(/[0-9,.]/g)?.length !== value.length) {
            return;
        }
        const sanitized = +value.replaceAll(",", "");
        const newVolume = sanitized * factor;
        if (newVolume > 1_200_000) {
            setError('Max volume: 1,200,000 m3.');
        } else {
            setError(undefined);
        }
        setVolume(nf.format(newVolume));
    };

    return (
        <>
            <label htmlFor="volume"
                   className="block text-xs font-medium text-gray-500 uppercase">Volume
                (m3)</label>
            <input type="text" name="volume" id="volume" value={volume}
                   onChange={(e) => onChange(e.target.value)}
                   className="mt-1 p-2 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-md sm:text-sm border-gray-300 rounded-md"
            data-cy={'volume-input'}/>
            <div className={'pl-1 pt-1 text-blue-600 text-sm'}>
                <button className={'font-bold'} onClick={() => onChange('' + volume, 1_000)}
                        type={'button'} data-cy={'volume-thousand'}>thousand
                </button>
                <span>{' - '}</span>
                <button className={'font-bold'} onClick={() => onChange('' + volume, 1_000_000)}
                        type={'button'} data-cy={'volume-million'}>million
                </button>
            </div>
            <div>
                {error && <p className="pl-1 text-red-600 text-xs mt-3" data-cy={'volume-error'}>{error}</p>}
            </div>
        </>
    )
}

function Collateral() {
    const [collateral, setCollateral] = useState<string>();

    useEffect(() => {
        const params: any = new URLSearchParams(window.location.search);
        if (params.has("collateral")) {
            onChange(params.get("collateral"));
        }
    }, []);

    const onChange = (value: string, factor: number = 1) => {
        if (value.endsWith('.')) {
            if (value.match(/\./g)?.length === 1) {
                setCollateral(value);
            }
            // don't accept input with more than 1 dot
            return;
        }
        if (value.length === 0) {
            setCollateral('');
            return;
        }
        if (value.length > 0 && value.match(/[0-9,.]/g)?.length !== value.length) {
            return;
        }
        const sanitized = +value.replaceAll(",", "");
        setCollateral(nf.format(sanitized * factor));
    };

    return (
        <>
            <label htmlFor="collateral"
                   className="block text-xs font-medium text-gray-500 uppercase">Collateral
                (ISK)</label>
            <input type="text" name="collateral" id="collateral"
                   value={collateral}
                   onChange={(e) => onChange(e.target.value)}
                   className="mt-1 p-2 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-md sm:text-sm border-gray-300 rounded-md"
            data-cy={'collateral-input'}/>
            <div className={'pl-1 pt-1 text-blue-600 text-sm'}>
                <button className={'font-bold'} onClick={() => onChange('' + collateral, 1_000_000)}
                        type={'button'} data-cy={'collateral-million'}>million
                </button>
                <span>{' - '}</span>
                <button className={'font-bold'} onClick={() => onChange('' + collateral, 1_000_000_000)}
                        type={'button'} data-cy={'collateral-billion'}>billion
                </button>
            </div>
        </>
    )
}

function Footer() {
    return (
        <footer className={'w-full h-24 border-t-2 text-center p-4 bottom-0'}>
            <p><a className={'text-blue-600'} href={'https://discord.gg/2KYBbZ7SrT'}>Join our Discord</a></p>
            <p>All EVE related materials are property of <a className={'text-blue-600'}
                                                            href={'https://www.ccpgames.com/'}>CCP Games</a></p>
        </footer>
    )
}
