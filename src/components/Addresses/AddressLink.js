import React, {Component} from 'react';

export default class AddressLink extends Component {

	constructor(props){
		super(props);

		this.state ={
			address: this.props.address
		}
	}

	render(){
		return (
			<a href={`/address/${this.state.address}`}>{this.state.address}</a>
		)
	}
}