let mongoose = require('mongoose');
const arrayUniquePlugin = require('mongoose-unique-array');

// VOUTS - received coin
const ledgerInSchema = mongoose.Schema({
	spent: Boolean,
	txid: {type: String, index: true},
	n: {type: Number, index: true},
	blockheight: {type: Number, index: true},
	value: {type: Number, index: true},
	time: {type: Number, index: true},
	type: {type: String, index: true},
	runningBalance: {type: Number, default: 0}
});

// VINS - spent
const ledgerOutSchema = mongoose.Schema({
	txid: {type: String, index: true},
	blockheight: {type: Number, index: true},
	voutIndex: {type: Number, index: true},
	value: {type: Number, index: true},
	time: {type: Number, index: true},
	type: {type: String, index: true},
	runningBalance: {type: Number, default: 0}
});

const vinsSchema = mongoose.Schema({
	raw: {
		txid: String,
		vout: Number,
		scriptSig: {
			asm: String,
			hex: String
		},
		sequence: Number,
		coinbase: String
	},
	// vout: { type: mongoose.Schema.Types.ObjectId, ref: 'Vouts' },
	blockheight: {type: Number},
	voutIndex: {type: Number},
	thisTxid: {type: String, index: true},
	prevTxid: {type: String, index: true},
	value: Number,
	address: {type: String, index: true},
	time: Number
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

const voutsSchema = mongoose.Schema({
	raw: voutRawSchema,
	spent: Boolean,
	txid: {type: String, index: true},
	n: Number,
	blockheight: {type: Number, index: true},
	value: Number,
	address: {type: String, index: true},
	time: Number,
	tx: {type: mongoose.Schema.Types.ObjectId, ref: 'Transactions'}
});

const addressesSchema = mongoose.Schema({
	address: {type: String, index: true, unique: true},
	ledgerIn: [ledgerInSchema],
	ledgerOut: [ledgerOutSchema],
	balance: {type: Number, index: true},
	rank: {type: Number, index: true},
	tag: {type: String, index: true},
	tagVerified: Boolean,
	totalSent: Number,
	totalReceived: Number
});

addressesSchema.plugin(arrayUniquePlugin);

addressesSchema.statics.richList = function(cb){
	this.find({balance: {$gt: 0.0}}).sort({balance:-1}).limit(500).exec(cb);
};
addressesSchema.statics.wholeRichList = function(cb){
	this.find({}).sort({balance:-1}).exec(cb);
};

let Address = mongoose.model('Address', addressesSchema);

module.exports = Address;