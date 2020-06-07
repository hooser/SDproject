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
import GeoJSON from 'ol/format/GeoJSON';
import {Style, Fill, Stroke, Circle, RegularShape, Text} from 'ol/style'
import Placemark from 'ol-ext/overlay/Placemark'
import  OlGeomPolygon from 'ol/geom/Polygon'
import OlGeomPoint from 'ol/geom/Point'
import OlSelect from 'ol/interaction/Select'
import OlFeature from 'ol/Feature'
import {singleClick} from 'ol/events/condition'
import olControlBar from 'ol-ext/control/Bar'
import 'ol-ext/control/Bar.css'
import olEditBar from 'ol-ext/control/EditBar'
import 'ol-ext/control/EditBar.css'
import KML from 'ol/format/KML';
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
import PureRenderMixin from 'react-addons-pure-render-mixin';
import SourceCluster from "ol/source/Cluster";
import {createEmpty, extend as OlExtend, getHeight as OlGetHeight, getWidth as OlGetWidth} from "ol/extent";
import '../../config/envConfig'

const FormItem = Form.Item;
const RadioGroup = Radio.Group;

export default class ListedMap extends React.Component{

    state = {
        category: ["全部"],
        colorset:['rgba(150, 150, 0, 0.2)','rgba(0, 125, 255, 0.2)','rgba(125, 0, 125, 0.2)'],
        province: "全国",
        selectParams: {},
        city: "",
        province2city:{"全国": ["全国"]},
        dataBar1: {
            key: [],
            value: []
        },
        dataBar2: {
            key: [],
            value: []
        },
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
        ]
    };

    map = {};
    companySource = null;
    companyLayer = null;
    heatMapLayer = null;
    cluterLayer = null;
    areaLayer = null;

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
        this.addMapControl();
        this.addPopUp();
        this.initData();
    }

    initData = () => {
        this.initBarData();
    };

    initBarData = () => {
        axios.get({
            url:'/fivehundred/statistics',
            data:{
                params: {}
            }
        }).then( (data) => {
            let dataBar1 = {
                key: [],
                value: []
            };
            for (let type in data.income_rank) {
                dataBar1.key.unshift(type);
                dataBar1.value.unshift((data.income_rank[type] * 1.0 / 1000).toFixed(2));
            }
            this.setState({dataBar1: dataBar1});
            let dataBar2 = {
                key: [],
                value: []
            };
            for (let type in data.profit_rank) {
                dataBar2.key.unshift(type);
                dataBar2.value.unshift((data.profit_rank[type] * 1.0 / 1000).toFixed(2));
            }
            this.setState({dataBar2: dataBar2});
        }).catch(function (error) {
            //console.log(error);
        });
    };

    getBarOption = (barId) => {
        let dataBar;
        let title;
        if (barId === 1) {
            dataBar = this.state.dataBar1;
            title = '总收入';
        } else {
            dataBar = this.state.dataBar2;
            title = '利润';
        }
        let option = {
            title: {
                text: title + '榜单(十亿)',
                subtext: 'TOP10'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'value',
                boundaryGap: [0, 0.01]
            },
            yAxis: {
                type: 'category',
                data: dataBar.key.slice(0, 10)
            },
            series: [
                {
                    name: title,
                    type: 'bar',
                    data: dataBar.value.slice(0, 10)
                }
            ]
        };
        return option;
    };

    getPieOption() {
        let data = [];
        //console.log(this.state.company_type_map);
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

    // setBarOption = (params,titleType='income') => {
    setBarOption = (params) => {
        /*
        let xData = [];
        let yData = [];
        console.log(params);
        axios.get({
            url:'/listed/statistic',
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
        axios.get({
            url:'/listed/statistic',
            data:{
                params: params
            }
        }).then( (data) => {
            //console.log(data);
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
            //console.log(error);
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
            //console.log(error);
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
        this.setState({selectParams: params});
        //console.log(params);
        // this.vecCompSource = null;
        if (this.areaLayer) {
            this.map.removeLayer(this.areaLayer);
        }
        if (params.hasOwnProperty('province')) {
            if (params.hasOwnProperty('city')) {
                this.areaLayer = this.buildAreaLayer({level: 'city', province: params.province, city: params.city});
            } else {
                this.areaLayer = this.buildAreaLayer({level: 'province', province: params.province});
            }
            this.map.addLayer(this.areaLayer);
        }
        this.map.removeLayer(this.companyLayer);
        this.map.removeLayer(this.heatMapLayer);
        this.companyLayer = this.buildVecCompanyLayer(params);
        this.heatMapLayer = this.buildHeatMapLayer(params);
        this.map.addLayer(this.companyLayer);
        this.map.addLayer(this.heatMapLayer);
        this.move2Location(params.province);

        this.setBarOption(params);
        /*
        if (this.state.curCoordination) {
            let viewPort = this.map.getView();
            let zoom = viewPort.getZoom();
            zoom = Math.min(12,zoom);
            console.log(this.state.curCoordination);
        }
         */
    };

    move2Location = (province) => {
        let viewPort = this.map.getView();
        //console.log(province);
        if (province === undefined || province === '全国') {
            viewPort.animate({
                center: fromLonLat([104.284, 37.548]),
                zoom: 4.5,
            });
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
                viewPort.animate({
                    center: fromLonLat([parseInt(data.lon), parseInt(data.lat)]),
                    zoom: 5
                });
            }
        }).catch(function (error) {
            //console.log(error);
        });
    };

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
            name: '企业分布',
            source: companySource,
            visible: false
        });
        axios.get({
            url:'/fivehundred/coordinates',
            data:{
                params:params
            }
        }).then( (data) => {
            if(data.features) {
                //console.log(data);
                let company_type_map = {};
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
                this.setState({currentResolution: null});
                this.buildCluterLayer(companySource);
            }
        }).catch(function (error) {
           
        });
        this.companySource = companySource;
        return companyLayer;
    };

    //构建热力图图层
    buildHeatMapLayer = (params) => {
        let url = global.constants.ip + '/fivehundred/heatmap?';
        for (let key in params) {
            url = url + key + "=" + params[key] + "&";
        }
        return new Heatmap({
            baseLayer: true,
            name: '热力图',
            source: new VectorSource({
                url: url,
                format: new GeoJSON()
            }),
            visible: false
        });
    };

    // 渲染地图
    renderOlMap = () => {
        let osmLayer = new OlLayerTile({
            name: '底图',
            source: new OlSourceOsm()
        });

        //公司图层
        this.companyLayer = this.buildVecCompanyLayer({});

        //热力图图层
        this.heatMapLayer = this.buildHeatMapLayer({});

        this.map = new OlMap({
            target: 'container',
            view: new OlView({
                center: fromLonLat([104.284, 37.548]),
                zoom: 4.5,
            }),
            layers: [osmLayer, this.companyLayer, this.heatMapLayer]
        });
    };

    // 添加地图控件
    addMapControl = () => {
        let map = this.map;
        map.addControl(new LayerSwitcherImage());
        //this.addDrawControl();
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
            onshow: function(){},
            onclose: function(){
                
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
            onshow: function(){},
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
            //console.log(e);
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

    // addDrawControl = () => {
    //     let vector = new VectorLayer( {
    //         source: new VectorSource(),
    //         style: function (f) {
    //             return new Style({
    //                 image: new Circle({
    //                     radius: 5,
    //                     stroke: new Stroke({ width: 1.5, color: f.get('color') || [255,128,0] }),
    //                     fill: new Fill({ color: (f.get('color') || [255,128,0]).concat([.3]) })
    //                 }),
    //                 stroke: new Stroke({ width: 2.5, color: f.get('color') || [255,128,0] }),
    //                 fill: new Fill({ color: (f.get('color') || [255,128,0]).concat([.3]) })
    //             })
    //         }
    //     });
    //     let mainbar = new olControlBar();
    //     this.map.addControl(mainbar);
    //     // Editbar
    //     let editbar = new olEditBar ({
    //         source: vector.getSource(),
    //         interactions: { Info: false }
    //     });
    //     mainbar.addControl(editbar);
    //     this.map.addLayer(vector);
    // };

    //根据公司id查询公司相关信息
    queryCompanyById = (companyId) =>{
        //console.log(companyId);
        axios.get({
            url:'/fivehundred/information',
            data:{
                params:{
                    "id":companyId,
                }
            }
        }).then( (data) => {
            console .log(data);
            if(data) {
                this.showCompanyInfoInMap(data);
                this.setState({companyData: data});
                this.setState({
                    barOption: this.getBarOptionByData(data)
                });
            }
        }).catch(function (error) {
            //console.log(error);
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
        //console.log(this.state.companyId);
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
        //console.log(parkId);
        axios.get({
            url:'fivehundred/information',
            data:{
                params:{
                    "id":parkId,
                }
            }
        }).then( (data) => {
            //console.log(data);
            if(data) {
                this.showParkInfoInMap(data);
            }
        }).catch(function (error) {
            //console.log(error);
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

    calculateClusterInfo = (resolution) => {
        this.setState({maxFeatureCount: 0});
        let features = this.cluterLayer.getSource().getFeatures();
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

    buildCluterLayer = (source) => {
        //聚合标注数据源
        let clusterSource = new SourceCluster({
            distance: 40,               //聚合的距离参数，即当标注间距离小于此值时进行聚合，单位是像素
            source: source              //聚合的数据源，即矢量要素数据源对象
        });
        //console.log(source.getFeatures());
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
        if (this.cluterLayer != null) {
            this.map.removeLayer(this.cluterLayer);
        }
        this.cluterLayer = clusters;
        this.map.addLayer(this.cluterLayer);
        return clusters;
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
            //console.log(error);
        });
        return areaLayer;
    };

    render(){
        let city = this.state.city;
        if (city === "全国" || city === "全省" || city === "上海市" || city === "北京市") {
            city = "";
        }
        let preTitle = "五百强";
        let barTitle = preTitle + "年度利润";
        let pieTitle = preTitle + "产业类型结构";

        let barOption = this.state.barOption;
        //console.log(barOption);

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
                {/*<Col span={8}>*/}
                {/*    <Bar option={this.getBarOption(1)} preTitle={preTitle}  barTitles={this.state.barTitles} updateOption={this.updateBarOption}/>*/}
                {/*    <Bar option={this.getBarOption(2)} preTitle={preTitle}  barTitles={this.state.barTitles} updateOption={this.updateBarOption}/>*/}
                {/*</Col>*/}
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
        //console.log(province);
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

