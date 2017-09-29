let mongoose = require('mongoose');

const scriptPubKeySchema = mongoose.Schema({
	asm: String,
	hex: String,
	reqSigs: Number,
	type: String,
	addresses: Array
});

const voutRawSchema = mongoose.Schema({
	value: Number,
	n: Number,
	scriptPubKey: scriptPubKeySchema
});

const voutsSchema = mongoose.Schema({
	raw: voutRawSchema,
	spent: Boolean,
	spentTxid: String,
	txid: {type: String, index: true},
	n: Number,
	blockheight: {type: Number, index: true},
	value: Number,
	address: {type: String, index: true},
	time: Number,
	tx: {type: mongoose.Schema.Types.ObjectId, ref: 'Transactions'}
});

voutsSchema.statics.latestBlock = function (cb) {
	this.findOne()
		.sort('-blockheight')
		.exec(cb);
};

voutsSchema.index({txid:1, n: 1}, { unique: true });

let Vouts = mongoose.model('Vouts', voutsSchema);

module.exports = Vouts;