let ioncoin = require('node-altcoin')();
let fs = require('fs');
let moment = require('moment');
let fetch = require('node-fetch');
// const util = require('util');
// let readline = require('readline');
// const ProgressBar = require('progress');

// configure winston logger
const winston = require('winston');
const winstonRotator = require('winston-daily-rotate-file');

const consoleConfig = [
	new winston.transports.Console({
		'colorize': true
	})
];

const createLogger = new winston.Logger({
	'transports': consoleConfig
});

const debugLogger = createLogger;
debugLogger.add(winstonRotator, {
	'name': 'debug-file',
	'level': 'debug',
	'filename': './logs/debug.log',
	'json': false,
	'datePattern': 'yyyy-MM-dd-',
	'prepend': true
});

debugLogger.debug("test");

const config = require('./config.json');

// iond setup
ioncoin.set('user', config.walletusername);
ioncoin.set('pass', config.walletpassword);
ioncoin.set({port: config.walletport});

// mongoose set up
let mongoose = require('mongoose');
mongoose.Promise = global.Promise;

let mongooseConnectString = `mongodb://${config.mongodbusername}:${config.mongodbpassword}@localhost:${config.mongodbport}/${config.mongodbnamemainnet}?authSource=admin`;

console.log(mongooseConnectString);

mongoose.connect(`mongodb://${config.mongodbusername}:${config.mongodbpassword}@localhost:${config.mongodbport}/${config.mongodbnamemainnet}?authSource=admin`, {useMongoClient: true});
const CLEAR_SCREEN = true;

// Setup collections in mongoose
let Blocks = require('./models/blocks');
let Transactions = require('./models/transactions');
let Addresses = require('./models/addresses');
let Vins = require('./models/vins');
let Vouts = require('./models/vouts');
let Peers = require('./models/peer');

// process command lines
let argsArray = require('optimist').argv;
let cmd = argsArray.cmd;

// console.log("cmd", cmd);
// let processedCount = 0;
// let rl = readline.createInterface({
// 	input: fs.createReadStream('hashlist.txt')
// });

let block, start, end, count, address, toHeight, fromHeight;

let txsFromFile = [];
let blocksFromFile = [];

// Tx
let completeGetTxPercent = 0;
let completeSaveTxPercent = 0;
let completeGetTx = 0;
let totalGetTx = 0;
let completeSaveTx = 0;
let totalSaveTx = 0;

// blocks
let completeGetBlocksPercent = 0;
let completeSaveBlocksPercent = 0;
let completeGetBlocks = 0;
let totalGetBlocks = 0;
let completeSaveBlocks = 0;
let totalSaveBlocks = 0;

// addresses
let totalSaveAddresses = 0;
let completeSaveAddresses = 0;
let completeSaveAddressesPercent = 0;

// Vouts
let completeSaveVouts = 0;
let completeSaveVoutsPercent = 0;
let totalSaveVouts = 0;

// Vins
let completeSaveVins = 0;
let completeSaveVinsPercent = 0;
let totalSaveVins = 0;

// processVins
let completeProcessVins = 0;
let completeProcessVinsPercent = 0;
let totalProcessVins = 0;

// voutsForVins
let totalVoutsForVins = 0;
let completeVoutsForVins = 0;
let completeVoutsForVinsPercent = 0;

let timeStarted = 0;

let linkVinsToVoutsRejected = 0;
let linkVinsToVoutsResolved = 0;

let lastBlockHeight = 0;
let lastTxHeight = 0;

switch (cmd.toLowerCase()) {
	case "savehashes":
		console.log(`command ${cmd.toLowerCase()}`);
		start = argsArray.start;
		count = argsArray.count || 1;
		saveHashes(start, count);
		break;
	case "readaddress":
		address = argsArray.address;
		readAddress(address);
		break;
	case "checkblocks":
		fromHeight = argsArray.fromheight;
		toHeight = argsArray.toheight;
		checkBlocks(toHeight, fromHeight);
		break;
	// case "linkvouts":
	// 	linkVouts();
	// 	break;
	// case "processtransactions":
	// 	processTransactions();
	// 	break;
	case "saveblockhahes":
		saveBlockHashes();
		break;
	// case "readtransactions":
	// 	start = argsArray.start;
	// 	end = argsArray.end;
	// 	readTransactions(start, end);
	// 	break;
	case "saveblocks":
		start = argsArray.start;
		end = argsArray.count;
		// Blocks.latestBlock(function (err, block) {
		// 	start = block.height + 1;
		processBlocks(start, end);
		// });
		break;
	case "saveblocksonly":
		saveBlocksSetup(argsArray.count);
		break;
	case "savetxsonly":
		saveTxsOnly(argsArray.start, argsArray.end);
		break;
	case "calculateaddressbalances":
		calculateAddressBalances();
		break;
	case "getpeerinfo":
		getpeerinfo();
		break;
	case "catchuptxs":
		start = argsArray.start;
		end = argsArray.end;
		catchUpTxs(start, end);
		break;
	case "pavv": // ProcessAddressVinsVouts
		// if(argsArray.continue === "true"){
		// 	start = 1;
		// 	end = argsArray.end;
		// } else {
		start = argsArray.start || 1;
		end = argsArray.end;
		// }
		pavvSetup(start, end);
		break;
	case "nextblocks":
		saveBlocksSetup(argsArray.count, true);
		break;
	case "startblocks":
		startblocks(argsArray.start);
		break;
	case "readfile":
		readfile(argsArray.file, argsArray.start, argsArray.end);
		break;
	case 'findnextblock':
		findNextBlock();
		break;
	case 'blocknotify':
		blockNotify(argsArray.hash);
		break;
	default:
		console.log("command not recognized");
		process.exit();
}

function blockNotify(hash){
	ioncoin.exec('getblock', hash, function (err, block) {
		if(err)
			console.log(err);
		let tmpArray = [];
		tmpArray.push(block);
		saveNextBlock(tmpArray);
	})
}

function findNextBlock(){
	ioncoin.exec('getinfo', function (err, getinfo) {
		let height = getinfo.blocks;

		Blocks.latestBlock((err, latest) => {
			console.log(`latest in db ${latest.height} and ${height} in the coin`);
			if(latest.height < height) {
				ioncoin.exec('getblockbynumber', latest.height + 1, function (err, block) {
					if (err)
						console.log(err);
					let tmpArray = [];
					tmpArray.push(block);

					console.log(tmpArray);

					saveNextBlock(tmpArray);
				})
			} else {
				console.log("CAUGHT UP!!!!!!");
			}
		})
	})
}

function readfile(file, start, end) {
	let fs = require("fs");
	console.log("\n *START* \n");
	let blocksFile = fs.readFileSync(file);

	blocksFile = JSON.parse(blocksFile);
	console.log("Output Content : \n");

	let txsRaw = []; // hold array of all tx's
	let txIdList = []; // hold list of txid's

	for (let i = start; i <= end; i++) {
		txsRaw = blocksFile[`${i}`].tx; // take raw tx's from the block
		// console.log(`txsRaw: txsRaw[${i}]`);
		txsRaw.forEach(tx => {
			txIdList.push(tx.txid);
			tx.blockhash = blocksFile[`${i}`].hash;
			tx.confirmations = blocksFile[`${i}`].confirmations;

			txsFromFile.push(tx);
		});

		// console.log(`${txsRaw["blockhash"]}`);

		blocksFile[`${i}`].tx = txIdList;

		blocksFromFile.push(blocksFile[`${i}`]);
		// txs.push(txsRaw);

		// console.log(`block[${i}]: ${JSON.stringify(blocks[i], null, 2)}`);

		// console.log(JSON.stringify(blocksFromFile, null, 2));

		// clear arrays
		txIdList = [];
		// txsRaw = [];
	}
	saveBlockFromFile(blocksFromFile);
	// console.log("txsFromFile");
	// console.log(JSON.stringify(txsFromFile, null, 2));

	console.log(`txs length: ${txsFromFile.length}`);
	console.log(`blocks length: ${blocksFromFile.length}`);

	// txs.forEach(tx => {
	// 	console.log(JSON.stringify(tx, null,2));
	// });

	console.log("\n *EXIT* \n");
	// process.exit();
}

function saveNextBlock(blocksArray) {
	let createBlockArray = [];
	let createTxArray = [];
	let getTxArray = [];

	console.log(blocksArray);
	timeStarted = new Date();

	blocksArray.forEach(block => {
		// console.log("block", block);
		let obj = {
			hash: block.hash,
			height: block.height,
			raw: block
		};
		totalSaveBlocks++;
		createBlockArray.push(createBlock(obj));
	});

	Promise.all(createBlockArray)
		.then((blocks) => {
			console.log("Resolving createBlockArray");
			blocks.forEach(block => {
				if (!block.err) {
					// console.log("block: " + JSON.stringify(block.raw.tx, null, 2));
					block.raw.tx.forEach(tx => {
						totalGetTx++;
						getTxArray.push(getTx(tx, block));
					})
				} else {
					console.log(block.err)
				}
			});
			Promise.all(getTxArray)
				.then(txs => {
					console.log("Resolving getTxArray");
					txs.forEach(tx => {
						totalSaveTx++;
						createTxArray.push(createTx(tx.tx, tx.block));
					});
					Promise.all(createTxArray)
						.then(() => {
							console.log("resolving createTxArray");
							if (start === 1) {
								pavv(1, 25);
							} else {
								summary();
							}
						});
				})
		})
}

function saveBlockFromFile(blocksArray) {
	let createBlockArray = [];
	let createTxArray = [];
	let getTxArray = [];

	console.log(blocksArray);
	timeStarted = new Date();

	blocksArray.forEach(block => {
		// console.log("block", block);
		let obj = {
			hash: block.hash,
			height: block.height,
			raw: block
		};
		totalSaveBlocks++;
		createBlockArray.push(createBlock(obj));
	});

	Promise.all(createBlockArray)
		.then((blocks) => {
			console.log("Resolving createBlockArray");
			blocks.forEach(block => {
				if (!block.err) {
					// console.log("block: " + JSON.stringify(block.raw.tx, null, 2));
					block.raw.tx.forEach(tx => {
						totalGetTx++;
						getTxArray.push(getTxFromArray(tx, block));
					})
				} else {
					console.log(block.err)
				}
			});
			Promise.all(getTxArray)
				.then(txs => {
					console.log("Resolving getTxArray");
					txs.forEach(tx => {
						totalSaveTx++;
						createTxArray.push(createTx(tx.tx, tx.block));
					});
					Promise.all(createTxArray)
						.then(() => {
							console.log("resolving createTxArray");
							if (start === 1) {
								pavv(1, 25);
							} else {
								summary();
							}
						});
				})
		})
}

function searchForTxidInArray(txid) {
	let chosen = {};
	txsFromFile.forEach(tx => {
		if (tx.txid === txid)
			chosen = tx;
	});
	return chosen;
}

function getTxFromArray(txid, block) {
	return new Promise((resolve, reject) => {
		let tx = searchForTxidInArray(txid);

		completeGetTx++;
		completeGetTxPercent = 100 * (completeGetTx / totalGetTx);
		if (CLEAR_SCREEN)
			console.log('\033c');
		console.log(`Getting Txs: ${completeGetTx} / ${totalGetTx}  ${completeGetTxPercent.toFixed(2)}% complete`);
		resolve({tx, block});
	})
}

function startblocks(start, end) {
	ioncoin.exec('getinfo', function (err, getinfo) {
		if (err) {
			throw err;
		}
		let blockheight = getinfo.blocks;

		let timeout;
		for (let i = 0; i < blockheight; i++) {
			timeout = setTimeout(function () {
				console.log(`1 second ${i} ... gotta wait til ${blockheight}`)
			}, 1000);
		}
		clearTimeout(timeout);
		process.exit();
	})
}

function pavvSetup(startBlock, endBlock) {
	if (startBlock > 1) {
		Vins.latestBlock(function (err, block) {
			startBlock = block.blockheight + 1;
			endBlock = startBlock + end - 1;
			pavv(startBlock, endBlock);
			console.log(`pavv(${startBlock}, ${endBlock})`);
		})
	} else {
		pavv(startBlock, endBlock);
		console.log(`pavv(${start}, ${end})`);
	}
}

function pavv(startBlock, endBlock) {
	let saveAddressArray = [];
	let saveVoutsArray = [];
	let saveVinsArray = [];
	let vinsToProcess = [];
	let voutsForVins = [];
	let vinsForAddress = [];
	let voutsForAddress = [];
	let newAddressesArray = [];

	if (timeStarted === 0) {
		timeStarted = new Date();
	}

	console.log(`{$and: [{blockheight: {$gte: ${startBlock}}}, {blockheight: {$lte: ${endBlock}}}]}`);

	Transactions.find({$and: [{blockheight: {$gte: startBlock}}, {blockheight: {$lte: endBlock}}]})
		.then(txs => {
			console.log("inside transactions.find()");
			txs.forEach(tx => {
				console.log("inside txs.forEach");
				tx.raw.vout.forEach(vout => {
					console.log("inside tx.raw.vout.forEach");
					if (vout.scriptPubKey !== undefined && vout.scriptPubKey.addresses !== undefined) {
						let address = vout.scriptPubKey.addresses[0];
						console.log(address);
						totalSaveAddresses++;
						saveAddressArray.push(saveAddress(address));
						newAddressesArray.push(address);

						totalSaveVouts++;
						saveVoutsArray.push(saveVout(vout, tx.raw, tx.blockheight, address));
					}
					// else {
					// 	console.log(`vout has no 'scriptPubKey'`);
					// }
				});
				tx.raw.vin.forEach(vin => {
					// console.log("inside tx.raw.vin.forEach");
					totalSaveVins++;
					saveVinsArray.push(saveVins(vin, tx.raw, tx.blockheight));
				});
			});
			console.log("waiting on saveAddressArray to finish");
			Promise.all(saveAddressArray)
				.then(() => {
					console.log("all saveAddressArray resolved successfully");
				})
				.catch(err => {
					console.log(err);
				});

			console.log("waiting on saveVoutsArray to finish");
			Promise.all(saveVoutsArray)
				.then(() => {
					console.log("all saveVoutsArray resolved successfully");
				})
				.catch(err => {
					console.log(err);
				});

			console.log("waiting on saveVinsArray to finish");
			Promise.all(saveVinsArray)
				.then(vins => {
					// console.log('inside promise.all(saveVinsArray)');
					vins.forEach(vin => {
						if (vin.raw.txid !== undefined) {
							// console.log("vins.length: ", vins.length);
							// console.log(`processVins(${vin._id})`);
							totalProcessVins++;
							vinsToProcess.push(processVins(vin._id));
						}
					});

					Promise.all(vinsToProcess)
						.then(vins => {
							console.log(`vinsToProcess all resolved ${vins.length} vins`);
							vins.forEach(vin => {
								if (vin !== null) {
									totalVoutsForVins++;
									voutsForVins.push(linkVinsToVouts(vin));
								}
							});

							Promise.all(voutsForVins)
								.then(() => {
									// console.log("inside promise.all for voutsForVins");
									newAddressesArray.forEach(address => {
										// console.log(`voutsForAddress.push(linkVoutsToAddress(${address.address}))`);
										// console.log(`address: ${address}`);
										voutsForAddress.push(linkVoutsToAddress(address, startBlock));
									});
									console.log("finished pushing promises to array");
									Promise.all(voutsForAddress)
										.then(() => {
											newAddressesArray.forEach(address => {
												// console.log(`vinsForAddress.push(linkVinsToAddress(${address.address}))`);
												vinsForAddress.push(linkVinsToAddress(address, startBlock));
											});
											console.log("waiting for vinsForAddress promises to resolve");
											Promise.all(vinsForAddress)
												.then(() => {
													cleanupTxAndAddresses()
														.then(() => {
															console.log("done cleanup...");
															summary();
														});
												})
										})
								})
						})
				})
		})
}

function cleanupTxAndAddresses() {
	let updatedTxs = [];
	let updatedAddresses = [];
	return new Promise((resolve, reject) => {
		Transactions.find({})
			.then(transactions => {
				console.log("found transactions");
				console.log(`transactions.count: ${transactions.length}`);
				transactions.forEach(tx => {
					if (tx.vouts.length > 1 || tx.vins.length > 1) {
						console.log(`each tx with vouts.length > 1 || vins.length > 1 -- ${tx.txid} @ ${tx.vouts.length}`);

						tx.vouts.sort((a, b) => {
							if (a.n < b.n)
								return -1;
							if (a.n > b.n)
								return 1;
							return 0;
						});
						tx.vins.sort((a, b) => {
							if (a.n < b.n)
								return -1;
							if (a.n > b.n)
								return 1;
							return 0;
						});

						let newTxVouts = removeDuplicates(tx.vouts, txVoutsEqual);
						let newTxVins = removeDuplicates(tx.vins, txVinsEqual);

						if (newTxVins.length < tx.vins.length) {
							console.log(`removed ${tx.vins.length - newTxVins.length} duplicates`)
						} else if (newTxVouts.length < tx.vouts.length) {
							console.log(`removed ${tx.vouts.length - newTxVouts.length} duplicates`)
						}

						updatedTxs.push(cleanupTxVoutsVins(tx, newTxVouts, newTxVins));
					}
				});

				Addresses.find({})
					.then(addresses => {
						addresses.forEach(addr => {
							if (addr.ledgerOut.length > 1 || addr.ledgerIn.length > 1) {
								// console.log(`each addr with ledgerIn.length or ledgerOut > 1 -- ${addr.address} @ ledgerIn: ${addr.ledgerIn.length} ledgerOut: ${addr.ledgerOut.length}`);

								addr.ledgerOut.sort((a, b) => {
									if (a.n < b.n)
										return -1;
									if (a.n > b.n)
										return 1;
									return 0;
								});
								addr.ledgerIn.sort((a, b) => {
									if (a.n < b.n)
										return -1;
									if (a.n > b.n)
										return 1;
									return 0;
								});

								let newAddrLedgerOut = removeDuplicates(addr.ledgerOut, addressesLedgerOutEqual);
								let newAddrLedgerIn = removeDuplicates(addr.ledgerIn, addressesLedgerInEqual);

								if (newAddrLedgerIn.length < addr.ledgerIn.length) {
									console.log(`removed ${addr.ledgerIn.length - newAddrLedgerIn.length} duplicates`)
								} else if (newAddrLedgerOut.length < addr.ledgerOut.length) {
									console.log(`removed ${addr.ledgerOut.length - newAddrLedgerOut.length} duplicates`)
								}

								updatedAddresses.push(cleanupAddressLedgers(addr, newAddrLedgerIn, newAddrLedgerOut))
							}
						});

						console.log(`all txs added. ${updatedTxs.length} promises in array`);
						console.log(`all addresses added. ${updatedAddresses.length} promises in array`);

						Promise.all(updatedTxs)
							.then(() => {
								Promise.all(updatedAddresses)
									.then(() => {
										console.log("finished");
										resolve();
									})
							});
					});
			});
	})
}

function cleanupTxVoutsVins(tx, newTxVouts, newTxVins) {
	return new Promise((resolve, reject) => {
		Transactions.findOneAndUpdate({txid: tx.txid},
			{
				$set: {
					vouts: newTxVouts,
					vins: newTxVins
				}
			}, {},
			function (err, newDoc) {
				if (err)
					console.log(err);
				// console.log(`updated transaction ${tx.txid}`);
				resolve(newDoc);
			})
	})
}

function cleanupAddressLedgers(addr, newAddrLedgerIn, newAddrLedgerOut) {
	return new Promise((resolve, reject) => {
		Addresses.findOneAndUpdate({address: addr.address},
			{
				$set: {
					ledgerIn: newAddrLedgerIn,
					ledgerOut: newAddrLedgerOut
				}
			}, {new: true},
			function (err, newDoc) {
				if (err)
					console.log(err);
				// console.log(`updated address ${addr.address}`);
				// if (addr.address === "iZn9pFA6mgATaWmFZhphMA3nqCDRbLQbWg") {
				// 	console.log("iZn9pFA6mgATaWmFZhphMA3nqCDRbLQbWg updated");
				// 	console.log(JSON.stringify(newDoc, null, 2));
				// }
				// console.log("newDoc");
				// console.log(JSON.stringify(newDoc, null, 2));
				resolve(newDoc)
			})
	})
}

function arrayContains(arr, val, equals) {
	let i = arr.length;
	while (i--) {
		if (equals(arr[i], val)) {
			return true;
		}
	}
	return false;
}

function removeDuplicates(arr, equals) {
	let originalArr = arr.slice(0);
	let i, len, val;
	arr.length = 0;

	for (i = 0, len = originalArr.length; i < len; ++i) {
		val = originalArr[i];
		if (!arrayContains(arr, val, equals)) {
			arr.push(val);
		}
	}
	return arr;
}

function txVoutsEqual(thing1, thing2) {
	return thing1.txid === thing2.txid && thing1.n === thing2.n;
}

function txVinsEqual(thing1, thing2) {
	return thing1.txid === thing2.txid && thing1.voutIndex === thing2.voutIndex;
}

function addressesLedgerInEqual(thing1, thing2) {
	return thing1.txid === thing2.txid && thing1.n === thing2.n;
}

function addressesLedgerOutEqual(thing1, thing2) {
	return thing1.txid === thing2.txid && thing1.voutIndex === thing2.voutIndex;
}

function catchUpTxs(startBlock, endBlock) {
	let saveAddressArray = [];
	let saveVoutsArray = [];
	let saveVinsArray = [];
	let vinsToProcess = [];
	let voutsForVins = [];
	let vinsForAddress = [];
	let voutsForAddress = [];
	let getTxArray = [];
	let createTxArray = [];
	timeStarted = new Date();
	Blocks.find({$and: [{height: {$gte: startBlock}}, {height: {$lte: endBlock}}]})
		.then(blocks => {
			blocks.forEach(block => {
				if (!block.err) {
					block.raw.tx.forEach(tx => {
						totalGetTx++;
						getTxArray.push(getTx(tx, block));
					})
				}
			});
			Promise.all(getTxArray)
				.then(txs => {
					console.log("Resolving getTxArray");
					let lastBlock = 0;
					txs.forEach(tx => {
						totalSaveTx++;
						createTxArray.push(createTx(tx.tx, tx.block));
						lastBlock = tx.block.height;
					});
					Promise.all(createTxArray)
						.then(txs => {
							console.log("resolving createTxArray");
							txs.forEach(tx => {
								if (!tx.hasOwnProperty("dupe")) {
									tx.raw.vout.forEach(vout => {
										let address = vout.scriptPubKey.addresses[0];

										totalSaveAddresses++;
										saveAddressArray.push(saveAddress(address));

										totalSaveVouts++;
										saveVoutsArray.push(saveVout(vout, tx.raw, tx.blockheight, address));
									});
									tx.raw.vin.forEach(vin => {
										totalSaveVins++;
										saveVinsArray.push(saveVins(vin, tx.raw, tx.blockheight));
									});
								}
							});

							Promise.all(saveAddressArray)
								.then(addresses => {
									console.log("all saveAddressArray resolved successfully");
								})
								.catch(err => {
									console.log("Caught from promise.all(saveVinsArray)");
									if (err.code !== 11000)
										console.log(err);
								});

							Promise.all(saveVoutsArray)
								.then(vouts => {
									console.log("all saveVoutsArray resolved successfully");
								})
								.catch(err => {
									console.log("Caught from promise.all(saveVinsArray)");
									console.log(err);
								});

							Promise.all(saveVinsArray)
								.then(vins => {
									Vins.find({"raw.txid": {$exists: true}})
										.then(foundVins => {
											// console.log("vins.length: ", vins.length);
											foundVins.forEach((vin) => {
												totalProcessVins++;
												vinsToProcess.push(processVins(vin._id));
											});

											Promise.all(vinsToProcess)
												.then(vins => {
													vins.forEach(vin => {
														totalVoutsForVins++;
														voutsForVins.push(linkVinsToVouts(vin));
													});

													Promise.all(voutsForVins)
														.then(newVins => {
															console.log("inside promise.all for voutsForVins");
															Addresses.find({})
																.then(findAddresses => {
																	findAddresses.forEach(address => {
																		voutsForAddress.push(linkVoutsToAddress(address.address));
																	});
																	console.log("finished pushing promises to array");
																	Promise.all(voutsForAddress)
																		.then(addresses => {
																			findAddresses.forEach(address => {
																				// console.log(`vinsForAddress.push(linkVinsToAddress(${address.address}))`);
																				vinsForAddress.push(linkVinsToAddress(address.address));
																			});
																			Promise.all(vinsForAddress)
																				.then(addresses => {
																					summary();
																				})
																				.catch(err => {
																					throw err;
																				});
																		}).catch(err => {
																		throw err;
																	});
																});
														})
												})
												.catch(err => {
													console.log(err);
												})
										})
										.catch(err => {
											console.log(err);
										})
								})
								.catch(err => {
									console.log("Caught from promise.all(saveVinsArray)");
									console.log(err);
								})

						});
				})
		})
}

function getpeerinfo() {
	let peerPromises = [];
	ioncoin.exec('getpeerinfo', function (err, peers) {
		if (err) {
			throw err;
		}
		peers.forEach(peer => {
			peerPromises.push(createPeer(peer));
		});
		Promise.all(peerPromises)
			.then(peers => {
				Peers.find({})
					.then(peers => {
						peers.forEach(peer => {
							let oneDayMilliseconds = 24 * 60 * 60 * 1000;
							let now = parseInt(Date.now());
							// console.log(`peer.lastsend:                ${peer.lastsend * 1000}`);
							// console.log(`oneDayMilliseconds:           ${oneDayMilliseconds}`);
							// console.log(`lastsend + oneDayMilliseconds:${(peer.lastsend * 1000) + oneDayMilliseconds}`);
							// console.log(`now:                          ${now}`);
							peers.forEach(peer => {
								if ((peer.lastsend * 1000) + oneDayMilliseconds <= now ||
									((peer.lastrecv * 1000) + oneDayMilliseconds <= now)) {
									Peers.remove({addr: peer.addr}, (err, result) => {
										console.log(`removed ${result}`);
									});
								}
							})
						});
						process.exit();
					})
			});
	})
}

function createPeer(peer) {
	return new Promise((resolve, reject) => {
		fetchGeoIPInfo(peer.addr.split(":")[0])
			.then(geodata => {

				peer["country_code"] = geodata.country_code;
				peer["country_name"] = geodata.country_name;
				peer["region_code"] = geodata.region_code;
				peer["region_name"] = geodata.region_name;
				peer["city"] = geodata.city;
				peer["zip_code"] = geodata.zip_code;
				peer["time_zone"] = geodata.time_zone;
				peer["latitude"] = geodata.latitude;
				peer["longitude"] = geodata.longitude;
				peer["metro_code"] = geodata.metro_code;

				Peers.create(peer, function (err, peerinfo) {
					if (err && err.code === 11000) {
						console.log("updating information");
						Peers.findOneAndUpdate({addr: peer.addr},
							{
								$set: {
									lastsend: peer.lastsend,
									lastrecv: peer.lastrecv,
									bytessent: peer.bytessent,
									bytesrecv: peer.bytesrecv,
									pingtime: peer.pingtime
								}
							}, {},
							function (err, newDoc) {
								if (err)
									throw err;
								resolve(newDoc);
							}
						);

					} else if (err) {
						console.log(err);
					} else {
						console.log(`saved a peer ${peerinfo.addr}`);
						resolve(peerinfo);
					}

				})
			});
	})
}

function fetchGeoIPInfo(ipaddr) {
	return new Promise((resolve, reject) => {
		fetch(`http://freegeoip.net/json/${ipaddr}`)
			.then((data) => {
				data.json().then((data) => {
					resolve(data);
				});
			});
	})
}

function saveBlocksSetup(end, inLoop) {
	Blocks.latestBlock(function (err, block) {
		if (!err) {
			if (block === null) {
				start = 1;
			} else {
				start = block.height;
				console.log(`starting at ${block.height}`);
			}
			if (inLoop)
				saveBlocks(start + 1, end, true);
			else
				saveBlocks(start + 1, end, false);
		} else {
			throw err;
		}
	});
}

function saveBlocks(start, end, inLoop) {
	let getBlockArray = [];
	let createBlockArray = [];
	let createTxArray = [];
	let getTxArray = [];

	timeStarted = new Date();

	// let start = 0;
	// console.log(`start @ ${start}`);

	for (let i = start; i < start + end; i++) {
		totalGetBlocks++;
		// console.log(`on block ${i}`);
		getBlockArray.push(getBlockByNumber(i));
	}

	Promise.all(getBlockArray)
		.then(blocks => {
			console.log("Resolving getBlockArray");
			blocks.forEach(block => {
				// console.log("block", block);
				let obj = {
					hash: block.hash,
					height: block.height,
					raw: block
				};
				totalSaveBlocks++;
				createBlockArray.push(createBlock(obj));
			});

			Promise.all(createBlockArray)
				.then((blocks) => {
					console.log("Resolving createBlockArray");
					blocks.forEach(block => {
						if (!block.err) {
							block.raw.tx.forEach(tx => {
								totalGetTx++;
								getTxArray.push(getTx(tx, block));
							})
						}
					});
					Promise.all(getTxArray)
						.then(txs => {
							console.log("Resolving getTxArray");
							txs.forEach(tx => {
								totalSaveTx++;
								createTxArray.push(createTx(tx.tx, tx.block));
							});
							Promise.all(createTxArray)
								.then(txs => {
									console.log("resolving createTxArray");
									if (inLoop) {
										pavv(2, end);
									} else {
										if (start === 1) {
											pavv(1, 25);
										} else {
											summary();
										}
									}
								});
						})
				})
		});

}

function saveHashes(start, count) {
	let cnt = 0;
	let blockWrites = [];
	rl.on('line', function (hash) {
		// console.log(`start ${typeof start} ${start} count ${typeof count} cnt >= start ${cnt >= start} ${count} start+count = ${start+count} cnt <= start+count ${cnt <= start+count}`);
		if (cnt >= start && cnt <= start + count - 1) {
			ioncoin.exec('getblock', hash, function (err, info) {
				let obj = {
					hash: info.hash,
					height: info.height,
					raw: info
				};

				Blocks.create(obj)
					.then((block) => {
						console.log(`writing to the db... height ${block.height}`);
					})
					.catch(function (err) {
						if (err && err.code === 11000) {
							console.log("duplicate block hash key...");
						} else if (err) {
							throw err;
						}
					});
			});
		} else if (cnt > start + count) {
			rl.close();
			console.log("closed readline");
		}
		cnt++;
	});
	// rl.on('close', function(data, data1){
	// 	console.log("close data: ", data);
	// 	console.log("close data1: ", data1);
	// 	Promise.all(blockWrites)
	// 		.then(function(results, results1){
	// 			console.log("results: ", results);
	// 			console.log("results1: ", results1);
	// 			console.log("resolved all promises");
	// 			// results.forEach(function(block){
	// 			// 	console.log("data: ", block);
	// 			// })
	// 		});
	// })
}

function saveBlockHashes() {
	let stream = fs.createWriteStream("hashes.txt");
	stream.once('open', function (fd) {
		Blocks.find({}).sort({height: 1}).exec((err, blocks) => {
			blocks.forEach((block) => {
				console.log(`saving ${block.hash} to file`);
				stream.write(`${block.hash}\n`);
			});
			console.log("done");
			stream.end();
		})
	});
}

function checkBlocks(toHeight, fromHeight = 1) {
	for (let i = fromHeight; i < toHeight + 1; i++) {
		Blocks.findOne({height: i}, function (err, doc) {
				if (doc === null) {
					console.log(`not found at block ${i}`);
					i = toHeight + 10;
				}
				if (i + 1 === toHeight) {
					console.log("done");
				}
			}
		);
	}
}

function readAddress(address) {
	Addresses.findOne({address: address}, function (err, doc) {
		if (err)
			throw err;
		console.log(doc);
	})
}

// function saveBlocks(start, count) {
// 	console.log("inside saveBlocks()");
// 	console.log("start", start);
// 	console.log("count", count);
// 	for (let i = start; i < start + count; i++) {
// 		setTimeout(function () {
// 			saveBlock(i);
// 		}, 750);
// 	}
// }

function calculateAddressBalances() {
	Addresses.find({})
		.then(addresses => {
			addresses.forEach(address => {
				let ledger = address.ledgerIn.concat(address.ledgerOut).sort((a, b) => {
					// swap signs of the return 1's to switch between ascending and descending
					if (a.blockheight < b.blockheight)
						return -1;
					if (a.blockheight > b.blockheight)
						return 1;
					return 0;
				});
				console.log("after sort");
				calculateBalances(address, ledger)
					.then(() => {
						recountRichlist()
							.then(() => {
								console.log("done");
								process.exit();
							});
					})
			})
		});
}

function updateRichlist() {
	let addressObj = {};
	let richList = [];
	Addresses.richList((err, addresses) => {
		addresses.forEach((address, i) => {
			addressObj = {
				id: address._id,
				rank: i + 1,
				address: address.address,
				amount: address.balance
			};
			richList.push(addressObj);

			Addresses.findOneAndUpdate({address: address.address},
				{
					$set: {
						rank: i + 1
					}
				}, {},
				function (err, newDoc) {
					if (err)
						throw err;
				})
		});
	})
}

/* This will calculate the totalSent, totalReceived, runningBalance and total balance
 for each given address. the ledger parameter must be a concatenated, in order array
 of ledgerOut and ledgerIns
*/
function calculateBalances(address, ledger) {
	return new Promise((resolve) => {
		console.log("in calcbalance promise");
		// console.log(JSON.stringify(ledger, null, 2));
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
			{address: address.address},
			{
				$set: {
					balance: runningBalance
				}
			}, {},
			function (err, addrDoc) {
				if (err)
					throw err;
				console.log(`updated ${addrDoc.address} to balance ${addrDoc.balance}`)
			}
		);

		address.balance = runningBalance;
		address.ledger = ledger;
		address.totalReceived = totalReceived;
		address.totalSent = totalSent;
		console.log(`totalSent: ${address.totalSent}`);
		console.log(`totalReceived: ${address.totalReceived}`);
		resolve(address);
	})
}

function recountRichlist() {
	return new Promise((resolve, reject) => {
		Addresses.wholeRichList((err, addresses) => {
			addresses.forEach((address, i) => {
				Addresses.findOneAndUpdate({address: address.address},
					{
						$set: {
							rank: i + 1
						}
					}, {new: true},
					function (err, newDoc) {
						if (err)
							throw err;
						console.log(newDoc.address);
					})
			});
			resolve();
		})
	})
}

function processBlocks(start, count) {
	console.log(`inside processBlocks(${start}, ${count})`);
	timeStarted = new Date();
	// totalBlocks = count;
	let getBlockArray = [];
	let createBlockArray = [];
	let getTxArray = [];
	let createTxArray = [];
	let saveAddressArray = [];
	let saveVoutsArray = [];
	let saveVinsArray = [];
	let vinsToProcess = [];
	let voutsForVins = [];
	let vinsForAddress = [];
	let voutsForAddress = [];
	// const blocksProgressBar = new ProgressBar('processing [:bar] :percent', {total: totalBlocks, incomplete: ' ', complete:'*'});
	for (let i = start; i < start + count; i++) {
		totalGetBlocks++;
		getBlockArray.push(getBlockByNumber(i));
	}

	Promise.all(getBlockArray)
		.then(blocks => {
			console.log("Resolving getBlockArray");
			blocks.forEach(block => {
				// console.log("block", block);
				let obj = {
					hash: block.hash,
					height: block.height,
					raw: block
				};
				totalSaveBlocks++;
				createBlockArray.push(createBlock(obj));
			});
			Promise.all(createBlockArray)
				.then((blocks) => {
					console.log("Resolving createBlockArray");
					blocks.forEach(block => {
						if (!block.err) {
							block.raw.tx.forEach(tx => {
								totalGetTx++;
								getTxArray.push(getTx(tx, block));
							})
						}
					});
					Promise.all(getTxArray)
						.then(txs => {
							console.log("Resolving getTxArray");
							txs.forEach(tx => {
								totalSaveTx++;
								createTxArray.push(createTx(tx.tx, tx.block));
							});
							Promise.all(createTxArray)
								.then(txs => {
									console.log("resolving createTxArray");
									txs.forEach(tx => {
										if (tx.dupe === undefined) {
											tx.raw.vout.forEach(vout => {
												console.log(vout);
												let address = vout.scriptPubKey.addresses[0];

												totalSaveAddresses++;
												saveAddressArray.push(saveAddress(address));

												totalSaveVouts++;
												saveVoutsArray.push(saveVout(vout, tx.raw, tx.blockheight, address));
											});
											tx.raw.vin.forEach(vin => {
												totalSaveVins++;
												saveVinsArray.push(saveVins(vin, tx.raw, tx.blockheight));
											});
										}
									});

									Promise.all(saveAddressArray)
										.then(() => {
											console.log("all saveAddressArray resolved successfully");
										});

									Promise.all(saveVoutsArray)
										.then(() => {
											console.log("all saveVoutsArray resolved successfully");
										});

									Promise.all(saveVinsArray)
										.then(() => {
											Vins.find({"raw.txid": {$exists: true}})
												.then(foundVins => {
													// console.log("vins.length: ", vins.length);
													foundVins.forEach((vin) => {
														totalProcessVins++;
														console.log(`processVins(${vin._id})`);
														vinsToProcess.push(processVins(vin._id));
													});

													Promise.all(vinsToProcess)
														.then(vins => {
															console.log(`vinsToProcess all resolved ${vins.length} vins`);
															vins.forEach(vin => {
																totalVoutsForVins++;
																voutsForVins.push(linkVinsToVouts(vin));
															});

															Promise.all(voutsForVins)
																.then(newVins => {
																	console.log("inside promise.all for voutsForVins");
																	Addresses.find({})
																		.then(findAddresses => {
																			findAddresses.forEach(address => {
																				voutsForAddress.push(linkVoutsToAddress(address.address));
																			});
																			console.log("finished pushing promises to array");
																			Promise.all(voutsForAddress)
																				.then(addresses => {
																					findAddresses.forEach(address => {
																						// console.log(`vinsForAddress.push(linkVinsToAddress(${address.address}))`);
																						vinsForAddress.push(linkVinsToAddress(address.address));
																					});
																					Promise.all(vinsForAddress)
																						.then(() => {
																							cleanupTxAndAddresses()
																								.then(() => {
																									console.log("done cleanup");
																									// summary();
																								});
																						})
																				})
																		});
																})
														})
												})
										})
								})
						})
				})
		})
}

function linkVinsToAddress(address, aboveHeight = 1) {
	return new Promise((resolve, reject) => {
		// console.log(`linkVinsToAddress(${address})`);
		Vins.find({$and: [{address: address}, {blockheight: {$gte: aboveHeight}}]})
			.then(vins => {
				if (vins.length > 0) {
					vins.forEach(vin => {
						// if (vin.blockheight >= aboveHeight) {
							// console.log(`finding ${vin._id}`);
							let newBalance = 0;
							Addresses.findOne({address: vin.address})
								.then(address => {
									// console.log(`finding address ${vin.address}`);
									newBalance = address.balance;

									let vinObj = {
										txid: vin.raw.txid,
										voutIndex: vin.voutIndex,
										value: vin.value,
									};

									console.log(`balance before ${newBalance} for ${vin.address}`);
									newBalance -= vin.value;
									console.log(`subtracting ${vin.value} from balance = ${newBalance} for ${vin.address}`);

									Addresses.findOneAndUpdate({address: vin.address},
										{
											$push: {
												ledgerOut: {
													runningBalance: newBalance,
													txid: vin.thisTxid,
													voutIndex: vin.voutIndex,
													value: vin.value,
													time: vin.time,
													blockheight: vin.blockheight,
													type: "-"
												},
											},
											$set: {
												balance: newBalance
											}
										},
										{new: true},
										function (err, newDoc) {
											if (err) {
												console.log("rejecting with err: ", err);
												// reject(err);
											}
											else {
												console.log(`successfully updated Address ${newDoc.address} with vin`)
											}
										}
									);

									let txVinObj = vinObj;
									txVinObj['address'] = vin.address;

									Transactions.findOneAndUpdate({txid: vin.thisTxid},
										{
											$push: {
												vins: txVinObj
											}
										}, {new: true},
										function (err, newDoc) {
											if (err) {
												console.log("rejecting with err: ", err);
												// reject(err);
											}
											else {
												console.log(`resolving after transactions.findOneAndUpdate(txid: ${newDoc.txid})`);
												resolve(newDoc);
											}
										})
								});
						// }
					})
				} else {
					resolve({address: null});
				}
			})
	})
}

function linkVoutsToAddress(address, aboveHeight = 1) {
	return new Promise((resolve, reject) => {
		console.log(`linkVoutstoAddress(${address})`);
		//{ $and: [ { "address": "idUjqdpEqcS86UfrzGEzDXv4yGZChat5jV" }, { "blockheight": { $gte: NumberInt(2000) } } ] }
		Vouts.find({$and: [{address: address}, {blockheight: {$gte: aboveHeight}}]})
			.then(vouts => {
				console.log(`${vouts.length} vouts for address ${address}`);
				if (vouts.length > 0) {
					vouts.forEach(vout => {
						// if (vout.blockheight >= aboveHeight) {
						let newBalance = 0;
						Addresses.findOne({address: vout.address})
							.then((address) => {
								newBalance = address.balance || 0;

								let voutObj = {
									txid: vout.txid,
									n: vout.n,
									value: vout.value,
									time: vout.time
								};

								newBalance += vout.value;
								Addresses.findOneAndUpdate({address: vout.address},
									{
										$push: {
											ledgerIn: {
												runningBalance: newBalance,
												txid: vout.txid,
												n: vout.n,
												value: vout.value,
												time: vout.time,
												blockheight: vout.blockheight,
												type: "+"
											}
										},
										$set: {
											balance: newBalance
										}
									},
									{new: true},
									function (err) {
										if (err) {
											console.log(" ------------------------------------------------------- rejecting with err: ------------------------------------------------------- \n", err);
											resolve(err);
										}
									}
								);

								let txVoutObj = voutObj;
								txVoutObj['address'] = vout.address;

								console.log(`voutObj to be added to ${vout.txid}`);
								Transactions.findOneAndUpdate(
									{txid: vout.txid},
									{
										$push: {
											vouts: txVoutObj
										}
									}, {new: true},
									function (err, newDoc) {
										if (err) {
											console.log("----------------- rejecting with err: -----------------", err);
											resolve(err);
										} else {
											console.log(`finished Transactions.findOneAndUpdate({txid: ${vout.txid} ${vout.n}) @ ${Date.now()}`);
											// console.log(`newDoc: ${newDoc}}) `);
											resolve(newDoc);
										}
									}
								)
							})
						// }
					})
				} else {
					console.log(`inside linkVoutsToAddress resolve null because vout==null ${address}`);
					resolve({address: null})
				}
			})
	})
}

function linkVinsToVouts(vin, aboveHeight = 1) {
	return new Promise((resolve, reject) => {
		// console.log(`finding {txid:${vin.raw.txid}, n:${vin.raw.vout}}`);
		Vouts.findOne({txid: vin.raw.txid, n: vin.raw.vout})
			.then(vout => {
				if (vout !== null) {
					if (vout.blockheight >= aboveHeight) {
						let query = {
							"raw.txid": vout.txid,
							"raw.vout": vout.n
						};

						Vins.findOneAndUpdate(
							query,
							{
								$set: {
									"vout": vout._id,
									"txid": vout.txid,
									"voutIndex": vout.n,
									"value": vout.value,
									"address": vout.address
								}
							},
							{new: true},
							(err, doc) => {
								if (err) {
									linkVinsToVoutsRejected++;
									reject(err);
								}
								completeVoutsForVins++;
								completeVoutsForVinsPercent = 100 * (completeVoutsForVins / totalVoutsForVins);
								if (CLEAR_SCREEN)
									console.log('\033c');
								console.log(`Processing VoutsForVins: ${completeVoutsForVins} / ${totalVoutsForVins} ${completeVoutsForVinsPercent.toFixed(2)}% complete`);
								linkVinsToVoutsResolved++;
								resolve(doc);
							}
						)
					} else {
						// console.log('reject');
						resolve("vout null");
					}
				}
			})
	})
}

function processVins(vinObjId) {
	return new Promise((resolve, reject) => {
		// console.log(`find {_id: ${vinObjId}}`);
		Vins.findOne({_id: vinObjId})
			.then(vin => {
				completeProcessVins++;
				completeProcessVinsPercent = 100 * (completeProcessVins / totalProcessVins);
				if (CLEAR_SCREEN)
					console.log('\033c');
				console.log(`Processing Vins: ${completeProcessVins} / ${totalProcessVins} ${completeProcessVinsPercent.toFixed(2)}% complete`);

				resolve(vin);
			})
			.catch(err => {
				reject(err);
			})
	})
}

//#region Summary()
function summary(data) {
	let finished = new Date();
	let timeDiff = finished - timeStarted; //in ms
	// strip the ms
	timeDiff /= 1000;
	// get seconds
	let seconds = Math.round(timeDiff);

	console.log(`Summary:`);
	console.log(`Took ${seconds} seconds`);

	console.log(`Total Blocks ${totalSaveBlocks} Last block saved `);
	console.log(`Total Transactions ${totalSaveTx}`);
	console.log(`Total Addresses ${totalSaveAddresses}`);
	console.log(`Total Vins ${totalSaveVins}`);
	console.log(`Total Vouts ${totalSaveVouts}`);
	console.log(`Total Processed Vins ${totalProcessVins}`);
	console.log(`Total Link Vins to Vouts Rejected ${linkVinsToVoutsRejected}`);

	if (data)
		console.log(data);

	process.exit();
}

//#endregion

function saveVins(vin, tx, blockheight) {
	return new Promise((resolve, reject) => {
		// console.log("saveVINS()");
		Vins.create(
			{
				raw: vin,
				thisTxid: tx.txid,
				prevTxid: vin.txid,
				time: tx.time,
				blockheight: blockheight,
			}, function (err, vout) {
				// if (err)
				// 	reject(err);

				if (err && err.code === 11000) {
					console.log("skip");
					resolve(err);
				} else {
					Vouts.findOneAndUpdate({txid: vin.txid, n: vin.voutIndex},
						{
							$set: {
								spent: true,
								spentTxid: tx.txid
							}
						}, {},
						function (err) {
							completeSaveVins++;
							completeSaveVinsPercent = 100 * (completeSaveVins / totalSaveVins);
							if (CLEAR_SCREEN)
								console.log('\033c');
							console.log(`Saving Vins: ${completeSaveVins} / ${totalSaveVins} ${completeSaveVinsPercent.toFixed(2)}% complete`);
							resolve(vout);
						}
					);
				}
			})
	})
}

function saveVout(vout, tx, blockheight, address) {
	return new Promise((resolve, reject) => {
		// console.log("saveVOUT()");
		let voutObj = {
			raw: vout,
			n: vout.n,
			value: vout.value,
			address: address,
			txid: tx.txid,
			blockheight: blockheight,
			time: tx.time
		};

		Vouts.create(voutObj, function (err, vout) {
			if (err)
				reject(err);

			completeSaveVouts++;
			completeSaveVoutsPercent = 100 * (completeSaveVouts / totalSaveVouts);
			if (CLEAR_SCREEN)
				console.log('\033c');
			console.log(`Saving Vouts: ${completeSaveVouts} / ${totalSaveVouts} ${completeSaveVoutsPercent.toFixed(2)}% complete`);
			resolve(vout);
		})
	})
}

function saveAddress(address) {
	return new Promise((resolve, reject) => {
		console.log("saveADDRESS()");
		Addresses.create({address}, function (err, address) {
			if (err && err.code === 11000) {
				console.log("error 11000 ... dupe address... moving on...");
				resolve({address: "dupe"});
				// }
				// else if (err) {
				// reject(err);
			} else {
				completeSaveAddresses++;
				completeSaveAddressesPercent = 100 * (completeSaveAddresses / totalSaveAddresses);
				if (CLEAR_SCREEN)
					console.log('\033c');
				console.log(`Saving Addresses: ${completeSaveAddresses} / ${totalSaveAddresses} ${completeSaveAddressesPercent.toFixed(2)}% complete`);
				resolve(address);
			}
		})
	})
}

function createTx(tx, block) {
	return new Promise((resolve, reject) => {
		let txObj = {
			raw: tx,
			txid: tx.txid,
			blockhash: tx.blockhash,
			blockheight: block.height
		};

		Transactions.create(txObj, function (err, tx) {
			if (err && err.code === 11000) {
				console.log("Duplicate txid key... skipping");
				resolve({dupe: "dupe"})
			} else if (err) {
				reject(err);
			} else {
				Blocks.findOneAndUpdate({hash: block.hash},
					{
						$push: {
							"meta.tx": txObj.raw
						},
					}, {},
					function (err) {
						if (err)
							throw err;
						completeSaveTx++;
						completeSaveTxPercent = 100 * (completeSaveTx / totalSaveTx);
						if (CLEAR_SCREEN)
							console.log('\033c');
						console.log(`Saving Tx: ${completeSaveTx} / ${totalSaveTx} ${completeSaveTxPercent.toFixed(2)}% complete`);
						resolve(tx);
					});
			}
		});
	})
}

function getTx(txid, block) {
	return new Promise((resolve, reject) => {
		ioncoin.exec('gettransaction', txid, function (err, tx) {
			console.log(tx);
			if (err)
				throw err;
			completeGetTx++;
			completeGetTxPercent = 100 * (completeGetTx / totalGetTx);
			if (CLEAR_SCREEN)
				console.log('\033c');
			console.log(`Getting Txs: ${completeGetTx} / ${totalGetTx}  ${completeGetTxPercent.toFixed(2)}% complete`);
			resolve({tx, block});
		});
	})
}

function createBlock(blockObj) {
	return new Promise((resolve, reject) => {
		Blocks.create(blockObj).then(block => {
			// console.log("create block");
			// if(err)
			// 	reject(err);
			completeSaveBlocks++;
			// console.log("completSaveBlocks", completeSaveBlocks);
			completeSaveBlocksPercent = 100 * (completeSaveBlocks / totalSaveBlocks);
			if (CLEAR_SCREEN)
				console.log('\033c');
			console.log(`Saving Blocks: ${completeSaveBlocks} / ${totalSaveBlocks} ${completeSaveBlocksPercent.toFixed(2)}% complete`);

			resolve(block);
		})
			.catch(err => {
				if (err.code === 11000) {
					// console.log(err);
					resolve({err: "duplicate"});
				}
				else {
					console.log("rejecting Blocks.create(blockObj)", err);
					reject(err);
				}
			})
	})
}

function saveTransaction(txid, block) {
	return new Promise((reject, resolve) => {
		ioncoin.exec('gettransaction', txid, function (err, info) {
			console.log("saveTransaction() -> txid ", txid);
			if (err)
				throw err;

			let obj = {
				raw: info
			};

			Transactions.create(obj, function (err, tx) {
				if (err && err.code === 11000) {
					console.log("Duplicate txid key... skipping");
				} else if (err) {
					throw err;
				} else {
					Blocks.findOneAndUpdate({hash: block.hash},
						{
							$push: {
								"meta.tx": info
							},
						}, {},
						function (err) {
							if (err)
								throw err;
							console.log(`updated ${block.hash}`);
							resolve(tx);
						});
					// processIOsForTx(info.vout, info.vin, txid, blockInfo, tx);
				}
			});
		});
	});
}

function getBlockByNumber(blockNumber) {
	return new Promise((resolve, reject) => {
		ioncoin.exec('getblockbynumber', blockNumber, function (err, info) {
			if (err) {
				console.log("rejecting getblockbynumber", err);
				reject(err);
				throw err;
			}
			completeGetBlocks++;
			completeGetBlocksPercent = 100 * (completeGetBlocks / totalGetBlocks);
			if (CLEAR_SCREEN)
				console.log('\033c');
			console.log(`Getting Blocks: ${completeGetBlocks} / ${totalGetBlocks} ${completeGetBlocksPercent.toFixed(2)}% complete`);
			// console.log(info);
			setTimeout(() => {
				resolve(info);
			}, 1000);
		});
	})
}