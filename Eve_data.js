import React, { PureComponent } from 'react';
import {
  BarChart, Bar, Cell, Brush, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import * as moment from 'moment';		// for time interpretation
import './styles.css';	
import './calendar.css';
import * as d3 from "d3-scale";


const barChartWidth_daily =15;  			// width of container
const barChartWidth_weekly =50;  			// width of container
const barChartHeight = 200; 		// height of container
const brushHeight = 20; 			// scroll bar height
const barFillColor = "#0D98BA";  	// bar fill color
const barFillColor_max = "red";
const barFillColor_min = "blue";
const brushColor = "#8884d8";		// scroll b ar fill color
const barSize = 40; 				// width of bars
const axesStroke = "#AAABEF"; 		// color of axes text
const legendWidth = 120;

/*
	complete file url format :
http://118.185.27.157:5000/energygrid1?max_results=720&where=_created>="Sun, 01 Mar 2020 00:00:00 GMT" and _created<="Wed, 01 Apr 2020 00:00:00 GMT"

*/

var fileURL = "http://118.185.27.157:5000/energygrid1?max_results=30000&where=";

var completedata = [];	// to store complete data, this should be global to maintain values among func calls
var todaysdata = [];	// to store current data being update regularly @ server

var prevdaycount=0;
var nextdaycount=0;
var prevweekcount=0;
var nextweekcount=0;

//---------------------------------------------------------------------------
		
// monthly values
var dayofmonth = 0;
var humidity_month 	= [];
var power_month		= [];
var temp_month 		= [];
var t_radius =0 ;
var p_radius =0 ;
var h_radius =0 ;
var x;

export default class Eve_data extends PureComponent {	

	intervalID;

	constructor(props)
	{
		super(props);

		this.state = 
		{
			power  		: [],		// daily values
			humidity 	: [],
			room_temp 	: [],
			date 		: moment.utc(),		
			
			humidity_week 	: [],	// weekly values
			power_week 		: [],
			temp_week 		: [],
			
			humidity_month 	: [],	// monthy values
			power_month		: [],
			temp_month 		: [],
			 
			fetching	: true,
							
							// calendar data
			dateContext: moment.utc(),
			today: moment.utc(),
			showMonthPopup: false,
			showYearPopup: false,
			selectedDay: null
		};
		
		this.width = props.width || "350px";
        this.style = props.style || {};
        this.style.width = this.width; // add this
		
		this.update = this.update.bind(this);	
		
        this.prevDay = this.prevDay.bind(this);
        this.nextDay = this.nextDay.bind(this);

		this.prevWeek = this.prevWeek.bind(this);
        this.nextWeek = this.nextWeek.bind(this);
		
		this.prevMonth = this.prevMonth.bind(this);
        this.nextMonth = this.nextMonth.bind(this);

		this.autofetchData = this.autofetchData.bind(this);
	}

	update(jsonData,currdateTS) //data of last month and current month, current date TS received
	{
		let loop = 0 ,i = 0, j=0;
		
		/* 
			jsonData is an array of entries 
			jsonData[0] 	= 1st entry of 1st day of last month
			jsonData[last] 	= most recent entry
		*/
		
		
		// daily values
		
		var hour_val       = 0;
		var count       = [];
		var hours       = [];		
		
		var avg_power   = 0;		
		var power_sum   = [];		 

		var avg_temp    = 0;
		var min_temp    = 0,
			max_temp	= 0,
			min_range	= 0,
			max_range	= 0;
		var temp_sum    = [];				
		
		var avg_humidity   = 0;
		var humidity_sum    = [];
		
		var power  		= [];	// store these values to state 
		var	humidity 	= [];
		var	room_temp 	= [];
		
		
		//---------------------------------------------------------------------------
		// weekly values
		
		var weekDayNumber = [0,1,2,3,4,5,6];
		var weekDayName   = [];
		var weekDayName_default  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
	
		var h_min = [100,100,100,100,100,100,100]; 
		var h_max = [ 0,   0,  0,  0,  0,  0,  0];	
		var h_na  = 0 ; // if value is not available
		
		var	power_sum_w = [0,0,0,0,0,0,0];		
		var x=0;
		var total_power_day = 0;		
		var p_na  = 0 ; // if value is not available
		
		var t_min = [100,100,100,100,100,100,100];
		var t_max = [ 0,   0,  0,  0,  0,  0,  0];		
		var t_na  = 0 ; // if value is not available
		
		var humidity_week	= [];
		var power_week 		= [];
		var temp_week 		= [];
		
		
		//---------------------------------------------------------------------------
		// logic begins here
		
		for(i=0; i < 24; i++)
		{
			hours.push(i);
			count.push(0);

			temp_sum.push(0);
			humidity_sum.push(0);
			power_sum.push(0);
		}
		
		for(i=0; i <= 31; i++)
		{
			humidity_month.push(0);
			power_month.push(0);
			temp_month.push(0)
		}
		
		
		// start picking data from array jsonData and put them in bars 
		
		let currdayno  = moment.utc(currdateTS).format("d"); // todays day no of week (0 to 6)
		let currweekno = moment.utc(currdateTS).format("w"); // week no (1 to 53)
		let currmonthno = moment.utc(currdateTS).format("M"); // month no (1 to 12)
		
		let en=0; 	 // traverse the page no and entry no.
		let moredaydata = true;
		let moreweekdata = true;
		
		
		for(en=jsonData.length-1; en>=0 ; en--)  // en : traversing the array entries, beginning from last (most recent)
		{			
			// pick todays data hour wise
			
			if( moment.utc(jsonData[en].Time_Stamp).format("w") == currweekno &&
				moment.utc(jsonData[en].Time_Stamp).format("d") == currdayno	) 
			{
				hour_val = parseInt(moment.utc(jsonData[en].Time_Stamp).format('H'));
				temp_sum[hour_val] 		+= jsonData[en].room_temp ;
				humidity_sum[hour_val] 	+= jsonData[en].Humidity;
				power_sum[hour_val] 	+= jsonData[en].voltage * jsonData[en].Current;
				
				count[hour_val]++;
			}
			else moredaydata = false; // when all entries of this day are covered
		
			
			// pick todays data, weekday (0-6) wise
			
			if( moment.utc(jsonData[en].Time_Stamp).format("w") == currweekno ) 
			{
				weekDayNumber = parseInt( moment.utc(jsonData[en].Time_Stamp).format('d') );
				weekDayName[weekDayNumber]= moment.utc(jsonData[en].Time_Stamp).format('ddd'); 
				
				if( jsonData[en].Humidity > h_max[weekDayNumber])
				{
					h_max[weekDayNumber] = jsonData[en].Humidity;
				}
				if( jsonData[en].Humidity < h_min[weekDayNumber] && jsonData[en].Humidity >0 )
				{
					h_min[weekDayNumber] = jsonData[en].Humidity;
				}
				
				if( jsonData[en].room_temp > t_max[weekDayNumber])
				{
					t_max[weekDayNumber] = jsonData[en].room_temp;
				}
				if( jsonData[en].room_temp < t_min[weekDayNumber] &&jsonData[en].room_temp >0 )
				{
					t_min[weekDayNumber] = jsonData[en].room_temp;
				}
				
				power_sum_w[weekDayNumber] += (jsonData[en].voltage*jsonData[en].Current);
			}
			else moreweekdata = false;// when all entries of this week are covered
			
			//if(!moredaydata && !moreweekdata) // when all days' and weeks' entries are covered, move out of loop
			//	break;
			
			// pick data for all days of the month
			
			if( moment.utc(jsonData[en].Time_Stamp).format("M") == currmonthno	) 
			{
				dayofmonth = parseInt(moment.utc(jsonData[en].Time_Stamp).format('D'));
				
				temp_month[dayofmonth]		=  Math.max(temp_month[dayofmonth],jsonData[en].room_temp);				
				humidity_month[dayofmonth] 	=  Math.max(humidity_month[dayofmonth],jsonData[en].Humidity);
				power_month[dayofmonth] 	+= jsonData[en].voltage * jsonData[en].Current;
			}
			
		}
		
		
		// calculating avg values for day 
		
		for(i=0;i<hours.length;i++)
		{
			avg_temp = temp_sum[i] / count[i]; 
			room_temp.push( { time:hours[i], temp_val : avg_temp  } );
			
			avg_humidity = humidity_sum[i] / count[i]; 
			humidity.push( { time:hours[i], humidity_val: avg_humidity  } );
			
			avg_power = power_sum[i] / count[i]; 
			power.push( { time : hours[i], power_val: avg_power  } );
		}
		
		// calculating avg values for week
		
		for(loop=0;loop < 7;loop++)
		{
			if(loop < weekDayName.length)
			{
				humidity_week.push({ day :  weekDayName[loop] , max_humidity : h_max[loop], min_humidity : h_min[loop]  });
				power_week.push({ day :  weekDayName[loop] , total_power : power_sum_w[loop]  });
				temp_week.push({ day :  weekDayName[loop] , max_temp : t_max[loop], min_temp : t_min[loop]  });
			}
			else 
			{
				humidity_week.push({ day :  weekDayName_default[loop] , max_temp : h_na, min_temp : h_na });
				power_week.push({ day :  weekDayName_default[loop] , total_power : p_na });
				temp_week.push({ day :  weekDayName_default[loop] , max_temp : t_na, min_temp : t_na });
			}
		}
		
		this.setState( {		
			power  		: power,	
			humidity 	: humidity,
			room_temp 	: room_temp,
			
			humidity_week 	: humidity_week,
			power_week 		: power_week,
			temp_week 		: temp_week,
			
			humidity_month 	: humidity_month,
			power_month		: power_month,
			temp_month 		: temp_month,
			
			date 			: currdateTS,		
			fetching		: false
		}
		);
		
	}
	
	componentDidMount()   
	{
		this.autofetchData();	
	}
	
	autofetchData = () => 
	{
		 // change the state and again fetch latest data
		this.setState(state => ({
		  fetching: true
		}));
		
		let fromDate;
		let toDate;
		let finalURL;	// to store appended url with dates

		let url_lm = [];   // to store url of last month's data
		let url_cm = [];   // to store url of this month's data

		let prom_array_lm = []; // to store promise of fetch result of last month
		let prom_array_cm = []; // to store promise of fetch result of this month
		
		var data_lm = [];	// to store last month's data
		var data_cm = [];	// to store this month's data
	
		
		// when regularly called, check what data needs to be fetched.
		// do not fetch whole data again and again. only what is updated since last fetch
		
		if(completedata.length ==0) // for 1st tym, length = 0
		{
		/*
			fetching data from first day of last month till last hour only once
			
			for current hour : regularly fetch latest data
			
			extract daily view and weekly view data from this data mass
			
			complete file url format :
			finalURL = http://118.185.27.157:5000/energygrid1?max_results=30000&where=_created>="Sun, 01 Mar 2020 00:00:00 GMT" and _created<="Wed, 01 Apr 2020 00:00:00 GMT"
			
			fileURL = http://118.185.27.157:5000/energygrid1?max_results=30000&where=
	
		*/
		
// fetch last month's data
					
			fromDate = moment.utc().subtract(1,'month').startOf('month').format("ddd, DD MMM YYYY HH:mm:ss [GMT]");
			toDate 	 = moment.utc().subtract(1,'month').endOf('month').format("ddd, DD MMM YYYY HH:mm:ss [GMT]");

			// last months data
			finalURL = fileURL + "_created>=\""+fromDate+"\" and _created<=\""+toDate+"\"";			
			url_lm.push(finalURL); // push the url into array
			
			// fetch the file (promise) from the 'url'
			prom_array_lm[0] = fetch(url_lm[0],{cache: "default"});
			
			Promise.all(prom_array_lm)
			.then(values => {
				return Promise.all(values.map(r=>r.json()));
			})
			.then(values => {
				data_lm = values;
				
				let i=0;
				for(i=0;i!=data_lm[0]._items.length;i++)  // add fetched data to final storage
					completedata.push(data_lm[0]._items[i]);
			})
			.catch( err => alert("Data cannot be obtained from server... Check if server is ON..."));
	

// fetch till current data
					
			fromDate = moment.utc().startOf('month').format("ddd, DD MMM YYYY HH:mm:ss [GMT]");
			toDate 	 = moment.utc().format("ddd, DD MMM YYYY HH:mm:ss [GMT]");

			// last months data
			finalURL = fileURL + "_created>=\""+fromDate+"\" and _created<=\""+toDate+"\"";		
			url_cm.push(finalURL); // push the url into array
			
			// fetch the file (promise) from the 'urls'
			prom_array_cm[0] = fetch(url_cm[0],{cache: "default"});
			
			Promise.all(prom_array_cm)
			.then(values => {
				return Promise.all(values.map(r=>r.json()));
			})
			.then(values => {
				data_cm = values;
				
				let i=0;
				for(i=0;i!=data_cm[0]._items.length;i++)	// add fetched data to final storage
					completedata.push(data_cm[0]._items[i]);
				
				// cache the data 
				/*
				let ls = localStorage.getItem('cached_data'); // ls:local storage for cached data
				if(ls)
				{
					//completedata = localStorage.getItem('cached_data');
				}
				else
				{	// store the data to local cache
					//let stringdata = JSON.stringify(completedata);
					//localStorage.setItem('cached_data',stringdata);
				}
				*/
				
				// till this point we have data from last month till mos recent entry of today				
				
				this.update(completedata,moment.utc());
				this.invervalID = setTimeout(this.autofetchData.bind(this),(1000*60*2));
			})
			.catch( );//err => alert("Data cannot be obtained from server... Check if server is ON..."));		
		}
		
		// from next auto call
		// if data has already been fetched, fetch only what is needed
		// check from the TS of last fetched data

		else	
		{
			let newdataurl 		= [];
			let prom_newdata 	= [];
			let newdata 		= [];
			
			let lastfetcheddataTS = completedata[completedata.length-1].Time_Stamp;
		
			fromDate = moment.utc(lastfetcheddataTS).add(1,'minutes').format("ddd, DD MMM YYYY HH:mm:ss [GMT]");
			
			// url of newly updated data
			finalURL = fileURL + "_created>\"" + fromDate + "\"";		
			newdataurl.push(finalURL); // push the url into array
			
			// fetch the file (promise) from the 'urls'
			prom_newdata[0] = fetch(newdataurl[0],{cache: "default"});
			
			Promise.all(prom_newdata)
			.then(values => {
				return Promise.all(values.map(r=>r.json()));
			})
			.then(values => {
				newdata = values;
				
				let i = 0; // start pushing new data from next avail loc in completedata
				for( ;i!=newdata[0]._items.length;i++)	// add fetched data to final storage
					completedata.push(newdata[0]._items[i]);
				
				// cache the data 
				//let ls = localStorage.getItem('cached_data'); // ls:local storage for cached data
				/*
				if(ls)
				{
					//completedata = localStorage.getItem('cached_data');
				}
				//else
				{	// store the data to local cache
					//let stringdata = JSON.stringify(completedata);
					//localStorage.setItem('cached_data',stringdata);
				}
				*/
				// till this point we have data from last month till mos recent entry of today				
				
				this.update(completedata,moment.utc());
				this.invervalID = setTimeout(this.autofetchData.bind(this),(1000*60*2));
			})
			.catch();// err => alert("Data cannot be obtained from server... Check if server is ON..."));	
			
		}			
			
	}
	
	componentWillUnmount() 
	{
        
         /*
		  stop getData() from continuing to run even
          after unmounting this component. Notice we are calling
          'clearTimeout()` here rather than `clearInterval()` as
          in the previous example.
        */
        clearTimeout(this.intervalID);
    }
	
	prevDay()
	{	
		this.setState(state => ({
		  fetching: true
		}));
		
		let currdayTS = moment.utc(this.state.date).subtract(1,'days');

		this.update(completedata,currdayTS);
		
	}
	
	nextDay()
	{	
		let currdayTS = moment.utc(this.state.date).add(1,'days');
		
		if(moment.utc(currdayTS)  <= moment.utc()  )
		{
			this.setState(state => ({
				fetching: true
			}));
			this.update(completedata,currdayTS);
		}
		else
			alert("You have reached today...");
	}
	
	prevWeek()
	{	
		this.setState(state => ({
		  fetching: true
		}));
		
		let currdayTS = moment.utc(this.state.date).subtract(1,'week');

		this.update(completedata,currdayTS);
	}
	
	nextWeek()
	{			
		let currdayTS = moment.utc(this.state.date).add(1,'week');
		
		if(moment.utc(currdayTS) <= moment.utc() )
		{
			this.setState(state => ({
				fetching: true
			}));
			this.update(completedata,currdayTS);
		}
		else
			alert("You have reached this week...");		
	}
	
	
	customTickFormatter(e)
	{
		//e holds the actual value on y axis 
		return e > 1000 ? (e/1000) + "k" : e;
	}
	
	
				//  CALENDAR FUNCTIONS

	weekdays = moment.weekdays(); //["Sunday", "Monday", "Tuesday", "Wednessday", "Thursday", "Friday", "Saturday"]
    weekdaysShort = moment.weekdaysShort(); // ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    months = moment.months();

    year = () => {
        return this.state.dateContext.format("Y");
    }
    month = () => {
        return this.state.dateContext.format("MMMM");
    }
    daysInMonth = () => {
        return this.state.dateContext.daysInMonth();
    }
    currentDate = () => {
        return this.state.dateContext.get("date");
    }
    currentDay = () => {
        return this.state.dateContext.format("D");
    }

    firstDayOfMonth = () => {
        let dateContext = this.state.dateContext;
        let firstDay = moment(dateContext).startOf('month').format('d'); // Day of week 0...1..5...6
        return firstDay;
    }

    setMonth = (month) => {
        let monthNo = this.months.indexOf(month);
        let dateContext = Object.assign({}, this.state.dateContext);
        dateContext = moment(dateContext).set("month", monthNo);
        this.setState({
            dateContext: dateContext
        });
    }

    nextMonth = () => {
        let dateContext = Object.assign({}, this.state.dateContext);
        dateContext = moment(dateContext).add(1, "months");
        this.setState({
            dateContext: dateContext,
			fetching: true
        });
        this.props.onNextMonth && this.props.onNextMonth();
		//this.update(completedata,dateContext);
    }

    prevMonth = () => {
        let dateContext = Object.assign({}, this.state.dateContext);
        dateContext = moment(dateContext).subtract(1, "months");
        this.setState({
            dateContext: dateContext,
			fetching: true
        });
        this.props.onPrevMonth && this.props.onPrevMonth();
		//this.update(completedata,dateContext);
    }

    onSelectChange = (e, data) => {
        this.setMonth(data);
        this.props.onMonthChange && this.props.onMonthChange();

    }
    SelectList = (props) => {
        let popup = props.data.map((data) => {
            return (
                <div key={data}>
                    <a className="monthName-list" href="#" onClick={(e)=> {this.onSelectChange(e, data)}}>
                        {data}
                    </a>
                </div>
            );
        });

        return (
            <div className="month-popup">
                {popup}
            </div>
        );
    }

    onChangeMonth = (e, month) => { // this method actrually shows the list of months in a popup manner
        this.setState({
            showMonthPopup: false//!this.state.showMonthPopup
        });
    }

    MonthNav = () => {
        return (
            <span className="label-month"
                onClick={(e)=> {this.onChangeMonth(e, this.month())}}>
                {this.month()}
                {this.state.showMonthPopup &&
                 <this.SelectList data={this.months} />
                }
            </span>
        );
    }

    showYearEditor = () => {
        this.setState({
            showYearNav: true
        });
    }

    setYear = (year) => {
        let dateContext = Object.assign({}, this.state.dateContext);
        dateContext = moment(dateContext).set("year", year);
        this.setState({
            dateContext: dateContext
        })
    }
    onYearChange = (e) => {
        this.setYear(e.target.value);
        this.props.onYearChange && this.props.onYearChange(e, e.target.value);
    }

    onKeyUpYear = (e) => {
        if (e.which === 13 || e.which === 27 ) {
            this.setYear(e.target.value);
            this.setState({
                showYearNav: false
            })
        }
    }

    YearNav = () => {
        return (
            this.state.showYearNav ?
            <input
                defaultValue = {this.year()}
                className="editor-year"
                ref={(yearInput) => { this.yearInput = yearInput}}
                onKeyUp= {(e) => this.onKeyUpYear(e)}
                onChange = {(e) => this.onYearChange(e)}
                type="number"
                placeholder="year"/>
            :
            <span
                className="label-year"
                onDoubleClick={(e)=> { this.showYearEditor()}}>
                {this.year()}
            </span>
        );
    }

    onDayClick = (e, day) => {
        this.setState({
            selectedDay: day
        });

        this.props.onDayClick && this.props.onDayClick(e, day);
    }
	
	render() { 	
	
	 // Map the weekdays i.e Sun, Mon, Tue etc as <td>
        let weekdays = this.weekdaysShort.map((day) => {
            return (
                <td key={day} className="week-day">{day}</td>
            )
        });

        let blanks = [];
        for (let i = 0; i < this.firstDayOfMonth(); i++) {
            blanks.push(<td key={i * 80} className="emptySlot">
                {""}
                </td>
            );
        }

		// scale the value for radius 
		// using  : Math.min.apply(Math,temp_month )
		x = d3.scaleLinear()
				.domain([Math.min.apply(null,temp_month ), Math.max.apply(null,temp_month )])
				.range([0, 1]);

		// days in month for temperature
        let daysInMonth_T = [];
        for (let d = 1; d <= this.daysInMonth(); d++) {
            let className = (d == this.currentDay() ? "day current-day": "day");
            let selectedClass = (d == this.state.selectedDay ? " selected-day " : "")
            daysInMonth_T.push(
                <td key={d} className={className + selectedClass} >
                    <span onClick={(e)=>{this.onDayClick(e, d)}}>
					
						<svg  width="40" height="40" >
						<circle cx="20" cy="20" 
						r={ 20*x( temp_month[d] ) } 
							fill="#D3D3D3" />	
						
						<text id="circle-data" x="15" y="20" textAnchor="middle" fill="black" 
									fontSize="15px" fontFamily="Arial" dy=".3em">
						{d}
						</text>
						Sorry, your browser does not support inline SVG.
						</svg>
						
					</span>
                </td>
			);
        }
		// days in month for humidity
		x = d3.scaleLinear()
				.domain([Math.min.apply(null,humidity_month ), Math.max.apply(null,humidity_month )])
				.range([0, 1]);
				
		let daysInMonth_H = [];
        for (let d = 1; d <= this.daysInMonth(); d++) {
            let className = (d == this.currentDay() ? "day current-day": "day");
            let selectedClass = (d == this.state.selectedDay ? " selected-day " : "")
            daysInMonth_H.push(
                <td key={d} className={className + selectedClass} >
                    <span onClick={(e)=>{this.onDayClick(e, d)}}>
					
						<svg  width="40" height="40" >
						<circle cx="20" cy="20" 
						r={  20*x( humidity_month[d] )  } 
							fill="#D3D3D3" />	
						
						<text id="circle-data" x="15" y="20" textAnchor="middle" fill="black" 
									fontSize="15px" fontFamily="Arial" dy=".3em">
						{d}
						</text>
						Sorry, your browser does not support inline SVG.
						</svg>
						
					</span>
                </td>
            );
        }
		// days in month for power
		
		x = d3.scaleLinear()
				.domain([Math.min.apply(null,power_month ), Math.max.apply(null,power_month )])
				.range([0, 1]);
				
				
		let daysInMonth_P = [];
        for (let d = 1; d <= this.daysInMonth(); d++) {
            let className = (d == this.currentDay() ? "day current-day": "day");
            let selectedClass = (d == this.state.selectedDay ? " selected-day " : "")
            daysInMonth_P.push(
                <td key={d} className={className + selectedClass} >
                    <span onClick={(e)=>{this.onDayClick(e, d)}}>
					
						<svg  width="40" height="40" >
						<circle cx="20" cy="20" 
						r={ 20*x( power_month[d] )  } 
						fill="#D3D3D3" />
						<text id="circle-data" x="15" y="20" textAnchor="middle" fill="black" 
									fontSize="15px" fontFamily="Arial" dy=".3em">
						{d}
						</text>
						Sorry, your browser does not support inline SVG.
						</svg>
						
					</span>
                </td>
            );
        }


        var totalSlots_T = [...blanks, ...daysInMonth_T]; // for temperature
        var totalSlots_H = [...blanks, ...daysInMonth_H];	// for humidity
        var totalSlots_P = [...blanks, ...daysInMonth_P];	// for power
        let rows_T = [];
        let rows_H = [];
        let rows_P = [];
        let cells_T = [];
        let cells_H = [];
        let cells_P = [];

        totalSlots_T.forEach((row, i) => {
            if ((i % 7) !== 0) {
                cells_T.push(row);
            } else {
                let insertRow = cells_T.slice();
                rows_T.push(insertRow);
                cells_T = [];
                cells_T.push(row);
            }
            if (i === totalSlots_T.length - 1) {
                let insertRow = cells_T.slice();
                rows_T.push(insertRow);
            }
        });

        let trElems_T = rows_T.map((d, i) => {
            return (
                <tr key={i*100}>					
					{d}
                </tr>
            );
        })
		
		totalSlots_H.forEach((row, i) => {
            if ((i % 7) !== 0) {
                cells_H.push(row);
            } else {
                let insertRow = cells_H.slice();
                rows_H.push(insertRow);
                cells_H = [];
                cells_H.push(row);
            }
            if (i === totalSlots_H.length - 1) {
                let insertRow = cells_H.slice();
                rows_H.push(insertRow);
            }
        });
		let trElems_H = rows_H.map((d, i) => {
            return (
                <tr key={i*100}>
					
					{d}
                </tr>
            );
        })
		totalSlots_P.forEach((row, i) => {
            if ((i % 7) !== 0) {
                cells_P.push(row);
            } else {
                let insertRow = cells_P.slice();
                rows_P.push(insertRow);
                cells_P = [];
                cells_P.push(row);
            }
            if (i === totalSlots_P.length - 1) {
                let insertRow = cells_P.slice();
                rows_P.push(insertRow);
            }
        });
		let trElems_P = rows_P.map((d, i) => {
            return (
                <tr key={i*100}>
					
					{d}
                </tr>
            );
        })
	
	
	
	
    return (
	<div>
		<div id="bargraph">
		
											<p id="duration_text"> Daily Data	</p>
			<div id="day_shift2">
				<button className="button" onClick={() => {this.prevDay()}} >
					<span>&laquo; Previous Day </span>
				</button>
				<button className="button button2" onClick={() => {this.nextDay()}} >
					<span>Next Day &raquo;</span> 
				</button>
			</div>
			
			{
			this.state.fetching ? 
				<div> 
					<div className="loading"> </div> 
					<p id="wait-text"> Please Wait. Updating the Data...</p> 
				</div> : 
				<div id="a3g" > 
					<div id="ag">	
						<p id="label"> Temperature for Day : {moment.utc(this.state.date).format("dddd")}
											<span> - </span>	{ moment.utc(this.state.date).format("DD/MM/YYYY")} </p>
						<BarChart width={barChartWidth_daily*this.state.room_temp.length} height={barChartHeight} 
							data={this.state.room_temp}>
							<XAxis dataKey="time" stroke= {axesStroke}/>
							<YAxis  type="number" domain={[0, 40]} stroke={axesStroke}  />
							<Tooltip />
							<CartesianGrid vertical = {false}strokeDasharray="4 2" />
							<Bar  dataKey="temp_val" fill={barFillColor} barSize={barSize} />
						</BarChart>
					</div>
					<div id="ag">
						<p id="label"> Humidity for Day : {moment.utc(this.state.date).format("dddd")}
											<span> - </span>	{ moment.utc(this.state.date).format("DD/MM/YYYY")} </p>
						<BarChart width={barChartWidth_daily*this.state.humidity.length} height={barChartHeight} 
						  data={this.state.humidity}>
							<XAxis dataKey="time" stroke= {axesStroke}/>
							<YAxis stroke={axesStroke}/>
							<Tooltip />
							<CartesianGrid vertical = {false}strokeDasharray="4 2" />
							<Bar type="monotone" dataKey="humidity_val" fill={barFillColor} barSize={barSize} />
						</BarChart>
					</div>
					<div id="ag">
						<p id="label"> Power for Day : {moment.utc(this.state.date).format("dddd")}
											<span> - </span>	{ moment.utc(this.state.date).format("DD/MM/YYYY")} </p>
						<BarChart width={barChartWidth_daily*this.state.power.length}  height={barChartHeight} 
							  data={this.state.power} >
							<XAxis dataKey="time" stroke= {axesStroke}/>
							<YAxis stroke={axesStroke}/>
							<Tooltip />
							<CartesianGrid vertical = {false}strokeDasharray="4 2" />
							<Bar type="monotone" dataKey="power_val" fill={barFillColor} barSize={barSize} />
						</BarChart>
					</div>
				</div>
			}
				
											<p id="duration_text"> Weekly Data	</p>
			<div id="day_shift2">
				<button className="button" onClick={() => {this.prevWeek()}} >
					<span>&laquo; Previous Week </span>
				</button>
				<button className="button button2" onClick={() => {this.nextWeek()}} >
					<span>Next Week &raquo;</span>
				</button>
			</div>
				
			{
			this.state.fetching ? 
				<div> 
					<div className="loading"> </div> 
					<p id="wait-text"> Please Wait. Updating the Data...</p> 
				</div> : 
				<div id="a3g">
				<div id="ag">
					<p id="label"> Temperature for Week : {moment.utc(this.state.date).format("w")}
											: 	{moment.utc(this.state.date).format("DD/MM/YYYY")} </p>
					<BarChart
						width={barChartWidth_weekly*this.state.temp_week.length}
						height={barChartHeight} 
						data={this.state.temp_week} >
						<XAxis dataKey="day" stroke= {axesStroke}/>
						<YAxis type="number" domain={[0, 40]}stroke={axesStroke}/>
						<Tooltip />
						<CartesianGrid vertical = {false}strokeDasharray="4 2" />
						<Bar dataKey="max_temp" fill={barFillColor_max}/>
						<Bar dataKey="min_temp" fill={barFillColor_min}/>
					</BarChart>
				</div>
				<div id="ag">
					<p id="label"> Humidity for Week : {moment.utc(this.state.date).format("w")} 
											: 	{moment.utc(this.state.date).format("DD/MM/YYYY")}</p>
					<BarChart
						width={barChartWidth_weekly*this.state.humidity_week.length}
						height={barChartHeight} 
						data={this.state.humidity_week} >
						<XAxis dataKey="day" stroke= {axesStroke}/>
						<YAxis stroke={axesStroke}/>
						<Tooltip />
						<CartesianGrid vertical = {false}strokeDasharray="4 2" />
						<Bar dataKey="max_humidity" fill={barFillColor_max}/>
						<Bar dataKey="min_humidity" fill={barFillColor_min}/>
					</BarChart>
				</div>
				<div id="ag">
					<p id="label"> Power for Week : {moment.utc(this.state.date).format("w")} 
											: 	{moment.utc(this.state.date).format("DD/MM/YYYY")}</p>
					<BarChart
						width={barChartWidth_weekly*this.state.power_week.length}
						height={barChartHeight} 
						data={this.state.power_week} >
						<XAxis dataKey="day" stroke= {axesStroke}/>
						<YAxis tickFormatter={this.customTickFormatter}   stroke={axesStroke}  />
						<Tooltip />
						<CartesianGrid vertical = {false}strokeDasharray="4 2" />
						<Bar dataKey="total_power" fill={barFillColor}/>
					</BarChart>
				</div>
			</div>
			}
											<p id="duration_text"> Monthly Data	</p>
			<div id="day_shift2">
				<button className="button" /*onClick={() => {this.prevMonth()}}*/ >
					<span> </span>
				</button>
				<button className="button button2" /*onClick={() => {this.nextMonth()}}*/ >
					<span></span>
				</button>
			</div>
			{
			this.state.fetching ? 
			<div> 
				<div className="loading"> </div> 
				<p id="wait-text"> Please Wait. Updating the Data...</p> 
			</div> : 
			
			<div id="calendar-parent">
				
				<div className="calendar-container" style={this.style}>
				<p id="label"> Temperature  </p>
					<table className="calendar">
						<thead>
							<tr className="calendar-header">
								<td colSpan="5">
									<this.MonthNav />
									{" "}
									<this.YearNav />
								</td>
								<td colSpan="2" className="nav-month">
									

								</td>
							</tr>
						</thead>
						<tbody>
							<tr>
								{weekdays}
							</tr>
							{trElems_T}
						</tbody>
					</table>

				</div>
				
				<div className="calendar-container" style={this.style}>
				<p id="label"> Humidity  </p>
					<table className="calendar">
						<thead>
							<tr className="calendar-header">
								<td colSpan="5">
									<this.MonthNav />
									{" "}
									<this.YearNav />
								</td>
								<td colSpan="2" className="nav-month">
									

								</td>
							</tr>
						</thead>
						<tbody>
							<tr>
								{weekdays}
							</tr>
							{trElems_H}
						</tbody>
					</table>

				</div>
				
				
				<div className="calendar-container" style={this.style}>
				<p id="label"> Power  </p>
					<table className="calendar">
						<thead>
							<tr className="calendar-header">
								<td colSpan="5">
									<this.MonthNav />
									{" "}
									<this.YearNav />
								</td>
								<td colSpan="2" className="nav-month">
									
								</td>
							</tr>
						</thead>
						<tbody>
							<tr>
								{weekdays}
							</tr>
							{trElems_P}
						</tbody>
					</table>

				</div>				
				
			</div>
			}	
		</div>
    </div>
	);
  }
}