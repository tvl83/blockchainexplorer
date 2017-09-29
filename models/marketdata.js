let mongoose = require('mongoose');

const marketDataSchema = mongoose.Schema({
	id: String,
	name: String,
	symbol: String,
	rank: String,
	price_usd: String,
	price_btc: String,
	// "'24h_volume_usd': String,
	market_cap_usd: String,
	available_supply: String,
	total_supply: String,
	percent_change_1h: String,
	percent_change_24h: String,
	percent_change_7d: String,
	last_updated: String,
	lastupdated: String
});
let MarketData = mongoose.model('MarketData', marketDataSchema);

module.exports = MarketData;