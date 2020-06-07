import React from 'react'
import { Card, Form, Row, Col, Statistic, Button, Icon, Input, Modal, Radio, Select} from 'antd'
import axios from '../../axios/index'
import 'ol/ol.css';
import OlMap from 'ol/Map';
import OlView from 'ol/View';
import OlLayerTile from 'ol/layer/Tile';
import OlSourceOsm from 'ol/source/OSM';
import {fromLonLat, getTransform} from 'ol/proj';
import Heatmap from 'ol/layer/Heatmap';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import SourceCluster from 'ol/source/Cluster';
import GeoJSON from 'ol/format/GeoJSON';
import KML from 'ol/format/KML';
import {Style,Fill,Stroke,Circle,RegularShape,Text} from 'ol/style'
import  OlGeomPolygon from 'ol/geom/Polygon'
import OlGeomPoint from 'ol/geom/Point'
import OlSelect from 'ol/interaction/Select'
import OlFeature from 'ol/Feature'
import { createEmpty, extend as OlExtend, getWidth as extentGetWidth, getHeight as extentGetHeight} from 'ol/extent'
import {singleClick} from 'ol/events/condition'
import LayerSwitcherImage from 'ol-ext/control/LayerSwitcherImage'
import 'ol-ext/control/LayerSwitcherImage.css'
import Popup from 'ol-ext/overlay/Popup'
import Placemark from 'ol-ext/overlay/Placemark'
import OlLegend from 'ol-ext/control/Legend'
import 'ol-ext/control/Legend.css'
import 'ol-ext/overlay/Popup.css'
import 'ol-ext/overlay/Popup.anim.css'
import EChartsLayer from 'ol-echarts'
import Pie from '../echarts/pie/index'
import Bar from '../echarts/bar/index'
import PureRenderMixin from 'react-addons-pure-render-mixin';
import {getWidth as OlGetWidth, getHeight as OlGetHeight } from "ol/extent";
import '../../config/envConfig'

const FormItem = Form.Item;
const RadioGroup = Radio.Group;

export default class DigitalMap extends React.Component{
//
    state = {
        category: ["全部"],
        colorset:['rgba(150, 150, 0, 0.2)','rgba(0, 125, 255, 0.2)','rgba(125, 0, 125, 0.2)'],
        province: "全国",
        selectParams: {},
        city: "",
        province2city:{"全国": ["全国"]},
        dataPie1: [],
        dataPie2: [],
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
        curComClusterResolution: null,
        curParkClusterResolution: null,
        maxFeatureCount: null,
        earthquakeCluster: null
    };

    map = {};
    companySource = null;
    companyLayer = null;
    heatMapLayer = null;
    parkSource = null;
    parkLayer = null;
    infoPopup = null;
    placemarkPopup = null;
    parkHeatMapLayer = null;
    clusterVectorLayer = null;
    parkClusterVectorLayer = null;

    constructor(props){
        super(props);
        this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
    }
    componentWillMount(){

    }

    componentDidMount(){
        this.initData();
        this.setCompanyCategory();
        this.setBarOption();
        this.renderOlMap();
        this.addMapControl();
        this.addPopUp();
    }

    initData = () => {
        this.setPieData();
    };

    setPieData = () => {
        axios.get({
            url:'/digital/statistics',
            data:{
                params: {}
            }
        }).then( (data) => {
            console.log(data);
            let dataPies = {
                company_type_count: [],
                city_count: []
            };
            for (let statisticsType in data) {
                for (let type in data[statisticsType]) {
                    dataPies[statisticsType].push({
                        value: data[statisticsType][type],
                        name: type
                    });
                }
            }
            this.setState({dataPie1: dataPies.company_type_count});
            this.setState({dataPie2: dataPies.city_count});
        }).catch(function (error) {
            console.log(error);
        });
    };

    getPieOption = (pieId) =>{
        let data;
        if (pieId === 1) {
            data = this.state.dataPie1;
        } else {
            data = this.state.dataPie2;
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

    setBarOption = (params,titleType='income') => {
        let xData = [];
        let yData = [];
        console.log(params);
        /*
        axios.get({
            url:'/digital/statistic',
            data:{
                params: params
            }
        }).then( (data) => {
            console.log(data);
            if(data[titleType]) {
                for (let key in data[titleType]) {
                    xData.push(key);
                    yData.push(parseInt(data[titleType][key]/1000000));
                }
                let option = {
                    title: {
                        text: '百万'
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
                this.setState({barOption: option});
            }
        }).catch(function (error) {
            console.log(error);
        });
        */
    };

    updateBarOption = (titleType) => {
        this.setBarOption(this.state.selectParams,titleType);
    };

    //产业类型
    setCompanyCategory = () => {
        axios.get({
            url:'/digital/category',
            data:{
                params:{}
            }
        }).then( (data) => {
            if(data && data.province) {
                let province = data.province;
                let province2city = {};
                province2city[province] = ['全省'];
                for (let key in data.city) {
                    province2city[province].push(key);
                }
                this.setState({
                    category: this.state.category.concat("数字产业"),
                    province2city: Object.assign({},this.state.province2city, province2city)
                });
            }
        }).catch(function (error) {
            console.log(error);
        });
    };

    //根据公司id查询公司相关信息
    queryCompanyById = (companyId) =>{
        console.log(companyId);
        axios.get({
            url:'/digital/information',
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

    //地图中显示企业相关信息
    showCompanyInfoInMap = (data) => {
        this.setState({
            companyId:data.id,
            companyName:data.name,
            companyPopulation:data.count,
            companyProfit:data.profit,
        });
        console.log(this.state.companyId);
        let curFeatureCoordination = this.companySource.getFeatureById(data.id).getGeometry().getFirstCoordinate();
        let viewPort = this.map.getView();
        this.infoPopup.show(curFeatureCoordination, data.name + "<br/>城市：" + data.city + "<br/>网址：" + data.website);
        this.placemarkPopup.show(curFeatureCoordination);
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

    //根据园区id查询园区相关信息
    queryParkById = (parkId) =>{
        console.log(parkId);
        axios.get({
            url:'/digitalpark/information',
            data:{
                params:{
                    "id":parkId,
                }
            }
        }).then( (data) => {
            console.log(data);
            if(data) {
                this.showParkInfoInMap(data);
            }
        }).catch(function (error) {
            console.log(error);
        });
    };

    //地图中显示园区信息
    showParkInfoInMap = (data) => {
        let curFeatureCoordination = this.parkSource.getFeatureById(data.id).getGeometry().getFirstCoordinate();
        let viewPort = this.map.getView();
        this.infoPopup.show(curFeatureCoordination, data.name + "<br/>城市：" + data.city);
        this.placemarkPopup.show(curFeatureCoordination);
        // viewPort.setCenter(curFeatureCoordination);
        let zoom = viewPort.getZoom();
        if ( zoom <= 12 ) {
            zoom = Math.min(12,zoom+2);
        }
        viewPort.animate({
            center: curFeatureCoordination,
            zoom: zoom
        });
    };

    //根据下拉菜单筛选企业
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
        this.setState({selectParams: params});
        console.log(params);
        // this.vecCompSource = null;
        this.map.removeLayer(this.companyLayer);
        this.map.removeLayer(this.heatMapLayer);
        this.companyLayer = this.buildVecCompanyLayer(params);
        this.heatMapLayer = this.buildHeatMapLayer(params);
        this.map.addLayer(this.companyLayer);
        this.map.addLayer(this.heatMapLayer);
        this.setBarOption(params);

        if (this.state.curCoordination) {
            let viewPort = this.map.getView();
            let zoom = viewPort.getZoom();
            zoom = Math.min(12,zoom);
            console.log(this.state.curCoordination);
            /*
            viewPort.animate({
                center: this.state.curCoordination,
                zoom: zoom
            });
             */
        }
    };

    //构建企业图层
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
            name: '企业分布',
            baseLayer: true,
            source: companySource,
            visible: false
        });
        axios.get({
            url:'/digital/coordinates',
            data:{
                params:params
            }
        }).then( (data) => {
            if(data.features) {
                console.log(data.features);
                let company_type_map = {};
                this.setState({coordinationId: data.features[0].id});
                let curCoordination = null;
                data.features.forEach( item => {
                    let point = new OlGeomPoint(item.geometry.coordinates);
                    point.applyTransform(getTransform('EPSG:4326', 'EPSG:3857'));
                    let feature = new OlFeature(point);
                    feature.setStyle(vecCompanyStyle);
                    feature.setId(item.id);
                    companySource.addFeature(feature);

                    if (curCoordination === null){
                        curCoordination = feature.getGeometry().getFirstCoordinate();
                    }

                    //company_type_map
                    if (item.industrial_type != null) {
                        let company_type = item.industrial_type;
                        if (company_type_map.hasOwnProperty(company_type)) {
                            company_type_map[company_type] += 1;
                        } else {
                            company_type_map[company_type] = 0;
                        }
                    }
                });
                this.setState({curCoordination});
                this.setState({company_type_map});
                this.clusterVectorLayer = this.buildCluterLayer(companyLayer);
            }
        }).catch(function (error) {
            console.log(error);
        });
        this.companySource = companySource;
        return companyLayer;
    };

    //构建热力图图层
    buildHeatMapLayer = (params, url, name) => {
        for (let key in params) {
            url = url + key + "=" + params[key] + "&";
        }
        return new Heatmap({
            name: name,
            baseLayer: true,
            source: new VectorSource({
                url: url,
                format: new GeoJSON()
            }),
            visible: false
        });
    };

    //构建产业园区图层
    buildParkLayer = (params) => {
        let vecParkStyle=new Style({
            fill: new Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new Stroke({
                color: '#29ff63',
                width: 1
            }),
            image: new Circle({
                radius: 3,
                fill: new Fill({
                    color: '#29ff63'
                })
            })
        });

        let parkSource=new VectorSource();
        let parkLayer=new VectorLayer({
            name: '园区分布',
            baseLayer: true,
            source: parkSource,
            visible: false
        });
        axios.get({
            url:'/digitalpark/coordinates',
            data:{
                params:params
            }
        }).then( (data) => {
            if(data.features) {
                console.log(data.features);
                let park_type_map = {};
                this.setState({coordinationId: data.features[0].id});
                let curCoordination = null;
                data.features.forEach( item => {
                    let point = new OlGeomPoint(item.geometry.coordinates);
                    point.applyTransform(getTransform('EPSG:4326', 'EPSG:3857'));
                    let feature = new OlFeature(point);
                    feature.setStyle(vecParkStyle);
                    feature.setId(item.id);
                    parkSource.addFeature(feature);

                    if (curCoordination === null){
                        curCoordination = feature.getGeometry().getFirstCoordinate();
                    }

                    //park_type_map
                    if (item.industrial_type != null) {
                        let park_type = item.industrial_type;
                        if (park_type_map.hasOwnProperty(park_type)) {
                            park_type_map[park_type] += 1;
                        } else  {
                            park_type_map[park_type] = 0;
                        }
                    }
                });
                this.setState({curCoordination});
                this.setState({park_type_map});
                this.parkClusterVectorLayer = this.buildParkCluterLayer(parkLayer);
            }
        }).catch(function (error) {
            console.log(error);
        });
        this.parkSource = parkSource;
        return parkLayer;
    };

    // 渲染地图
    renderOlMap = () => {
        let osmLayer = new OlLayerTile({
            title: "底图",
            source: new OlSourceOsm()
        });

        //公司图层
        this.companyLayer = this.buildVecCompanyLayer({});

        //公司热力图图层
        let companyHeatMapLayerUrl = global.constants.ip + '/digital/heatmap?';
        this.heatMapLayer = this.buildHeatMapLayer({}, companyHeatMapLayerUrl, '企业热力图');

        //园区图层
        this.parkLayer = this.buildParkLayer({});

        //园区热力图图层
        let parkHeatMapLayerUrl = global.constants.ip + '/digitalpark/heatmap?';
        this.parkHeatMapLayer = this.buildHeatMapLayer({}, parkHeatMapLayerUrl, '园区热力图');

        this.map = new OlMap({
            target: 'container',
            view: new OlView({
                center: fromLonLat([104.284, 37.548]),
                zoom: 4.5,
            }),
            layers: [osmLayer, this.companyLayer, this.heatMapLayer, this.parkLayer, this.parkHeatMapLayer]
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
            condition: singleClick
        });
        this.map.addInteraction(select);

        // infoPopup overlay
        let self = this;
        let infoPopup = new Popup ({
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
        this.map.addOverlay (infoPopup);

        // placemarkPopup overlay
        let placemarkPopup = new Placemark ({
            // color: '#369',
            // backgroundColor : 'yellow',
            contentColor: '#000',
            onshow: function(){ console.log("You opened a placemark"); },
            autoPan: true,
            autoPanAnimation: { duration: 250 }
        });
        this.map.addOverlay (placemarkPopup);
        /*
        select.on('select', function(evt){
            let coord = evt.mapBrowserEvent.coordinate;
        });
        */
        // On selected => show/hide popup
        select.getFeatures().on(['add'], e => {
            console.log(e);
            let feature = e.element;
            let content = "";
            let id = feature.getId();
            // popup.show(feature.getGeometry().getFirstCoordinate(), content);
            if (this.companyLayer.getVisible()) {
                this.queryCompanyById(id);
            } else {
                this.queryParkById(id);
            }

        });
        select.getFeatures().on(['remove'], e => {
            infoPopup.hide();
            placemarkPopup.hide();
        });
        this.select = select;
        this.infoPopup = infoPopup;
        this.placemarkPopup = placemarkPopup;
    };

    calculateClusterInfo = (resolution, layer) => {
        this.setState({maxFeatureCount: 0});
        let features = layer.getSource().getFeatures();
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
            radius = 0.17 * (OlGetWidth(extent) + OlGetHeight(extent)) / resolution; /** key code **/
            radius = radius * 5;
            if(radius < 7){
                radius = 7;
            }
            feature.set('radius', radius);
        }
    };

    buildCluterLayer = (layer) => {
        //矢量要素数据源
        let source = layer.getSource();
        //聚合标注数据源
        let clusterSource = new SourceCluster({
            distance: 10,               //聚合的距离参数，即当标注间距离小于此值时进行聚合，单位是像素
            source: source              //聚合的数据源，即矢量要素数据源对象
        });
        //加载聚合标注的矢量图层
        let styleCache = {};                    //用于保存特定数量的聚合群的要素样式
        let clusters = new VectorLayer({
            name: '企业聚点',
            baseLayer: true,
            visible: true,
            source: clusterSource,
            style: (feature, resolution) => {
                if (resolution != this.state.curComClusterResolution) {
                    this.calculateClusterInfo(resolution, this.clusterVectorLayer);  /** key code **/
                    this.setState({curComClusterResolution: resolution});
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

    buildParkCluterLayer = (layer) => {
        //矢量要素数据源
        let source = layer.getSource();
        //聚合标注数据源
        let clusterSource = new SourceCluster({
            distance: 10,               //聚合的距离参数，即当标注间距离小于此值时进行聚合，单位是像素
            source: source              //聚合的数据源，即矢量要素数据源对象
        });
        //加载聚合标注的矢量图层
        let styleCache = {};                    //用于保存特定数量的聚合群的要素样式
        let clusters = new VectorLayer({
            name: '园区聚点',
            baseLayer: true,
            visible: false,
            source: clusterSource,
            style: (feature, resolution) => {
                if (resolution != this.state.curParkClusterResolution) {
                    this.calculateClusterInfo(resolution, this.parkClusterVectorLayer);  /** key code **/
                    this.setState({curParkClusterResolution: resolution});
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
                                    color: '#34cc0c'
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
        let city = this.state.city;
        if (city === "全国" || city === "全省" || city === "上海市" || city === "北京市") {
            city = "";
        }
        let preTitle = this.state.province + city;
        let pieTitle1 = "数字产业公司类型";
        let pieTitle2 = "数字产业城市分布";

        let barOption = this.state.barOption;
        console.log(barOption);

        return (
            <Row style={{backgroundColor:"white"}}>
                <Col span={16}>
                    <Row>
                        <Card style={{backgroundColor:"white"}}>
                            <QueryCompanyForm queryCompany = { this.queryCompanyBySelect } category = {this.state.category} province2city = {this.state.province2city}/>
                        </Card>
                    </Row>

                    <Row>
                        <Card>
                            <div id="container" style={{height:750}}></div>
                        </Card>
                    </Row>
                </Col>
                <Col span={8}>
                    <Pie option={this.getPieOption(1)} title={pieTitle1}/>
                    <Pie option={this.getPieOption(2)} title={pieTitle2}/>
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
            </Form>
        );
    }
}
QueryCompanyForm = Form.create({})(QueryCompanyForm);

