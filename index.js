import fetch from 'node-fetch';
import ccxt from 'ccxt';
import formData from 'form-data';

// const baseEndPoint = 'http://localhost/autoTradeBot/api'
const baseEndPoint = 'https://quandayne.com/bibobot/api'

let getCoins = async (headersList) => {
	let result = []
	const response = await fetch(`${baseEndPoint}/getCoinMaster`, {
		method: "POST",
		headers: headersList
	}).then((res) => res.json())

	for (const item of response) {
		// Đổi tên coin sang cấu trúc của ccxt
		result[item.coin_name.replace("usdt", "/usdt").toUpperCase()] = item.decimal_places
	}
	return result
}

let getPrice = async (coins) => {
	let result = []

	if (coins == undefined || Object.keys(coins).length == 0) return result

	const exchange = new ccxt.bybit();
	exchange.timeout = 5000
	const response = await exchange.fetchTickers(Object.keys(coins))
	for (const symbol in response) {
		const item = {
			coinName: symbol,
			bid: response[symbol].bid,
			ask: response[symbol].ask,
			average: ((response[symbol].ask + response[symbol].bid) / 2).toFixed(coins[symbol]),
			spread: (response[symbol].bid && response[symbol].ask) ? response[symbol].ask - response[symbol].bid : undefined
		}
		result.push(item)
	}
	return result
}

let updateCurrentPrice = async (prices, headersList) => {
	let body = new formData();

	body.append('data', JSON.stringify(prices));
	const response = await fetch(`${baseEndPoint}/updateCurrentPrice`, {
		method: "POST",
		body: body,
		headers: headersList,
		time: true
	}).then((res) => res.json()).catch((error) => {
		console.log(error)
	});
	return response
}

function calcTime(city, offset) {
	var b = new Date()
	var utc = b.getTime() + (b.getTimezoneOffset() * 60000);
	var nd = new Date(utc + (3600000 * offset));
	return "Time in " + city + " is " + nd.toLocaleString();

}
let main = async () => {
	const headersList = {
		"Accept": "application/json",
		"Authorization": "Bearer 71|LRfR9vvJr3FKAYK4cJSs0Er7VKAz390Qk1eEz0VI",
	}

	const coins = await getCoins(headersList)

	setInterval(async () => {
		const prices = await getPrice(coins)
		const result = await updateCurrentPrice(prices, headersList)
		console.log(result);
		console.log(calcTime('japan', '+9'))
	}, 1500);
}


try {
	main();
} catch (error) {
	main();
}

