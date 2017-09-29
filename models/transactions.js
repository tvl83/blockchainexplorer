let mongoose = require('mongoose');

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
	blockheight: Number,
	blockhash: String,
	vins: [
		{
			txid: String,
			voutIndex: Number,
			value: Number,
			address: String
		}
	],
	vouts: [
		{
			txid: String,
			n: Number,
			value: Number,
			time: Number,
			address: String
		}
	]
});

transactionSchema.statics.latestBlock = function (cb) {
	this.findOne()
		.sort('-blockheight')
		.exec(cb);
};

let Transactions = mongoose.model('Transactions', transactionSchema);

module.exports = Transactions;