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
					lastConn: 946684800
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
		// console.log(`this.state.peerlist`);
		// console.log(this.state.peerlist);
		return (
			<div>
				<h3>Network</h3>
				<Table striped condensed hover>
					<thead>
					<tr>
						<th>IP Address:Port</th>
						<th>Version</th>
						{/*<th>Last Connection</th>*/}
					</tr>
					</thead>
					<tbody>
					{
						this.state.peerlist.map(peer => {
							// console.log("peer");
							// console.log(peer);
							return (
								<tr key={peer.id}>
									<td>{peer.ip}</td>
									<td>{peer.version}</td>
									{/*<td><Moment unix>946684800</Moment></td>*/}
								</tr>
							)
						})
					}
					</tbody>
				</Table>
			</div>
		)
	}
}