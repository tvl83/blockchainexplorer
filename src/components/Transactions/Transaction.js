import React, {Component} from 'react';
import {CHOSEN_NET, elipsisHash, numberWithCommas, ROOT_URL} from "../../utilities/utilities";
import {Col, Grid, Panel, Row, Tab, Table, Tabs} from "react-bootstrap";
// import SearchForm from "../SearchForm";
import Heading from "../Heading";
import Moment from "react-moment";
import AddressLink from "../Addresses/AddressLink";
import TransactionLink from "./TransactionLink";

export default class Transaction extends Component {

	constructor(props) {
		super(props);

		this.state = {
			txhash: this.props.match.params.txhash,
			data: {
				blockheight: 0
			},
			tx: {
				rawVins: [],
				rawVouts: [],
				raw: {
					vin: [],
					vout: []
				}
			},
			totalValueOut: 0,
			totalValueOutFormatted: 0
		}
	}

	componentDidMount() {

	}

	componentWillMount() {
		let {txhash} = this.state;

		fetch(`${ROOT_URL}/tx?txhash=${txhash}&net=${CHOSEN_NET}`)
			.then((data) => {
				data.json().then((data) => {
					console.log("data");
					console.log(data);
					this.setState({
						data,
						tx: {
							raw: data.raw,
							rawVouts: data.rawVouts,
							rawVins: data.rawVins
						}
					});
					let totalValue = 0;

					data.raw.vout.forEach(vout => {
						totalValue += vout.value;
					});

					let totalValueOut = numberWithCommas(totalValue.toFixed(8));
					let totalValueOutFormatted;
					if(totalValue > 0)
						totalValueOutFormatted = numberWithCommas(totalValue.toFixed(8));
					else
						totalValueOutFormatted = totalValue.toFixed(8);

					this.setState({
						totalValueOut: totalValueOut,
						totalValueOutFormatted: totalValueOutFormatted
					})
				});
			});
	}

	render() {
		console.log("this.state:", this.state);
		let txblock = this.state.tx;
		console.log("txblock:", txblock);
		let inputCount = -1;
		return (
			<Grid>
				<Heading/>
				{/*<SearchForm redirect={false} path=""/>*/}
				<Row>
					<Col md={12}>
						<h2>Details for Transaction</h2>
						<Row>
							<Table striped hover>
								<tbody>
								<tr>
									<td>Transaction Hash</td>
									<td>{txblock.raw.txid}</td>
								</tr>
								<tr>
									<td>Block Hash</td>
									<td>{txblock.raw.blockhash}</td>
								</tr>
								<tr>
									<td>Date/Time</td>
									<td><Moment unix>{txblock.raw.time}</Moment></td>
								</tr>
								<tr>
									<td>Height</td>
									<td>{this.state.data.blockheight}</td>
								</tr>
								<tr>
									<td>Total Output</td>
									<td>{this.state.totalValueOutFormatted} ION <small>({this.state.totalValueOut})</small></td>
								</tr>
								<tr>
									<td>Fees</td>
									<td>(fees)</td>
								</tr>
								</tbody>
							</Table>
						</Row>
						<Tabs id="data-panels">
							<Tab eventKey={1} title="Input/Outputs">
								<Panel header="Inputs">
									<Table striped hover>
										<thead>
										<tr>
											<td>Index</td>
											<td>Previous Output</td>
											<td>Address</td>
											<td>Amount</td>
										</tr>

										</thead>
										<tbody>
										{
											txblock.rawVins.map((vin) => {
												inputCount++;
												return (
													<tr key={inputCount}>
														<td>{inputCount}</td>
														{
															!vin.raw.hasOwnProperty("scriptSig") ?
																<td>Generation</td>
																:
																<td><TransactionLink txid={vin.prevTxid} txidIndex={vin.voutIndex}/></td>

														}
														{
															!vin.raw.hasOwnProperty("scriptSig") ?
																<td>N/A</td>
																:
																/*{<td>{txblock.prevTx.scriptPubKey.addresses[0]}</td>}*/
																<td><AddressLink address={vin.address}/></td>
														}
														{
															!vin.raw.hasOwnProperty("scriptSig") ?
																<td>0</td>
																:
																/*{<td>{txblock.prevTx.value}</td>}*/
																<td>{numberWithCommas(vin.value)} ION</td>
														}
													</tr>
												)
											})
										}
										</tbody>
									</Table>
								</Panel>
								<Panel header="Outputs">
									<Table striped hover>
										<thead>
										<tr>
											<td>Index</td>
											<td>Redeemed In</td>
											<td>Address</td>
											<td>Amount</td>
										</tr>
										</thead>
										<tbody>
										{
											txblock.rawVouts.map(vout => {
												return (
													<tr key={vout.raw.n}>
														<td>{vout.raw.n}</td>
														<td>{vout.spent ?
															<a href={`/tx/${vout.spentTxid}`}>{elipsisHash(vout.spentTxid)}</a>
															:
															'Not Yet Redeemed'}</td>
														<td><a href={`/address/${vout.raw.scriptPubKey.addresses[0]}`}>{vout.raw.scriptPubKey.addresses[0]}</a></td>
														<td>{numberWithCommas(vout.raw.value)} ION</td>
													</tr>
												)
											})
										}
										</tbody>
									</Table>
								</Panel>
							</Tab>
							<Tab eventKey={2} title="RAW Block (JSON)">
								<pre>{JSON.stringify(txblock.raw, null, 2)}</pre>
							</Tab>
						</Tabs>
					</Col>
				</Row>
			</Grid>
		)
	}
}