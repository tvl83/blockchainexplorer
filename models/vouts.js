let mongoose = require('mongoose');

const scriptPubKeySchema = mongoose.Schema({
	asm: String,
	hex: String,
	reqSigs: Number,
	type: String,
	addresses: {type: Array, index: true}
});

const voutRawSchema = mongoose.Schema({
	value: Number,
	n: Number,
	scriptPubKey: scriptPubKeySchema
});

const voutsSchema = mongoose.Schema({
	raw: voutRawSchema,
	spent: {type: Boolean, index: true},
	spentTxid: {type: String, index: true},
	txid: {type: String, index: true},
	n: {type: Number, index: true},
	blockheight: {type: Number, index: true},
	value: {type: Number, index: true},
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