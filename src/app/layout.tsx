import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import {
  DynamicContextProvider,
  EthereumWalletConnectors,
} from "../app/lib/dynamic";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gnosis dApp",
  description: "Gnosis Dapp Boilerplate",
};

const evmNetworks = [
  {
    blockExplorerUrls: ['https://gnosisscan.io/'],
    chainId: 100,
    chainName: 'Gnosis Mainnet',
    iconUrls: ['https://cdn.prod.website-files.com/63692bf32544bee8b1836ea6/636a6e764bdb11a70341fab4_owl-forest.png'],
    name: 'Gnosis',
    nativeCurrency: {
      decimals: 18,
      name: 'xDAI',
      symbol: 'xDAI',
    },
    networkId: 2,
    rpcUrls: ['https://1rpc.io/gnosis'],
    vanityName: 'Gnosis Mainnet',
  },
  {
    blockExplorerUrls: ['https://gnosis.blockscout.com/'],
    chainId: 10200,
    chainName: 'Gnosis Chiado',
    iconUrls: ['https://cdn.prod.website-files.com/63692bf32544bee8b1836ea6/636a6e764bdb11a70341fab4_owl-forest.png'],
    name: 'Chiado',
    nativeCurrency: {
      decimals: 18,
      name: 'xDAI',
      symbol: 'xDAI',
    },
    networkId: 1,
    rpcUrls: ['https://rpc.chiado.gnosis.gateway.fm'],
    vanityName: 'Chiado',
  },
  {
    blockExplorerUrls: ['https://sepolia.etherscan.io/'],
    chainId: 11155111,
    chainName: 'Sepolia',
    iconUrls: ['https://www.ethereum-ecosystem.com/logos/ethereum_icon.png'],
    name: 'Sepolia',
    nativeCurrency: {
      decimals: 18,
      name: 'ETH',
      symbol: 'ETH',
    },
    networkId: 3,
    rpcUrls: ['https://gateway.tenderly.co/public/sepolia'],
    vanityName: 'Sepolia',
  },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DynamicContextProvider
          settings={{
            environmentId: "299c3720-c413-49cb-bc32-ab64b2244bc4",
            walletConnectors: [EthereumWalletConnectors],
            overrides: { evmNetworks },
          }}
        >
          {children}
        </DynamicContextProvider>
      </body>
    </html>
  );
}
