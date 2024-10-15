"use client";

import { useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { getWeb3Provider, getSigner } from '@dynamic-labs/ethers-v6';
import { Button, Typography, Card, Form, Input, message as antdMessage } from 'antd';
import { AbiCoder, Contract } from 'ethers';
import AppHeader from '../components/Header';

const { Title, Text } = Typography;

const sepoliaSenderAddress = '0x89ddbb0EbDAad37ed791DBFFf156d0ead8A1Ba4f';
const sepoliaSenderABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "targetChainId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "threshold",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "targetAddress",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      },
      {
        "internalType": "address[]",
        "name": "reporters",
        "type": "address[]"
      },
      {
        "internalType": "address[]",
        "name": "adapters",
        "type": "address[]"
      }
    ],
    "name": "dispatchMessageToAdapters",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const chiadoReceiverAddress = '0x449f37648D3f546EB0Bd0D065045c826b98dF75B';
const chiadoReceiverABI = [
  {
    "inputs": [],
    "name": "lastReceivedMessage",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export default function Main() {
  const { primaryWallet } = useDynamicContext(); 
  const [loading, setLoading] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>('');
  const [fetchingMessage, setFetchingMessage] = useState<boolean>(false);
  
  const sendMessageToChiado = async (messageText: string) => {
    if (!primaryWallet) {
      antdMessage.error('No wallet connected. Please connect your wallet.');
      return;
    }

    const provider = await getWeb3Provider(primaryWallet); 
    const signer = await getSigner(primaryWallet); 

    if (!provider || !signer) return;

    setLoading(true);
    try {
      const sepoliaSenderContract = new Contract(sepoliaSenderAddress, sepoliaSenderABI, signer);

      const abiCoder = new AbiCoder();
      const encodedMessage = abiCoder.encode(["string"], [messageText]);

      const tx = await sepoliaSenderContract.dispatchMessageToAdapters(
        100100, 
        1, 
        chiadoReceiverAddress, 
        encodedMessage, 
        ["0xc6755144d60548f3DD420F47Cf48DAe553bBf042"], 
        ["0x3F5929bee6A59661D6CcC9c4eB751048009CE11B"]  
      );
      await tx.wait();

      antdMessage.success('Message sent successfully!');
    } catch (error) {
      console.error(error);
      antdMessage.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const fetchLastReceivedMessage = async () => {
    if (!primaryWallet) {
      antdMessage.error('No wallet connected. Please connect your wallet.');
      return;
    }

    const provider = await getWeb3Provider(primaryWallet);
    if (!provider) return;

    setFetchingMessage(true);
    try {
      const chiadoReceiverContract = new Contract(chiadoReceiverAddress, chiadoReceiverABI, provider);
      const message = await chiadoReceiverContract.lastReceivedMessage();
      console.log(message);
      setLastMessage(message);
      antdMessage.success('Message fetched successfully!');
    } catch (error) {
      console.error('Error fetching message:', error);
      antdMessage.error('Failed to fetch message');
    } finally {
      setFetchingMessage(false);
    }
  };

  return (
    <>
      <div style={{ position: 'fixed', top: 0, width: '100%', zIndex: 1000 }}>
        <AppHeader />
      </div>

      <div style={{ padding: '100px 20px', maxWidth: '600px', margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div>
          <Card style={{ marginTop: '20px', textAlign: 'center', padding: '40px 20px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', borderRadius: '10px' }}>
            <Title level={3} style={{ marginBottom: '20px' }}>Send Cross-Chain Message</Title>
            <Form onFinish={(values) => sendMessageToChiado(values.message)} layout="vertical" style={{ marginTop: 20 }}>
              <Form.Item
                name="message"
                label="Message"
                rules={[{ required: true, message: 'Please enter a message' }]}
              >
                <Input placeholder="Enter message to send to Chiado" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Send Message
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <Button type="default" onClick={fetchLastReceivedMessage} loading={fetchingMessage} style={{ marginTop: '20px' }}>
            Fetch Last Received Message
          </Button>

          {lastMessage && (
            <Card style={{ marginTop: '20px', textAlign: 'center', padding: '40px 20px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', borderRadius: '10px' }}>
              <Title level={3}>Last Received Message on Chiado</Title>
              <Text>{lastMessage}</Text>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
