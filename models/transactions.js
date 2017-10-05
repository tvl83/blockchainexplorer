let mongoose = require('mongoose');
const arrayUniquePlugin = require('mongoose-unique-array');

const voutsArraySchema = mongoose.Schema({
	txid: String,
	n: Number,
	value: Number,
	time: Number,
	address: String
});

const vinsArraySchema = mongoose.Schema({
	txid: String,
	voutIndex: Number,
	value: Number,
	address: String
});

const transactionSchema = mongoose.Schema({
	raw: {
		txid: {type: String, unique: true},
		version: Number,
		time: Number,
		locktime: Number,
		vin: Array,
		vout: Array,
		blockhash: String,
		confirmations: Number,
		blocktime: Number
	},
	txid: {type: String, unique: true, index: true},
	totalValueIn: Number,
	totalValueOut: Number,
	rawVins: [],
	rawVouts: [],
	blockheight: {type: Number, index: true},
	blockhash: String,
	vins: [{type: vinsArraySchema, unique: true}],
	vouts: [{type: voutsArraySchema, unique: true}]
});

transactionSchema.plugin(arrayUniquePlugin);

transactionSchema.statics.latestBlock = function (cb) {
	this.findOne()
		.sort('-blockheight')
		.exec(cb);
};

transactionSchema.index({"txid": 1, "vouts": [{"n": 1, "value": 1}]}, {unique: true});


let Transactions = mongoose.model('Transactions', transactionSchema);

module.exports = Transactions;