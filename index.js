import fetch from 'node-fetch';
import ccxt from 'ccxt';
import formData from 'form-data';

const baseEndPoint = 'http://localhost/autoTradeBot/api'
// const baseEndPoint = 'https://quandayne.com/biboBot/api'



let getPrice = async (coins) => {
    let result = []

    if (coins == undefined || coins.length == 0) return result

    const exchange = new ccxt.huobi();
    const response = await exchange.fetchTickers(coins)
    for (const symbol in response) {
        const item = {
            coinName: symbol,
            bid: response[symbol].bid,
            ask: response[symbol].ask,
            average: (response[symbol].ask + response[symbol].bid) / 2,
            spread: (response[symbol].bid && response[symbol].ask) ? response[symbol].ask - response[symbol].bid : undefined
        }
        result.push(item)
    }
    return result
}

let getCoins = async (headersList) => {
    let result = []
    const response = await fetch(`${baseEndPoint}/getCoinMaster`, {
        method: "POST",
        headers: headersList
    }).then((res) => res.json())

    for (const item of response) {
        result.push(((item.coin_name).replace("usdt", "/usdt")).toUpperCase())
    }
    return result
}

let updateCurrentPrice = async (prices, headersList) => {
    let body = new formData();

    body.append('data', JSON.stringify(prices));
    console.time("timer1");
    const response = await fetch(`${baseEndPoint}/updateCurrentPrice`, {
        method: "POST",
        body: body,
        headers: headersList,
        time: true
    }).then((res) => res.json())
    console.timeEnd("timer1");
    return response
}

let main = async () => {
    const headersList = {
        "Accept": "application/json",
        "Authorization": "Bearer 16|SkD2vAENQz1MLdU1rbiBRzsJWCy1gFbBMWtsTbYZ",
    }

    const coins = await getCoins(headersList)

    setInterval(async () => {
        const prices = await getPrice(coins)
        const result = await updateCurrentPrice(prices, headersList)
        console.log(result);
    }, 5000);
}

main();

