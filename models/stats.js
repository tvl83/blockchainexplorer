let mongoose = require('mongoose');

const statsSchema = mongoose.Schema({
	lastblock: Number
});

let Stats = mongoose.model('Stats', statsSchema);

module.exports = Stats;