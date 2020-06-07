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

const FormItem = Form.Item;
const RadioGroup = Radio.Group;

export default class ListedMap extends React.Component{

    state = {
        category: ["全部"],
        colorset:['rgba(150, 150, 0, 0.2)','rgba(0, 125, 255, 0.2)','rgba(125, 0, 125, 0.2)'],
    };

    map = {};
    companyMapLayer = null;
    heatMapLayer = null;
    clusterLayer = null;

    constructor(props){
        super(props);
        this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
    }
    componentWillMount(){

    }

    componentDidMount(){
        this.renderOlMap();
        this.addMapControl();
    }

    // 渲染地图
    renderOlMap = () => {
        let osmLayer = new OlLayerTile({
            name: '底图',
            source: new OlSourceOsm()
        });

        this.map = new OlMap({
            target: 'container',
            view: new OlView({
                center: fromLonLat([104.284, 37.548]),
                zoom: 4.92,
            }),
            //layers: [osmLayer, this.companyLayer, this.heatMapLayer]
            layers: [osmLayer]
        });
    };

    // 添加地图控件
    addMapControl = () => {
        let map = this.map;
        map.addControl(new LayerSwitcherImage());
        //this.addDrawControl();
    };

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
                            <UploadFile getResponseData = { this.getResponseDataByUpload }></UploadFile>
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
        post('http://219.141.209.3:8082/geometry/analyze', formData,config).then((response)=>{
            console.log(response);
            if(response.data.features.length > 0) {
                this.props.getResponseData(response.data);
                this.setState({
                    fileList: [],
                    uploading: false,
                });
                message.success('解析成功.');
            } else {
                this.setState({
                    uploading: false,
                });
                message.error('解析失败，请上传.csv文件,且表格包含列address');
            }
        }).catch( (error) =>{
            this.setState({
                uploading: false,
            });
            message.error('解析失败，请上传.csv文件,且表格包含列address');
            console.log(error);
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
                    <Col span={2}>
                        <Upload {...props}>
                            <Tooltip placement="topLeft" title={tipsText}>
                                <Button>
                                    <Icon type="upload" /> 选择文件
                                </Button>
                            </Tooltip>
                        </Upload>
                    </Col>
                    <Col span={8}>
                        <Button
                            type="primary"
                            onClick={this.handleUpload}
                            disabled={fileList.length === 0}
                            loading={uploading}
                        >
                            {uploading ? '解析中' : '开始解析'}
                        </Button>
                    </Col>
                </Row>
            </div>
        );
    }
}

