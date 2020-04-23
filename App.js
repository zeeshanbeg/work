
						//importing libraries
import React, { PureComponent } from 'react';
import {
  BarChart, Bar, Brush, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import * as moment from 'moment';   // for time interpretation
import './styles.css';				// styling and design



						// separate files for daily and weekly data
import Eve_data from './Eve_data.js';
//import PTH_D  from 	'./PTH_D.js';
//import PTH_W  from 	'./PTH_W.js';
//import Eve_data_W from './Eve_data_W.js';

			
/*					// dates and formats
var dateString;		// todays date
var daily_date = "2020-02-18";		
var daily_date_format = "DD/MM/YYYY";//"dddd, MMMM Do YYYY";

var weekly_date =  "2020-02-20";
var weekly_date_format  = "w"; // week no.is shown

						// date for Calender
var initial_daily_date;		

*/

var seconds;
var time_for_update = 60;	 // seconds value	
var next_update_in  = time_for_update ; // show time remaining for next update

export default class AC_Data extends PureComponent {	
	
	
	constructor(props)				// initialize the values for dates
	{
		super(props);
		this.state = {loaded : true}//, seconds: time_for_update};
		seconds = time_for_update;
	}
	
	componentDidMount() 
	{
		//this.interval = setInterval(() => this.update(), 1000 * time_for_update);
		//this.interval_rem_time_for_update = setInterval(() => this.rem_time_for_update(), 1000);
		
		//dateString = moment();
		
		//daily_date =  moment(dateString).format(daily_date_format);
		//weekly_date = daily_date;	
		
	}
	
	update = () => 
	{
		//alert("update");
		this.setState(state => ({
		  loaded: !state.loaded
		}));
		
		//console.log(this.state.loaded);
	}
	
	rem_time_for_update()
	{
		/*this.setState(state => ({
		  seconds: state.seconds > 0 ? state.seconds - 1 : state.seconds = time_for_update
		}));
		
		<div id="day_shift">
			<button class="button" onClick={this.dateDec} >
				<span>Previous Day </span>
			</button>
			<button class="button button2" >
				<span>Next Day </span>
			</button>
		</div>
		
		<div id="daily">
				<p id="duration_text"> Weekly Data	</p>	
				
				<Eve_data_W  />		
			</div>
		
		
		
		*/
		//seconds > 0 ? seconds-- : seconds = time_for_update;
	}
	
	render() { 
    return (
	<div id="parent-container">
		<div id="project_header"> 
			SMART BUILDING - BITS PILANI .GOA 
		</div>	
	
		<div id="data">			
			
			<div id="daily">	
				
				<Eve_data  />		
			</div>
			
		</div>
	
	</div>
    );

  }
}