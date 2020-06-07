import React from 'react'
import './index.less'
import {Card, Col, Row, Divider} from "antd";
export default class Home extends React.Component{

    render(){
        return (
            <div className="home-wrap">
                {/*<Divider orientation="left" >*/}
                <Row>
                    <Col align="top">
                        <Row>
                            <Col ><img src="/assets/face.png" alt=""/></Col>
                        </Row>

                    </Col>
                    <Col span={2}></Col>
                </Row>
                {/*</Divider>*/}
            </div>
        );
    }
}