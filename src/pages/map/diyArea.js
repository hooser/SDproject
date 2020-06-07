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
var overlays = [];
// var map = {};

export default class ListedMapBD extends React.Component{

    state = {
        category: ["全部"],
        colorset:['rgba(150, 150, 0, 0.2)','rgba(0, 125, 255, 0.2)','rgba(125, 0, 125, 0.2)'],
        province: "全国",
        selectParams: {},
        visible: false,
        clickonzdy: false,                  //是否在园区自定义
        isdragg: true,
        isht:false,
        typeSelect: 'Polygon',
        industrialpark_name: "",
        
    };

    map = {};
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
        // this.setCompanyCategory();
        
        this.renderOlMap();
    }

    //园区自定义相关的函数
    fnAddmarker = (point) => {
            let prepoint = overlays.length>0? overlays[overlays.length-1]:point;
            overlays.push(point);           
            let polyline = new BMap.Polyline([prepoint,point], {strokeColor:"blue", strokeWeight:4, strokeOpacity:0.6});     
            this.map.addOverlay(polyline);   
            let mark = new BMap.Marker(point);
            this.setState({clickonzdy:true});
            // console.log(this.state.clickonzdy);
            this.map.addOverlay(mark);  // 将标注添加到地图中 
    };

    fnAddPoint = (id) => {//在两个点之间添加虚拟的触发点 
        console.log("now you are in fnAddPoint");
        let os = []; 
        const {isdragg} = this.state; 
        if ((id==-1 )&& isdragg) {
            this.setState({isdragg:false});//只能实添加一次，即以后的isdragg全是false
            for(let i=0;i<overlays.length;i++) {
                os.push(overlays[i]);
                os.push(new BMap.Point(((overlays[i].lng+overlays[(i+1)%overlays.length].lng)/2).toFixed(6),
                    ((overlays[i].lat+overlays[(i+1)%overlays.length].lat)/2).toFixed(6)));
            }
        }else if(id>=0)  {
            
            os = overlays;//先在id后面添加，再在id前面添加 
            os.splice(id+1,0,new BMap.Point(
                    ((overlays[id].lng+overlays[(id+1)%overlays.length].lng)/2).toFixed(6),
                    ((overlays[id].lat+overlays[(id+1)%overlays.length].lat)/2).toFixed(6)
                )); 
            os.splice(id==0?overlays.length:id,0,new BMap.Point(
                    ((overlays[(id==0?overlays.length-1:id-1)%overlays.length].lng+overlays[(id)%overlays.length].lng)/2).toFixed(6),
                    ((overlays[(id==0?overlays.length-1:id-1)%overlays.length].lat+overlays[(id)%overlays.length].lat)/2).toFixed(6)
                ));
        
        } else {
            os = overlays;
        }
        return os;
    };

    fnHuaTu = () => {                                         //绘图函数
        //this.map.__listeners.onclick = null; //取消监听
        this.fnAddPoint(); 
        const {isht} = this.state; 
        if(!isht&&overlays.length>2) {//两个节点是不能形成面的
            let polygon = new BMap.Polygon(overlays, null);  //创建多边形
            // var polygon =  new BMap.Polygon(overlays, {strokeColor:156, strokeWeight:2, strokeOpacity:0.5,fillColor:155});  //创建多边形
            this.map.addOverlay(polygon);   //增加多边形      
            this.setState({isht:true});
        }     
    };

    fnGetJsonDatas() {
    
        let s = [];
        for(let i = 0;i<overlays.length;i++) { 
            s.push([overlays[i].lng,overlays[i].lat]);
        }
        s.push([overlays[0].lng,overlays[0].lat]);//形成闭环
        let jsons = [s];
        this.state.my_locations = jsons;
        console.log(JSON.stringify(jsons,null, 4));
    };

    showModal = () => {
            this.setState({
            visible: true,
        });
        this.fnClose();
    };

    fnClose =() =>{
        overlays.length = 0;  
        this.map.clearOverlays();// 清除标注 
        this.setState({isht:false});
        // this.componentDidMount();
    } 

    addDrawLayer = () => {
        if(this.state.clickonzdy == false)                      //显示 开始定义
        {
            let fnadd = this.fnAddmarker;
                this.map.addEventListener('click', function(e){ //监听
                fnadd(new BMap.Point(e.point.lng,e.point.lat));  
            }); 
        }
        else
        {
            this.fnHuaTu();
            this.fnGetJsonDatas();
            this.showModal();
            this.setState({clickonzdy:false});
        }
    };

    zoomInSlow = (curZoom, endZoom, step) => {
        if (curZoom >= endZoom) return;
        this.map.zoomIn();
        curZoom = this.map.getZoom();
        setTimeout(() => {
            this.zoomInSlow(curZoom, endZoom, step);
        }, 2000);
    };

    // 渲染地图
    renderOlMap = () => {
        let map = new BMap.Map("container"); // 创建Map实例
        // let map = new BMap.Map('baidumap');
        map.centerAndZoom(new BMap.Point(104.284, 37.548), 5.5); // 初始化地图,设置中心点坐标和地图级别
        map.addControl(new BMap.NavigationControl());
        // map.addControl(new BMap.MapTypeControl()); //添加地图类型控件
        map.setCurrentCity("北京"); // 设置地图显示的城市 此项是必须设置的
        map.enableScrollWheelZoom();
        map.enableContinuousZoom();

        this.map = map;
    };

    show = () => {
        this.setState({
        visible: true,
     });
    };

    handleOk = e => {
        // console.log(e);
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

    saveGeom = (geoms, name) => {

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
       // console.log(barOption);

        return (
            <Row style={{backgroundColor:"white"}}>
                <Col span={24}>
                    <Row>
                        <Card style={{backgroundColor:"white"}}>
                            <QueryCompanyForm addDrawLayer = {this.addDrawLayer} clickonzdy = {this.state.clickonzdy} />
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
                <Col span={0}>
                    
                </Col>
            </Row>
        );
    }
}

class QueryCompanyForm extends React.Component{
    state = {
      clickonzdy:false
    };

    render(){
       
        return (
            <Form layout="inline">
            
                <FormItem>
                    <Button type="primary" onClick={this.props.addDrawLayer}>{this.props.clickonzdy?'定义完成':'开始定义'}</Button>
                </FormItem>

            </Form>
        );
    }
}
QueryCompanyForm = Form.create({})(QueryCompanyForm);


