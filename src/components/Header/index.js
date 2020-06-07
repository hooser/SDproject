import React from 'react'
import { Row,Col,Divider } from "antd"
import './index.less'
import Util from '../../utils/utils'
import axios from '../../axios'
import { connect } from 'react-redux'
class Header extends React.Component{
    state={
        userName:''
    }
    componentWillMount(){
        this.setState({
            userName:'Admin'
        })
        setInterval(()=>{
            let sysTime = Util.formateDate(new Date().getTime());
            this.setState({
                sysTime
            })
        },1000)
    }

    render(){
        const { menuName, menuType } = this.props;
        return (
            <div className="header">
                <Row className="header-top" >
                    {
                        menuType?'':

                            <Col align="left">

                                <Row>
                                   <font color="white" size = '5'>{menuName || '自定义园区'}</font>
                                </Row>

                            </Col>
                    }
                </Row>
                <Row className="breadcrumb" />

            </div>
        );
    }
}
const mapStateToProps = state => {
    return {
        menuName: state.menuName
    }
};
export default connect(mapStateToProps)(Header)