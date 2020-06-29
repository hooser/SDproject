import React from 'react'
import { HashRouter, Route, Switch, Redirect} from 'react-router-dom'
import App from './App'
import Login from './pages/login'
import Admin from './admin'
import NoMatch from './pages/nomatch'
import Home from './pages/home';
import BasicTable from './pages/table/basicTable'
// import ListedMap from './pages/map/listedMap'
// import ListedMapBD from './pages/map/listedMapBD'
// import DigitalMap from './pages/map/digitalMap'
// import CompanyMap from './pages/map/companyMap'
// import ClusterMap from './pages/map/clusterMap'
// import FreeTrade from './pages/map/freetrade'
// import FiveHundred from './pages/map/fivehundred'
// import DataVis from './pages/map/datavis'
// import DiyList from './pages/map/diyList'
// import DiyArea from './pages/map/diyArea'
// import BdMap from './pages/map/bdmap'

//新的页面索引
import DiyList from './pages/map/diyList'
import DiyArea from './pages/map/diyArea'
import IndMain_Company from './pages/map/IndMain_company'
import MainCompany from './pages/map/mainCompany'
import MainResearch from './pages/map/mainResearch'
import MainInstrument from './pages/map/mainInstrument'
import MainLeague from './pages/map/mainLeague'
import MainInnovation from './pages/map/mainInnovation'
import MainIncabutor from './pages/map/mainIncabutor'
import MainPerson from './pages/map/mainPerson'
import Industries from './pages/map/Industries'


export default class ERouter extends React.Component{

    render(){
        return (
            <HashRouter>
                <App>
                    <Switch>
                        <Route path="/login" component={Login}/>
                        <Route path="/" render={()=>
                            <Admin>              { /* Admin在以下部分变换 */}
                                <Switch>
                                    {/*<Route path='/industrymain_company' component={Home} />*/}
                                    {/*<Route path="/companylist" component={BasicTable} />*/}

                                    //新的页面索引
                                    <Route path='/industrymain_company' component={IndMain_Company} />
                                    <Route path='/mainCompany' component={MainCompany} />
                                    <Route path='/mainResearch' component={MainResearch} />
                                    <Route path='/mainInstrument' component={MainInstrument} />
                                    <Route path='/mainLeague' component={MainLeague} />
                                    <Route path='/mainInnovation' component={MainInnovation} />
                                    <Route path='/mainIncabutor' component={MainIncabutor} />
                                    <Route path='/mainPerson' component={MainPerson} />
                                    <Route path='/diyList' component={DiyList} />
                                    <Route path='/diyArea' component={DiyArea} />
                                    <Route path='/Industries' component={Industries} />
                                    {/*<Route path='/companymap' component={CompanyMap} />*/}
                                    <Redirect to="/industrymain_company" />
                                    <Route component={NoMatch} />
                                </Switch>
                            </Admin>         
                        } />
                    </Switch>
                </App>
            </HashRouter>
        );
    }
}