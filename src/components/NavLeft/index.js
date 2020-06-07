import React from 'react'
import { Menu, Icon } from 'antd';
import { NavLink } from 'react-router-dom'
import { connect } from 'react-redux'
import { switchMenu, saveBtnList } from './../../redux/action'
// import MenuConfig from './../../config/menuConfig'
import './index.less'
// const SubMenu = Menu.SubMenu;
import SubMenu from 'antd/lib/menu/SubMenu';
import Link from "react-router-dom/Link";

class NavLeft extends React.Component {
    state = {
        currentKey: ''
    };
    // 菜单点击
    handleClick = ({ item, key }) => {
        if (key == this.state.currentKey) {
            return false;
        }
        // 事件派发，自动调用reducer，通过reducer保存到store对象中
        const { dispatch } = this.props;
        dispatch(switchMenu(item.props.title));

        this.setState({
            currentKey: key
        });
        // hashHistory.push(key);
    };
    // componentWillMount(){
    //     const menuTreeNode = this.renderMenu(MenuConfig);
    //
    //     this.setState({
    //         menuTreeNode
    //     })
    // }
    // 菜单渲染
    renderMenu =(data)=>{
        return data.map((item)=>{
            if(item.children){
                return (
                    <SubMenu title={item.title} key={item.key}>
                        { this.renderMenu(item.children)}
                    </SubMenu>
                )
            }
            return <Menu.Item title={item.title} key={item.key}>
                <NavLink to={item.key}>{item.title}</NavLink>
            </Menu.Item>
        })
    }

    homeHandleClick = () => {
        const { dispatch } = this.props;
        dispatch(switchMenu('功能说明'));
        this.setState({
            currentKey: ""
        });
    };
    render() {
        return (
            <div>
                <NavLink to="/home" onClick={this.homeHandleClick}>
                    <div className="logo">
                        {/*<img src="/assets/logo-ant.svg" alt=""/>*/}
                        <h1>产业集群监测平台</h1>
                    </div>
                </NavLink>
                
                <Menu
                    mode="inline"
                    theme="dark"
                    inlineCollapsed={this.state.collapsed}
                    onClick={this.handleClick}
                >
                    <Menu.Item key="father1" ><Link to="/industrymain_company">产业集群检测平台</Link></Menu.Item>

                    <SubMenu key="sub1"  title="产业主体">
                        <Menu.Item key="1"><Link to="/mainCompany">企业</Link></Menu.Item>
                        <Menu.Item key="2">研究机构</Menu.Item>
                        <Menu.Item key="3">园区</Menu.Item>
                        <Menu.Item key="4">产业集群</Menu.Item>
                        <Menu.Item key="5">联盟协会</Menu.Item>
                        <Menu.Item key="6">众创空间</Menu.Item>
                        <Menu.Item key="7">孵化器</Menu.Item>
                        <Menu.Item key="8">人才</Menu.Item>
                    </SubMenu>
                    <Menu.Item key="father2" ><Link to="/industrymain_company">产业</Link></Menu.Item>
                    <SubMenu key="sub3"  title="区域">
                        
                        <Menu.Item key="10">城市数据展示</Menu.Item>
                        <Menu.Item key="11">县域数据展示</Menu.Item>
                        <Menu.Item key="12">园区数据展示</Menu.Item>
                    </SubMenu>
                    <SubMenu key="sub4"  title="个人工作台">
                        <Menu.Item key="9"><Link to="/diyArea">区域自定义</Link></Menu.Item>
                        <Menu.Item key="13"><Link to="/diyList">自动解析与可视化</Link></Menu.Item>
                        <Menu.Item key="14">园区数据填报</Menu.Item>
                        <Menu.Item key="15">区域数据填报</Menu.Item>
                    </SubMenu>
                </Menu>
            </div>
        );
    }
}
export default connect()(NavLeft)