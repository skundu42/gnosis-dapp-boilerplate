"use client";

import { useState } from 'react';
import { Button, Typography, Space, Card, Layout, message } from 'antd';
import AppHeader from '../components/Header'; 
import axios from 'axios';

const { Title, Text } = Typography;
const { Content } = Layout;

export default function Main() {
  const [totalSupply, setTotalSupply] = useState<string | null>(null);

  const fetchProof = async () => {
    try {
      const response = await axios.post('https://jsonrpc.hashi-explorer.xyz/v1', {
        id: 1,
        jsonrpc: "2.0",
        method: "hashi_getAccountAndStorageProof",
        params: {
          chainId: 10,
          address: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
          storageKeys: ["0x00000000000000000000000000000000000000000000000000000000000000b"],
          blockNumber: 126086800
        }
      });

      const proof = response.data.result;
      setTotalSupply(proof); 
      message.success('Storage proof fetched successfully');
    } catch (error) {
      console.error("Error fetching proof:", error);
      message.error('Failed to fetch proof');
    }
  };

  return (
    <Layout style={{ height: '100vh', backgroundColor: '#f0f2f5' }}>
      <AppHeader />
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <div style={{ padding: '20px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <div>
            <Card
              style={{
                padding: '40px 20px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                borderRadius: '10px',
                backgroundColor: '#fff',
              }}
            >
              <Title level={3} style={{ marginBottom: '20px' }}>Fetch USDC Proof</Title>
              <Text style={{ display: 'block', marginBottom: '20px' }}>
                Fetch the USDC total supply proof from Optimism.
              </Text>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  style={{
                    backgroundColor: '#52c41a',
                    borderColor: '#52c41a',
                    color: '#fff',
                  }}
                  onClick={fetchProof}
                >
                  Fetch Proof
                </Button>
                {totalSupply && (
                  <div style={{ marginTop: '20px', textAlign: 'left', wordBreak: 'break-all' }}>
                    <Text><strong>Total Supply Proof:</strong></Text>
                    <Text>{JSON.stringify(totalSupply, null, 2)}</Text>
                  </div>
                )}
              </Space>
            </Card>
          </div>
        </div>
      </Content>
    </Layout>
  );
}
