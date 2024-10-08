"use client";

import { useState } from 'react';
import { getWeb3Provider, getSigner } from '@dynamic-labs/ethers-v6';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Button, Input, Form, message, Layout, Typography, Card, Space, Upload, Row, Col } from 'antd';
import { ethers } from 'ethers';
import { UploadOutlined } from '@ant-design/icons';
import AppHeader from '../components/Header'; 

const { Content } = Layout;
const { Title, Text } = Typography;

const MintERC1155Page = () => {
  const { primaryWallet } = useDynamicContext();
  const [contractAddress, setContractAddress] = useState<string>('');
  const [tokenId, setTokenId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [image, setImage] = useState<File | null>(null);
  const [deployTxHash, setDeployTxHash] = useState<string | null>(null);
  
  const handleUpload = (file: File) => {
    setImage(file);
    return false;
  };

  const deployContract = async () => {
    if (!primaryWallet) {
      message.error('No wallet connected');
      return;
    }
  
    try {
      const provider = await getWeb3Provider(primaryWallet);
      const signer = await getSigner(primaryWallet);
  
      const factory = new ethers.ContractFactory(
        [
          'function mint(address to, uint256 id, uint256 amount, bytes data) public',
        ],
        'your_contract_bytecode', 
        signer
      );
  
      const contract = await factory.deploy();
      
      const deploymentTransaction = contract.deploymentTransaction();
  
      if (deploymentTransaction) {
        const receipt = await deploymentTransaction.wait();
  
        if (receipt && receipt.contractAddress) {
          setContractAddress(receipt.contractAddress);
          setDeployTxHash(receipt.hash); 
          message.success('Contract deployed successfully!');
        } else {
          message.error('Failed to retrieve deployed contract address or transaction details');
        }
      } else {
        message.error('Failed to retrieve deployment transaction');
      }
    } catch (error) {
      console.error(error);
      message.error('Contract deployment failed');
    }
  };
  
  const mintTokens = async () => {
    if (!primaryWallet || !contractAddress) {
      message.error("No wallet connected or contract not deployed");
      return;
    }

    if (!amount || !tokenId) {
      message.error('Please fill all fields');
      return;
    }

    try {
      const provider = await getWeb3Provider(primaryWallet);
      const signer = await getSigner(primaryWallet);

      const contract = new ethers.Contract(
        contractAddress,
        ['function mint(address to, uint256 id, uint256 amount, bytes data) public'],
        signer
      );

      const tx = await contract.mint(primaryWallet.address, tokenId, amount, '0x');
      await tx.wait();
      setTransactionHash(tx.hash);
      message.success(`Successfully minted ${amount} tokens`);
    } catch (error) {
      console.error(error);
      message.error('Minting failed');
    }
  };

  return (
    <Layout style={{ height: '100vh', backgroundColor: '#f0f2f5' }}>
      <AppHeader /> 

      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <div style={{ padding: '20px', maxWidth: '1200px', width: '100%' }}>
          <Title level={1} style={{ marginBottom: '40px', color: '#001529', textAlign: 'center' }}>Deploy & Mint ERC1155 Tokens</Title>
          
          <Row gutter={24}> 
            <Col xs={24} md={12}> 
              <Card
                style={{
                  padding: '40px 20px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  borderRadius: '10px',
                  backgroundColor: '#fff',
                  marginBottom: '20px',
                }}
              >
                <Title level={3} style={{ marginBottom: '20px' }}>Deploy New ERC1155 Contract</Title>
                <Form layout="vertical" onFinish={deployContract}>
                  <Form.Item label="Token Name" required>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter token name"
                    />
                  </Form.Item>
                  <Form.Item label="Token Description" required>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter token description"
                    />
                  </Form.Item>
                  <Form.Item label="Upload Token Image">
                    <Upload beforeUpload={handleUpload} showUploadList={false}>
                      <Button icon={<UploadOutlined />}>Click to Upload</Button>
                    </Upload>
                    {image && <Text>Uploaded: {image.name}</Text>}
                  </Form.Item>

                  <Button type="primary" htmlType="submit" disabled={!primaryWallet}>
                    Deploy Contract
                  </Button>
                  {deployTxHash && (
                    <div style={{ marginTop: '20px', textAlign: 'left', wordBreak: 'break-all' }}>
                      <Text><strong>Deployment Transaction Hash:</strong></Text>
                      <Text>{deployTxHash}</Text>
                    </div>
                  )}
                </Form>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card
                style={{
                  padding: '40px 20px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  borderRadius: '10px',
                  backgroundColor: '#fff',
                }}
              >
                <Title level={3} style={{ marginBottom: '20px' }}>Mint a Token</Title>
                <Text style={{ display: 'block', marginBottom: '20px' }}>
                  Enter the details below to mint a new ERC1155 token.
                </Text>
                <Form layout="vertical" onFinish={mintTokens}>
                  <Form.Item label="ERC1155 Contract Address" required>
                    <Input
                      value={contractAddress}
                      onChange={(e) => setContractAddress(e.target.value)}
                      placeholder="Enter contract address"
                    />
                  </Form.Item>

                  <Form.Item label="Token ID" required>
                    <Input
                      value={tokenId}
                      onChange={(e) => setTokenId(e.target.value)}
                      placeholder="Enter token ID"
                    />
                  </Form.Item>

                  <Form.Item label="Amount to Mint" required>
                    <Input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      type="number"
                    />
                  </Form.Item>

                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      disabled={!primaryWallet || !contractAddress}
                    >
                      Mint Tokens
                    </Button>
                    {transactionHash && (
                      <div style={{ marginTop: '20px', textAlign: 'left', wordBreak: 'break-all' }}>
                        <Text><strong>Transaction Hash:</strong></Text>
                        <Text>{transactionHash}</Text>
                      </div>
                    )}
                  </Space>
                </Form>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
};

export default MintERC1155Page;
