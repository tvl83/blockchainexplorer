let mongoose = require('mongoose');

const aboutIonSchema = mongoose.Schema({
	name: String,
	algorithm: String,
	walletVersion: String,
	website: String,
	bitcoinTalk: String,
	socialNets: [String],
	sourceCode: String,
	firstblock: Number,
	getinfo: {
		version: String,
		protocolversion: Number,
		walletversion: Number,
		balance: Number,
		stashedsend_balance: Number,
		newmint: Number,
		stake: Number,
		blocks: Number,
		timeoffset: Number,
		moneysupply: Number,
		connections: Number,
		proxy: String,
		ip: String,
		difficulty: Number,
		testnet: Boolean,
		keypoololdest: Number,
		keypoolsize: Number,
		paytxfee: Number,
		mininput: Number,
		errors: String
	}
});

let AboutIon = mongoose.model('AboutIon', aboutIonSchema);

module.exports = AboutIon;