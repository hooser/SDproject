import React from 'react'
import { Card, Form, Row, Col, Statistic, Button, Icon, Input, Modal, Radio, Select} from 'antd'
import axios from '../../axios/index'
import 'ol/ol.css';
import {fromLonLat, getTransform} from 'ol/proj';
import Heatmap from 'ol/layer/Heatmap';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Draw, Modify, Snap } from "ol/interaction";
import GeoJSON from 'ol/format/GeoJSON';
import {Style, Fill, Stroke, Circle, RegularShape, Text} from 'ol/style'
import Placemark from 'ol-ext/overlay/Placemark'
import  OlGeomPolygon from 'ol/geom/Polygon'
import OlGeomPoint from 'ol/geom/Point'
import OlSelect from 'ol/interaction/Select'
import OlFeature from 'ol/Feature'
import {singleClick} from 'ol/events/condition'
import 'ol-ext/control/Bar.css'
import 'ol-ext/control/EditBar.css'
import LayerSwitcherImage from 'ol-ext/control/LayerSwitcherImage'
import 'ol-ext/control/LayerSwitcherImage.css'
import Popup from 'ol-ext/overlay/Popup'
import 'ol-ext/control/Legend.css'
import 'ol-ext/overlay/Popup.css'
import 'ol-ext/overlay/Popup.anim.css'
import Pie from '../echarts/pie/index'
import Bar from '../echarts/bar/index'
import PureRenderMixin from 'react-addons-pure-render-mixin';
import SourceCluster from "ol/source/Cluster";
import {createEmpty, extend as OlExtend, getHeight as OlGetHeight, getWidth as OlGetWidth} from "ol/extent";
import '../../config/envConfig'

import BMap  from 'BMap';
import * as mapv from 'mapv';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;

export default class ListedMapBD extends React.Component{

    state = {
        category: ["全部"],
        colorset:['rgba(150, 150, 0, 0.2)','rgba(0, 125, 255, 0.2)','rgba(125, 0, 125, 0.2)'],
        province: "全国",
        selectParams: {},
        visible: false,
        typeSelect: 'Polygon',
        industrialpark_name: "",
        city: "",
        province2city:{"全国": ["全国"]},
        barOption: {
            title: {
                text: ''
            },
            tooltip: {
                trigger: 'axis'
            },
            xAxis: {
                data: []
            },
            yAxis: {
                type: 'value'
            },
            series: [
                {
                    name: '年收入',
                    type: 'bar',
                    data: []
                }
            ]
        },
        barTitles: [
            {key: 'income', value: '年收入'},
            {key: 'tax', value: '缴税金额'},
            {key: 'profit', value: '净利润'}
        ],
        my_locations:{}
    };

    map = {};
    companySource = null;
    pointLayer = null;
    heatmapLayer = null;
    clusterLayer = null;
    areaLayer = null;
    customAreaLayer = null;
    drawInteraction = null;
    drawLayer = null;
    snap = null;
    // pointLayer = null;

    constructor(props){
        super(props);
        this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
    }
    componentWillMount(){

    }

    componentDidMount(){
        this.setCompanyCategory();
        this.setBarOption();
        this.renderOlMap();
        // this.addMapControl();
        // this.addPopUp();
        // this.addCustomAreaLayer();
    }

    getPieOption() {
        let data = [];
        console.log(this.state.company_type_map);
        for (let type in this.state.company_type_map) {
            data.push(
                {
                    value: this.state.company_type_map[type],
                    name: type
                }
            );
        }
        let option = {
            title: {
                text: '',
                x: 'center'
            },
            legend: {
                orient: 'vertical',
                right: 10,
                top: 20,
                bottom: 20,
                data: []
            },
            tooltip: {
                trigger: 'item',
                formatter: "{a} <br/>{b} : {c} ({d}%)"
            },
            series: [
                {
                    name: '公司数目',
                    type: 'pie',
                    radius: '55%',
                    center: [
                        '50%', '50%'
                    ],
                    data: data,
                    itemStyle: {
                        emphasis: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }
            ]
        };
        return option;
    }

    setBarOption = (params) => {
        axios.get({
            url:'/listed/statistic',
            data:{
                params: params
            }
        }).then( (data) => {
            console.log(data);
            if (data) {
                let xData = [];
                let incomeData = [];
                let taxData = [];
                let profitData = [];
                for (let key in data.income) {
                    xData.push(key);
                    incomeData.push(parseInt(data.income[key]/1000000));
                }
                for (let key in data.tax) {
                    taxData.push(parseInt(data.tax[key]/1000000));
                }
                for (let key in data.income) {
                    profitData.push(parseInt(data.profit[key]/1000000));
                }
                let labelOption = {
                    normal: {
                        show: true,
                        align: 'center',
                        verticalAlign: 'middle',
                        position: 'top',
                        rotate: 0,
                        formatter: '{c}',
                        fontSize: 12,
                        rich: {
                            name: {
                                textBorderColor: '#fff'
                            }
                        }
                    }
                };

                let option = {
                    color: ['#003366', '#006699', '#4cabce'],
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: {
                            type: 'shadow'
                        }
                    },
                    legend: {
                        data: ['年收入', '缴税额', '净利润']
                    },
                    toolbox: {
                        show: true,
                        orient: 'vertical',
                        left: 'right',
                        top: 'center',
                        feature: {
                            mark: {show: true},
                            dataView: {show: true, readOnly: false},
                            magicType: {show: true, type: ['line', 'bar', 'stack', 'tiled']},
                            restore: {show: true},
                            saveAsImage: {show: true}
                        }
                    },
                    calculable: true,
                    xAxis: [
                        {
                            type: 'category',
                            axisTick: {show: false},
                            data: xData
                        }
                    ],
                    yAxis: [
                        {
                            type: 'value'
                        }
                    ],
                    series: [
                        {
                            name: '年收入',
                            type: 'bar',
                            barGap: 0,
                            label: labelOption,
                            data: incomeData
                        },
                        {
                            name: '缴税额',
                            type: 'bar',
                            label: labelOption,
                            data: taxData
                        },
                        {
                            name: '净利润',
                            type: 'bar',
                            label: labelOption,
                            data: profitData
                        }
                    ]
                };
                this.setState({barOption: option});
            }
        }).catch(function (error) {
            console.log(error);
        });
    };

    updateBarOption = (titleType) => {
        this.setBarOption(this.state.selectParams,titleType);
    };

    //产业类型
    setCompanyCategory = () => {
        axios.get({
            url:'/listed/category',
            data:{
                params:{}
            }
        }).then( (data) => {                                //js异步编程，es6 promise, 后端把数据传给前端，正确进入then，否则进入catch
            if(data && data.province && data.type) {
                for (let key in data.province) {
                    data.province[key] = ['全省'].concat(data.province[key]);
                }
                this.setState({
                    category: this.state.category.concat(data.type),
                    province2city: Object.assign({},this.state.province2city, data.province)
                });
            }
        }).catch(function (error) {
            console.log(error);
        });
    };

    queryCompanyBySelect = (params) => {
        this.setState({province: params.province});
        this.setState({city: params.city});
        if (params.type === '全部') {
            delete params.type;
        }
        if (params.province === '全国') {
            delete params.province;
        }
        if (params.city === '全省' || params.city === "全国" || params.city === "") {
            delete params.city;
        }
        if (params.hasOwnProperty('province')) {
            if (!params.hasOwnProperty('city')) {
                this.getBoundary(params.province, "#78bcff");
            } else {
                this.getBoundary(params.city, "#78bcff");
            }
        }
        this.setState({selectParams: params});
        this.clusterLayer.hide();
        this.pointLayer.hide();
        this.heatmapLayer.hide();
        this.buildLayers(params);
        this.move2Location(params.province);
        this.setBarOption(params);
    };

    zoomInSlow = (curZoom, endZoom, step) => {
        if (curZoom >= endZoom) return;
        this.map.zoomIn();
        curZoom = this.map.getZoom();
        setTimeout(() => {
            this.zoomInSlow(curZoom, endZoom, step);
        }, 2000);
    };

    getBoundary = (province, color) => {
        this.map.clearOverlays();
        let bdary = new BMap.Boundary();
        bdary.get(province, (rs) => {       //获取行政区域
            // this.map.clearOverlays();        //清除地图覆盖物
            let count = rs.boundaries.length; //行政区域的点有多少个
            if (count === 0) {
                alert('未能获取当前输入行政区域: ' + province);
                return ;
            }
            let pointArray = [];
            for (let i = 0; i < count; i++) {
                let ply = new BMap.Polygon(rs.boundaries[i], {
                    strokeWeight: 0.1,
                    strokeOpacity: 0,
                    strokeStyle: '',
                    strokeColor: color,
                    fillColor: color,
                    fillOpacity: 0.2
                }); //建立多边形覆盖物
                this.map.addOverlay(ply);  //添加覆盖物
            }
        });
    };

    move2Location = (province) => {
        let center;
        if (province === undefined || province === '全国') {
            center = new BMap.Point(104.284, 37.548);
            this.map.setZoom(5);
            setTimeout(() => {
                this.map.panTo(center);
            }, 1000);
            return;
        }

        let params = {address: province};
        axios.get({
            url:'geometry/geo',
            data:{
                params:params
            }
        }).then( (data) => {
            if (data) {
                center = new BMap.Point(parseInt(data.lon), parseInt(data.lat));
                this.map.panTo(center);
                setTimeout(() => {
                    this.zoomInSlow(this.map.getZoom(), 6, 0.5);
                }, 1000);
            }
        }).catch(function (error) {
            console.log(error);
        });
    };

    buildLayers = (params) => {
        axios.get({
            url:'/listed/coordinates',
            data:{
                params:params
            }
        }).then( (data) => {
            if(data.features) {
                console.log(data.features);
                let company_type_map = {};
                let pointData = [];
                data.features.forEach( item => {
                    let point = new OlGeomPoint(item.geometry.coordinates);
                    point.applyTransform(getTransform('EPSG:4326', 'EPSG:3857'));

                    //company_type_map
                    if (item.industrial_type != null) {
                        let company_type = item.industrial_type;
                        if (company_type_map.hasOwnProperty(company_type)) {
                            company_type_map[company_type] += 1;
                        } else {
                            company_type_map[company_type] = 0;
                        }
                    }

                    pointData.push({
                        geometry: item.geometry,
                        count: 30 * Math.random()
                    });
                });

                let dataSet = new mapv.DataSet(pointData);

                let pointOptions = {
                    fillStyle: 'rgba(0, 191, 243, 0.7)',
                    // shadowColor: 'rgba(255, 50, 50, 1)',
                    // shadowBlur: 30,
                    // globalCompositeOperation: 'lighter',
                    methods: {
                        click: function (item) {
                            console.log(item);
                        }
                    },
                    size: 3,
                    // updateImmediate: true,
                    draw: 'simple'
                };
                this.pointLayer = new mapv.baiduMapLayer(this.map, dataSet, pointOptions);
                this.pointLayer.hide();

                let clusterOptions = {
                    // shadowColor: 'rgba(255, 250, 50, 1)',
                    // shadowBlur: 10,
                    fillStyle: 'rgba(255, 50, 0, 1.0)', // 非聚合点的颜色
                    size: 5, // 非聚合点的半径
                    minSize: 8, // 聚合点最小半径
                    maxSize: 31, // 聚合点最大半径
                    globalAlpha: 0.8, // 透明度
                    clusterRadius: 150, // 聚合像素半径
                    methods: {
                        click: function(item) {
                            console.log(item);  // 点击事件
                        }
                    },
                    maxZoom: 19, // 最大显示级别
                    label: { // 聚合文本样式
                        show: true, // 是否显示
                        fillStyle: 'white',
                        // shadowColor: 'yellow',
                        // font: '20px Arial',
                        // shadowBlur: 10,
                    },
                    gradient: { 0: "blue", 0.5: 'yellow', 1.0: "rgb(255,0,0)"}, // 聚合图标渐变色
                    draw: 'cluster'
                };
                this.clusterLayer= new mapv.baiduMapLayer(this.map, dataSet, clusterOptions);
                // clusterLayer.hide();

                let heatmapOptions = {
                    size: 13,
                    gradient: { 0.25: "rgb(0,0,255)", 0.55: "rgb(0,255,0)", 0.85: "yellow", 1.0: "rgb(255,0,0)"},
                    max: 100,
                    // range: [0, 100], // 过滤显示数据范围
                    // minOpacity: 0.5, // 热力图透明度
                    // maxOpacity: 1,
                    draw: 'heatmap'
                };
                this.heatmapLayer = new mapv.baiduMapLayer(this.map, dataSet, heatmapOptions);
                this.heatmapLayer.hide();
                this.setState({company_type_map});
            }
        }).catch(function (error) {
            console.log(error);
        });
        return null;
    };

    // 渲染地图
    renderOlMap = () => {
        let map = new BMap.Map("container"); // 创建Map实例
        map.centerAndZoom(new BMap.Point(104.284, 37.548), 5.5); // 初始化地图,设置中心点坐标和地图级别
        map.addControl(new BMap.NavigationControl());
        // map.addControl(new BMap.MapTypeControl()); //添加地图类型控件
        map.setCurrentCity("北京"); // 设置地图显示的城市 此项是必须设置的
        map.enableScrollWheelZoom();
        map.enableContinuousZoom();

        this.map = map;
        this.buildLayers();
    };

    addDrawLayer = () => {
        return;     //园区自定义 暂未实现
        if (this.drawLayer != null) {
            this.map.removeLayer(this.drawLayer);
        }
        let drawSource = new VectorSource();
        this.drawLayer = new VectorLayer({
            name: '自定义绘制',
            source: drawSource,
            style: new Style({
                fill: new Fill({
                    color: "rgba(255, 255, 255, 0.2)"
                }),
                stroke: new Stroke({
                    color: "#ffcc33",
                    width: 2
                }),
                image: new Circle({
                    radius: 7,
                    fill: new Fill({
                        color: "#ffcc33"
                    })
                })
            })
        });
        this.map.addLayer(this.drawLayer);

        // let modify = new Modify({ source: drawSource });
        // this.map.addInteraction(modify);
        this.removeDrawInteractions();
        this.addDrawInteractions(drawSource);
    };

    selectLayer = (layer) => {
        if(layer == 1){
            this.clusterLayer.show();
            this.heatmapLayer.show();
            this.pointLayer.show();
            this.clusterLayer.hide();
            this.heatmapLayer.hide();
            // this.state.pointLayer.show();
        }
        else if(layer == 2){
            this.clusterLayer.show();
            this.heatmapLayer.show();
            this.pointLayer.show();
            this.pointLayer.hide();
            this.heatmapLayer.hide();
            // this.state.clusterLayer.show();
        }
        else{
            this.clusterLayer.show();
            this.heatmapLayer.show();
            this.pointLayer.show();
            this.clusterLayer.hide();
            this.pointLayer.hide();
            // this.state.heatmapLayer.show();
        }
    };

    showModal = () => {
        this.setState({
        visible: true,
     });
    };

    handleOk = e => {
        console.log(e);
        let val = this.refs.park_name.value;
        console.log(val);
        this.setState({
        industrialpark_name:val,
        visible: false,
        });
        let _this = this;

        //let name = 'test01';
        _this.saveGeom(this.state.my_locations,val);//this.state.industrialpark_name
    };

    handleCancel = e => {
        console.log(e);
        this.setState({
        visible: false,
    });
  };

    addDrawInteractions = (source) =>{
        this.drawInteraction = new Draw({
            source: source,
            type: this.state.typeSelect
        });
        this.map.addInteraction(this.drawInteraction);
        this.snap = new Snap({ source: source });
        this.map.addInteraction(this.snap);
        let _this = this;
        this.drawInteraction.on("drawend", (event) => {
            //弹框，输入name，取消，确定
            //如果确定，
            this.showModal();
            let name = 'test01';

            let feature = event.feature;
            let features = source.getFeatures();
            features = features.concat(feature);

            console.log(features);
            features.forEach(f => {
                let geom = f.geometry;
                //let locations = f.getGeometry().getCoordinates();

                this.setState({
                    my_locations: f.getGeometry().getCoordinates(),
                 });
                //_this.saveGeom(this.state.my_locations, '');//this.state.my_locations
            });
            //console.log(this.state.my_locations);
        });
    }

    saveGeom = (geoms, name) => {
        console.log("shuyulou");
        console.log(name);
        axios.get({
            url:'geometry/save',
            data:{
                params:{
                    "geom": JSON.stringify(geoms),
                    "name": name//JSON.stringify(name)
                }
            }
        }).then( (data) => {
            if (data.result == 1) {
                this.removeCustomAreaLayer();
                this.addCustomAreaLayer();
                this.removeDrawInteractions();
            }
        }).catch(function (error) {
            //console.log(error);
        });
    };

    removeDrawInteractions = () => {
        if (this.drawInteraction != null) {
            this.map.removeInteraction(this.drawInteraction);
        }
        if (this.snap != null) {
            this.map.removeInteraction(this.snap);
        }
    };
    //load自定义区域
    addCustomAreaLayer = () => {
        this.customAreaLayer = this.buildCustomLayer();
        this.map.addLayer(this.customAreaLayer);
    };
    removeCustomAreaLayer = () => {
        if (this.customAreaLayer != null) {
            this.map.removeLayer(this.customAreaLayer);
        }
    };

    changeTypeSelect = (typeSelect) => {
        console.log(typeSelect);
        this.setState({typeSelect: "Polygon"});
    };

    buildAreaLayer = (params = {level: 'province', province: '上海市'}) => {
        let areaSource=new VectorSource();
        let areaLayer = new VectorLayer({
            source: areaSource,
            visible: true
        });
        axios.get({
            url:'/geometry/district',
            data:{
                params:params
            }
        }).then( (data) => {
            if (data[params.level][0].multipolygon) {
                let multipolygon = new OlGeomPolygon(data[params.level][0].multipolygon);
                multipolygon.applyTransform(getTransform('EPSG:4326', 'EPSG:3857'));
                let feature = new OlFeature(multipolygon);
                areaSource.addFeature(feature);
            }
        }).catch(function (error) {
            console.log(error);
        });
        return areaLayer;
    };

    buildCustomLayer = (params = {name: 'test01'}) => {
        let customSource=new VectorSource();
        let customLayer = new VectorLayer({
            source: customSource,
            visible: true,
            name: '自定义显示'
        });
        axios.get({
            url:'/geometry/load',
            data:{
                params:params
            }
        }).then( (data) => {
            if (data.multipolygon) {
                let multipolygon = new OlGeomPolygon(data.multipolygon);
                let feature = new OlFeature(multipolygon);
                customSource.addFeature(feature);
            }
        }).catch(function (error) {
            console.log(error);
        });
        return customLayer;
    };

    render(){
        let city = this.state.city;
        if (city === "全国" || city === "全省" || city === "上海市" || city === "北京市") {
            city = "";
        }
        let preTitle = this.state.province + city;
        let barTitle = preTitle + "年度利润";
        let pieTitle = preTitle + "产业类型结构";

        let barOption = this.state.barOption;
        console.log(barOption);

        return (
            <Row style={{backgroundColor:"white"}}>
                <Col span={16}>
                    <Row>
                        <Card style={{backgroundColor:"white"}}>
                            <QueryCompanyForm queryCompany = { this.queryCompanyBySelect } addDrawLayer = {this.addDrawLayer} selectLayer = {this.selectLayer} category = {this.state.category} province2city = {this.state.province2city}/>
                       </Card>
                       <Modal
                            title=""
                            visible={this.state.visible}
                            onOk={this.handleOk}
                            onCancel={this.handleCancel}
                        >
                            园区名称：<br/>
                            <input ref="park_name" />
                        </Modal>
                    </Row>

                    <Row>
                        <Card>
                            <div id="container" style={{height:750}}></div>
                        </Card>
                    </Row>
                </Col>
                <Col span={8}>
                    <Pie option={this.getPieOption(this.state.province)} title={pieTitle}/>
                    <Bar option={barOption} preTitle={preTitle}  barTitles={this.state.barTitles} updateOption={this.updateBarOption}/>
                </Col>
            </Row>
        );
    }
}

class QueryCompanyForm extends React.Component{
    state = {
      province: "全国"
    };

    componentDidMount(){
    }

    handleQueryCompany = () => {
        let fieldsValue = this.props.form.getFieldsValue();
        this.props.form.validateFields((err,values)=>{
            if(!err){
                this.props.queryCompany(fieldsValue);
            }
        })
    };

    handleProvinceChange = (province) =>{
        console.log(province);
        this.setState({province})
    };

    handleTypeChange = (typeSelect) =>{
        console.log(typeSelect);              //获取到了下拉按钮的值
        this.props.changeTypeSelect(typeSelect);
        //this.setState({shape})
    };

    queryCategory = () => {
        let request_json = {
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
    
    render(){
        const { getFieldDecorator } = this.props.form;
        const selectTypeWrapper = this.props.category.map(item => <Select.Option key={item}>{item}</Select.Option>);
        let province2city = this.props.province2city;
        let provinceWrapper = [];
        let cityWrapperMap = {};
        for (let key in province2city) {
            provinceWrapper.push(<Select.Option key={key}>{key}</Select.Option>);
            let cityWapper = [];
            for (let item of province2city[key]) {
                cityWapper.push(<Select.Option key={item}>{item}</Select.Option>);
            }
            cityWrapperMap[key] = cityWapper;
        }
        return (
            <Form layout="inline">
                <FormItem label="省份">
                    {
                        getFieldDecorator('province', {
                            initialValue: '全国'
                        })(
                            <Select style={{ width: 130 }} onChange={this.handleProvinceChange}>
                                {provinceWrapper}
                            </Select>
                        )
                    }
                </FormItem>
                <FormItem label="城市">
                    {
                        getFieldDecorator('city', {
                            initialValue: province2city[this.state.province][0]
                        })(
                            <Select style={{ width: 130 }}>
                                {cityWrapperMap[this.state.province]}
                            </Select>
                        )
                    }
                </FormItem>
                <FormItem label="产业类型">
                    {
                        getFieldDecorator('type', {
                            initialValue: '全部'
                        })(
                            <Select style={{ width: 130 }}>
                                {selectTypeWrapper}
                            </Select>
                        )
                    }
                </FormItem>
                <FormItem>
                    <Button type="primary" onClick={this.handleQueryCompany}>查询</Button>
                </FormItem>
                
                <FormItem>
                    <Button type="primary" onClick={this.props.addDrawLayer}>园区自定义</Button>
                </FormItem>

                <FormItem>
                    <Button type="primary" onClick={this.queryCategory}>测试</Button>
                </FormItem>

                <FormItem>
                    <Select id="pid" defaultValue="2" onChange={this.props.selectLayer}>
                        <Select.Option value="1">企业分布图</Select.Option>
                        <Select.Option value="2">企业聚类图</Select.Option>
                        <Select.Option value="3">企业热力图</Select.Option>
                    </Select>
                </FormItem>

            </Form>
        );
    }
}
QueryCompanyForm = Form.create({})(QueryCompanyForm);


