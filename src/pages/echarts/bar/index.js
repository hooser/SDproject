import React from 'react'
import { Card, Select } from 'antd'
import ReactEcharts from 'echarts-for-react';
import echartTheme from '../echartTheme'
// import echarts from 'echarts'
// 引入 ECharts 主模块
import echarts from 'echarts/lib/echarts'
// 引入饼图和折线图
import 'echarts/lib/chart/bar'
// 引入提示框和标题组件
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/title';
import 'echarts/lib/component/legend';
import 'echarts/lib/component/markPoint';
import PureRenderMixin from 'react-addons-pure-render-mixin';
export default class Bar extends React.Component {

    constructor(props) {
        super(props);
        this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
    }
    state = {};

    componentWillMount() {
        echarts.registerTheme('light', echartTheme);
    }

    updateOption = (titleType) => {
        this.props.updateOption(titleType);
    };


    render() {
        let selectTitleWrapper = this.props.barTitles.map(item => <Select.Option key={item.key}>{this.props.preTitle}-{item.value}</Select.Option>);
        return (
            <div>
                <Card title= {this.props.preTitle + "数据统计"} >
                    {/*<Select defaultValue={this.props.barTitles[0].key} style={{ width: 360 }} onChange={this.updateOption}>*/}
                        {/*{selectTitleWrapper}*/}
                    {/*</Select>*/}
                    <ReactEcharts option={this.props.option} theme="light" notMerge={true} lazyUpdate={true} style={{ height: 340 }} />
                </Card>
            </div>
        );
    }
}