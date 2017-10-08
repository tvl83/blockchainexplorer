"use strict";
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
// const session = require('express-session');
// const MongoStore = require('connect-mongo')(session);
const cors = require('cors')({origin: true});

const request = require('request-promise');

const app = express();

const config = require('./config.json');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

// APIs
let mongoose = require('mongoose');

let mongooseConnectString = `mongodb://${config.mongodbusername}:${config.mongodbpassword}@localhost:${config.mongodbport}/${config.mongodbname}?authSource=admin`;
console.log(mongooseConnectString);

mongoose.connect(mongooseConnectString, {useMongoClient: true});

mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, '# MongoDB - connection error: '));

let Blocks = require('./models/blocks');
let Transactions = require('./models/transactions');
let Addresses = require('./models/addresses');
let Vins = require('./models/vins');
let Vouts = require('./models/vouts');
let MarketData = require('./models/marketdata');
let Peers = require('./models/peer');
let GetInfo = require('./models/getinfo');

app.get('/block', function (req, res) {
	cors(req, res, () => {
		const block = req.query.block;
		if (block.length === 64) {
			Blocks.findOne({hash: block})
				.populate('meta.tx')
				.populate({path: 'meta.tx', model: 'Vins'})
				.populate({path: 'meta.tx', model: 'Vouts'})
				.exec()
				.then((block) => blockCallback(block, res))
				.catch((err) => res.send({error: err}));
		} else if (Number.isInteger(parseInt(block))) { //&& parseInt(block) <= lastHeight
			// console.log(`searching by block height ${block}`);
			Blocks.findOne({height: block})
				.populate('meta.tx')
				.exec()
				.then((block) => blockCallback(block, res))
				.catch((err) => {
					console.log(err);
					res.send({error: err})
				});
		}
	});
});

app.get('/vout', function (req, res) {
	cors(req, res, () => {
		// console.log(req.query);
		Vouts.findOne({_id: req.query.vout})
			.then(vout => {
				// console.log(vout);
				res.send(vout);
			})
			.catch(err => {
				// console.log(err);
				res.send(err);
			})
	});
});

app.get('/tx', function (req, res) {
	cors(req, res, () => {
		let txid = req.query.txhash;
		// console.log(txid);
		// console.log(req.query);
		Transactions.findOne({"raw.txid": txid}, function (err, tx) {
			if (err) {
				throw err;
			}
			// console.log("found: ", tx);

			Vouts.find({txid:txid})
				.then(vouts => {
					// console.log(`found vouts ${JSON.stringify(vouts)}`);
					tx.rawVouts = vouts;
					// console.log(`rawVouts ${tx.rawVouts}`);
					Vins.find({thisTxid: txid})
						.then(vins => {
							tx.rawVins = vins;
							// console.log(`rawVouts ${tx.rawVins}`);
							// console.log(`found vins ${JSON.stringify(vins)}`);
							if (tx === null)
								res.json({error: "tx hash not found"});
							else
								res.json(tx);
						})
				});
		})
	});
});

app.get('/lastblockheight', function (req, res) {
	cors(req, res, () => {
		let latest = latestBlock();
		latest.then(lastHeight => {
			let latestBlockObj = {height: lastHeight};
			console.log(latestBlockObj);
			res.send(latestBlockObj);
		})
	})
});

app.get('/getinfo', function(req, res){
	cors(req,res,() => {
		GetInfo.findOne({})
			.then(info => {
				res.send(info);
			})
	})
});

app.get('/lastvinheight', function (req, res) {
	cors(req, res, () => {
		let latest = latestVin();
		latest.then(lastHeight => {
			let latestBlockObj = {lastVin: lastHeight};
			console.log(latestBlockObj);
			res.send(latestBlockObj);
		})
	})
});

app.get('/lastblocks', function (req, res) {
	cors(req, res, () => {
		Blocks.lastBlocks(function (err, blocks) {
			if (err)
				res.send(err);
			res.send(blocks);
		})
	})
});

app.get('/ionmarketinfo', function (req, res) {
	cors(req, res, () => {
		if (req.query.force === "true") {
			console.log("forced");
			request({
				uri: `https://api.coinmarketcap.com/v1/ticker/ion/`,
				method: 'GET',
				json: true
			}).then(function (response) {
				// console.log(response);
				// console.log(response[0]);
				let stats = response[0];

				delete stats['24h_volume_usd'];

				// console.log(stats);
				let marketdata = {
					"id": stats.id,
					"name": stats.name,
					"symbol": stats.symbol,
					"rank": stats.rank,
					"price_usd": stats.price_usd,
					"price_btc": stats.price_btc,
					"market_cap_usd": stats.market_cap_usd,
					"available_supply": stats.available_supply,
					"total_supply": stats.total_supply,
					"percent_change_1h": stats.percent_change_1h,
					"percent_change_24h": stats.percent_change_24h,
					"percent_change_7d": stats.percent_change_7d,
					"last_updated": stats.last_updated,
					lastupdated: Date.now()
				};

				MarketData.findOneAndUpdate({}, {$set: marketdata}, {new: true, upsert: true}, function (err, doc) {
					if (err)
						res.send(err);
					console.log("then");
					console.log(doc);
					res.send(doc);
				})
			})
		} else {
			let lastupdated = Date.now();
			let now = Date.now();
			let marketInfo = {};

			MarketData.findOne({}, function (err, marketData) {
				if (err)
					throw err;
				// console.log(marketData);
				lastupdated = parseInt(marketData.lastupdated);
				marketInfo = marketData;
				let fiveMinutesMilliseconds = 5 * 60 * 1000;
				let fiveMinutesFromNow = lastupdated + fiveMinutesMilliseconds;
				// console.log(`5fromNow: ${fiveMinutesFromNow}`);
				// console.log(`Date.now(): ${now}`);
				// console.log(`lastupdated: ${lastupdated}`);
				// console.log(`fiveMinutesMilliseconds: ${fiveMinutesMilliseconds}`);
				// console.log(`${lastupdated + fiveMinutesMilliseconds} > ${now}`);
				if ((lastupdated + fiveMinutesMilliseconds) > (now)) { // send data from db
					// console.log("dont need to update");
					res.send(marketInfo);
				} else { // data older than 5 minutes, update db and send data to client
					// console.log("data is more than 5 minutes old refreshing db");
					request({
						uri: `https://api.coinmarketcap.com/v1/ticker/ion/`,
						method: 'GET',
						json: true
					}).then(function (response) {
						// console.log(response[0]);
						let stats = response[0];

						let marketdata = {
							"id": stats.id,
							"name": stats.name,
							"symbol": stats.symbol,
							"rank": stats.rank,
							"price_usd": stats.price_usd,
							"price_btc": stats.price_btc,
							"market_cap_usd": stats.market_cap_usd,
							"available_supply": stats.available_supply,
							"total_supply": stats.total_supply,
							"percent_change_1h": stats.percent_change_1h,
							"percent_change_24h": stats.percent_change_24h,
							"percent_change_7d": stats.percent_change_7d,
							"last_updated": stats.last_updated,
							lastupdated: Date.now()
						};

						MarketData.findOneAndUpdate({}, {$set: marketdata}, {new: true, upsert: true}, function (err, doc) {
							if (err)
								res.send(err);
							// console.log("then");
							// console.log(doc);
							res.send(doc);
						})
					})
				}
			});
		}
	})
});

app.get('/address', function (req, res) {
	cors(req, res, () => {
		let address = req.query.address;

		Addresses.findOne({address: address}, function (err, address) {
			if (err) {
				throw err;
			}
			if (address === null)
				res.json({error: "address not found"});
			else {
				console.log("before sort");
				let ledger = address.ledgerIn.concat(address.ledgerOut).sort((a, b) => {
					// swap signs of the return 1's to switch between ascending and descending
					if (a.blockheight < b.blockheight)
						return -1;
					if (a.blockheight > b.blockheight)
						return 1;
					return 0;
				});
				console.log("after sort");
				console.log(address);

				calculateBalances(address, ledger)
					.then(address => {
						res.json(address);
					})
			}
		})
	})
});

app.get('/txheight', function (req, res) {
	cors(req, res, () => {
		let txid = req.query.txid;
		Transactions.findOne({txid: txid})
			.then(txDoc => {
				res.send({blockHeight: txDoc.blockheight});
			})
	})
});

app.get('/getpeerlist', function (req, res) {
	cors(req, res, () => {
		let peersArr = [];
		Peers.find({})
			.sort({addr: 1})
			.then(peers => {
				peers.forEach(peer => {
					peersArr.push({
						id: peer._id,
						ip: peer.addr,
						country_name: peer.country_name,
						region_name: peer.region_name,
						city: peer.city,
						time_zone: peer.time_zone,
						version: peer.subversion,
						lastConn: peer.conntime
					});
				});
				peersArr.sort((a, b) => {
					// swap signs of the return 1's to switch between ascending and descending
					if (a.addr < b.addr)
						return -1;
					if (a.addr > b.addr)
						return 1;
					return 0;
				});

				res.send(peersArr);
			});
	});
});

app.get('/getrichlist', function (req, res) {
	cors(req, res, () => {
		console.log(`getrichlist`);
		let addressObj = {};
		let richList = [];
		Addresses.richList((err, addresses) => {
			if(err)
				res.send(err);

			addresses.forEach((address, i)=> {
				addressObj = {
					id: address._id,
					rank: i+1,
					address: address.address,
					amount: address.balance
				};
				richList.push(addressObj);

				Addresses.findOneAndUpdate({address:address.address},
					{
						$set: {
							rank: i+1
						}
					}, {},
					function(err, newDoc){
					if(err)
						throw err;
					})
			});

			res.send(richList);
		})
	})
});

app.listen(3001, function (err) {
	if (err) {
		return console.log(err);
	}
	console.log('API Sever is listening on http://localhost:3001');
});

function latestBlock() {
	return new Promise((resolve, reject) => {
		Blocks.latestBlock(function (err, block) {
			console.log(block.height);
			resolve(block.height);
		})
	})
}

function latestVin(){
	return new Promise((resolve, reject) => {
		Vins.latestBlock(function (err, vin) {
			console.log(vin.blockheight);
			resolve(vin.blockheight);
		})
	})
}

function calculateBalances(address, ledger) {
	return new Promise((resolve) => {
		console.log("in calcbalance promise");
		console.log(JSON.stringify(ledger, null, 2));
		let runningBalance = 0;
		let totalSent = 0;
		let totalReceived = 0;

		ledger.forEach(ledgerItem => {
			if (ledgerItem.type === '+') {
				console.log("adding");
				runningBalance += ledgerItem.value;
				ledgerItem['runningBalance'] = runningBalance;
				console.log(`address ${address.address} running balance = ${runningBalance}`);
			}
			else if (ledgerItem.type === '-') {
				console.log("subtracting");
				runningBalance -= ledgerItem.value;
				ledgerItem['runningBalance'] = runningBalance;
				console.log(`address ${address.address} running balance = ${runningBalance}`);
			}
		});

		address.ledgerOut.forEach(ledgerOut => {
			totalSent += ledgerOut.value;
		});
		address.ledgerIn.forEach(ledgerIn => {
			totalReceived += ledgerIn.value;
		});

		Addresses.findOneAndUpdate(
			{address:address.address},
			{
				$set: {
					balance: runningBalance
				}
			}, {},
			function(err,addressDoc){
				if(err)
					throw err;
				console.log(`updated ${addressDoc.address} to balance ${addressDoc.balance}`);
				address.balance = runningBalance;
				address.ledger = ledger;
				address.totalReceived = totalReceived;
				address.totalSent = totalSent;
				console.log(`totalSent: ${address.totalSent}`);
				console.log(`totalReceived: ${address.totalReceived}`);
				resolve(address);
			}
		);
	})
}

function blockCallback(blockObj, res) {
	console.log("After exec, in promise result");
	if (blockObj.raw === null) {
		console.log("block height/hash not found");
		res.json({error: "block height/hash not found"});
	} else {

		let txQuery = {$or: []};

		blockObj.raw.tx.forEach(function (tx) {
			txQuery.$or.push({"txid": tx});
		});

		let blockTxObj = {
			raw: {},
			txs: [],
			valueOut: 0
		};

		// console.log('txQuery', txQuery);

		Transactions.find(txQuery).populate('vins').populate('vouts').exec(function (err, doc) {
			if (err)
				throw err;
			// console.log("txQuery doc: ");
			// console.log(JSON.stringify(doc, null, 4));
			blockTxObj.raw = blockObj.raw;
			blockTxObj.block = blockObj;
			blockTxObj.txs = doc;

			// console.log("blockTxObj", blockTxObj);

			if (blockObj.raw === null)
				res.json({error: "block height not found"});
			else {
				// console.log("blockTxObj.block.meta.tx");
				// console.log(JSON.stringify(blockTxObj.block.meta.tx[0], null, 4));
				if (blockTxObj.block.meta.tx.length > 0) {
					blockTxObj.block.meta.tx.forEach(tx => {
						tx.vout.forEach(function (vout) {
							blockTxObj.valueOut += vout.value;
						})
					});
				}
				// console.log(blockTxObj);
				res.json(blockTxObj);
			}
		}).catch((err) => {
			res.send({error: err});
		});
	}
}