import React, {Component} from 'react';
import {elipsisHash, numberWithCommas} from "../../utilities/utilities";
import Moment from "react-moment";

export default class AddressTxRowSummary extends Component {

	constructor(props){
		super(props);

		this.state ={
			txid: this.props.address.txid,
			address: this.props.address.addr,
			value: this.props.address.value,
			block: this.props.address.blockheight,
			runningBalance: this.props.address.runningBalance,
			time: this.props.address.time,
			type: this.props.address.type
		}
	}

	componentWillMount(){
		// fetch(`${ROOT_URL}/txheight?txid=${this.state.txid}&net=${CHOSEN_NET}`)
		// 	.then((data) => {
		// 		data.json().then((data) => {
		// 			console.log(data);
		// 		})
		// 	})
	}

	render(){
		// console.log(`props ${JSON.stringify(this.props, null,2)}`);
		// console.log(`state ${JSON.stringify(this.state, null, 2)}`);
		return (
			<tr>
				<td><a href={`/tx/${this.state.txid}`}>{elipsisHash(this.state.txid)}</a></td>
				<td><a href={`/block/${this.state.block}`}>{this.state.block}</a></td>
				<td><Moment unix>{this.state.time}</Moment></td>
				<td>{this.state.type} {numberWithCommas(this.state.value)} ION</td>
				<td>{numberWithCommas(this.state.runningBalance)} ION</td>
			</tr>
		)
	}
}