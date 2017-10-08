import React, {Component} from 'react';
import {Grid} from 'react-bootstrap';
import Heading from "./Heading";
// import SearchForm from "./SearchForm";
import TickerPanels from "./TickerPanels";
import DataPanels from "./DataPanels";

export default class App extends Component {
	render(){
		return (
			<Grid>
				<Heading/>
				{/*<SearchForm redirect={false} path=""/>*/}
				<TickerPanels/>
				<DataPanels/>
			</Grid>
		)
	}
}