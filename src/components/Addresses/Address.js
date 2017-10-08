import React, {Component} from 'react';
import {Col, Grid, Panel, Row, Tab, Table, Tabs} from "react-bootstrap";
import {CHOSEN_NET, numberWithCommas, ROOT_URL} from "../../utilities/utilities";
// import { Table as DataTable, Column, Cell } from "fixed-data-table";
import Heading from "../Heading";
// import SearchForm from "../SearchForm";
import AddressTxRowSummary from "./AddressTxRowSummary";

export default class Address extends Component {

	constructor(props) {
		super(props);

		// this._dataList = this.props.ledgerIn.concat(this.props.ledgerOut);

		// console.log(this._dataList);

		this.state = {
			address: this.props.match.params.address,
			ledger: [],
			totalBalance: 0,
			totalSent: 0,
			totalReceived: 0
		};

		this.calcRunningBalance = this.calcRunningBalance.bind(this);
	}

	componentWillMount() {
		let {address} = this.state;

		fetch(`${ROOT_URL}/address?address=${address}&net=${CHOSEN_NET}`)
			.then((data) => {
				data.json().then((data) => {
					console.log("data");
					console.log(data);
					this.setState(
						{
							address: data,
							totalBalance: data.balance,
							totalReceived: data.totalReceived,
							totalSent: data.totalSent,
							ledger: data.ledgerIn.concat(data.ledgerOut).sort((a,b) =>
							{
								// swap signs of the return 1's to switch between ascending and descending
								if(a.blockheight < b.blockheight)
									return 1;
								if(a.blockheight > b.blockheight)
									return -1;
								return 0;
							})
						}
					);
				});
			});
	}

	calcRunningBalance(curBalance, nextTxBalance){
		if(nextTxBalance)
			return curBalance + nextTxBalance;
		else
			return curBalance
	}

	render() {
		console.log("address: "); console.log(this.state);
		let address = this.state.address;
		return (
			<Grid>
				<Heading/>
				{/*<SearchForm redirect={false} path=""/>*/}
				<Row>
					<Col md={12}>
						<h2>Details for Address</h2>
						<Row>
							<Table striped hover>
								<tbody>
								<tr>
									<td>Address</td>
									<td>{address.address}</td>
								</tr>
								<tr>
									<td>Balance</td>
									<td>{address.balance} ION</td>
								</tr>
								<tr>
									<td>Rich List</td>
									<td>{address.rank}</td>
								</tr>
								<tr>
									<td>Received</td>
									<td>{numberWithCommas(this.state.totalReceived)} ION</td>
								</tr>
								<tr>
									<td>Sent</td>
									<td>{numberWithCommas(this.state.totalSent)} ION</td>
								</tr>
								</tbody>
							</Table>
						</Row>
						<Tabs id="data-panels">
							<Tab eventKey={1} title="Transactions">
								<Panel>
									<Table striped hover>
										<thead>
										<tr>
											<td>Hash</td>
											<td>Block</td>
											<td>Date/Time</td>
											<td>Amount</td>
											<td>Running Balance</td>
										</tr>
										</thead>
										<tbody>
										{
											this.state.ledger.map(addressLedgerObj => {
												let addressTxRow = {
													txid: addressLedgerObj.txid,
													addr: this.state.address.address,
													time: addressLedgerObj.time,
													type: addressLedgerObj.type,
													value: addressLedgerObj.value,
													blockheight: addressLedgerObj.blockheight,
													runningBalance: addressLedgerObj.runningBalance
												};
												return (
													<AddressTxRowSummary key={addressLedgerObj._id} address={addressTxRow}/>
												)
											})
										}
										</tbody>
									</Table>
								</Panel>
							</Tab>
							{/*<Tab eventKey={2} title="RAW Block (JSON)">*/}
								{/*<pre>{JSON.stringify(this.state.address, null, 2)}</pre>*/}
							{/*</Tab>*/}
						</Tabs>
					</Col>
				</Row>
			</Grid>
		)
	}
}