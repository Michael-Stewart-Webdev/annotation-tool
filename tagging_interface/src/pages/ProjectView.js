import React from 'react';
import {Component} from 'react';
import { PieChart } from 'react-minimal-pie-chart';
import { Redirect, Link, BrowserRouter, Route, Switch, withRouter } from 'react-router-dom'
import { TransitionGroup, CSSTransition } from "react-transition-group";
import Error404Page from '../pages/Error404Page';
import {Bar, Line, HorizontalBar } from 'react-chartjs-2';

import { defaults } from 'react-chartjs-2'

import { Comment } from '../components/Comment';

defaults.global.defaultFontFamily = 'Open Sans'

// Config for all API fetch requests
const fetchConfigGET = {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};


const chartColours = [
"#36A2EB",
"#FF6384",
"#6dc922",
"#B4436C",
"#FFCE56",
"#F78154",
"#5FAD56",
"#4D9078",
"#586BA4",
"#324376",
"#F5DD90",
"#6665DD",
"#7B4B94",
];


// Couldn't find a good component for this online so I made my own. It visualises the 'annotations per doc' in the form of a 
// waffle chart, which looks more or less like a heat map but without any labels. The data should be ordered in descending freq
// of number of annotations.
class WaffleChart extends Component {
  constructor(props) {
    super(props);
  }



  render() {
    var maxValue = this.props.data.length - 1;

    var total = this.props.data.reduce((a, b) => a + b, 0);
    var ratio = 100 / total;

    var tooltips = [];

    var tooltipSide = -1;
    var rowIdx = 0;

    var data = this.props.data.reverse(); // Reverse the order so that the docs annotated more are on top

    // Calculate the tooltip positions
    var totalSquares = 0;
    for(var i in this.props.data) {

      var count = this.props.data[i];
      var squares = Math.ceil(count * ratio);

      tooltips.push(
        <span style={{'top': (Math.ceil(totalSquares / 10) * 19) + 'px'}} className={"waffle-chart-tooltip tooltip-" + (tooltipSide === 1 ? "right" : "left")}>

          <b style={{'background': 'rgba(54, 162, 235,' + Math.max(0.1, ((maxValue - i) / maxValue)) + ')'}}>
            {(maxValue - i === 0) ? "Not yet annotated" : ((maxValue - i) + " annotation" + (maxValue - i === 1 ? '' : 's'))}
          </b>
          <span className="num-docs">{this.props.data[i]} docs</span>
        </span>
      );

      tooltipSide *= -1;

      rowIdx += Math.floor(squares / 10) + 1;
      totalSquares += squares;
      
    }


    return (
      <div className="waffle-chart-container">
        <div className="waffle-chart-legend">
          <span>{maxValue}</span>
          <div className="waffle-chart-legend-inner"></div>
          <span>0</span>


        </div>
        <div className="waffle-chart" id="annotations-per-doc-chart">
          <div className="waffle-chart-squares">
            { this.props.data.map((frequency, groupIndex) => {

              var value = maxValue - groupIndex;

              return new Array(Math.ceil(frequency * ratio)).fill(0).map((square, squareIndex) => {
                return (
                  <div className="waffle-square" style={
                    {'background': 'rgba(54, 162, 235,' + Math.max(0.1, ((value) / maxValue)) + ')'}}>
                    { value }
                  </div>
                )
              }
              )}
            )}
          </div>
          <div className="waffle-chart-info">1 square = ~{ Math.ceil(1 / ratio) } documents</div> 
          <div className="waffle-chart-tooltips">{ tooltips }</div>
        </div>    


      </div>

      )
  }
}


// Returns a JSON array of styles for the entity chart.
function getEntityChartStyles() {
  return {
    backgroundColor: 'rgba(54, 162, 235, 0.6)',
    borderColor: 'rgba(54, 162, 235, 0.6)',
    borderWidth: 1,
    hoverBackgroundColor: 'rgba(54, 162, 235, 0.6)',
    hoverBorderColor: 'rgba(54, 162, 235, 0.6)',
  }
}


// https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Set the styles of the activity chart data.
function setActivityChartStyles(activityChartData) {

  for(var i in activityChartData.datasets) {
    var colourIdx = parseInt(i) % chartColours.length;
    activityChartData.datasets[i] = Object.assign({}, activityChartData.datasets[i], {
      fill: true,
      lineTension: 0.1,
      backgroundColor: chartColours[colourIdx],
      borderColor: chartColours[colourIdx],
      borderCapStyle: 'butt',
      borderDash: [],
      borderDashOffset: 0.0,
      borderJoinStyle: 'miter',
      pointBorderColor: chartColours[colourIdx],
      pointBackgroundColor: chartColours[colourIdx],
      pointBorderWidth: 3,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: chartColours[colourIdx],
      pointHoverBorderColor: 'rgba(220,220,220,1)',
      pointHoverBorderWidth: 2,
      pointRadius: 1,
      pointHitRadius: 10,
    })

  }
  return activityChartData;
}


// The project dashboard, which renders in the container to the right of the navigation.
// Its data comes from props, not state (so that the dashboard doesn't need to be reloaded when switching between
// pages in the Project view).
class ProjectDashboard extends Component {
  constructor(props) {
    super(props);    
  }






  render() {

    // var heatmapData = new Array(198).fill(3);
    // var h1 = new Array(200).fill(2)
    // var h2 = new Array(200).fill(1)
    // var h3 = new Array(200).fill(0)
    // heatmapData = heatmapData.concat(h1);
    // heatmapData = heatmapData.concat(h2);
    // heatmapData = heatmapData.concat(h3);

    

    //heatmapData = heatmapData.map(() => Math.random())

    return (
     
      <div id="project-dashboard" className={(this.props.loading ? "loading" : "")}>
        <div className="dashboard-top-row">
        <div className="dashboard-key-items">
          <div className="dashboard-item">
            <div className="flex-wrapper">



              <div>
                <div className="name"># Annotated</div>
                <div className="value"><span class="st st-darker">{ numberWithCommas(this.props.data.numDocGroupsAnnotated) } / { numberWithCommas(this.props.data.totalDocGroups) }</span></div>
              </div>

              <div class="pieChart">

                { this.props.loading && 
                <PieChart
                  data={[
                    { value: 0, color: "rgb(109, 201, 34)"},
                    { value: 1, color: "rgba(0, 0, 0, 0)"}, // sneaky 
                  ]}
                  background={"#d5d5d5"}
                  lineWidth={18}
                  startAngle={270}
                />
                }
                { !this.props.loading && 
                  <PieChart
                  data={[
                    { value: (this.props.data.numDocGroupsAnnotated), color: "rgb(109, 201, 34)"},
                    { value: (this.props.data.totalDocGroups - this.props.data.numDocGroupsAnnotated), color: "rgba(0, 0, 0, 0)"}, // sneaky 
                  ]}
                  background={"#d5d5d5"}
                  animate={true}
                  animationDuration={500}
                  lineWidth={18}
                  startAngle={270}
                />
                }



              </div>
            </div>

          </div>
          <div className="dashboard-item">
            <div className="name">Avg. agreement</div>
            <div className="value"><span class="st st-darker"> { this.props.data.avgAgreement * 100}% </span></div>
          </div>
          <div className="dashboard-item">
            <div className="name">Avg. time per document</div>
            <div className="value"><span class="st st-darker">{ this.props.data.avgTimePerDocument } seconds</span></div>
          </div>
          </div>

          <Link to={"/projects/" + this.props.project_id + "/tagging"} className="annotate-button"><i class="fa fa-pencil"></i>Annotate</Link>

        </div>



        <div className="dashboard-white-boxes">


          <div className="dashboard-wrapper-item col-60">



            <div className="dashboard-item col-100">
              <div className="inner">
                <h3>Entity frequencies</h3>
                <div>
                  { this.props.loading && 
                    <div className="chart-placeholder"><i class="fa fa-cog fa-spin"></i>Loading...</div>
                  }
                  { !this.props.loading && 
                  <Bar
                    data={this.props.data.entityChartData.entityClasses}
                    height={230}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      legend: {
                        display: false
                      },
                      scales: {
                        yAxes: [{
                          ticks: {
                            beginAtZero: true,
                            precision: 0
                            
                          },
                          scaleLabel: {
                            display: true,
                            labelString: "Frequency"
                          }
                        }]
                      },
                    }}
                  />}


                </div>
              </div>
            </div>

            <div className="dashboard-item col-60">
              <div className="inner">
                <h3>Activity</h3>
                <div>
                  { this.props.loading && 
                    <div className="chart-placeholder"><i class="fa fa-cog fa-spin"></i>Loading...</div>
                  }
                  { !this.props.loading && 
                  <Line
                    data={this.props.data.activityChartData}
                    height={230}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        xAxes: [{
                          type: 'time',
                          time: {
                            unit: 'day',
                          },
                          ticks: {
                            max: new Date()
                          }
                        }],
                        yAxes: [{
                          ticks: {
                            beginAtZero: true,
                            precision: 0
                            
                          },
                          scaleLabel: {
                            display: true,
                            labelString: "Annotations"
                          }
                        }]
                      }
                    }}/>
                  }
                </div>
              </div>
            </div>

            

            <div className="dashboard-item col-40">
              <div className="inner">
                <h3>Annotations/document</h3>
                { this.props.loading && 
                  <div className="chart-placeholder"><i class="fa fa-cog fa-spin"></i>Loading...</div>
                }
                { !this.props.loading && 
                  <WaffleChart data={this.props.data.annotationsChartData}/>
                }
              </div>
            </div>
          </div>

        


        <div className="dashboard-item col-40 double-height">
          <div className="inner">
            <h3>Comments</h3>

            <div className="comments-wrapper">              

              { this.props.data.comments.map((comment, i) => <Comment index={i} text={comment.text} date={comment.date} author={comment.author} document={comment.document} />) }

            </div>
          </div>
        </div>

          
        </div>


      </div>    
      
    )
  }
}



class ProjectViewSidenav extends Component {
  constructor(props) {
    super(props);
  }



  render() {
    /* old 
    <div className="project-card">
      <div className="circle-icon"><div className="inner">PO</div></div>
      <div>
        <div className="project-name">Project one</div>
        <div className="project-creator">Created by <span className="creator-name">someone</span></div>
      </div>
    </div>



    <div className="go-back"><Link to="/projects"><i class="fa fa-chevron-left"></i>Projects</Link></div>

    */

    var currentLocation = window.location.pathname;
    var view = currentLocation.split('/')[currentLocation.split('/').length - 1];

    return (
      <nav id="project-view-sidenav">
        <div className="project-card">
          <div className="circle-icon"><div className="inner"></div></div>
          <div>
            <div className="project-name st " style={{'display': 'block'}}><Link to={"/projects/" + this.props.project_id + "/dashboard"}>{this.props.project_name}</Link></div>
            <div className="project-creator st">Created by <span className="creator-name">{this.props.project_author}</span></div>
          </div>
        </div>

        <ul className="sidenav-items">
          <ProjectViewSidenavButton project_id={this.props.project_id} view={view} name="Dashboard" icon="bar-chart"/>
          <ProjectViewSidenavButton project_id={this.props.project_id} view={view} name="Annotations" icon="list-alt"/>
          <ProjectViewSidenavButton project_id={this.props.project_id} view={view} name="Category hierarchy" icon="tree"/>
          <ProjectViewSidenavButton project_id={this.props.project_id} view={view} name="Invitations" icon="envelope"/>
          <ProjectViewSidenavButton project_id={this.props.project_id} view={view} name="Settings" icon="wrench"/>
        </ul>

      </nav>
    )
  }
}

class ProjectViewSidenavButton extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    var pathName = this.props.name.replace(" ", "-").toLowerCase();
    return (
      <li className={this.props.view === pathName ? "active" : ""}>
        <Link to={"/projects/" + this.props.project_id + "/" + pathName}>
        <i className={"fa fa-" + this.props.icon}></i>{ this.props.name }
        </Link>


      </li>
    )
  }
}

class EmptyThing extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return ( <div>Hello I am empty lol</div> )
  }
}

class ProjectView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,

      project_name: "????????",
      project_author: "????????",

      data: {

        dashboard: {

          numDocGroupsAnnotated: 999,
          totalDocGroups: 9999,

          avgAgreement: 0.5,

          avgTimePerDocument: 15,

          comments: [
            {
              author: "Mr Pingu",
              date: "4 Sept",
              text: "Noot noot! I don't know what this is",
              document: "replace a/c converter cap",
            },
            {
              author: "Mrs Pingu",
              date: "3 Sept",
              text: "This doesn't make sense",
              document: "fix 50 things on seal",
            },
            {
              author: "Michael",
              date: "1 Sept",
              text: "Not sure what a flange is",
              document: "look at flange more",
            }
          ],
        }        
      }   
    }
  }

  componentWillMount() {
    var t = this;

    fetch('http://localhost:3000/projects/' + this.props.project_id, fetchConfigGET) // TODO: move localhost out
      .then(response => response.text())
      .then((data) => {
        console.log(data, "<<<");
        var d = JSON.parse(data);

        window.setTimeout(() => {

          // Add the chart styles here in the front-end
          var entityChartData = Object.assign({}, d.dashboard.entityChartData.entityClasses.datasets[0], getEntityChartStyles())
          d.dashboard.entityChartData.entityClasses.datasets[0] = entityChartData;

          d.dashboard.activityChartData = setActivityChartStyles(d.dashboard.activityChartData);




          t.setState({
            loading: false,

            project_name: d.project_name,
            project_author: d.project_author,

            data: d,

            
          }, () => { console.log(this.state.data.dashboard.entityChartData)} );
      }, 1);
    });




    
    // Query api for project

  }

  render() {
    var location = this.props.location;

    return (
      <div>
        <div id="project-view" className={this.state.loading ? "loading" : ""}>
          <ProjectViewSidenav view={this.state.view}
                              project_id={this.props.project_id}
                              project_name={this.state.project_name}
                              project_author={this.state.project_author}

                               />


          <div className="project-view-wrapper">
          <TransitionGroup className="transition-group">
          <CSSTransition
          key={location.key}
          timeout={{ enter: 400, exit:400 }}
          classNames="fade"
          >
          <section className={"route-section" + (!this.state.loading ? " loaded" : "")}>
           <Switch location={location}>
              <Route path="/projects/:id/dashboard"           render={() => <ProjectDashboard loading={this.state.loading} data={this.state.data.dashboard} project_id={this.props.project_id} />} />     
              <Route path="/projects/:id/annotations"         render={() => <EmptyThing {...this.state} />} />     
              <Route path="/projects/:id/category-hierarchy"  render={() => <EmptyThing {...this.state} />} />     
              <Route path="/projects/:id/invitations"         render={() => <EmptyThing {...this.state} />} />     
              <Route path="/projects/:id/settings"            render={() => <EmptyThing {...this.state} />} />   
              <Route             render={() => <Error404Page />} />   
            </Switch>
          </section>
          </CSSTransition>
          </TransitionGroup>
          </div>
        
      

          


        </div>     
      </div>
    )
  }
}
// { currentView }

export default withRouter(ProjectView);