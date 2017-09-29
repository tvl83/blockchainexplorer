import React from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter, Switch, Route} from 'react-router-dom';
import App from './components/App';
import Address from './components/Addresses/Address';
import Block from "./components/Blocks/Block";
import Transaction from "./components/Transactions/Transaction";

ReactDOM.render(
	<BrowserRouter>
		<Switch>
			<Route exact path='/' component={App}/>
			<Route path='/address/:address' component={Address}/>
			<Route path='/block/:block' component={Block}/>
			<Route path='/tx/:txhash' component={Transaction}/>
		</Switch>
	</BrowserRouter>
	, document.getElementById('root'));
