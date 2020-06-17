import React from 'react'
// import { Card, Table,Form, Row, Col, Statistic, Button, Icon, Input, Modal, Radio, Select, Divider} from 'antd'
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
import '../../config/envConfig';

//导入antd
import { Card, Table,Form, Row, Col, Statistic, Button, Icon, Input, Modal, Radio, Select, Divider} from 'antd';

import * as mapv from 'mapv';
import Link from "react-router-dom/Link";

//导入图片
import ind1 from './pic/ind1.png';
import ind2 from './pic/ind2.png';

export default class ListedMapBD extends React.Component{
    state = {
        companyNum:0,
        MainIndustry:0,
        company:0,
    };
    
    data=[
        ['海洋','化工','食品','生物医药'],
        ['纺织服装','玻璃器皿','地理信息','电力'],
        ['新能源','集成电路','新能源汽车','稀土'],
        ['锂电池','3D打印','光伏','大数据'],
        ['高技术服务业','金融科技','新型显示','网络安全'],
        ['云计算','软件信息技术服务','镁铝合金','人工智能'],
        ['节能环保','医疗器械','动力电池','文化创意'],
        ['高端装备','石墨烯','机器人','太阳能'],
        ['数控机床','新零售','现代高效农业','5G'],
        ['VR','旅游','区块链','医疗健康'],
        ['新材料','电子商务','航空','工业互联网'],
        ['物联网','体育','卫星及应用','化妆品'],
        ['LED','陶瓷','智能电网','海洋装备'],
        ['动漫','航天','无人机','北斗']
    ];


    // MainIndustry = 0;

    componentWillMount(){
        this.queryCategory();
    }

    queryCategory = () => {
        console.log("yeilp!");        

        let request_json = {
        "dimensions":["category"
        ],
        "metrics":[
            {
                "type":"count",
                "field":"distinct entity_name",
                "in_data":false,
                "alias":"count_distinct"
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
        }).then( (data) => {                                //js异步编程，es6 promise, 后端把数据传给前端，正确进入then，否则进入catch
            console.log(data);

            if(data) {
                console.log(data.result.category[0].count_distinct);
                this.setState({MainIndustry:data.result.category[0].count_distinct});
                console.log(this.MainIndustry);
            }
            
        }).catch(function (error) {
            // console.log(error);
        });

        let request_json1 = {
        "dimensions":["category"
        ],
        "metrics":[
            {
                "type":"count",
                "field":"distinct entity_name",
                "in_data":false,
                "alias":"count_distinct"
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
                params: {request_json: request_json1}
            }
        }).then( (data) => {                                //js异步编程，es6 promise, 后端把数据传给前端，正确进入then，否则进入catch
            console.log(data);

            if(data) {
                console.log(data.result.category[0].count_distinct);
                this.setState({company:data.result.category[0].count_distinct});
                // console.log(this.MainIndustry);
            }
            
        }).catch(function (error) {
            // console.log(error);
        });
    };

    render(){

        return (
            <Row style={{backgroundColor:"white"}}>
                <Col style={{height:800}} span = '12'>
                    <div className="card-left">
                        <Card bordered={true} style={{ width:600 },{height:700}}>
                            <tr>
                                <td><img src={ind1} height="70" width="70" span = '3'/></td>
                                <td><h1>产业   56个</h1></td>
                            </tr>
                            <Industry_Table data = {this.data} />
                        </Card>
                    </div>
                </Col>
                
                <Col style={{backgroundColor:"white"}} span = '12'>
                    <div className="card-left">
                        <Card bordered={true} style={{ width:600 },{height:700}} backgroundColor={'black'}>
                            <tr>
                                <td><img src={ind2} height="70" width="70" /></td>
                                <td></td>
                                <td><h1>产业主体 {this.state.MainIndustry} 个</h1></td>
                            </tr>
                                <ul>
                                    <h2><li>企业{this.state.company}（家) </li></h2>
                                    <li><h2>研究机构（家）</h2></li>
                                    <li><h2>园区（家）</h2></li>
                                    <li><h2>产业集群（个）</h2></li>
                                    <li><h2>联盟协会（个）</h2></li>
                                    <li><h2>众创空间（个）</h2></li>
                                    <li><h2>孵化器（个）</h2></li>
                                    <li><h2>人才（位）</h2></li>
                                </ul>
                        </Card>
                    </div>
                </Col>
            </Row>
        );
    }
}

class Industry_Table extends React.Component{   //产业类型的表格

 
  render(){
    return (
     <div>
        <table className='tabel' border="1" width= "100%" align="center" cellspacing="1" cellpadding="1">
        
            {
              this.props.data.map((row,index)=>{
                console.log(row);
                return (<tr key={index} >
                  {
                     row.map((cell,index)=>{
                        return <td key={index}><Link to="/listedmapbd">{cell}</Link></td>
                     })
                  }
                 </tr>
                  )
              })
            }
    
        </table>
     </div>
    );
  }
}


