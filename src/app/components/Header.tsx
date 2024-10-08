import React from 'react';
import Link from 'next/link';
import { Layout, Menu, Typography } from 'antd';
import { DynamicWidgetButton } from '../components/wallet';
import Image from 'next/image';

const { Header } = Layout;
const { Title } = Typography;

const menuItems = [
  {
    key: '1',
    label: <Link href="/">Home</Link>,
  },
  {
    key: '2',
    label: <Link href="/erc1155">ERC1155</Link>,
  },
  {
    key: '3',
    label: <Link href="/hashi">Hashi</Link>,
  },
  {
    key: '4',
    label: <Link href="/shutter">Shutter</Link>,
  },
];

export const AppHeader: React.FC = () => {
  return (
    <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#001529', padding: '0 50px', height: '80px', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <Image
          src="https://cdn.prod.website-files.com/662931fe35e0c191d1733ab9/662931fe35e0c191d1733b0f_owl-forest.png"
          alt="Logo"
          width={60} 
          height={60} 
          style={{ marginRight: '15px' }}
          priority
        />
        <Title level={3} style={{ color: '#fff', margin: 0, lineHeight: '80px', fontSize: '24px' }}>
          Gnosis Boilerplate dApp
        </Title>
      </div>

      <Menu
        theme="dark"
        mode="horizontal"
        style={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', borderBottom: 'none' }}
        defaultSelectedKeys={['1']}
        items={menuItems}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', height: '100%' }}>
        <div style={{ padding: '20px 10px 0 10px' }}> 
          <DynamicWidgetButton />
        </div>
      </div>
    </Header>
  );
};

export default AppHeader;
