import fetch from 'node-fetch';
import ccxt from 'ccxt';
import formData from 'form-data';
import cluster from 'cluster';

// const baseEndPoint = 'http://localhost/bibobot/api'
const baseEndPoint = 'http://14.225.205.27/bibobot/api'

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

	/**
	 * coin không thể lấy giá: 
	 *  SHIB/USDT
	 */
	const exchange = new ccxt.bybit();
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
	const b = new Date()
	const utc = b.getTime() + (b.getTimezoneOffset() * 60000);
	const nd = new Date(utc + (3600000 * offset));
	return "Time in " + city + " is " + nd.toLocaleString();

}
let main = async () => {
	const headersList = {
		"Accept": "application/json",
		"Authorization": "Bearer 98|04wOGPHXBOnNpefkmVJbWu0p7rp7bQbojo7d8GhE",
	}

	const coins = await getCoins(headersList)

	setInterval(async () => {
		const prices = await getPrice(coins)
		const result = await updateCurrentPrice(prices, headersList)
		console.log(result);
		console.log(calcTime('japan', '+9') + " " + baseEndPoint)
	}, 1300);
}



if (cluster.isMaster) {
	cluster.fork();

	cluster.on('exit', function (worker, code, signal) {
		cluster.fork();
	});
}

if (cluster.isWorker) {
	main()
}

