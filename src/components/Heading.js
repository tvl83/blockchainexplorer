import React, {Component} from 'react';
import { Row, Col } from 'react-bootstrap';
import {CHOSEN_NET, ROOT_URL} from "../utilities/utilities";

export default class Heading extends Component {

	constructor(props){
		super(props);

		this.state = {
			height: 0
		}
	}

	componentWillMount(){
		fetch(`${ROOT_URL}/lastblockheight?net=${CHOSEN_NET}`)
			.then((data) => {
				data.json().then((data)=>{
					this.setState(data);
				});
			});
	}

	render() {
		return (
			<Row>
				<Col md={12}>
					<h1>Ion Blockchain Explorer</h1>
					<p>up to block <span id="up-to-block">{this.state.height}</span></p>
				</Col>
			</Row>
		)
	}
}