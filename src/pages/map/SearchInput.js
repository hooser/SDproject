import React from 'react'
import { Select } from 'antd';
import axios from "../../axios";

const { Option } = Select;

let timeout;
let currentValue;

function fetch(value, callback) {
    if (timeout) {
        clearTimeout(timeout);
        timeout = null;
    }
    currentValue = value;

    function fake() {
        console.log('param name: ' + value);
        axios.get({
            url:'/listed/list',
            data:{
                params:{
                    "name": value
                }
            }
        }).then( (res) => {
            if(currentValue === value) {
                console.log(res);
                const data = [];
                let type = 'company';
                let resCompany = res.company;
                if (resCompany.length >= 30) {
                    resCompany = resCompany.slice(0, 30);
                }
                resCompany.forEach(r => {
                    data.push({
                        key: r.id,
                        value: r.name
                    });
                });
                if (data.length === 0) {
                    type = 'address';
                    data.push({
                        key: -(Math.random()),
                        value: value
                    });
                }
                callback(data, type);
            }
        }).catch(function (error) {
            console.log(error);
        });

    }

    timeout = setTimeout(fake, 300);
}

export default class SearchInput extends React.Component {
    state = {
        type: 'company',
        data: [],
        value: undefined,
    };

    handleSearch = value => {
        fetch(value, (data, type) => this.setState({ data: data, type: type }));
    };

    handleChange = value => {
        this.setState({ value });
        if (this.state.type === 'address') {
            let address = this.state.data[0].value;
            this.props.updateSearchInput(address, this.state.type);
        } else {
            this.props.updateSearchInput(value, this.state.type);
        }
    };

    render() {
        const options = this.state.data.map(d => <Option key={d.key}>{d.value}</Option>);
        return (
            <Select
                showSearch
                value={this.state.value}
                placeholder={this.props.placeholder}
                style={this.props.style}
                defaultActiveFirstOption={false}
                showArrow={false}
                filterOption={false}
                onSearch={this.handleSearch}
                onChange={this.handleChange}
                notFoundContent={null}
            >
                {options}
            </Select>
        );
    }
}