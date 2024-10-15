"use client";

import { Typography, Space, Card, Layout, Row, Col } from 'antd';
import { AppstoreOutlined, SafetyOutlined, LockOutlined } from '@ant-design/icons'; // Importing Ant Design icons
import AppHeader from './components/Header'; 

const { Title, Text } = Typography;
const { Content } = Layout;

export default function Main() {
  return (
    <Layout
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f2f5, #ffffff)', // Light gradient background
      }}
    >
      <AppHeader />
      <Content
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
        }}
      >
        <div style={{ maxWidth: '800px', width: '100%', textAlign: 'center' }}>
          <Row gutter={[32, 32]} justify="center">
            <Col xs={24} sm={12}>
              <Card
                title={
                  <Space>
                    <AppstoreOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    <Title level={4} style={{ marginBottom: '0', color: '#001529' }}>ERC1155</Title>
                  </Space>
                }
                bordered={false}
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #e0f7fa, #ffffff)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.3s ease',
                  minHeight: '250px', 
                }}
                hoverable
              >
                <Text style={{ fontSize: '16px', color: '#001529' }}>
                  Explore ERC1155 token features such as minting and managing multiple token types.
                </Text>
              </Card>
            </Col>

            <Col xs={24} sm={12}>
              <Card
                title={
                  <Space>
                    <SafetyOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    <Title level={4} style={{ marginBottom: '0', color: '#001529' }}>Hashi</Title>
                  </Space>
                }
                bordered={false}
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #e0f7fa, #ffffff)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.3s ease',
                  minHeight: '250px', 
                }}
                hoverable
              >
                <Text style={{ fontSize: '16px', color: '#001529' }}>
                  Explore the functionalities of Hashi, an EVM hash oracle aggregator.
                </Text>
              </Card>
            </Col>

            <Col xs={24} sm={12}>
              <Card
                title={
                  <Space>
                    <LockOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    <Title level={4} style={{ marginBottom: '0', color: '#001529' }}>
                      Shutterized Gnosis Chain
                    </Title>
                  </Space>
                }
                bordered={false}
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #e0f7fa, #ffffff)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.3s ease',
                  minHeight: '250px', 
                }}
                hoverable
              >
                <Text style={{ fontSize: '16px', color: '#001529' }}>
                  Utilize Shutterized Gnosis Chain for enhanced privacy and secure transactions.
                </Text>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
}
