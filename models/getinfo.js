let mongoose = require('mongoose');

const getInfoSchema = mongoose.Schema({
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
	_errors: String
});

let GetInfo = mongoose.model('GetInfo', getInfoSchema);

module.exports = GetInfo;