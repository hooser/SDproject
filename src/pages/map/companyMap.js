import React from 'react'
import { Card, Form, Row, Col, Statistic, Button, Icon, Input, Modal, Radio, Select} from 'antd'
import axios from '../../axios/index'
import 'ol/ol.css';
import './index.less';
import OlMap from 'ol/Map';
import OlView from 'ol/View';
import OlLayerTile from 'ol/layer/Tile';
import OlSourceOsm from 'ol/source/OSM';
import {fromLonLat, getTransform} from 'ol/proj';
import Heatmap from 'ol/layer/Heatmap';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import {Style, Fill, Stroke, Circle, RegularShape, Text} from 'ol/style'
import  OlGeomPolygon from 'ol/geom/Polygon'
import OlGeomPoint from 'ol/geom/Point'
import OlSelect from 'ol/interaction/Select'
import OlFeature from 'ol/Feature'
import {singleClick} from 'ol/events/condition'
import LayerSwitcherImage from 'ol-ext/control/LayerSwitcherImage'
import 'ol-ext/control/LayerSwitcherImage.css'
import Popup from 'ol-ext/overlay/Popup'
import OlLegend from 'ol-ext/control/Legend'
import 'ol-ext/control/Legend.css'
import 'ol-ext/overlay/Popup.css'
import 'ol-ext/overlay/Popup.anim.css'
import EChartsLayer from 'ol-echarts'
import Pie from '../echarts/pie/index'
import Bar from '../echarts/bar/index'
import SearchInput from './SearchInput'
import ReactEcharts from "echarts-for-react";
import SourceCluster from "ol/source/Cluster";
import { createEmpty, extend as OlExtend, getWidth as OlGetWidth, getHeight as OlGetHeight } from "ol/extent";

const FormItem = Form.Item;
const RadioGroup = Radio.Group;

export default class CompanyMap extends React.Component{
    state = {
        companyId: null,
        companyName:"",
        companyData:{},
        category: ["全部"],
        colorset:['rgba(150, 150, 0, 0.2)','rgba(0, 125, 255, 0.2)','rgba(125, 0, 125, 0.2)'],
        barOption: {
            title: {
                text: '十万'
            },
            tooltip: {
                trigger: 'axis'
            },
            xAxis: {
                data: [2014,2015,2016,2017,2018]
            },
            yAxis: {
                type: 'value'
            },
            series: [
                {
                    name: '利润',
                    type: 'bar',
                    data: [33,38,40,42,50]
                }
            ]
        },
        barTitles: [
            {key: 'income', value: '年收入'},
            {key: 'tax', value: '缴税金额'},
            {key: 'profit', value: '净利润'}
        ],
        currentResolution: null,
        maxFeatureCount: null,
        earthquakeCluster: null
    };

    map = {};
    popup = null;
    select = null;
    companySource = null;
    vecCompAllLayer = null;
    pointLayer = null;
    clusterVectorLayer = null;

    constructor(props){
        super(props);
    }
    componentWillMount(){

    }

    componentDidMount(){
        this.renderOlMap();
        this.addPopUp();
        this.addMapControl();
    }

    getBarOptionByData = (data, titleType='income') => {
        data = data[titleType];
        let xData = [];
        let yData = [];
        for (let key in data) {
            xData.push(key);
            yData.push(parseInt(data[key]/10000));
        }
        let option = {
            title: {
                text: '十万'
            },
            tooltip: {
                trigger: 'axis'
            },
            xAxis: {
                data: xData
            },
            yAxis: {
                type: 'value'
            },
            series: [
                {
                    name: titleType,
                    type: 'bar',
                    data: yData
                }
            ]
        };
        return option;
    };

    updateBarOption = (titleType) => {
        this.setState({
            barOption: this.getBarOptionByData(this.state.companyData, titleType)
        });
    };

    handleQueryCompanyOrAddress = (companyOrAddress, searchType) => {
        if (this.pointLayer) {
            this.map.removeLayer(this.pointLayer);
        }
        if (searchType === 'company') {
            this.queryCompanyById(companyOrAddress);
        } else {
            this.queryAddress(companyOrAddress);
        }
    };

    queryCompanyById = (companyId) =>{
        console.log(companyId);
        axios.get({
            url:'/listed/information',
            data:{
                params:{
                    "id":companyId,
                }
            }
        }).then( (data) => {
            console.log(data);
            if(data) {
                this.showCompanyInfoInMap(data);
                this.setState({companyData: data});
                this.setState({
                    barOption: this.getBarOptionByData(data)
                });
            }
        }).catch(function (error) {
            console.log(error);
        });
    };

    showCompanyInfoInMap = (data) => {
        this.setState({
            companyId:data.id,
            companyName:data.name,
        });
        console.log(this.state.companyId);
        let curFeatureCoordination = this.companySource.getFeatureById(data.id).getGeometry().getFirstCoordinate();
        let viewPort = this.map.getView();
        this.popup.show(curFeatureCoordination, data.name + "<br/>省份：" + data.province + "<br/>网址：" + data.website);
        // viewPort.setCenter(curFeatureCoordination);
        let zoom = viewPort.getZoom();
        if ( zoom <= 12 ) {
            zoom = Math.min(12,zoom+2);
        }
        viewPort.animate({
            center: curFeatureCoordination,
            zoom: zoom
        });
        /*
        viewPort.on('change:resolution',(e) => {
            let curZoom = viewPort.getZoom();
            if (curZoom >= 12) {
                console.log("cur point change to large");

            } else if (curZoom < 12) {
                console.log("cur point change to small");

            }
        });
        */
    };

    //地址查询，渲染一个点在地图中
    queryAddress = (address) => {
        axios.get({
            url:'/listed/geo',
            data:{
                params:{
                    "address": address,
                }
            }
        }).then( (data) => {
            if(data) {
                this.pointLayer = this.buildPointByGeo(parseFloat(data.lon), parseFloat(data.lat));
                this.map.addLayer(this.pointLayer);
            }
        }).catch(function (error) {
            console.log(error);
        });
    };

    //根据地址查询返回经纬度 构建包含一个点的图层
    buildPointByGeo = (lon, lat) => {
        let point = new OlGeomPoint([lon, lat]);
        point.applyTransform(getTransform('EPSG:4326', 'EPSG:3857'));
        let feature = new OlFeature(point);
        let style=new Style({
            fill: new Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new Stroke({
                color: '#ff3614',
                width: 2
            }),
            image: new Circle({
                radius: 6,
                fill: new Fill({
                    color: '#ff3614'
                })
            })
        });
        feature.setStyle(style);
        let source=new VectorSource();
        source.addFeature(feature);
        let pointLayer = new VectorLayer({
            source: source,
            visible: true
        });

        //set center
        let viewPort = this.map.getView();
        let zoom = viewPort.getZoom();
        if ( zoom <= 12 ) {
            zoom = Math.min(12,zoom+2);
        }
        viewPort.animate({
            center: fromLonLat([lon, lat]),
            zoom: zoom
        });
        return pointLayer;
    };

    //构建全国公司图层
    buildVecCompanyLayer = (params) => {
        let vecCompanyStyle=new Style({
            fill: new Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new Stroke({
                color: '#438abf',
                width: 1
            }),
            image: new Circle({
                radius: 3,
                fill: new Fill({
                    color: '#07b9ff'
                })
            })
        });
        let companySource=new VectorSource();
        let companyLayer=new VectorLayer({
            baseLayer: true,
            name: '公司分布',
            source: companySource,
            visible: false
        });
        if (params.type === '全部') {
            delete params.type;
        }
        if (params.province === '全国') {
            delete params.province;
        }
        if (params.city === '全省') {
            delete params.city;
        }
        axios.get({
            url:'/listed/coordinates',
            data:{
                params:params
            }
        }).then( (data) => {
            if(data.features) {
                console.log(data.features);
                data.features.forEach( item => {
                    let point = new OlGeomPoint(item.geometry.coordinates);
                    point.applyTransform(getTransform('EPSG:4326', 'EPSG:3857'));
                    let feature = new OlFeature(point);
                    feature.setStyle(vecCompanyStyle);
                    feature.setId(item.id);
                    companySource.addFeature(feature);
                });
                this.clusterVectorLayer = this.buildClusterLayer(companySource);
            }
        }).catch(function (error) {
            console.log(error);
        });
        this.companySource = companySource;
        // this.buildClusterLayer(companySource);
        return companyLayer;
    };

    // 渲染地图
    renderOlMap = () => {
        let osmLayer = new OlLayerTile({
            source: new OlSourceOsm()
        });
        //公司图层
        this.vecCompAllLayer = this.buildVecCompanyLayer({});


        this.map = new OlMap({
            target: 'container',
            view: new OlView({
                center: fromLonLat([104.284, 37.548]),
                zoom: 4.5,
            }),
            layers: [osmLayer, this.vecCompAllLayer]
        });
    };

    // 添加地图控件
    addMapControl = () => {
        let map = this.map;
        map.addControl(new LayerSwitcherImage());
    };

    //添加 popup
    addPopUp = () => {
        // Select  interaction
        let select = new OlSelect({
            hitTolerance: 5,
            multi: false,
            condition: singleClick,
            layers: [this.vecCompAllLayer]
        });
        this.map.addInteraction(select);

        // Popup overlay
        let popup = new Popup ({
            popupClass: "default", //"tooltips", "warning" "black" "default", "tips", "shadow",
            closeBox: true,
            onshow: function(){ console.log("You opened the box"); },
            onclose: function(){
                console.log("You close the box");
                // self.echartsBarLayer.remove();
            },
            positioning: 'auto',
            autoPan: true,
            autoPanAnimation: { duration: 250 }
        });
        this.map.addOverlay (popup);

        // On selected => show/hide popup
        select.getFeatures().on(['add'], e => {
            console.log(e);
            let style=new Style({
                fill: new Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new Stroke({
                    color: '#ff3614',
                    width: 2
                }),
                image: new Circle({
                    radius: 6,
                    fill: new Fill({
                        color: '#ff3614'
                    })
                })
            });
        	let feature = e.element;
            feature.setStyle(style);
            let content = "";
            let companyId = feature.getId();
            // popup.show(feature.getGeometry().getFirstCoordinate(), content);
            this.handleQueryCompanyOrAddress(companyId, 'company');
        });
        select.getFeatures().on(['remove'], e => {
            let style=new Style({
                fill: new Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new Stroke({
                    color: '#438abf',
                    width: 1
                }),
                image: new Circle({
                    radius: 3,
                    fill: new Fill({
                        color: '#07b9ff'
                    })
                })
            });
            let feature = e.element;
            feature.setStyle(style);
        	popup.hide();
        });
        this.select = select;
        this.popup = popup;
    };

    calculateClusterInfo = (resolution) => {
        this.setState({maxFeatureCount: 0});
        let features = this.clusterVectorLayer.getSource().getFeatures();
        let feature, radius;
        for (let i = features.length - 1; i >= 0; i--) {
            feature = features[i];
            let originalFeatures = feature.get('features');
            let extent = createEmpty();
            let j = (void 0), jj = (void 0);
            for (let j = 0, jj = originalFeatures.length; j<jj; ++j) {
                OlExtend(extent, originalFeatures[j].getGeometry().getExtent());
            }
            this.setState({maxFeatureCount: Math.max(this.state.maxFeatureCount, jj)});
            radius = 0.15 * (OlGetWidth(extent) + OlGetHeight(extent)) / resolution; /** key code **/
            if(radius < 10){
                radius = 10;
            }
            feature.set('radius', radius);
        }
    };

    buildClusterLayer = (source) => {
        //聚合标注数据源
        let clusterSource = new SourceCluster({
            distance: 40,               //聚合的距离参数，即当标注间距离小于此值时进行聚合，单位是像素
            source: source              //聚合的数据源，即矢量要素数据源对象
        });
        console.log(source.getFeatures());
        //加载聚合标注的矢量图层
        let styleCache = {};                    //用于保存特定数量的聚合群的要素样式
        let clusters = new VectorLayer({
            baseLayer: true,
            name: '聚点图',
            visible: true,
            source: clusterSource,
            style: (feature, resolution) => {
                if (resolution != this.state.currentResolution) {
                    this.calculateClusterInfo(resolution);  /** key code **/
                    this.setState({currentResolution: resolution});
                }
                let size = feature.get('features').length;          //获取该要素所在聚合群的要素数量
                let style = styleCache[size];
                if(!style){
                    style = [
                        new Style({
                            image: new Circle({
                                radius: feature.get('radius'),
                                stroke: new Stroke({
                                    color: '#fff'
                                }),
                                fill: new Fill({
                                    color: '#3399CC'
                                })
                            }),
                            text: new Text({
                                text: size.toString(),
                                fill: new Fill({
                                    color: '#fff'
                                })
                            })
                        })
                    ];
                    styleCache[size] = style;
                }
                return style;
            }
        });
        this.map.addLayer(clusters);
        return clusters;
    };

    render(){
        let preTitle = (this.state.companyName || "公司平均");
        return (
            <Row>
                <Col span={16}>
                    <Row>
                        <Card>
                            <QueryCompanyForm queryCompanyOrAddress = {this.handleQueryCompanyOrAddress}/>
                        </Card>
                    </Row>

                    <Row>
                        <Card className="bg-wrap">
                            <div id="container" style={{height:750}}></div>
                        </Card>
                    </Row>
                </Col>
                <Col span={8}>
                    <Card title='公司简介' style={{height: 300}}>
                        <h3>公司名称：{this.state.companyName || "暂无"}</h3>
                        <h3>产业类型: {this.state.companyData.industrial_type || "暂无类型"}</h3>
                        <h3>详细介绍：{this.state.companyName || "暂无详细介绍"}</h3>
                        <h3>网址: {this.state.companyData.website || "暂无网址"}</h3>
                    </Card>
                    <Bar option={this.state.barOption} preTitle={preTitle} barTitles={this.state.barTitles} updateOption={this.updateBarOption}/>
                </Col>
            </Row>
        );
    }
}

class QueryCompanyForm extends React.Component{
    state = {
      type: 'company'
    };
    componentDidMount(){
    }

    updateSearchInput = (value, type) => {
        console.log(value + ": " + type);
        this.setState({type});
        this.props.form.setFieldsValue({
            'companyOrAddress': value
        });
    };
    handleQueryCompany = () => {
        let fieldsValue = this.props.form.getFieldsValue();
        console.log(fieldsValue);
        this.props.form.validateFields((err,values)=>{
            if(!err){
                this.props.queryCompanyOrAddress(fieldsValue.companyOrAddress, this.state.type);
            }
        })
    };

    render(){
        const { getFieldDecorator } = this.props.form;
        return (
            <Form layout="inline">
                <FormItem label="">
                    {
                        getFieldDecorator('companyOrAddress',{
                            initialValue:'',
                            rules:[
                                {
                                    required:true,
                                    message:'输入不能为空'
                                },
                                {
                                    whitespace:true,
                                    message:'输入不能为空'
                                }
                            ]
                        })(
                            <SearchInput placeholder="请输入公司名或地址" style={{ width: 250 }} updateSearchInput = {this.updateSearchInput}/>
                        )
                    }
                </FormItem>
                <FormItem>
                    <Button type="primary" onClick={this.handleQueryCompany}>查询</Button>
                </FormItem>
            </Form>
        );
    }
}
QueryCompanyForm = Form.create({})(QueryCompanyForm);

