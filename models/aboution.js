let mongoose = require('mongoose');

const aboutIonSchema = mongoose.Schema({
	name: String,
	algorithm: String,
	walletVersion: String,
	website: String,
	bitcoinTalk: String,
	socialNets: [String],
	sourceCode: String,
	firstblock: Number
});
let AboutIon = mongoose.model('AboutIon', aboutIonSchema);

module.exports = AboutIon;