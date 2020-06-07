import React from 'react'
import { Row,Col } from 'antd';
import Header from './components/Header'
import Footer from './components/Footer'
import { connect } from 'react-redux'
import NavLeft from './components/NavLeft'
import './style/common.less'
import Home from './pages/home'

class Admin extends React.Component{

    render(){
        return (
            <Row className="container">
                <Col span="3" className="nav-left">
                    <NavLeft/>
                </Col>
                <Col span="21" className="main">
                    <Header/>
                    <Row className="content">
                        {/* <Home/> */}
                         { this.props.children }
                    </Row>
                     <Footer/> 
                </Col>
            </Row>
        );
    }
}
export default connect()(Admin)