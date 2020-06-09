import React from 'react'
import { Card, Form, Row, Col, Statistic, Button, Icon, Input, Modal, Radio, Select, Upload, message, Tooltip} from 'antd'
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
import { post } from "axios";

import * as mapv from 'mapv';

import XLSX from 'xlsx';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;

export default class ListedMap extends React.Component{

    state = {
        category: ["全部"],
        colorset:['rgba(150, 150, 0, 0.2)','rgba(0, 125, 255, 0.2)','rgba(125, 0, 125, 0.2)'],
    };

    map = {};
    // companyMapLayer = null;
    // heatMapLayer = null;
    // clusterLayer = null;
    pointLayer = null;
    heatmapLayer = null;
    clusterLayer = null;

    constructor(props){
        super(props);
        this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
    }
    componentWillMount(){

    }

    componentDidMount(){
        this.renderOlMap();
        // this.setBarOption();
        // this.addMapControl();
    }

    // 渲染地图
    renderOlMap = () => {
        // let osmLayer = new OlLayerTile({
        //     name: '底图',
        //     source: new OlSourceOsm()
        // });

        // this.map = new OlMap({
        //     target: 'container',
        //     view: new OlView({
        //         center: fromLonLat([104.284, 37.548]),
        //         zoom: 4.92,
        //     }),
        //     //layers: [osmLayer, this.companyLayer, this.heatMapLayer]
        //     layers: [osmLayer]
        // });
        let map = new window.BMap.Map("container"); // 创建Map实例
        map.centerAndZoom(new window.BMap.Point(104.284, 37.548), 5.5); // 初始化地图,设置中心点坐标和地图级别
        map.addControl(new window.BMap.NavigationControl());
        // map.addControl(new window.BMap.MapTypeControl()); //添加地图类型控件
        map.setCurrentCity("北京"); // 设置地图显示的城市 此项是必须设置的
        map.enableScrollWheelZoom();
        map.enableContinuousZoom();
        this.map = map;
    };

    // 添加地图控件
    // addMapControl = () => {
    //     let map = this.map;
    //     map.addControl(new LayerSwitcherImage());
    //     //this.addDrawControl();
    // };

    getResponseDataByUpload = (responseData) => {
        if (responseData) {
            if (this.heatMapLayer) {
                this.map.removeLayer(this.heatMapLayer);
            }
            if (this.companyMapLayer) {
                this.map.removeLayer(this.companyMapLayer);
            }
            if (this.clusterLayer) {
                this.map.removeLayer(this.clusterLayer);
            }

            let sourcePoint = this.buildVectorSourceByResposeData(responseData, 'point');
            this.setState({currentResolution: null});
            this.clusterLayer = this.buildClusterLayer(sourcePoint);
            this.map.addLayer(this.clusterLayer);

            this.companyMapLayer = this.buildCompanyMapLayer(sourcePoint);
            this.map.addLayer(this.companyMapLayer);

            let sourceHeatmap = this.buildVectorSourceByResposeData(responseData, 'heatmap');
            this.heatMapLayer = this.buildHeatMapLayer(sourceHeatmap);
            this.map.addLayer(this.heatMapLayer);

        }
    };

    buildVectorSourceByResposeData = (data, type = 'point') => {
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
        let source = new VectorSource();
        data.features.forEach( item => {
            let point = new OlGeomPoint(item.geometry.coordinates);
            point.applyTransform(getTransform('EPSG:4326', 'EPSG:3857'));
            let feature = new OlFeature(point);
            if (type !== 'heatmap') {
                feature.setStyle(style);
            }
            feature.setId(item.id);
            source.addFeature(feature);
        });
        return source;
    };


    buildCompanyMapLayer = (source) =>{
        return new VectorLayer({
            baseLayer: true,
            name: '企业分布',
            source: source,
            visible: false
        });
    };

    buildHeatMapLayer = (source) =>{
        return new Heatmap({
            baseLayer: true,
            name: '热力图',
            source: source,
            visible: false
        });
    };

    calculateClusterInfo = (resolution) => {
        this.setState({maxFeatureCount: 0});
        let features = this.clusterLayer.getSource().getFeatures();
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
        return clusters;
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

    buildNewLayer = (pointData) => {
        console.log(pointData);
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
        // let dataSet = new mapv.DataSet(pointData);
        this.pointLayer = new mapv.baiduMapLayer(this.map, dataSet, pointOptions);

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
    };

    render(){
        let city = this.state.city;
        if (city === "全国" || city === "全省" || city === "上海市" || city === "北京市") {
            city = "";
        }

        return (
            <Row style={{backgroundColor:"white"}}>
                <Col span={24}>
                    <Row>
                        <Card style={{backgroundColor:"white"}}>
                            <UploadFile selectLayer = {this.selectLayer} buildNewLayer = {this.buildNewLayer}></UploadFile>
                        </Card>
                    </Row>

                    <Row>
                        <Card>
                            <div id="container" style={{height:1000}}></div>
                        </Card>
                    </Row>
                </Col>
            </Row>
        );
    }
}

class UploadFile extends React.Component {
    state = {
        fileList: [],
        uploading: false,
    };


//将原始csv格式文件转化成需要格式
    csv2sheet = (csv) => {
        let sheet = {}; // 将要生成的sheet
        csv = csv.split('\n');
        csv.forEach(function(row, i) {
            row = row.split(',');
            if(i == 0) sheet['!ref'] = 'A1:'+String.fromCharCode(65+row.length-1)+(csv.length-1);
            row.forEach(function(col, j) {
                sheet[String.fromCharCode(65+j)+(i+1)] = {v: col};
            });
        });
        // console.log(sheet);
        return sheet;
    };   

    // 将一个sheet转成最终的excel文件的blob对象，然后利用URL.createObjectURL下载
    sheet2blob = (sheet, sheetName) => {
        sheetName = sheetName || 'sheet1';
        let workbook = {
                SheetNames: [sheetName],
                Sheets: {}
            };
        workbook.Sheets[sheetName] = sheet;
        // 生成excel的配置项
        let wopts = {
                bookType: 'xlsx', // 要生成的文件类型
                bookSST: false, // 是否生成Shared String Table，官方解释是，如果开启生成速度会下降，但在低版本IOS设备上有更好的兼容性
                type: 'binary'
            };
        let wbout = XLSX.write(workbook, wopts);
        let blob = new Blob([s2ab(wbout)], {type:"application/octet-stream"});
    // 字符串转ArrayBuffer
        function s2ab(s) {
            let buf = new ArrayBuffer(s.length);
            let view = new Uint8Array(buf);
            for (let i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
                return buf;
            }
        return blob;
    };

    openDownloadDialog = (url, saveName) =>
    {
        if(typeof url == 'object' && url instanceof Blob)
        {
            url = URL.createObjectURL(url); // 创建blob地址
        }
        let aLink = document.createElement('a');
        aLink.href = url;
        aLink.download = saveName || ''; // HTML5新增的属性，指定保存文件名，可以不要后缀，注意，file:///模式下不会生效
        let event;
        if(window.MouseEvent) event = new MouseEvent('click');
        else
        {
            event = document.createEvent('MouseEvents');
            event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        }
        aLink.dispatchEvent(event);
    };

    handleUpload = () => {
        const { fileList } = this.state;
        const formData = new FormData();
        formData.append('file', fileList[0]);
        this.setState({
            uploading: true,
        });
        console.log(fileList[0]);
        // You can use any AJAX library you like
        const config = {
            headers: {
                'content-type': 'multipart/form-data'
            },
            timeout: 600*1000
        };
        let pointData = [];
        post('http://100.64.174.1:8082/geometry/analyze', formData,config).then((response)=>{
            console.log(response);
            if(response.data.features.length > 0) {
                response.data.features.forEach(item => {
                pointData.push({
                        geometry: item.geometry,
                        count: 30 * Math.random()
                    });
                });
                this.props.buildNewLayer(pointData);
            }
                // console.log(pointData);
                // let dataSet = new mapv.DataSet(pointData);
                // console.log(response.data.features);
            });

         //获取文件
        post('http://100.64.174.1:8082/entity/analyze', formData,config).then((response)=>{
            // console.log(response);
            
            let body = response.data;
            let sheet = this.csv2sheet(body);
            let blob = this.sheet2blob(sheet);
            this.openDownloadDialog(blob, '导出.xlsx');
            this.setState({
                uploading: false,
            });
        });

    };

    render() {
        const { uploading, fileList } = this.state;
        const props = {
            headers:{
                "Content-Type": "multipart/form-data",
                "authorization": 'authorization-text'
            },
            multiple: false,
            onRemove: file => {
                this.setState(state => {
                    const index = state.fileList.indexOf(file);
                    const newFileList = state.fileList.slice();
                    newFileList.splice(index, 1);
                    return {
                        fileList: newFileList,
                    };
                });
            },
            beforeUpload: file => {
                this.setState(state => ({
                    fileList: [file],
                }));
                return false;
            },
            fileList,
        };
        const tipsText = <span>请上传.csv文件，表格包含列address</span>;

        return (
            <div>
                <Row>
                    <Col align="left">
                        <Upload {...props}>
                            <Tooltip placement="topLeft" title={tipsText}>
                                <Button>
                                    <Icon type="upload" /> 上传文件
                                </Button>
                            </Tooltip>
                        </Upload>
                    </Col>
                    <Col align="left">
                        <Button
                            type="primary"
                            onClick={this.handleUpload}
                            disabled={fileList.length === 0}
                            loading={uploading}
                        >
                            {uploading ? '解析中' : '开始解析'}
                        </Button>
                    </Col>
                    <Col align="right">
                        <Select id="pid" defaultValue="2" onChange={this.props.selectLayer}>
                        <Select.Option value="1">企业分布图</Select.Option>
                        <Select.Option value="2">企业聚类图</Select.Option>
                        <Select.Option value="3">企业热力图</Select.Option>
                    </Select>
                    </Col>
                </Row>
            </div>
        );
    }
}

