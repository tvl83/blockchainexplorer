import React, {Component} from 'react';
import { Row, Tabs, Tab} from 'react-bootstrap';
import LatestBlocks from "./DataPanels/LatestBlocks";
import RichList from "./DataPanels/RichList";
import Overview from "./DataPanels/Overview";
import Extraction from "./DataPanels/Extraction";
import Network from "./DataPanels/Network";
import AboutIon from "./DataPanels/AboutIon";

export default class DataPanels extends Component {

	render() {
		return (
			<Row>
				<Tabs id="data-panels">
					<Tab eventKey={1} title="Latest Blocks">
						<LatestBlocks/>
					</Tab>
					<Tab eventKey={2} title="Rich List">
						<RichList/>
					</Tab>
					{/*<Tab eventKey={3} title="Overview">*/}
						{/*<Overview/>*/}
					{/*</Tab>*/}
					{/*<Tab eventKey={4} title="Extraction">*/}
						{/*<Extraction/>*/}
					{/*</Tab>*/}
					<Tab eventKey={5} title="Network">
						<Network/>
					</Tab>
					<Tab eventKey={6} title="About Ion">
						<AboutIon/>
					</Tab>
				</Tabs>
			</Row>
		)
	}
}