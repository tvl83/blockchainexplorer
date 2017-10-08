import React, {Component} from 'react';
import {Col, Grid, Row, Tab, Tabs} from "react-bootstrap";
import {CHOSEN_NET, ROOT_URL} from "../../utilities/utilities";

export default class AboutIon extends Component {

	constructor(props) {
		super(props);

		this.state = {
			getinfo: {}
		}
	}

	componentWillMount() {
		fetch(`${ROOT_URL}/getinfo?net=${CHOSEN_NET}`)
			.then((data) => {
				data.json().then((data) => {
					this.setState(
						{
							getinfo: data
						}
					);
				});
			});
	}

	render() {
		console.log(this.state);
		return (
			<div>
				<h3>About Ion</h3>
				<Grid>
					<Row>
						<Col md={12}>
							<Tabs id="data-panels">
								<Tab eventKey={1}>
									<pre>
										{JSON.stringify(this.state.getinfo, null, 2)}
										</pre>
								</Tab>
							</Tabs>
						</Col>
					</Row>
				</Grid>
			</div>
		)
	}
}