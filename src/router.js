import React from 'react'
import { HashRouter, Route, Switch, Redirect} from 'react-router-dom'
import App from './App'
import Login from './pages/login'
import Admin from './admin'
import NoMatch from './pages/nomatch'
import Home from './pages/home';
import BasicTable from './pages/table/basicTable'
import ListedMap from './pages/map/listedMap'
import ListedMapBD from './pages/map/listedMapBD'
import DigitalMap from './pages/map/digitalMap'
import CompanyMap from './pages/map/companyMap'
import ClusterMap from './pages/map/clusterMap'
import FreeTrade from './pages/map/freetrade'
import FiveHundred from './pages/map/fivehundred'
import DataVis from './pages/map/datavis'
import DiyList from './pages/map/diyList'
import DiyArea from './pages/map/diyArea'
import BdMap from './pages/map/bdmap'

//新的页面索引
import IndMain_Company from './pages/map/IndMain_company'
import MainCompany from './pages/map/mainCompany'

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
                                    <Route path='/home' component={Home} />
                                    {/*<Route path="/companylist" component={BasicTable} />*/}

                                    //新的页面索引
                                    <Route path='/industrymain_company' component={IndMain_Company} />
                                    <Route path='/mainCompany' component={MainCompany} />
                                    <Route path='/diyList' component={DiyList} />
                                     <Route path='/diyArea' component={DiyArea} />
                                    {/*<Route path='/companymap' component={CompanyMap} />*/}
                                    <Redirect to="/home" />
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