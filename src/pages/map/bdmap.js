import React from 'react'
import { Card, Form, Row, Col, Statistic, Button, Icon, Input, Modal, Radio, Select, Upload, message, Tooltip} from 'antd'
import axios from "../../axios";

const FormItem = Form.Item;

export default class bdMap extends React.Component{
    state = {
        category: ["全部"],
        dataWithCategory: null,
        minConcentration: 0,
        maxConcentration: 0,
        step: -1
    };
    map = null;
    componentDidMount(){
        let map = new window.BMap.Map("address"); // 创建Map实例
        map.centerAndZoom(new window.BMap.Point(104.284, 37.548), 6); // 初始化地图,设置中心点坐标和地图级别
        map.addControl(new window.BMap.NavigationControl());
        // map.addControl(new window.BMap.MapTypeControl()); //添加地图类型控件
        map.setCurrentCity("北京"); // 设置地图显示的城市 此项是必须设置的
        map.enableScrollWheelZoom();
        map.enableContinuousZoom();

        map.setMapStyle({
            styleJson: [{
                "featureType": "water",
                "elementType": "all",
                "stylers": {
                    // "color": "#044161"
                }
            }, {
                "featureType": "land",
                "elementType": "all",
                "stylers": {
                    // "color": "#091934"
                }
            }, {
                "featureType": "boundary",
                "elementType": "geometry",
                "stylers": {
                    // "color": "#064f85"
                }
            }, {
                "featureType": "railway",
                "elementType": "all",
                "stylers": {
                    "visibility": "off"
                }
            }, {
                "featureType": "highway",
                "elementType": "geometry",
                "stylers": {
                    "visibility": "off"
                }
            }, {
                "featureType": "highway",
                "elementType": "geometry.fill",
                "stylers": {
                    "visibility": "off"
                }
            }, {
                "featureType": "highway",
                "elementType": "labels",
                "stylers": {
                    "visibility": "off"
                }
            }, {
                "featureType": "arterial",
                "elementType": "geometry",
                "stylers": {
                    // "color": "#004981",
                    "lightness": -39
                }
            }, {
                "featureType": "arterial",
                "elementType": "geometry.fill",
                "stylers": {
                    // "color": "#00508b"
                }
            }, {
                "featureType": "poi",
                "elementType": "all",
                "stylers": {
                    "visibility": "off"
                }
            }, {
                "featureType": "green",
                "elementType": "all",
                "stylers": {
                    // "color": "#056197",
                    "visibility": "off"
                }
            }, {
                "featureType": "subway",
                "elementType": "all",
                "stylers": {
                    "visibility": "off"
                }
            }, {
                "featureType": "manmade",
                "elementType": "all",
                "stylers": {
                    "visibility": "off"
                }
            }, {
                "featureType": "local",
                "elementType": "all",
                "stylers": {
                    "visibility": "off"
                }
            }, {
                "featureType": "arterial",
                "elementType": "labels",
                "stylers": {
                    "visibility": "off"
                }
            }, {
                "featureType": "boundary",
                "elementType": "geometry.fill",
                "stylers": {
                    // "color": "#029fd4"
                }
            }, {
                "featureType": "building",
                "elementType": "all",
                "stylers": {
                    // "color": "#1a5787"
                }
            }, {
                "featureType": "label",
                "elementType": "all",
                "stylers": {
                    "visibility": "off"
                }
            }, {
                "featureType": "poi",
                "elementType": "labels.text.fill",
                "stylers": {
                    // "color": "#ffffff"
                }
            }, {
                "featureType": "poi",
                "elementType": "labels.text.stroke",
                "stylers": {
                    // "color": "#1e1c1c"
                }
            }, {
                "featureType": "administrative",
                "elementType": "labels",
                "stylers": {
                    "visibility": "on"
                }
            }, {
                "featureType": "road",
                "elementType": "labels",
                "stylers": {
                    "visibility": "off"
                }
            }]
        });

        this.map = map;
        // this.renderBoundary();
        this.queryCategory();
        this.renderBoundaryByAll();
        this.queryDataWithCategory();
    }

    renderBoundary = () => {
        let provinces = ["广西-#C8C1E3", "广东-#FBC5DC", "湖南-#DBEDC7", "贵州-#E7CCAF", "云南-#DBEDC7",
            "福建-#FEFCBF", "江西-#E7CCAF", "浙江-#C8C1E3", "安徽-#FBC5DC", "湖北-#C8C1E3",
            "河南-#DBECC8", "江苏-#DBECC8", "四川-#FCFBBB", "海南-#FCFBBB", "山东-#FCFBBB", "辽宁-#FCFBBB",
            "新疆-#FCFBBB", "西藏-#E7CCAF", "陕西-#E7CCAF", "河北-#E7CCAF", "黑龙江-#E7CCAF", "宁夏-#FBC5DC",
            "内蒙古-#DBEDC7", "青海-#DBEDC7", "甘肃-#C8C1E3", "山西-#FBC5DC", "吉林省-#C8C1E3",
            "北京-#FBC5DC", "天津-#C8C1E3", "上海-#FCFBBB", "重庆-#FBC5DC"
        ];
        provinces.forEach((province) => {
            let count = Math.round(Math.random()*100);
            let color = null;
            if (count >= 0 && count <= 20) {
                color = "#6aff8d";
            } else if (count >= 21 && count <= 60) {
                color = "#78bcff";
            } else {
                color = "#ff4843";
            }
            this.getBoundary(province.substring(0, province.indexOf('-')), color);
        });
    };

    newVar = {
        "dimensions":[
            "entity_name"
        ],
        "metrics":[
            {
                "type":"sum",
                "field":"concentration",
                "in_data":true,
                "alias":"result"
            }
        ],
        "filters":[
            {
                "type":"in",
                "field":"label",
                "conditions":[
                    "industry_concentration"
                ]
            }
        ]
    };
    queryCategory = () => {
        let request_json = this.newVar;
        axios.get({
            url:'/entity/statistic',
            data:{
                params: {request_json: request_json}
            }
        }).then( (data) => {                                //js异步编程，es6 promise, 后端把数据传给前端，正确进入then，否则进入catch
            console.log(data);
            if(data && data.result) {
                data.result.entity_name.forEach((item) => {
                    this.setState({
                        category: this.state.category.concat(item.value),
                    });
                });
            }
        }).catch(function (error) {
            console.log(error);
        });
    };

    queryIndustryBySelect = (fieldVal) => {
        if (this.state.dataWithCategory === null) return;
        this.map.removeControl(this.legendCtrl);
        if (fieldVal.type === '全部') {
            this.renderBoundaryByAll();
            return;
        }
        for (let item of this.state.dataWithCategory) {
            if (item.value === fieldVal.type) {
                this.renderBoundaryByData(item.province);
                break;
            }
        }
    };

    renderBoundaryByAll = () => {
        let request_json = {
            "dimensions":[
                "province",
                "city"
            ],
            "metrics":[
                {
                    "type":"sum",
                    "field":"concentration",
                    "in_data":true,
                    "alias":"result"
                }
            ],
            "filters":[
                {
                    "type":"in",
                    "field":"label",
                    "conditions":[
                        "industry_concentration"
                    ]
                }
            ]
        };

        axios.get({
            url:'/entity/statistic',
            data:{
                params: {request_json: request_json}
            }
        }).then( (data) => {                                //js异步编程，es6 promise, 后端把数据传给前端，正确进入then，否则进入catch
            if(data && data.result && data.result.province) {
                this.renderBoundaryByData(data.result.province);
            }
        }).catch(function (error) {
            console.log(error);
        });
    };

    renderBoundaryByData = (data) => {
        this.map.clearOverlays();
        let minConcentration = 65535, maxConcentration = -65535;
        data.forEach((item) => {
            item.city.forEach((e) => {
                minConcentration = e.result > minConcentration ? minConcentration : e.result;
                maxConcentration = e.result < maxConcentration ? maxConcentration : e.result;
            });
        });
        let step = (maxConcentration - minConcentration) / 5.0;
        this.setState({
            minConcentration: minConcentration,
            maxConcentration: maxConcentration,
            step: step
        }, () => this.addLegend());
        data.forEach((item) => {
            item.city.forEach((e) => {
                let colorType = Math.floor((e.result - minConcentration) / step);

                let color;
                switch (colorType) {
                    case 0: color = "#fdae61"; break;
                    case 1: color = "#f46d43"; break;
                    case 2: color = "#ff4843"; break;
                    case 3: color = "#d01e23"; break;
                    case 4: color = "#a50026"; break;
                    default: color = "#a50026"
                }
                this.getBoundary(e.value, color);
            });
        });
    };

    queryDataWithCategory = () => {
        let request_json = {
            "dimensions":[
                'entity_name',
                "province",
                "city"
            ],
            "metrics":[
                {
                    "type":"sum",
                    "field":"concentration",
                    "in_data":true,
                    "alias":"result"
                }
            ],
            "filters":[
                {
                    "type":"in",
                    "field":"label",
                    "conditions":[
                        "industry_concentration"
                    ]
                }
            ]
        };

        axios.get({
            url:'/entity/statistic',
            data:{
                params: {request_json: request_json}
            }
        }).then( (data) => {                                //js异步编程，es6 promise, 后端把数据传给前端，正确进入then，否则进入catch
            console.log(data);
            if(data && data.result) {
                this.setState({dataWithCategory: data.result.entity_name});
            }
        }).catch(function (error) {
            console.log(error);
        });
    };

    getBoundary = (province, color) => {
        let bdary = new window.BMap.Boundary();
        bdary.get(province, (rs) => {       //获取行政区域
            // this.map.clearOverlays();        //清除地图覆盖物
            let count = rs.boundaries.length; //行政区域的点有多少个
            if (count === 0) {
                // alert('未能获取当前输入行政区域: ' + province);
                this.getBoundary(province+'市', color);
                return ;
            }
            let pointArray = [];
            for (let i = 0; i < count; i++) {
                let ply = new window.BMap.Polygon(rs.boundaries[i], {
                    strokeWeight: 1,
                    strokeOpacity: 0.5,
                    strokeStyle: 'solid',
                    strokeColor: 'white',
                    fillColor: color,
                    fillOpacity: 0.9
                }); //建立多边形覆盖物
                this.map.addOverlay(ply);  //添加覆盖物
                pointArray = pointArray.concat(ply.getPath());
            }
            // this.map.setViewport(pointArray);    //调整视野
            // addlabel();
        });
    };

    /**
     * 添加图例
     * 实质就是在地图上添加自己的页面元素
     *
     * html 网页元素
     **/
    addLegend = (html) => {
        function LegendControl() {
            this.defaultAnchor = window.window.BMap_ANCHOR_BOTTOM_RIGHT;
            this.defaultOffset = new window.BMap.Size(10, 10);
        }

        LegendControl.prototype = new window.BMap.Control();
        LegendControl.prototype.initialize =  () =>{
            const div = document.createElement('div');
            // 添加文字说明
            // div.appendChild(document.createTextNode('颜色指示'));
            // 设置样式
            div.style.height = '200px';
            div.style.width = '190px';
            // div.style.cursor = "pointer";
            div.style.border = ".5px solid #aaa";
            div.style.fontSize = '12px';
            div.style.backgroundColor = 'white';
            div.style.color = 'bule';
            div.style.padding = '3px 6px';
            div.style.boxShadow = '2px 2px 3px rgba(0, 0, 0, 0.35)';

            const div1 = this.createDiv('10px', '10px', '#fdae61');
            div.appendChild(div1);
            const div2 = this.createDiv('10px', '28px', '#f46d43');
            div.appendChild(div2);
            const div3 = this.createDiv('10px', '46px', '#ff4843');
            div.appendChild(div3);
            const div4 = this.createDiv('10px', '64px', '#d01e23');
            div.appendChild(div4);
            const div5 = this.createDiv('10px', '82px', '#a50026');
            div.appendChild(div5);

            const div6 = this.createDivWithText('55px', '-94px', 'white', Math.floor(this.state.minConcentration * 100) / 100 + ' - ' + Math.floor((this.state.minConcentration + this.state.step) * 100) / 100);
            div.appendChild(div6);
            const div7 = this.createDivWithText('55px', '-76px', 'white', Math.floor((this.state.minConcentration + this.state.step) * 100) / 100 + ' - ' + Math.floor((this.state.minConcentration + 2 * this.state.step) * 100) / 100);
            div.appendChild(div7);
            const div8 = this.createDivWithText('55px', '-58px', 'white', Math.floor((this.state.minConcentration + 2 * this.state.step) * 100) / 100 + ' - ' + Math.floor((this.state.minConcentration + 3 * this.state.step) * 100) / 100);
            div.appendChild(div8);
            const div9 = this.createDivWithText('55px', '-40px', 'white', Math.floor((this.state.minConcentration + 3 * this.state.step) * 100) / 100 + ' - ' + Math.floor((this.state.minConcentration + 4 * this.state.step) * 100) / 100);
            div.appendChild(div9);
            const div10 = this.createDivWithText('55px', '-22px', 'white', Math.floor((this.state.minConcentration + 4 * this.state.step) * 100) / 100 + ' - ' + Math.floor((this.state.minConcentration + 5 * this.state.step) * 100) / 100);
            div.appendChild(div10);

            this.map.getContainer().appendChild(div);
            return div;
        };

        this.legendCtrl = new LegendControl();
        this.map.addControl(this.legendCtrl);
    };

    createDiv = (left, top ,color) => {
        let div = document.createElement('div');
        div.style.height = '20px';
        div.style.width = '30px';
        div.style.backgroundColor = color;
        div.style.padding = '5px 6px';
        div.style.position = 'relative';
        div.style.top = top;
        div.style.left = left;
        return div;
    };

    createDivWithText = (left, top ,color, text) => {
        let div = document.createElement('div');
        div.style.height = '20px';
        div.style.lineHeight = '20px';
        div.style.fontSize = '14px';
        div.style.width = '120px';
        div.style.backgroundColor = color;
        div.style.padding = '5px 6px';
        div.style.position = 'relative';
        div.style.top = top;
        div.style.left = left;
        div.appendChild(document.createTextNode(text));
        return div;
    };
    
    render() {
        return(
            <Row style={{backgroundColor:"white"}}>
                <Col span={24}>
                    <Row>
                        <Card style={{backgroundColor:"white"}}>
                            <QueryIndustryForm queryIndustry = { this.queryIndustryBySelect } category = {this.state.category}/>
                        </Card>
                    </Row>
                    <Row>
                        <Card>
                            <div className="address" id="address" style={{height:1000}}>
                            </div>
                        </Card>
                    </Row>
                </Col>
            </Row>

        )
    }
}

class QueryIndustryForm extends React.Component{
    state = {
        province: "全国"
    };

    componentDidMount(){
    }

    handleQueryIndustry = () => {
        let fieldsValue = this.props.form.getFieldsValue();
        this.props.form.validateFields((err,values)=>{
            if(!err){
                this.props.queryIndustry(fieldsValue);
                console.log(fieldsValue);
            }
        })
    };

    handleTypeChange = (typeSelect) =>{
        console.log(typeSelect);              //获取到了下拉按钮的值
        this.props.changeTypeSelect(typeSelect);
        //this.setState({shape})
    };

    render(){
        const { getFieldDecorator } = this.props.form;
        const selectTypeWrapper = this.props.category.map(item => <Select.Option key={item}>{item}</Select.Option>);
        return (
            <Form layout="inline">
                <FormItem label="产业类型">
                    {
                        getFieldDecorator('type', {
                            initialValue: '全部'
                        })(
                            <Select style={{ width: 200 }}>
                                {selectTypeWrapper}
                            </Select>
                        )
                    }
                </FormItem>
                <FormItem>
                    <Button type="primary" onClick={this.handleQueryIndustry}>查询</Button>
                </FormItem>

            </Form>
        );
    }
}
QueryIndustryForm = Form.create({})(QueryIndustryForm);

