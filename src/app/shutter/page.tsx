"use client";

import React, { useState, useEffect } from 'react';
import { getSigner } from '@dynamic-labs/ethers-v6';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Button, Form, message, Layout, Typography, Card, Row, Col, Select, notification, Spin, Steps } from 'antd';
import { keccak256, toUtf8Bytes } from 'ethers';
import AppHeader from '../components/Header';
import axios from 'axios';

const { Content } = Layout;
const { Title } = Typography;
const { Step } = Steps;

const ShutterizedRPS = () => {
  const { primaryWallet } = useDynamicContext();
  const [encryptedData, setEncryptedData] = useState({ player1: '', player2: '' });
  const [decryptedMoves, setDecryptedMoves] = useState({ player1: '', player2: '' });
  const [gameInProgress, setGameInProgress] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [gameResult, setGameResult] = useState('');
  const [loadingPlayer1, setLoadingPlayer1] = useState(false);
  const [loadingPlayer2, setLoadingPlayer2] = useState(false);
  const [encryptionTimestamp, setEncryptionTimestamp] = useState(Math.floor(Date.now() / 1000) + 20);

  const apiBaseUrl = 'https://nanoshutter.staging.shutter.network';

  const handlePlayerMove = async (player: string, move: string) => {
    if (!primaryWallet) {
      message.error('No wallet connected. Please connect your wallet.');
      return;
    }

    player === 'player1' ? setLoadingPlayer1(true) : setLoadingPlayer2(true);
    try {
      const signer = await getSigner(primaryWallet);
      const hashedMove = keccak256(toUtf8Bytes(move));
      const tx = await signer.sendTransaction({
        to: primaryWallet.address, 
        value: 0,
        data: hashedMove,
      });
      await tx.wait();

      notification.info({
        message: 'Transaction Sent',
        description: `Move transaction for ${player} has been sent. Tx Hash: ${tx.hash}`,
      });

      const response = await axios.post(`${apiBaseUrl}/encrypt/with_time`, {
        cypher_text: move,
        timestamp: encryptionTimestamp,
      });

      if (response.status !== 200) {
        throw new Error('Encryption service returned an error');
      }

      const encryptedMove = response.data.message;
      setEncryptedData((prevData) => ({ ...prevData, [player]: encryptedMove }));
      setCurrentStep(currentStep + 1);

      notification.info({
        message: 'Move Encrypted',
        description: `${player === 'player1' ? 'Player 1' : 'Player 2'} encrypted move: ${encryptedMove}`,
      });
    } catch (error) {
      console.error('Error encrypting move:', error);
      message.error('Failed to encrypt move. Please try again later.');
    } finally {
      player === 'player1' ? setLoadingPlayer1(false) : setLoadingPlayer2(false);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        if (!gameInProgress) return;

        if (encryptedData.player1 && encryptedData.player2) {
          if (!decryptedMoves.player1) {
            const response = await axios.post(`${apiBaseUrl}/decrypt/with_time`, {
              encrypted_msg: encryptedData.player1,
              timestamp: encryptionTimestamp,
            });
            setDecryptedMoves((prevMoves) => ({ ...prevMoves, player1: response.data.message }));
          }
          if (!decryptedMoves.player2) {
            const response = await axios.post(`${apiBaseUrl}/decrypt/with_time`, {
              encrypted_msg: encryptedData.player2,
              timestamp: encryptionTimestamp,
            });
            setDecryptedMoves((prevMoves) => ({ ...prevMoves, player2: response.data.message }));
          }

          if (decryptedMoves.player1 && decryptedMoves.player2) {
            const result = determineWinner(decryptedMoves.player1, decryptedMoves.player2);
            setGameResult(result);
            setCurrentStep(3);
            setGameInProgress(false);

            notification.success({
              message: 'Game Result',
              description: `The game has concluded. ${result}`,
            });
          }
        }
      } catch (e:any) {
        if (e.response && e.response.status === 400) {
          setCurrentStep(2);
        } else {
          console.error('Error during decryption:', e);
          setGameInProgress(false);
          setCurrentStep(3);
        }
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [encryptedData, decryptedMoves, encryptionTimestamp, gameInProgress]);

  const resetGame = () => {
    setEncryptedData({ player1: '', player2: '' });
    setDecryptedMoves({ player1: '', player2: '' });
    setGameInProgress(true);
    setEncryptionTimestamp(Math.floor(Date.now() / 1000) + 20);
    setGameResult('');
    setCurrentStep(0);
  };

  const determineWinner = (move1: string, move2: string) => {
    if (move1 === move2) {
      return "It's a tie!";
    }

    if (
      (move1 === 'Rock' && move2 === 'Scissors') ||
      (move1 === 'Paper' && move2 === 'Rock') ||
      (move1 === 'Scissors' && move2 === 'Paper')
    ) {
      return 'Player 1 wins!';
    } else {
      return 'Player 2 wins!';
    }
  };

  const getCardStyle = (player: string) => {
    if (gameResult.includes(player)) {
      return {
        padding: '40px 20px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        borderRadius: '10px',
        backgroundColor: '#fff',
        border: '2px solid green',
      };
    }
    return {
      padding: '40px 20px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      borderRadius: '10px',
      backgroundColor: '#fff',
    };
  };

  return (
    <Layout style={{ height: '100vh', backgroundColor: '#f0f2f5' }}>
      <AppHeader />

      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <div style={{ padding: '20px', maxWidth: '1200px', width: '100%' }}>
          <Title level={1} style={{ marginBottom: '40px', color: '#001529', textAlign: 'center' }}>Shutterized Rock Paper Scissors</Title>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Card
                style={getCardStyle('Player 1')}
              >
                <Title level={3} style={{ marginBottom: '20px' }}>Player 1</Title>
                <Form layout="vertical" onFinish={(values) => handlePlayerMove('player1', values.move)}>
                  <Form.Item name="move" label="Choose your move" required>
                    <Select placeholder="Select move">
                      <Select.Option value="Rock">Rock</Select.Option>
                      <Select.Option value="Paper">Paper</Select.Option>
                      <Select.Option value="Scissors">Scissors</Select.Option>
                    </Select>
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={loadingPlayer1} disabled={!gameInProgress}>
                    Submit Move
                  </Button>
                </Form>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card
                style={getCardStyle('Player 2')}
              >
                <Title level={3} style={{ marginBottom: '20px' }}>Player 2</Title>
                <Form layout="vertical" onFinish={(values) => handlePlayerMove('player2', values.move)}>
                  <Form.Item name="move" label="Choose your move" required>
                    <Select placeholder="Select move">
                      <Select.Option value="Rock">Rock</Select.Option>
                      <Select.Option value="Paper">Paper</Select.Option>
                      <Select.Option value="Scissors">Scissors</Select.Option>
                    </Select>
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={loadingPlayer2} disabled={!gameInProgress}>
                    Submit Move
                  </Button>
                </Form>
              </Card>
            </Col>
          </Row>
          <Button type="default" onClick={resetGame} style={{ marginTop: '20px' }}>
            Start New Game
          </Button>
          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <Steps current={currentStep}>
              <Step title="Waiting for Player 1 Move" />
              <Step title="Waiting for Player 2 Move" />
              <Step title="Decrypting Moves" />
              <Step title="Game Concluded" />
            </Steps>
            {currentStep < 3 && (
              <div style={{ marginTop: '20px' }}>
                <Spin size="large" />
              </div>
            )}
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default ShutterizedRPS;