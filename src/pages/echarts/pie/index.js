import React from 'react'
import { Card } from 'antd'
import ReactEcharts from 'echarts-for-react';
import echartTheme from '../echartTheme'
import themeLight from '../themeLight'
// import echarts from 'echarts'
import echarts from 'echarts/lib/echarts'
// 引入饼图和折线图
import 'echarts/lib/chart/pie'
// 引入提示框和标题组件
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/title';
import 'echarts/lib/component/legend';
import 'echarts/lib/component/markPoint';
export default class Bar extends React.Component {

    state = {};

    componentWillMount() {
        echarts.registerTheme('light', themeLight);
    }

    getOption() {
        return this.props.option;
    }



    render() {
        return (
            <div >
                <Card title={this.props.title}>
                    <ReactEcharts
                        option={this.getOption()}
                        theme="light"
                        notMerge={true}
                        lazyUpdate={true}
                        style={{ height: 340 }} />
                </Card>
            </div>
        );
    }
}