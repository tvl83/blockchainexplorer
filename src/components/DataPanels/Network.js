import React, {Component} from 'react';
import {Table} from "react-bootstrap";
import {CHOSEN_NET, ROOT_URL} from "../../utilities/utilities";
// import {Moment} from "react-moment";

export default class Network extends Component {

	constructor(props) {
		super(props);

		this.state = {
			peerlist: [
				{
					id: 0,
					ip: '',
					version: '',
					lastConn: 946684800,
					country_name: "",
					region_name: "",
					city: "",
					time_zone: "",
				}
			]
		}
	}

	componentWillMount() {
		fetch(`${ROOT_URL}/getpeerlist?net=${CHOSEN_NET}`)
			.then((data) => {
				data.json().then((peerlist) => {
					console.log(`peerlist`);
					console.log(peerlist);
					this.setState({
						peerlist
					})
				})
			})
	}

	render() {
		return (
			<div>
				<h3>Network</h3>
				<strong>{this.state.peerlist.length}</strong> nodes connected to our node within the last 24 hours. After 24 hours without activity from a given node it is removed from the list.
				<Table striped condensed hover>
					<thead>
					<tr>
						<th>IP Address:Port</th>
						<th>Version</th>
						<th>Region</th>
						<th>Country</th>
						<th>Time Zone</th>
						{/*<th>Last Connection</th>*/}
					</tr>
					</thead>
					<tbody>
					{
						this.state.peerlist.map(peer => {
							return (
								<tr key={peer.id}>
									<td>{peer.ip}</td>
									<td>{peer.version}</td>
									<td>{peer.region_name}</td>
									<td>{peer.country_name}</td>
									<td>{peer.time_zone}</td>
									{/*<td><Moment unix>946684800</Moment></td>*/}
								</tr>
							)
						})
					}
					</tbody>
				</Table>
			</div>
		)
		// console.log(`this.state.peerlist`);
		// console.log(this.state.peerlist);
	}
}