import React from 'react';
import { Card, Button, Table, Form, Select, Input,DatePicker } from 'antd';
import moment from 'moment';
import axios from "../../axios";
const FormItem = Form.Item;
const Option = Select.Option;
export default class CompanyList extends React.Component{

    state = {
        selectedRowKeys: [], // Check here to configure the default column
        loading: false,
        tableData: []
    };

    componentDidMount(){
        this.setTableData({
            limit: 100000,
            offset: 0
        });
    }

    setTableData(params={}) {
        axios.get({
            url:'listed/all',
            data:{
                params: params
            }
        }).then( (data) => {
            console.log(data);
            if(data.all) {
                let tableData = [];
                data.all.forEach( item => {
                    item.income = parseInt(item.income/1000000)
                    tableData.push(item)
                });
                this.setState({tableData});
            }
        }).catch(function (error) {
            console.log(error);
        });
    }

    start = () => {
        this.setState({ loading: true });
        // ajax request after empty completing
        setTimeout(() => {
            this.setState({
                selectedRowKeys: [],
                loading: false,
            });
        }, 1000);
    };

    onSelectChange = selectedRowKeys => {
        console.log('selectedRowKeys changed: ', selectedRowKeys);
        this.setState({ selectedRowKeys });
    };

    render(){
        const columns = [
            {
                title: 'ID',
                dataIndex: 'id'
            },
            {
                title: '企业名称',
                dataIndex: 'name',
            },
            {
                title: '公司规模',
                dataIndex: 'employee',
            },
            {
                title: '盈利(百万)',
                dataIndex: 'income',
            },
            {
                title: '地址',
                dataIndex: 'address',
            },
        ];

        const { loading, selectedRowKeys } = this.state;
        const rowSelection = {
            selectedRowKeys,
            onChange: this.onSelectChange,
        };
        const hasSelected = selectedRowKeys.length > 0;


        return (
            <div>
                <Card>
                    <FilterForm />
                </Card>
                <div className="content-wrap">
                    <Table rowSelection={rowSelection} columns={columns} dataSource={this.state.tableData} />
                </div>
            </div>
        );
    }
}

class FilterForm extends React.Component{

    render(){
        const { getFieldDecorator } = this.props.form;
        return (
            <Form layout="inline">
                <FormItem label="公司名称">
                    {
                        getFieldDecorator('companyName')(
                            <Input placeholder="请输入公司名"  />
                        )
                    }
                </FormItem>
                <FormItem label="成立时间">
                    {
                        getFieldDecorator('createDate',{
                            initialValue:moment('2016-08-08')
                        })(
                            <DatePicker
                                showTime
                                format="YYYY-MM-DD"
                            />
                        )
                    }
                </FormItem>
                <FormItem label="公司规模">
                    {
                        getFieldDecorator('op_mode',{
                            initialValue: '0'
                        })(
                            <Select
                                style={{ width: 100 }}
                                placeholder="全部"
                            >
                                <Option value="0">全部</Option>
                                <Option value="1">20人以下</Option>
                                <Option value="2">20-50人</Option>
                                <Option value="3">50-100人</Option>
                                <Option value="4">100-500人</Option>
                                <Option value="5">500-1000人</Option>
                                <Option value="6">1000人以上</Option>
                            </Select>
                        )
                    }
                </FormItem>
                <FormItem>
                    <Button type="primary" style={{margin:'0 20px'}}>查询</Button>
                    <Button>重置</Button>
                </FormItem>
            </Form>
        );
    }
}
FilterForm = Form.create({})(FilterForm);

