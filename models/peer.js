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
	syncnode : Boolean,
	country_code: String,
	country_name: String,
	region_code: String,
	region_name: String,
	city: String,
	zip_code: String,
	time_zone: String,
	latitude: Number,
	longitude: Number,
	metro_code: Number

});
let Peers = mongoose.model('Peers', peerSchema);

module.exports = Peers;