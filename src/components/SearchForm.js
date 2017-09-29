import React, {Component} from 'react';
import { Redirect } from 'react-router';
import {Row, Col, FormGroup, InputGroup, FormControl, Button, Form} from 'react-bootstrap';
import {CHOSEN_NET, ROOT_URL} from "../utilities/utilities";

export default class SearchForm extends Component {

	constructor(props) {
		super(props);

		console.log("props", props);
		console.log("this.props", this.props);

		this.state = {
			query: "",
			redirect: false,
			path: ""
		};

		this.processSearch = this.processSearch.bind(this);
		this.onChange = this.onChange.bind(this);

		this.searchHashOrHeight = this.searchHashOrHeight.bind(this);
		this.searchAddress = this.searchAddress.bind(this);
	}

	// componentDidMount(){
	// 	console.log("componentDidMount");
	// }
	//
	// componentWillMount(){
	// 	console.log("componentWillMount");
	// 	this.setState({
	// 		path: '',
	// 		redirect: false
	// 	});
	// }

	// componentDidUpdate(){
	// 	console.log("componentDidUpdate");
	// 	if(this.props.redirect) {
	// 		// this.setState({
	// 		// 	path: '',
	// 		// 	redirect: false
	// 		// });
	// 		this.props.redirect = false;
	// 		this.props.path = "";
	// 	}
	// }

	processSearch(e) {
		e.preventDefault();
		let q = this.state.query.trim();

		if (q.length === 64 || Number.isInteger(parseInt(q, 10))) {
			this.searchHashOrHeight(q);
		} else if (q.length === 34) {
			this.searchAddress(q);
		}
	}

	searchHashOrHeight(q) {
		fetch(`${ROOT_URL}/block?block=${q}&net=${CHOSEN_NET}`)
			.then((data) => {
				data.json().then((data) => {

					console.log("fetch response...");
					if (data.hasOwnProperty("error")) {
						console.log(data);
						console.log("block not found");
					} else {
						let url = `/block/${q}`;
						this.props.redirect = true;
						this.props.path = url;
						console.log("this.props: ", this.props);
					}
				})
			})
	}

	searchAddress(q) {
		fetch(`${ROOT_URL}/address?address=${q}&net=${CHOSEN_NET}`)
			.then((data) => {
				data.json().then((data) => {
					console.log("fetch response...");
					if (data.hasOwnProperty("error")) {
						console.log(data);
						console.log("address not found");
					} else {
						let url = `/address/${q}`;
						this.props.redirect = true;
						this.props.path = url;
						console.log("this.props: ", this.props);
					}
				})
			})
	}

	onChange(event) {
		this.setState({
			query: event.target.value
		})
	}

	render() {
		// console.log("this.state.path: ", this.state.path);
		// console.log("this.state.query: ", this.state.query);
		console.log("this.state: ", this.state);
		// console.log(`"${this.state.path}" !== "/block/${this.state.query}"`,  (this.state.path) !== (`/block/${this.state.query}`))
		if(this.props.redirect){ // && this.state.path !== `/block/${this.state.query}`){
			return (
				<Redirect push to={this.props.path}/>
			)
		}

		return (
			<Row id="search-row" bsStyle="margin-bottom: 10px">
				<Col md={3}>
					<Form inline onSubmit={this.processSearch}>
						<FormGroup>
							<InputGroup>
								<FormControl onChange={this.onChange} type="text" name="query"/> <Button type="submit">Search</Button>
							</InputGroup>
						</FormGroup>
					</Form>
				</Col>
			</Row>
		)
	}
}