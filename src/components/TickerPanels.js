import React, {Component} from 'react';
import { Row, Col, Panel} from 'react-bootstrap';
import {ROOT_URL} from "../utilities/utilities";

export default class TickerPanels extends Component {

	constructor(props){
		super(props);

		this.state = {
			btcPrice: 0.0,
			usdPrice: 0.0,
			marketCap: 0.0,
			totalSupply: 0
		}
	}

	componentWillMount(){
		let _this = this;
		fetch(`${ROOT_URL}/ionmarketinfo`)
			.then(function(response){
				response.json()
					.then(function(data){
						let stats = data;
						_this.setState({
							btcPrice: stats.price_btc,
							usdPrice: stats.price_usd,
							marketCap: stats.market_cap_usd,
							totalSupply: stats.total_supply,
							percent_change_1h: stats.percent_change_1h,
							percent_change_24h: stats.percent_change_24h,
							percent_change_7d: stats.percent_change_7d,
							rank: stats.rank
						});
				})
			})
	}

	render() {
		return (
			<Row bsStyle="margin: 0 -30px 0 -30px" id="ticker-panels">
				<Col md={12} bsStyle="padding:0">
					<Col xs={3}>
						<Panel header="BTC price" >
							{parseFloat(this.state.btcPrice).toFixed(8)} BTC
						</Panel>
					</Col>
					<Col xs={3}>
						<Panel header="USD Price">
							${parseFloat(this.state.usdPrice).toFixed(3)}
						</Panel>
					</Col>
					<Col xs={3}>
						<Panel header="% Change">
							<Row>
								<Col xs={12}>
									<span className="smallStats"><strong>1hr:</strong> {parseFloat(this.state.percent_change_1h).toFixed(2)}</span> { ' ' }
									<span className="smallStats"><strong>24hr:</strong> {parseFloat(this.state.percent_change_24h).toFixed(2)}</span> { ' ' }
									<span className="smallStats"><strong>7d:</strong> {parseFloat(this.state.percent_change_7d).toFixed(2)}</span>
								</Col>
							</Row>
						</Panel>
					</Col>
					<Col xs={3}>
						<Panel header="Market Cap">
							${parseFloat(this.state.marketCap).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,')}
						</Panel>
					</Col>
					<Col xs={3}>
						<Panel header="Master Nodes">
              ??? / ???
						</Panel>
					</Col>
					<Col xs={3}>
						<Panel header="Difficulty">
							---
						</Panel>
					</Col>
					<Col xs={3}>
						<Panel header="Outstanding">
							{parseFloat(this.state.totalSupply).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,')} ION
						</Panel>
					</Col>
					<Col xs={3}>
						<Panel header="Notice">
							All data updated every 5 minutes
						</Panel>
					</Col>
				</Col>
			</Row>
		)
	}
}