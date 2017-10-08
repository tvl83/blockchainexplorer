import React, {Component} from 'react';
import {Table} from 'react-bootstrap';
import {CHOSEN_NET, numberWithCommas, ROOT_URL} from "../../utilities/utilities";
import AddressLink from "../Addresses/AddressLink";

export default class RichList extends Component {

	constructor(props) {
		super(props);

		this.state = {
			richlist: [
				{
					rank: 0,
					address: '',
					amount: 10000.0
				}
			]
		}
	}


	componentWillMount() {
		fetch(`${ROOT_URL}/getrichlist?net=${CHOSEN_NET}`)
			.then((data) => {
				data.json().then((richlist) => {
					this.setState({
						richlist
					})
				})
			})
	};

	render() {
		return (
			<div>
				<h4>Richest Addresses</h4>
				Richlist is as of the latest block with all data processed. As the latest block processed goes up this list will change. This list also only shows addresses with greater than 0 ION in the address.
				<Table striped condensed hover>
					<thead>
					<tr>
						<th>Rank</th>
						<th>Address</th>
						<th>Amount</th>
					</tr>
					</thead>
					<tbody>
					{
						this.state.richlist.map(
							ranking => {
								return (
									<tr key={ranking.rank}>
										<td>{ranking.rank}</td>
										<td><AddressLink address={ranking.address}/></td>
										<td>{numberWithCommas(ranking.amount.toFixed(8))} ION</td>
									</tr>
								)
							}
						)
					}
					</tbody>
				</Table>
			</div>
		)
	}
}