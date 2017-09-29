import React, {Component} from 'react';
import {Table} from 'react-bootstrap';
import {CHOSEN_NET, numberWithCommas, ROOT_URL} from "../../utilities/utilities";
import AddressLink from "../Addresses/AddressLink";

export default class RichList extends Component {

	constructor(props) {
		super(props);

		this.state = {
			richlist: []
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
										<td>{numberWithCommas(ranking.amount)} ION</td>
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