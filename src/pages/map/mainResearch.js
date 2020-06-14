

import React from 'react'
// import { Card, Form, Row, Col, Statistic, Button, Icon, Input, Modal, Radio, Select} from 'antd'
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
import PureRenderMixin from 'react-addons-pure-render-mixin';
import SourceCluster from "ol/source/Cluster";
import {createEmpty, extend as OlExtend, getHeight as OlGetHeight, getWidth as OlGetWidth} from "ol/extent";
import '../../config/envConfig'

import * as mapv from 'mapv';
import { Card, Table,Form, Row, Col, Statistic, Button, Icon, Input, Modal, Radio, Select, Divider,Menu, Dropdown} from 'antd';
import SubMenu from 'antd/lib/menu/SubMenu';
import { DownOutlined, PlusOutlined } from '@ant-design/icons';

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
        city: "",
        province2city:{"全国": ["全国"]},
        childrenMsg:[],
        //map: {};
        my_locations:{},
        companyNum:0,
        companyName:[],
        companyLon:[],
        companyLat:[],
        
        //图层是否显示
        pointLayerShow:false,
        heatmapLayerShow:false,
        clusterLayerShow:true,
        noLayerShow:false,                   //无图层显示

        //右侧栏目点击后显示的企业点
        singleCompanyLayerShow:false,
        companyType:'所有',
        currentProvince:'全国',
        currentIndustry:'所有'
    };

    map = {};
    companySource = null;
    pointLayer = null;
    heatmapLayer = null;
    clusterLayer = null;
    singleCompanyLayer = null;
    areaLayer = null;
    customAreaLayer = null;
    drawInteraction = null;
    drawLayer = null;
    snap = null;
    // pointLayer = null;

    //省市产业数据
    constructor(props){
        super(props);
        this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
    }
    componentWillMount(){

    }

    componentDidMount(){
        this.setCompanyCategory();
        this.renderOlMap();
    }

    //测试函数
    queryCategory = () => {
        console.log("yeilp!");
        console.log(this.state.currentProvince);
        let currentCompany = '';
        let companyKey = ["listed_company","china_top_500","tech_center"];                                 //企业类别显示字段
        let industryKey = [];                                //产业类型显示字段
        let provinceKey = ["上海","云南省","内蒙古自治区","北京","吉林省","四川省","天津","宁夏回族自治区","安徽省","山东省","山西省","广东省","广西壮族自治区","新疆维吾尔自治区","江苏省","江西省","河北省","河南省","浙江省","湖北省","海南省","湖南省","甘肃省","福建省","西藏自治区","贵州省","辽宁省","重庆","陕西省","青海省","黑龙江省"];                                //省显示字段

        let request_json = null;                            //请求json
        if(this.state.companyType == "所有"){               //显示所有类型的企业
        }
        else
        {
            companyKey = [];
            companyKey.push(this.state.companyType);
        }
    
        if(this.state.currentProvince == "全国")
        {
        }
        else
        {
            provinceKey = [];
            provinceKey.push(this.state.currentProvince);
        }
        
        if(this.state.currentIndustry == "所有")           //不要该字段
        {
            request_json = {
            "dimensions":[
  
                "entity_name"
            ],
            "metrics":[
                {
                    "type":"avg",
                    "field":"lon",
                    "in_data":false,
                    "alias":"lon"
                },
                 {
                    "type":"avg",
                    "field":"lat",
                    "in_data":false,
                    "alias":"lat"
                }
            ],
            "filters":[
                {
                    "type":"in",
                    "field":"label",
                    "conditions":companyKey
                },
                {
                    "type":"in",
                    "field":"province",
                    "conditions":provinceKey
                }
                ]
            };
        }
        else{
            industryKey.push(this.state.currentIndustry);
            request_json = {
            "dimensions":[
  
                "entity_name"
            ],
            "metrics":[
                {
                    "type":"avg",
                    "field":"lon",
                    "in_data":false,
                    "alias":"lon"
                },
                 {
                    "type":"avg",
                    "field":"lat",
                    "in_data":false,
                    "alias":"lat"
                }
            ],
            "filters":[
                {
                    "type":"in",
                    "field":"label",
                    "conditions":companyKey
                },
                {
                    "type":"in",
                    "field":"CCID_industry",
                    "in_data":true,
                    "conditions":industryKey

                },
                {
                    "type":"in",
                    "field":"province",
                    "conditions":provinceKey
                }
                ]
            };
        }

        axios.get({
            url:'/entity/statistic',
            data:{
                params: {request_json: request_json}
            }
        }).then( (data) => {                                //js异步编程，es6 promise, 后端把数据传给前端，正确进入then，否则进入catch
            console.log(data);
            let tcompany_num = 0;
            let companyName = [];
            let companyLat = [];
            let companyLon = [];

            if(data) {
                console.log(data);
                data.result.entity_name.forEach((item) => {
                    //console.log(item.entity_name[0].value);
                    companyName.push({
                        key:tcompany_num,
                        name:item.value,
                    });
                    companyLat.push(
                        // key:tcompany_num,
                        item.lat
                    );
                    companyLon.push(
                        // key:tcompany_num,
                        item.lon
                    );
                    tcompany_num = tcompany_num + 1;
                });
                this.setState({
                    companyNum:tcompany_num,
                    companyName:companyName,
                    companyLat:companyLat,
                    companyLon:companyLon
                });
               
            }
            
        }).catch(function (error) {
            // console.log(error);
        });
    };

    //园区自定义相关的函数
    fnAddmarker = (point) => {
            let prepoint = overlays.length>0? overlays[overlays.length-1]:point;
            overlays.push(point);           
            let polyline = new window.BMap.Polyline([prepoint,point], {strokeColor:"blue", strokeWeight:4, strokeOpacity:0.6});     
            this.map.addOverlay(polyline);   
            let mark = new window.BMap.Marker(point);
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
                os.push(new window.BMap.Point(((overlays[i].lng+overlays[(i+1)%overlays.length].lng)/2).toFixed(6),
                    ((overlays[i].lat+overlays[(i+1)%overlays.length].lat)/2).toFixed(6)));
            }
        }else if(id>=0)  {
            
            os = overlays;//先在id后面添加，再在id前面添加 
            os.splice(id+1,0,new window.BMap.Point(
                    ((overlays[id].lng+overlays[(id+1)%overlays.length].lng)/2).toFixed(6),
                    ((overlays[id].lat+overlays[(id+1)%overlays.length].lat)/2).toFixed(6)
                )); 
            os.splice(id==0?overlays.length:id,0,new window.BMap.Point(
                    ((overlays[(id==0?overlays.length-1:id-1)%overlays.length].lng+overlays[(id)%overlays.length].lng)/2).toFixed(6),
                    ((overlays[(id==0?overlays.length-1:id-1)%overlays.length].lat+overlays[(id)%overlays.length].lat)/2).toFixed(6)
                ));
        
        } else {
            os = overlays;
        }
        return os;
    };

    fnHuaTu = () => {                                         //绘图函数
        
        this.fnAddPoint(); 
        const {isht} = this.state; 
        if(!isht&&overlays.length>2) {//两个节点是不能形成面的
            let polygon = new window.BMap.Polygon(overlays, null);  //创建多边形
            // var polygon =  new window.BMap.Polygon(overlays, {strokeColor:156, strokeWeight:2, strokeOpacity:0.5,fillColor:155});  //创建多边形
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
        //console.log(JSON.stringify(jsons,null, 4));
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
            this.clusterLayer.hide();
            this.heatmapLayer.hide();
            this.pointLayer.hide();
            let fnadd = this.fnAddmarker;
                this.map.addEventListener('click', function(e){ //监听
                fnadd(new window.BMap.Point(e.point.lng,e.point.lat));  
            }); 
        }
        else
        {
            this.fnHuaTu();
            this.fnGetJsonDatas();
            this.showModal();
            this.setState({clickonzdy:false});
            //this.saveGeom(this.state.my_locations,this.state.val);
            this.renderOlMap();
        }
    };

    //产业类型
    setCompanyCategory = () => {   //获取产业类型及省市情况
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
        // this.setBarOption(params);
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
        let bdary = new window.BMap.Boundary();
        bdary.get(province, (rs) => {       //获取行政区域
            // this.map.clearOverlays();        //清除地图覆盖物
            let count = rs.boundaries.length; //行政区域的点有多少个
            if (count === 0) {
                alert('未能获取当前输入行政区域: ' + province);
                return ;
            }
            let pointArray = [];
            for (let i = 0; i < count; i++) {
                let ply = new window.BMap.Polygon(rs.boundaries[i], {
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
            center = new window.BMap.Point(104.284, 37.548);
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
                center = new window.BMap.Point(parseInt(data.lon), parseInt(data.lat));
                this.map.panTo(center);
                setTimeout(() => {
                    this.zoomInSlow(this.map.getZoom(), 6, 0.5);
                }, 1000);
            }
        }).catch(function (error) {
            console.log(error);
        });
    };

    //单独显示某个企业点
    showCompanyInMap = () => {
        //根据公司名获取公司的经纬度坐标
        // this.companySource.hide();
        // this.pointLayer.hide();
        // this.heatmapLayer.hide();

        let data = [
        // 点数据
            {
                geometry: {
                    type: 'Point',
                    coordinates: [123, 56]
                },
                fillStyle: 'red',
                size: 7
            }
        ];
        let dataSet = new mapv.DataSet(data);
        let pointOptions = {
                    fillStyle: 'rgba(0, 191, 243, 0.7)',
                    // methods: {
                    //     click: function (item) {
                    //         console.log(item);
                    //     }
                    // },
                    size: 3,
                    draw: 'simple'
                };
        this.singleCompanyLayer = new mapv.baiduMapLayer(this.map, dataSet, pointOptions);
    };

    //三种图层显示
    buildLayers = (params) => {
        axios.get({
            url:'/listed/coordinates',
            data:{
                params:params
            }
        }).then( (data) => {
            if(data.features) {
                //console.log(data.features);
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
                            // console.log(item);
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
                            // console.log(item);  // 点击事件
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
                this.clusterLayer = new mapv.baiduMapLayer(this.map, dataSet, clusterOptions);
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
        let map = new window.BMap.Map("container"); // 创建Map实例
        // let map = new window.BMap.Map('baidumap');
        map.centerAndZoom(new window.BMap.Point(104.284, 37.548), 5.5); // 初始化地图,设置中心点坐标和地图级别
        map.addControl(new window.BMap.NavigationControl());
        // map.addControl(new window.BMap.MapTypeControl()); //添加地图类型控件
        map.setCurrentCity("北京"); // 设置地图显示的城市 此项是必须设置的
        map.enableScrollWheelZoom();
        map.enableContinuousZoom();

        this.map = map;
        this.buildLayers();
    };

    selectLayer = (layer) => {
        if(layer == 1){
            this.clusterLayer.show();
            this.heatmapLayer.show();
            this.pointLayer.show();
            this.clusterLayer.hide();
            this.heatmapLayer.hide();
            // this.state.clusterLayer.show();
            this.setState({
                clusterLayerShow:false,
                heatmapLayerShow:false,
                noLayerShow:false,
                pointLayerShow:true
            });
        }
        else if(layer == 2){
            this.clusterLayer.show();
            this.heatmapLayer.show();
            this.pointLayer.show();
            this.pointLayer.hide();
            this.heatmapLayer.hide();
            // this.state.clusterLayer.show();
            this.setState({
                clusterLayerShow:true,
                heatmapLayerShow:false,
                noLayerShow:false,
                pointLayerShow:false
            });
        }
        else if(layer == 3){
            this.clusterLayer.show();
            this.heatmapLayer.show();
            this.pointLayer.show();
            this.clusterLayer.hide();
            this.pointLayer.hide();
            // this.state.heatmapLayer.show();
            this.setState({
                clusterLayerShow:false,
                heatmapLayerShow:true,
                noLayerShow:false,
                pointLayerShow:false
            });
        }
        else{
            this.clusterLayer.show();
            this.heatmapLayer.show();
            this.pointLayer.show();
            this.clusterLayer.hide();
            this.pointLayer.hide();
            this.heatmapLayer.hide();

            this.setState({
                clusterLayerShow:false,
                heatmapLayerShow:false,
                noLayerShow:true,
                pointLayerShow:false
            });
        }
    };

    show = () => {
        this.setState({
        visible: true,
     });
    };

    handleOk = e => {
        // console.log(e);
        let val = this.refs.park_name.value;
        this.state.val = val;
        //console.log(this.state.val);
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
            console.log(error);
        });
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

    //点击右边栏中的企业名，地图上打印相关的企业点

    printsingleCompanyLayer = (selectedRowKeys) => {
         
        console.log(selectedRowKeys);
        //判断当前显示的图层，关闭之
        if(this.state.pointLayerShow == true)
        {
            this.pointLayer.show();
            this.pointLayer.hide();
        }
        else if(this.state.clusterLayerShow == true)
        {
            this.clusterLayer.show();
            this.clusterLayer.hide();
        }
        else if(this.state.heatmapLayerShow == true)
        {
            this.heatmapLayer.show();
            this.heatmapLayer.hide();
        }
        else
        {
            
        }

        if(this.state.singleCompanyLayerShow == true){
            this.singleCompanyLayer.hide();
        }

        let rowlenth = selectedRowKeys.length;
        let data = [];
        for(let i = 0; i < rowlenth; i++) {
            
            data.push({
                geometry: {
                    type: 'Point',
                    coordinates: [this.state.companyLon[i], this.state.companyLat[i]]
                },
                count: 30 * Math.random()
            });
        }

        let dataSet = new mapv.DataSet(data);

        let pointOptions = {

            fillStyle: 'rgba(0, 191, 243, 0.7)', 
            size: 3,
            draw: 'simple'
        };

        this.singleCompanyLayer = new mapv.baiduMapLayer(this.map, dataSet, pointOptions);
        this.setState({singleCompanyLayerShow:true});
    };

    clearsingleCompanyLayer = () => {
        this.singleCompanyLayer.hide();
        this.setState({singleCompanyLayerShow:false});
    };

    //父组件从子组件获取企业列表
    getChildrenMsg = (result, selectedRowKeys) => {
        //console.log(result, selectedRowKeys);
        // 很奇怪这里的result就是子组件那bind的第一个参数this，msg是第二个参数
        let childrenRst = [];
        selectedRowKeys.forEach((item) => {
            childrenRst.push(item);
        });
        
        this.printsingleCompanyLayer(childrenRst);
    };

    //父亲组件打印所有企业列表
    showAllCompany = () => {

        console.log("showAllCompany");
        //判断当前显示的图层，关闭之
        if(this.state.pointLayerShow == true)
        {
            this.pointLayer.show();
            this.pointLayer.hide();
        }
        else if(this.state.clusterLayerShow == true)
        {
            this.clusterLayer.show();
            this.clusterLayer.hide();
        }
        else if(this.state.heatmapLayerShow == true)
        {
            this.heatmapLayer.show();
            this.heatmapLayer.hide();
        }
        else
        {
            
        }

        if(this.state.singleCompanyLayerShow == true){
            this.singleCompanyLayer.hide();
        }

        let data = [];
        console.log(this.state.companyLon.length);
        for(let i = 0; i < this.state.companyName.length; i++) {
            
            data.push({
                geometry: {
                    type: 'Point',
                    coordinates: [this.state.companyLon[i], this.state.companyLat[i]]
                },
                count: 30 * Math.random()
            });
        }

        console.log(data);

        let dataSet = new mapv.DataSet(data);

        let pointOptions = {

            fillStyle: 'rgba(0, 191, 243, 0.7)', 
            size: 3,
            draw: 'simple'
        };

        this.singleCompanyLayer = new mapv.baiduMapLayer(this.map, dataSet, pointOptions);
        this.setState({singleCompanyLayerShow:true});
    };

    //父组件从子组件获取企业类别
    getChildrencompanyType = (result,companyT) => {
        this.setState({companyType:companyT});
        console.log(this.state.companyType);
    };

    //父组件从子组件获取产业类型
    getChildrencurrentIndustry = (result,currentI) => {
        this.setState({currentIndustry:currentI});
        console.log(this.state.currentIndustry);
    };

    //父组件从子组件获取省份
    getChildrencurrentProvince = (result,currnetP) => {
        this.setState({currentProvince:currnetP});
        console.log(this.state.currentProvince);
    };

    render(){
       

        return (
            <Row style={{backgroundColor:"white"}}>
                <Row>
                        <Card style={{backgroundColor:"white"}}>
                            <QueryCompanyForm parent={this} queryCategory = {this.queryCategory} queryCompany = { this.queryCompanyBySelect } addDrawLayer = {this.addDrawLayer} selectLayer = {this.selectLayer} category = {this.state.category} province2city = {this.state.province2city} clickonzdy = {this.state.clickonzdy} />
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
                    <Col span = {17}>
                        <Card>
                            <div id="container" style={{height:750}}></div>
                        </Card>
                    </Col>
                    <Col span={7}>
                        <ListInfo showAllCompany={this.showAllCompany} singleCompanyLayerShow={this.state.singleCompanyLayerShow} clearsingleCompanyLayer={this.clearsingleCompanyLayer} parent={this} companyNum={this.state.companyNum} companyName={this.state.companyName} showCompanyInMap={this.showCompanyInMap} />
                    </Col>
                </Row>
            </Row>

        );
    }
}

class ListInfo extends React.Component{    
    
    state = {
        selectedRowKeys:[],
        loading: false
    };

    columns = [
        {
            title: 'Name',
            dataIndex: 'name',
        },
    ];

    start = () => {
        this.setState({ loading: true });
        console.log(this.state.selectedRowKeys);
        this.props.parent.getChildrenMsg(this, this.state.selectedRowKeys);
        this.setState({
            selectedRowKeys: [],
            loading: false,
        });
    };

    onSelectChange = selectedRowKeys => {
        console.log('selectedRowKeys changed: ', selectedRowKeys);
        this.setState({ selectedRowKeys });
    };

    render(){

        const { loading, selectedRowKeys } = this.state;

        const rowSelection = {
            selectedRowKeys,
            onChange: this.onSelectChange,
        };

        const hasSelected = selectedRowKeys.length > 0;
        return (
            
            <Row style={{backgroundColor:"white"}}>
                <Col style={{backgroundColor:"white"}} >
                    <div className="card-test">
                        <Card bordered={false} style={{ width:1000 },{height:600}} >  
                        <h1>共有{this.props.companyNum}家企业</h1>
                        <Button type="primary" onClick={this.start} disabled={!hasSelected} loading={loading}>
                            显示
                        </Button>
                        <Button type="primary" onClick={this.props.showAllCompany}  loading={loading}>
                            全部
                        </Button>
                        <Button type="primary" onClick={this.props.clearsingleCompanyLayer} disabled={!this.props.singleCompanyLayerShow}>
                            清除
                        </Button>
                        <span style={{ marginLeft: 8 }}>
                            {hasSelected ? `Selected ${selectedRowKeys.length} items` : ''}
                        </span>

                        <Table rowSelection={rowSelection} columns={this.columns} dataSource={this.props.companyName} />
                        </Card>
                    </div>
                </Col>
            </Row>
        );
    }
};


class QueryCompanyForm extends React.Component{
   
    provinceData = ["全国","上海","云南省","内蒙古自治区","北京","吉林省","四川省","天津","宁夏回族自治区","安徽省","山东省","山西省","广东省","广西壮族自治区","新疆维吾尔自治区","江苏省","江西省","河北省","河南省","浙江省","湖北省","海南省","湖南省","甘肃省","福建省","西藏自治区","贵州省","辽宁省","重庆","陕西省","青海省","黑龙江省"];
    cityData = {
        "全国":[" "
        ],
        "上海": [
            "上海城区"
        ],
        "云南省": [
            "临沧市",
            "丽江市",
            "保山市",
            "大理市",
            "大理白族自治州",
            "安宁市",
            "弥勒市",
            "文山壮族苗族自治州",
            "文山市",
            "昆明市",
            "昭通市",
            "普洱市",
            "曲靖市",
            "楚雄市",
            "楚雄彝族自治州",
            "玉溪市",
            "迪庆藏族自治州"
        ],
        "内蒙古自治区": [
            "乌兰察布市",
            "乌兰浩特市",
            "乌海市",
            "包头市",
            "呼伦贝尔市",
            "呼和浩特市",
            "巴彦淖尔市",
            "满洲里市",
            "赤峰市",
            "通辽市",
            "鄂尔多斯市",
            "锡林浩特市",
            "锡林郭勒盟",
            "阿拉善盟",
            "霍林郭勒市"
        ],
        "北京": [
            "北京城区"
        ],
        "吉林省": [
            "公主岭市",
            "吉林市",
            "四平市",
            "延吉市",
            "延边朝鲜族自治州",
            "德惠市",
            "敦化市",
            "松原市",
            "梅河口市",
            "洮南市",
            "白城市",
            "白山市",
            "蛟河市",
            "辽源市",
            "通化市",
            "长春市",
            "集安市"
        ],
        "四川省": [
            "乐山市",
            "什邡市",
            "内江市",
            "凉山彝族自治州",
            "南充市",
            "宜宾市",
            "峨眉山市",
            "巴中市",
            "广元市",
            "广安市",
            "广汉市",
            "康定市",
            "彭州市",
            "德阳市",
            "成都市",
            "攀枝花市",
            "江油市",
            "泸州市",
            "眉山市",
            "简阳市",
            "绵阳市",
            "自贡市",
            "西昌市",
            "达州市",
            "遂宁市",
            "邛崃市",
            "都江堰市",
            "阿坝藏族羌族自治州",
            "雅安市"
        ],
        "天津": [
            "天津城区"
        ],
        "宁夏回族自治区": [
            "吴忠市",
            "固原市",
            "灵武市",
            "石嘴山市",
            "银川市",
            "青铜峡市"
        ],
        "安徽省": [
            "亳州市",
            "六安市",
            "合肥市",
            "天长市",
            "宁国市",
            "安庆市",
            "宣城市",
            "宿州市",
            "巢湖市",
            "桐城市",
            "池州市",
            "淮北市",
            "淮南市",
            "滁州市",
            "潜山市",
            "界首市",
            "芜湖市",
            "蚌埠市",
            "铜陵市",
            "阜阳市",
            "马鞍山市",
            "黄山市"
        ],
        "山东省": [
            "东营市",
            "临沂市",
            "临清市",
            "乐陵市",
            "乳山市",
            "威海市",
            "安丘市",
            "寿光市",
            "平度市",
            "德州市",
            "招远市",
            "新泰市",
            "日照市",
            "昌邑市",
            "曲阜市",
            "枣庄市",
            "栖霞市",
            "泰安市",
            "济南市",
            "济宁市",
            "海阳市",
            "淄博市",
            "滕州市",
            "滨州市",
            "潍坊市",
            "烟台市",
            "禹城市",
            "聊城市",
            "肥城市",
            "胶州市",
            "荣成市",
            "莱州市",
            "莱芜区",
            "莱西市",
            "莱阳市",
            "菏泽市",
            "蓬莱市",
            "诸城市",
            "邹城市",
            "青岛市",
            "青州市",
            "高密市",
            "龙口市"
        ],
        "山西省": [
            "临汾市",
            "介休市",
            "侯马市",
            "吕梁市",
            "大同市",
            "太原市",
            "忻州市",
            "怀仁市",
            "晋中市",
            "晋城市",
            "朔州市",
            "永济市",
            "汾阳市",
            "运城市",
            "长治市",
            "阳泉市",
            "高平市"
        ],
        "广东省": [
            "东莞市",
            "中山市",
            "云浮市",
            "佛山市",
            "兴宁市",
            "南雄市",
            "台山市",
            "四会市",
            "广州市",
            "开平市",
            "恩平市",
            "惠州市",
            "揭阳市",
            "普宁市",
            "梅州市",
            "汕头市",
            "江门市",
            "河源市",
            "深圳市",
            "清远市",
            "湛江市",
            "潮州市",
            "珠海市",
            "肇庆市",
            "茂名市",
            "阳春市",
            "阳江市",
            "韶关市"
        ],
        "广西壮族自治区": [
            "东兴市",
            "北海市",
            "南宁市",
            "柳州市",
            "桂林市",
            "梧州市",
            "河池市",
            "玉林市",
            "百色市",
            "贵港市",
            "贺州市",
            "钦州市",
            "防城港市"
        ],
        "新疆维吾尔自治区": [
            "乌鲁木齐市",
            "五家渠市",
            "伊犁哈萨克自治州",
            "克拉玛依市",
            "双河市",
            "吐鲁番市",
            "和田地区",
            "和田市",
            "哈密市",
            "喀什地区",
            "塔城市",
            "奎屯市",
            "巴音郭楞蒙古自治州",
            "库尔勒市",
            "昌吉回族自治州",
            "昌吉市",
            "石河子市",
            "阜康市",
            "阿克苏地区",
            "阿克苏市",
            "阿拉尔市"
        ],
        "江苏省": [
            "东台市",
            "丹阳市",
            "仪征市",
            "兴化市",
            "南京市",
            "南通市",
            "句容市",
            "启东市",
            "太仓市",
            "如皋市",
            "宜兴市",
            "宿迁市",
            "常州市",
            "常熟市",
            "张家港市",
            "徐州市",
            "扬中市",
            "扬州市",
            "新沂市",
            "无锡市",
            "昆山市",
            "江阴市",
            "泰兴市",
            "泰州市",
            "海安市",
            "海门市",
            "淮安市",
            "溧阳市",
            "盐城市",
            "苏州市",
            "连云港市",
            "镇江市",
            "靖江市",
            "高邮市"
        ],
        "江西省": [
            "上饶市",
            "丰城市",
            "乐平市",
            "九江市",
            "井冈山市",
            "南昌市",
            "吉安市",
            "宜春市",
            "德兴市",
            "抚州市",
            "新余市",
            "景德镇市",
            "樟树市",
            "瑞昌市",
            "瑞金市",
            "萍乡市",
            "贵溪市",
            "赣州市",
            "高安市",
            "鹰潭市"
        ],
        "河北省": [
            "三河市",
            "任丘市",
            "保定市",
            "唐山市",
            "安国市",
            "廊坊市",
            "张家口市",
            "承德市",
            "新乐市",
            "武安市",
            "沙河市",
            "沧州市",
            "河间市",
            "泊头市",
            "涿州市",
            "深州市",
            "石家庄市",
            "秦皇岛市",
            "衡水市",
            "迁安市",
            "遵化市",
            "邢台市",
            "邯郸市",
            "霸州市",
            "高碑店市"
        ],
        "河南省": [
            "三门峡市",
            "义马市",
            "信阳市",
            "偃师市",
            "南阳市",
            "周口市",
            "商丘市",
            "孟州市",
            "安阳市",
            "巩义市",
            "平顶山市",
            "开封市",
            "新乡市",
            "新密市",
            "新郑市",
            "林州市",
            "永城市",
            "沁阳市",
            "洛阳市",
            "济源市",
            "漯河市",
            "濮阳市",
            "焦作市",
            "登封市",
            "禹州市",
            "荥阳市",
            "许昌市",
            "辉县市",
            "邓州市",
            "郑州市",
            "长葛市",
            "项城市",
            "驻马店市",
            "鹤壁市"
        ],
        "浙江省": [
            "东阳市",
            "临海市",
            "丽水市",
            "义乌市",
            "乐清市",
            "余姚市",
            "兰溪市",
            "台州市",
            "嘉兴市",
            "宁波市",
            "嵊州市",
            "平湖市",
            "建德市",
            "慈溪市",
            "杭州市",
            "桐乡市",
            "永康市",
            "江山市",
            "海宁市",
            "温岭市",
            "温州市",
            "湖州市",
            "玉环市",
            "瑞安市",
            "绍兴市",
            "舟山市",
            "衢州市",
            "诸暨市",
            "金华市",
            "龙泉市"
        ],
        "海南省": [
            "三亚市",
            "儋州市",
            "文昌市",
            "海口市",
            "澄迈县",
            "琼中黎族苗族自治县"
        ],
        "湖北省": [
            "仙桃市",
            "十堰市",
            "咸宁市",
            "天门市",
            "孝感市",
            "宜城市",
            "宜昌市",
            "宜都市",
            "广水市",
            "应城市",
            "当阳市",
            "恩施市",
            "枝江市",
            "枣阳市",
            "武汉市",
            "武穴市",
            "汉川市",
            "潜江市",
            "荆州市",
            "荆门市",
            "襄阳市",
            "赤壁市",
            "鄂州市",
            "钟祥市",
            "随州市",
            "麻城市",
            "黄冈市",
            "黄石市"
        ],
        "湖南省": [
            "吉首市",
            "娄底市",
            "宁乡市",
            "岳阳市",
            "常德市",
            "张家界市",
            "怀化市",
            "株洲市",
            "永州市",
            "汨罗市",
            "沅江市",
            "浏阳市",
            "湘乡市",
            "湘潭市",
            "湘西土家族苗族自治州",
            "益阳市",
            "衡阳市",
            "邵阳市",
            "郴州市",
            "醴陵市",
            "长沙市"
        ],
        "甘肃省": [
            "临夏回族自治州",
            "兰州市",
            "嘉峪关市",
            "天水市",
            "定西市",
            "张掖市",
            "武威市",
            "白银市",
            "酒泉市",
            "陇南市"
        ],
        "福建省": [
            "三明市",
            "南安市",
            "南平市",
            "厦门市",
            "宁德市",
            "建瓯市",
            "晋江市",
            "武夷山市",
            "永安市",
            "泉州市",
            "漳州市",
            "漳平市",
            "福安市",
            "福州市",
            "福清市",
            "福鼎市",
            "莆田市",
            "邵武市",
            "龙岩市",
            "龙海市"
        ],
        "西藏自治区": [
            "山南市",
            "拉萨市",
            "日喀则市",
            "林芝市"
        ],
        "贵州省": [
            "仁怀市",
            "六盘水市",
            "兴义市",
            "安顺市",
            "清镇市",
            "贵阳市",
            "遵义市",
            "铜仁市",
            "黔南布依族苗族自治州"
        ],
        "辽宁省": [
            "丹东市",
            "凌海市",
            "凌源市",
            "北镇市",
            "大石桥市",
            "大连市",
            "庄河市",
            "抚顺市",
            "朝阳市",
            "本溪市",
            "沈阳市",
            "海城市",
            "盘锦市",
            "营口市",
            "葫芦岛市",
            "调兵山市",
            "辽阳市",
            "铁岭市",
            "锦州市",
            "阜新市",
            "鞍山市"
        ],
        "重庆": [
            "重庆城区"
        ],
        "陕西省": [
            "兴平市",
            "咸阳市",
            "商洛市",
            "安康市",
            "宝鸡市",
            "延安市",
            "汉中市",
            "渭南市",
            "神木市",
            "西安市",
            "铜川市",
            "韩城市"
        ],
        "青海省": [
            "格尔木市",
            "海东市",
            "西宁市"
        ],
        "黑龙江省": [
            "七台河市",
            "五常市",
            "伊春市",
            "佳木斯市",
            "双鸭山市",
            "哈尔滨市",
            "大兴安岭地区",
            "大庆市",
            "安达市",
            "海伦市",
            "海林市",
            "牡丹江市",
            "绥化市",
            "绥芬河市",
            "铁力市",
            "黑河市",
            "齐齐哈尔市"
        ]
    };

    state = {
        province: "全国",
        clickonzdy:false,
        cities: [],
        secondCity: '',
        industryType:[],
        name:'',
        items:[],
        visible:false,
        company_name:'',
       
    };


    companyType = '';
    currentProvince = '';
    currentIndustry = '';
    index = 0;

    componentWillMount(){
       this.setCityInfo();
       this.setType();
       this.setItems();
    }

    //设置企业类别
    setItems = () => {
        this.setState({items:['所有','国家企业技术中心','重点实验室','发改委国家工程研究中心','科技部工程技术研究中心']});
    }
    setCityInfo = () => {
        this.setState({
            cities:this.cityData[this.provinceData[0]],
            secondCity:this.cityData[this.provinceData[0]][0]
        });
    }

    handleProvinceChange = value => {
    console.log("value="+value);
    // console.log(value);
    this.setState({
      // currentProvince:value,
      cities: this.cityData[value],
      secondCity: this.cityData[value][0]
    });
    console.log(this.currentProvince);
    this.props.parent.getChildrencurrentProvince(this,value);
  };

  handleIndustryChange = value => {
    // console.log(this.currentIndustry);

    this.props.parent.getChildrencurrentIndustry(this,value);
  };

  handleCompanyChange = value => {
    
    // this.companyType = value;
    console.log(this.companyType);
    this.props.parent.getChildrencompanyType(this,value);
  };

    onSecondCityChange = value => {
    this.setState({
      secondCity: value,
    });
  };

    setType = () => {

        let request_json = {
            "dimensions":[
                "CCID_industry"
            ],
            "metrics":[
                {
                    "type":"avg",
                    "field":"lon",
                    "in_data":false,
                    "alias":"lon"
                },
                 {
                    "type":"avg",
                    "field":"lat",
                    "in_data":false,
                    "alias":"lat"
                }
            ],
            "filters":[
                {
                    "type":"in",
                    "field":"label",
                    "conditions":[
                        "listed_company"
                    ]
                }
            ]
        };

        axios.get({
            url:'/entity/statistic',
            data:{
                params: {request_json: request_json}
            }
        }).then( (data) => {
            // console.log(data.result.id.entity_name.CCID_industry.value);
            console.log(data);
            // let categorylen = data.result.length;
            // console.log(categorylen);
            let CCID_industrylen = data.result.CCID_industry.length;
            console.log(data.result.CCID_industry);       

            if(data.result.CCID_industry) {
                let tempType = ['所有'];
                for (let i = 0; i < CCID_industrylen; i++) {
                    tempType.push(data.result.CCID_industry[i].value);
                }
                this.setState({industryType:tempType});
                // console.log(this.state.industryType);
            }
        }).catch(function (error) {
            console.log(error);
        });
    };
    

    handleOk = e => {

        let val = this.refs.company_name.value;
        let titems = this.state.items;
        titems.push(val);
        this.refs.company_name.value ='';
        this.setState({
            items:titems,
            visible:false
        });
    };

    handleCancel = e => {
        //console.log(e);
        this.setState({
        visible: false,
    });
  };

  addCompanies = () => {
    this.setState({visible:true});
  }

    render(){

        return (
            <Form layout="inline">
                <FormItem>
                    {/* <PlusCircleOutlined  onClick={this.addCompanies}/> */}
                    <Modal
                            title=""
                            visible={this.state.visible}
                            onOk={this.handleOk}
                            onCancel={this.handleCancel}
                        >
                            企业名称：<br/>
                            <input ref="company_name" />
                        </Modal>
                </FormItem>
                <FormItem label="机构类别">
                    {
                         <Select
                            defaultValue={'所有'}
                            style={{ width: 120 }}
                            onChange={this.handleCompanyChange}
                            >
                                {this.state.items.map(item => (
                                    <Option key={item}>{item}</Option>
                            ))}
                            </Select>
                    }
                </FormItem>

                <FormItem label="机构类型">
                    {
                        <Select
                        defaultValue={'所有'}
                        style={{ width: 120 }}
                        onChange={this.handleIndustryChange}
                        >
                            {this.state.industryType.map(ind => (
                            <Option key={ind}>{ind}</Option>
                        ))}
                    </Select>
                    }
                </FormItem>
                <FormItem label="省">
                    {
                    <Select
                        defaultValue={'全国'}
                        style={{ width: 120 }}
                        onChange={this.handleProvinceChange}
                        >
                            {this.provinceData.map(province => (
                            <Option key={province}>{province}</Option>
                        ))}
                    </Select>
                    }
                </FormItem>

                <FormItem label="市">
                    {
                    <Select
                        style={{ width: 120 }}
                        defaultValue={''}
                        onChange={this.onSecondCityChange}
                    >
                        {this.state.cities.map(city => (
                        <Option key={city}>{city}</Option>
                    ))}
                </Select>
                    }
                </FormItem>

                {/*<FormItem>
                    <Button type="primary" onClick={this.handleQueryCompany}>查询</Button>
                </FormItem>*/}
                
                <FormItem>
                    <Button type="primary" onClick={this.props.queryCategory }>查询</Button>
                </FormItem>

                {/*<FormItem>
                    <Button type="primary" onClick={this.props.addDrawLayer}>{this.props.clickonzdy?'定义完成':'自定义区域'}</Button>
                </FormItem>*/}

                <FormItem>
                    <Select id="pid" defaultValue="2" onChange={this.props.selectLayer}>
                        <Select.Option value="1">企业分布图</Select.Option>
                        <Select.Option value="2">企业聚类图</Select.Option>
                        <Select.Option value="3">企业热力图</Select.Option>
                        <Select.Option value="4">无企业图</Select.Option>
                    </Select>
                </FormItem>

            </Form>
        );
    }
}
QueryCompanyForm = Form.create({})(QueryCompanyForm);

