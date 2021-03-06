let mongoose = require('mongoose');

const vinsSchema = mongoose.Schema({
	raw: {
		txid: {type: String, index: true},
		vout: {type: Number, index: true},
		scriptSig: {
			asm: String,
			hex: String
		},
		sequence: Number,
		coinbase: String
	},
	vout: { type: mongoose.Schema.Types.ObjectId, ref: 'Vouts' },
	blockheight: {type: Number, index: true},
	voutIndex: {type: Number, index: true},
	thisTxid: {type: String, index: true},
	prevTxid: {type: String, index: true},
	value: Number,
	address: {type: String, index: true},
	time: Number
});

vinsSchema.statics.latestBlock = function (cb) {
	this.findOne()
		.sort('-blockheight')
		.exec(cb);
};

let Vins = mongoose.model('Vins', vinsSchema);

module.exports = Vins;