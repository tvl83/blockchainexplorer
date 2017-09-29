let mongoose = require('mongoose');

const peerSchema = mongoose.Schema({
	addr : {type: String, unique: true},
	services : String,
	lastsend : Number,
	lastrecv : Number,
	bytessent : Number,
	bytesrecv : Number,
	conntime : Number,
	timeoffset : Number,
	pingtime : Number,
	version : Number,
	subversion : String,
	inbound : Boolean,
	startingheight : Number,
	banscore : Number,
	syncnode : Boolean
});
let Peers = mongoose.model('Peers', peerSchema);

module.exports = Peers;