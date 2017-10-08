let mongoose = require('mongoose');

const rawBlockSchema = mongoose.Schema({
	hash: {type: String, unique: true, index: true},
	confirmations: Number,
	size: Number,
	height: {type: Number, index: true},
	version: Number,
	merkleroot: String,
	mint: Number,
	time: Number,
	nonce: Number,
	bits: String,
	difficulty: Number,
	blocktrust: String,
	chaintrust: String,
	previousblockhash: String,
	flags: String,
	proofhash: String,
	entropybit: Number,
	modifier: String,
	modifierv2: String,
	tx: Array,
	signature: String
});

const metaBlockSchema = mongoose.Schema({
	tx: [{type: mongoose.Schema.Types.ObjectId, ref: 'Transactions'}]
});

const vinsSchema = mongoose.Schema({
		txid: String,
		vout: Number,
		scriptSig: {
			asm: String,
			hex: String
		},
		sequence: Number,
		coinbase: String

});

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

const metaTxSchema = mongoose.Schema({
	txid: String,
	version: Number,
	time: Number,
	locktime: Number,
	vin: [vinsSchema],
	vout: [voutRawSchema],
	blockhash: String,
	confirmations: Number,
	blocktime: Number
});

const blocksSchema = mongoose.Schema({
	height: {type: Number, index: true, unique: true},
	hash: {type: String, index: true},
	time: {type: Number, index: true},
	mint: {type: Number, index: true},
	raw: rawBlockSchema,
	meta: {
		tx: [metaTxSchema]
	}
});

blocksSchema.statics.latestBlock = function (cb) {
	this.findOne()
		.sort('-height')
		.exec(cb);
};

blocksSchema.statics.lastBlocks = function(cb){
	this.find({}).sort({height:-1}).limit(15).exec(cb);
};

let Blocks = mongoose.model('Blocks', blocksSchema);

module.exports = Blocks;