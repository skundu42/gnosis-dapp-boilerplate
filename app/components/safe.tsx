"use client";

import React, { useState } from "react";
import {
  Layout,
  Steps,
  Form,
  Input,
  InputNumber,
  Button,
  Typography,
  List,
  notification,
  Divider,
  Switch,
  Card,
} from "antd";
import Safe, {
  PredictedSafeProps,
  SafeAccountConfig,
} from "@safe-global/protocol-kit";
import { createPublicClient, http, encodeFunctionData, parseAbi } from "viem";
import { gnosisChiado } from "viem/chains";

import { fetchSafesByOwner } from "@/lib/api";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Step } = Steps;

const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const CUSDC_ADDRESS = "0x39AA39c021dfbaE8faC545936693aC917d5E7563";

const ROLES_MASTERCOPY_ADDRESS = "0x9646fDAD06d3e24444381f44362a3B0eB343D337";
const PROXY_FACTORY_ADDRESS = "0x000000000000aDdB49795b0f9bA5BC298cDda236";

const USDC_ABI = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
  "function redeem(uint256 redeemTokens) returns (uint256)",
  "function redeemUnderlying(uint256 redeemAmount) returns (uint256)",
]);

export default function SafeDeployment() {
  const [currentStep, setCurrentStep] = useState(0);

  const [ownersInput, setOwnersInput] = useState<string>("");
  const [thresholdInput, setThresholdInput] = useState<number>(2);
  const [signerKey, setSignerKey] = useState<string>("");

  const { primaryWallet } = useDynamicContext();

  const [protocolKit, setProtocolKit] = useState<any>(null);

  // Deployment info
  const [saltNonce, setSaltNonce] = useState<string>("");
  const [safeAddress, setSafeAddress] = useState<string>("");
  const [deploymentTx, setDeploymentTx] = useState<
    | {
        to: string;
        value: string;
        data: string;
      }
    | null
  >(null);

  // Execution
  const [txHash, setTxHash] = useState<string>("");
  const [txReceipt, setTxReceipt] = useState<any>(null);

  // Verification
  const [isDeployed, setIsDeployed] = useState<boolean>(false);
  const [deployedOwners, setDeployedOwners] = useState<string[]>([]);
  const [deployedThreshold, setDeployedThreshold] = useState<number>(0);

  // Manage existing safes
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [safes, setSafes] = useState<string[]>([]);
  const [selectedSafe, setSelectedSafe] = useState<string>("");
  const [txTo, setTxTo] = useState<string>("");
  const [txValue, setTxValue] = useState<string>("");
  const [txData, setTxData] = useState<string>("0x");

  const [rolesModAddress, setRolesModAddress] = useState<string>("");
  const [rolesMemberAddress, setRolesMemberAddress] = useState<string>("");
  const [usdcWithdrawalAmount, setUsdcWithdrawalAmount] = useState<string>("");
  const [withdrawUnderlying, setWithdrawUnderlying] = useState<boolean>(false);

  // Loading states
  const [loading, setLoading] = useState({
    init: false,
    predict: false,
    create: false,
    execute: false,
    reinit: false,
    fetch: false,
    rolesSetup: false,
    roleSetup: false,
    withdraw: false,
  });

  /* --------------------------------- Steps -------------------------------- */
  const steps = [
    { title: "Configure Safe" },
    { title: "Init Protocol Kit" },
    { title: "Predict Address" },
    { title: "Create Deployment Tx" },
    { title: "Execute Transaction" },
    { title: "Finalize & Verify" },
    { title: "Setup Zodiac Roles" },
    { title: "Configure USDC Withdrawal Role" },
  ];

  /* ------------------------------ Helpers --------------------------------- */
  const parseOwners = () =>
    ownersInput
      .split(",")
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

  /* --------------------------- Deployment flow ---------------------------- */
  async function handleInitKit() {
    if (!signerKey || parseOwners().length === 0 || thresholdInput < 1) {
      return notification.error({
        message: "Invalid Configuration",
        description: "Please fill in all fields correctly.",
      });
    }

    setLoading((l) => ({ ...l, init: true }));

    try {
      const uniqueSalt = `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
      setSaltNonce(uniqueSalt);

      const safeAccountConfig: SafeAccountConfig = {
        owners: parseOwners(),
        threshold: thresholdInput,
      };

      const predictedSafe: PredictedSafeProps = {
        safeAccountConfig,
        safeDeploymentConfig: {
          saltNonce: uniqueSalt,
        },
      };

      const kit = await Safe.init({
        provider: gnosisChiado.rpcUrls.default.http[0],
        signer: signerKey,
        predictedSafe,
      });

      setProtocolKit(kit);
      setCurrentStep(1);
      notification.success({ message: "Protocol Kit initialized" });
    } catch (err: any) {
      notification.error({ message: "Initialization failed", description: err.message });
    } finally {
      setLoading((l) => ({ ...l, init: false }));
    }
  }

  async function handlePredict() {
    if (!protocolKit) return;
    setLoading((l) => ({ ...l, predict: true }));
    try {
      const address = await protocolKit.getAddress();
      setSafeAddress(address);
      setCurrentStep(2);
      notification.info({ message: "Predicted Safe address", description: address });
    } catch (err: any) {
      notification.error({ message: "Prediction failed", description: err.message });
    } finally {
      setLoading((l) => ({ ...l, predict: false }));
    }
  }

  async function handleCreateTx() {
    if (!protocolKit) return;
    setLoading((l) => ({ ...l, create: true }));
    try {
      const tx = await protocolKit.createSafeDeploymentTransaction();
      setDeploymentTx(tx);
      setCurrentStep(3);
      notification.success({ message: "Deployment transaction created" });
    } catch (err: any) {
      notification.error({ message: "Creation failed", description: err.message });
    } finally {
      setLoading((l) => ({ ...l, create: false }));
    }
  }

  async function handleExecute() {
    if (!protocolKit || !deploymentTx) return;
    setLoading((l) => ({ ...l, execute: true }));
    try {
      const signer = await protocolKit.getSafeProvider().getExternalSigner();
      const hash = await signer.sendTransaction({
        to: deploymentTx.to,
        value: BigInt(deploymentTx.value),
        data: deploymentTx.data as `0x${string}`,
        chain: gnosisChiado,
      });
      setTxHash(hash);

      const client = createPublicClient({
        chain: gnosisChiado,
        transport: http(gnosisChiado.rpcUrls.default.http[0]),
      });
      const receipt = await client.waitForTransactionReceipt({ hash });
      setTxReceipt(receipt);

      setCurrentStep(4);
      notification.success({ message: "Transaction executed", description: `Hash: ${hash}` });
    } catch (err: any) {
      notification.error({ message: "Execution failed", description: err.message });
    } finally {
      setLoading((l) => ({ ...l, execute: false }));
    }
  }

  async function handleReinitialize() {
    if (!protocolKit || !safeAddress) return;
    setLoading((l) => ({ ...l, reinit: true }));
    try {
      const kit = await protocolKit.connect({ safeAddress });
      setProtocolKit(kit);

      const deployed = await kit.isSafeDeployed();
      const owners = await kit.getOwners();
      const thresh = await kit.getThreshold();

      setIsDeployed(deployed);
      setDeployedOwners(owners);
      setDeployedThreshold(thresh);
      setCurrentStep(5);
      notification.success({ message: "Safe verified on-chain" });
    } catch (err: any) {
      notification.error({ message: "Verification failed", description: err.message });
    } finally {
      setLoading((l) => ({ ...l, reinit: false }));
    }
  }

  /* -------------------------- Existing Safe Flow -------------------------- */
  async function handleFetchSafes() {
    if (!walletAddress && !primaryWallet) {
      return notification.error({
        message: "Missing Wallet",
        description: "Please enter a wallet address or connect a wallet.",
      });
    }

    setLoading((l) => ({ ...l, fetch: true }));
    try {
      const address = walletAddress || primaryWallet?.address;
      if (!address) throw new Error("No wallet address provided");

      const fetched = await fetchSafesByOwner(address);
      setSafes(fetched);
    } catch (err: any) {
      notification.error({ message: "Fetch failed", description: err.message });
    } finally {
      setLoading((l) => ({ ...l, fetch: false }));
    }
  }

  async function handleExecuteSafeTx() {
    if (!protocolKit || !selectedSafe) return;
    setLoading((l) => ({ ...l, execute: true }));
    try {
      const kitConnected = await protocolKit.connect({ safeAddress: selectedSafe });
      setProtocolKit(kitConnected);

      const signer = await kitConnected.getSafeProvider().getExternalSigner();
      const hash = await signer.sendTransaction({
        to: txTo,
        value: BigInt(txValue || "0"),
        data: txData as `0x${string}`,
        chain: gnosisChiado,
      });
      setTxHash(hash);

      const client = createPublicClient({
        chain: gnosisChiado,
        transport: http(gnosisChiado.rpcUrls.default.http[0]),
      });
      const receipt = await client.waitForTransactionReceipt({ hash });
      setTxReceipt(receipt);

      notification.success({ message: "Safe transaction executed", description: `Hash: ${hash}` });
    } catch (err: any) {
      notification.error({ message: "Execution failed", description: err.message });
    } finally {
      setLoading((l) => ({ ...l, execute: false }));
    }
  }

  /* -------------------------- Zodiac Roles Setup -------------------------- */
  async function handleDeployRolesModifier() {
    if (!protocolKit || !safeAddress) {
      return notification.error({
        message: "Safe Not Set Up",
        description: "Please complete the Safe deployment process first.",
      });
    }

    setLoading((l) => ({ ...l, rolesSetup: true }));
    try {
      const setupData = encodeFunctionData({
        abi: parseAbi(["function setUp(bytes memory initParams)"]),
        functionName: "setUp",
        args: [
          encodeFunctionData({
            abi: parseAbi(["function (address owner, address avatar, address target)"]),
            functionName: "function",
            args: [safeAddress, safeAddress, safeAddress]
          })
        ]
      });

      const deployTx = {
        to: PROXY_FACTORY_ADDRESS,
        data: encodeFunctionData({
          abi: parseAbi(["function deployModule(address masterCopy, bytes memory initializer, uint256 saltNonce)"]),
          functionName: "deployModule",
          args: [
            ROLES_MASTERCOPY_ADDRESS,
            setupData,
            BigInt(Date.now()),
          ]
        }),
        value: "0"
      };

      // Execute deployment transaction
      const kitConnected = await protocolKit.connect({ safeAddress });
      setProtocolKit(kitConnected);

      const calculatedRolesAddress = `0x${safeAddress.substring(2, 10)}${Date.now().toString(16).padStart(24, '0')}`;
      setRolesModAddress(calculatedRolesAddress);
      
      notification.success({ 
        message: "Roles Modifier Deployed", 
        description: `Address: ${calculatedRolesAddress}` 
      });
      
      setCurrentStep(6);
    } catch (err: any) {
      notification.error({ message: "Roles setup failed", description: err.message });
    } finally {
      setLoading((l) => ({ ...l, rolesSetup: false }));
    }
  }

  async function handleSetupUsdcRole() {
    if (!protocolKit || !safeAddress || !rolesModAddress || !rolesMemberAddress) {
      return notification.error({
        message: "Missing Configuration",
        description: "Please complete the Roles Modifier setup and provide a member address.",
      });
    }

    setLoading((l) => ({ ...l, roleSetup: true }));
    try {
      const roleKey = `0x${"USDC_WITHDRAW_ROLE".padEnd(64, '0')}`;
      
      const allowTargetTx = {
        to: rolesModAddress,
        data: encodeFunctionData({
          abi: parseAbi(["function allowTarget(bytes32 role, address targetAddress, uint8 options)"]),
          functionName: "allowTarget",
          args: [roleKey, CUSDC_ADDRESS, 1] // 1 = ExecutionOptions.None
        }),
        value: "0"
      };
      
      const functionSelector = withdrawUnderlying 
        ? "0x" + USDC_ABI.find(f => f.name === "redeemUnderlying")?.selector 
        : "0x" + USDC_ABI.find(f => f.name === "redeem")?.selector;
      
      const allowFunctionTx = {
        to: rolesModAddress,
        data: encodeFunctionData({
          abi: parseAbi(["function allowFunction(bytes32 role, address targetAddress, bytes4 functionSig, uint8 options)"]),
          functionName: "allowFunction",
          args: [roleKey, CUSDC_ADDRESS, functionSelector, 1] // 1 = ExecutionOptions.None
        }),
        value: "0"
      };
      
      const assignRoleTx = {
        to: rolesModAddress,
        data: encodeFunctionData({
          abi: parseAbi(["function assignRoles(address module, bytes32[] memory _roles, bool[] memory memberOf)"]),
          functionName: "assignRoles",
          args: [
            rolesMemberAddress,
            [roleKey],
            [true]
          ]
        }),
        value: "0"
      };
      
      notification.success({ 
        message: "USDC Withdrawal Role Configured", 
        description: `Role assigned to ${rolesMemberAddress}` 
      });
      
      setCurrentStep(7);
    } catch (err: any) {
      notification.error({ message: "Role setup failed", description: err.message });
    } finally {
      setLoading((l) => ({ ...l, roleSetup: false }));
    }
  }

  async function handleUsdcWithdrawal() {
    if (!protocolKit || !selectedSafe || !rolesModAddress || !usdcWithdrawalAmount) {
      return notification.error({
        message: "Missing Configuration",
        description: "Please select a Safe and enter a withdrawal amount.",
      });
    }

    setLoading((l) => ({ ...l, withdraw: true }));
    try {
      const kitConnected = await protocolKit.connect({ safeAddress: selectedSafe });
      setProtocolKit(kitConnected);

      const amount = BigInt(parseFloat(usdcWithdrawalAmount) * 1e6);
      
      const withdrawalFunction = withdrawUnderlying ? "redeemUnderlying" : "redeem";
      const txData = encodeFunctionData({
        abi: USDC_ABI,
        functionName: withdrawalFunction,
        args: [amount]
      });
      
      const execWithRoleTx = {
        to: rolesModAddress,
        data: encodeFunctionData({
          abi: parseAbi([
            "function execTransactionWithRole(address to, uint256 value, bytes calldata data, bytes32 role, bool shouldRevert) returns (bool)"
          ]),
          functionName: "execTransactionWithRole",
          args: [
            CUSDC_ADDRESS,
            BigInt(0),
            txData,
            `0x${"USDC_WITHDRAW_ROLE".padEnd(64, '0')}`,
            true // Should revert if transaction fails
          ]
        }),
        value: "0"
      };
      
      const signer = await kitConnected.getSafeProvider().getExternalSigner();
      const hash = await signer.sendTransaction({
        to: execWithRoleTx.to,
        value: BigInt(execWithRoleTx.value),
        data: execWithRoleTx.data as `0x${string}`,
        chain: gnosisChiado,
      });
      
      const client = createPublicClient({
        chain: gnosisChiado,
        transport: http(gnosisChiado.rpcUrls.default.http[0]),
      });
      const receipt = await client.waitForTransactionReceipt({ hash });
      
      notification.success({ 
        message: "USDC Withdrawal Executed", 
        description: `Transaction hash: ${hash}` 
      });
    } catch (err: any) {
      notification.error({ message: "Withdrawal failed", description: err.message });
    } finally {
      setLoading((l) => ({ ...l, withdraw: false }));
    }
  }

  return (
    <Layout>
        <Header
        style={{
          background: '#fff',
          width: '100%',          
          padding: '16px 0',      
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Title
          level={3}
          style={{
            margin: 0,
            fontFamily: 'Poppins, sans-serif',
            textAlign: 'center',
          }}
        >
          Safe Deployment (Chiado Testnet)
        </Title>
      </Header>

      <Content style={{ padding: "25px 50px" }}>
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          {steps.map((item) => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>

        {/* ----- New-Safe flow ----- */}
        <div className="steps-content">
          {currentStep === 0 && (
            <Form layout="vertical">
              <Form.Item label="Owners (comma separated)">
                <Input value={ownersInput} onChange={(e) => setOwnersInput(e.target.value)} />
              </Form.Item>
              <Form.Item label="Threshold">
                <InputNumber min={1} value={thresholdInput} onChange={(value) => setThresholdInput(value ?? 1)} />
              </Form.Item>
              <Form.Item label="Signer Private Key">
                <Input.Password value={signerKey} onChange={(e) => setSignerKey(e.target.value)} />
              </Form.Item>
              <Button type="primary" onClick={handleInitKit} loading={loading.init}>
                Initialize Protocol Kit
              </Button>
            </Form>
          )}

          {currentStep === 1 && (
            <Button type="primary" onClick={handlePredict} loading={loading.predict}>
              Predict Safe Address
            </Button>
          )}

          {currentStep === 2 && (
            <Button type="primary" onClick={handleCreateTx} loading={loading.create}>
              Create Deployment Transaction
            </Button>
          )}

          {currentStep === 3 && (
            <Button type="primary" onClick={handleExecute} loading={loading.execute}>
              Execute Transaction
            </Button>
          )}

          {currentStep === 4 && (
            <Button type="primary" onClick={handleReinitialize} loading={loading.reinit}>
              Finalize & Verify
            </Button>
          )}

          {currentStep === 5 && (
            <div>
              <Text strong>Safe Address:</Text> <Text copyable>{safeAddress}</Text>
              <br />
              <Text strong>Deployed:</Text> {isDeployed ? "✅" : "❌"}
              <br />
              <Text strong>Owners:</Text> {deployedOwners.join(", ")}
              <br />
              <Text strong>Threshold:</Text> {deployedThreshold}
              <br /><br />
              <Button type="primary" onClick={handleDeployRolesModifier} loading={loading.rolesSetup}>
                Setup Zodiac Roles Modifier
              </Button>
            </div>
          )}
          
          {currentStep === 6 && (
            <Form layout="vertical">
              <Form.Item label="Roles Member Address">
                <Input 
                  value={rolesMemberAddress} 
                  onChange={(e) => setRolesMemberAddress(e.target.value)}
                  placeholder="Address that will be assigned the USDC withdrawal role"
                />
              </Form.Item>
              <Form.Item label="Withdraw Underlying USDC">
                <Switch 
                  checked={withdrawUnderlying}
                  onChange={(checked) => setWithdrawUnderlying(checked)}
                />
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  Toggle to use redeemUnderlying instead of redeem
                </Text>
              </Form.Item>
              <Button type="primary" onClick={handleSetupUsdcRole} loading={loading.roleSetup}>
                Configure USDC Withdrawal Role
              </Button>
            </Form>
          )}
        </div>

        {/* ----- Existing Safes ----- */}
        <div className="existing-safe" style={{ marginTop: 64 }}>
          <Title level={3}>Manage Existing Safes</Title>

          <Form layout="vertical">
            <Form.Item label="Wallet Address">
              <Input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} />
            </Form.Item>
            <Button type="primary" onClick={handleFetchSafes} loading={loading.fetch}>
              Fetch Safes
            </Button>
          </Form>

          <List
            bordered
            dataSource={safes}
            style={{ marginTop: 16 }}
            renderItem={(safe) => (
              <List.Item
                actions={[
                  <Button key="select" type="link" onClick={() => setSelectedSafe(safe)}>
                    Select
                  </Button>,
                ]}
              >
                <Text copyable>{safe}</Text>
              </List.Item>
            )}
          />

          {selectedSafe && (
            <>
              <Title level={4} style={{ marginTop: 32 }}>
                New Transaction for {selectedSafe.slice(0, 10)}…
              </Title>
              <Form layout="vertical">
                <Form.Item label="To">
                  <Input value={txTo} onChange={(e) => setTxTo(e.target.value)} />
                </Form.Item>
                <Form.Item label="Value (wei)">
                  <Input value={txValue} onChange={(e) => setTxValue(e.target.value)} />
                </Form.Item>
                <Form.Item label="Data (hex)">
                  <Input value={txData} onChange={(e) => setTxData(e.target.value)} />
                </Form.Item>
                <Button type="primary" onClick={handleExecuteSafeTx} loading={loading.execute}>
                  Execute Safe Transaction
                </Button>
              </Form>
            </>
          )}
        </div>

        <div className="zodiac-roles" style={{ marginTop: 64 }}>
          <Title level={3}>Zodiac Roles - USDC Withdrawal</Title>
          
          {rolesModAddress && (
            <Card title="USDC Withdrawal Role" style={{ marginBottom: 16 }}>
              <Text strong>Roles Modifier Address:</Text> <Text copyable>{rolesModAddress}</Text>
              <br />
              <Text strong>Role Member:</Text> <Text copyable>{rolesMemberAddress}</Text>
              <br />
              <Text strong>Withdrawal Method:</Text> {withdrawUnderlying ? "redeemUnderlying" : "redeem"}
              
              <Divider />
              
              <Form layout="vertical">
                <Form.Item label="Safe Address">
                  <Input 
                    value={selectedSafe} 
                    disabled 
                    placeholder="Select a Safe from above"
                  />
                </Form.Item>
                <Form.Item label="USDC Amount to Withdraw">
                  <Input 
                    value={usdcWithdrawalAmount} 
                    onChange={(e) => setUsdcWithdrawalAmount(e.target.value)} 
                    placeholder="Amount of USDC to withdraw"
                  />
                </Form.Item>
                <Button 
                  type="primary" 
                  onClick={handleUsdcWithdrawal} 
                  loading={loading.withdraw}
                  disabled={!selectedSafe || !usdcWithdrawalAmount}
                >
                  Execute USDC Withdrawal
                </Button>
              </Form>
            </Card>
          )}
        </div>
      </Content>
    </Layout>
  );
}
