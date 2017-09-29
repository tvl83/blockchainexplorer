import React, {Component} from 'react';
import {elipsisHash} from "../../utilities/utilities";

export default class TransactionLink extends Component {

	constructor(props){
		super(props);

		console.log("this.props");
		console.log(this.props);
		this.state ={
			txid: this.props.txid,
			index: 0,
			hasIndex: false
		}
	}

	componentWillMount(){
		if(this.props.txidIndex >= 0){
			this.setState({
				index: this.props.txidIndex,
				hasIndex: true
			})
		}
	}

	render(){
		if(this.state.hasIndex){
			return (
				<a href={`/tx/${this.state.txid}`}>{elipsisHash(this.state.txid)}:{this.state.index}</a>
			)
		} else {
			return (
				<a href={`/tx/${this.state.txid}`}>{elipsisHash(this.state.txid)}</a>
			)
		}

	}
}