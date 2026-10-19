import React, { useState } from 'react';
import {
    TrendingUp,
    ShieldAlert,
    Cpu,
    DollarSign,
    Sliders,
    Lock,
    Zap,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

const ASSET_TYPES = [
    { id: 'forex', name: 'Forex Trading Bot', icon: TrendingUp, desc: 'Automated currency pair arbitrage and macro trend execution.' },
    { id: 'crypto', name: 'Crypto Trading Bot', icon: Cpu, desc: 'Spot and futures algorithmic execution across centralized & decentralized exchanges.' },
    { id: 'stock', name: 'Stock Trading Bot', icon: DollarSign, desc: 'Equities execution for NASDAQ & NYSE markets with momentum strategies.' },
    { id: 'mev', name: 'MEV Trading Bot', icon: Zap, desc: 'High-frequency blockchain searcher bot for frontrunning, backrunning & arbitrage.' },
];

export default function TradingDashboard() {
    const [selectedAsset, setSelectedAsset] = useState('forex');
    const [fundAmount, setFundAmount] = useState(200);
    const [allocationPercent, setAllocationPercent] = useState(50);

    // Asset-specific configuration states
    const [config, setConfig] = useState({
        // Forex
        forexPair: 'EUR/USD',
        leverage: '50x',
        stopLoss: '2.0%',
        takeProfit: '5.0%',
        // Crypto
        cryptoPair: 'BTC/USDT',
        marketType: 'Futures',
        strategy: 'Grid Trading',
        // Stock
        stockTicker: 'AAPL',
        exchange: 'NASDAQ',
        orderType: 'Limit',
        // MEV
        slippage: '0.5%',
        gasPriority: '3 Gwei',
        privateRpc: true,
    });

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Add explicit types for key and value
    const handleConfigChange = (key: string, value: string | boolean) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    // Add React.FormEvent type for the event parameter
    const handleDeployBot = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (fundAmount < 200) {
            setError('Minimum initial capital required to deploy any bot is $200.');
            return;
        }

        setSuccessMessage(`Successfully deployed ${selectedAsset.toUpperCase()} Bot with $${fundAmount} capital (${allocationPercent}% allocation)!`);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-slate-950">
            {/* Top Navbar */}
            <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <Zap className="h-5 w-5 text-slate-950 fill-current" />
                        </div>
                        <div>
                            <span className="font-bold tracking-tight text-lg text-white">NexusQuant</span>
                            <span className="text-xs block text-cyan-400 font-medium">Multimarket Algorithmic Engine</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="hidden md:flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-xs text-slate-400">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Global Execution Nodes: Optimal</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Container */}
            <main className="max-w-7xl mx-auto px-6 py-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">Deploy Automated Strategy</h1>
                    <p className="text-slate-400 mt-1">Select your target market sector and configure institutional-grade execution parameters.</p>
                </div>

                <form onSubmit={handleDeployBot} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left / Center Column: Asset Selection & Dynamic Configurations */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Asset Selector Cards */}
                        <div className="space-y-4">
                            <label className="text-sm font-semibold uppercase tracking-wider text-slate-400">1. Select Asset Class</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {ASSET_TYPES.map((asset) => {
                                    const Icon = asset.icon;
                                    const isSelected = selectedAsset === asset.id;
                                    return (
                                        <div
                                            key={asset.id}
                                            onClick={() => setSelectedAsset(asset.id)}
                                            className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${isSelected
                                                ? 'bg-slate-900 border-cyan-500 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500'
                                                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                {isSelected && <CheckCircle2 className="h-5 w-5 text-cyan-400" />}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white text-base">{asset.name}</h3>
                                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{asset.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Dynamic Configuration Panel Based on Selection */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
                            <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
                                <Sliders className="h-5 w-5 text-cyan-400" />
                                <h2 className="text-lg font-semibold text-white capitalize">{selectedAsset} Bot Parameters</h2>
                            </div>

                            {/* FOREX CONFIGURATION */}
                            {selectedAsset === 'forex' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-2">Currency Pair</label>
                                        <select
                                            value={config.forexPair}
                                            onChange={(e) => handleConfigChange('forexPair', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                                        >
                                            <option value="EUR/USD">EUR/USD (Euro / US Dollar)</option>
                                            <option value="GBP/USD">GBP/USD (British Pound / US Dollar)</option>
                                            <option value="USD/JPY">USD/JPY (US Dollar / Japanese Yen)</option>
                                            <option value="AUD/USD">AUD/USD (Australian Dollar / US Dollar)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-2">Leverage</label>
                                        <select
                                            value={config.leverage}
                                            onChange={(e) => handleConfigChange('leverage', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                                        >
                                            <option value="10x">10x Leverage</option>
                                            <option value="25x">25x Leverage</option>
                                            <option value="50x">50x Leverage</option>
                                            <option value="100x">100x Leverage (High Risk)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-2">Stop Loss Threshold</label>
                                        <input
                                            type="text"
                                            value={config.stopLoss}
                                            onChange={(e) => handleConfigChange('stopLoss', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-2">Take Profit Target</label>
                                        <input
                                            type="text"
                                            value={config.takeProfit}
                                            onChange={(e) => handleConfigChange('takeProfit', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* CRYPTO CONFIGURATION */}
                            {selectedAsset === 'crypto' && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-2">Trading Pair</label>
                                        <select
                                            value={config.cryptoPair}
                                            onChange={(e) => handleConfigChange('cryptoPair', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                                        >
                                            <option value="BTC/USDT">BTC/USDT</option>
                                            <option value="ETH/USDT">ETH/USDT</option>
                                            <option value="SOL/USDT">SOL/USDT</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-2">Market Type</label>
                                        <select
                                            value={config.marketType}
                                            onChange={(e) => handleConfigChange('marketType', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                                        >
                                            <option value="Spot">Spot Execution</option>
                                            <option value="Futures">Perpetual Futures</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-2">Strategy Style</label>
                                        <select
                                            value={config.strategy}
                                            onChange={(e) => handleConfigChange('strategy', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                                        >
                                            <option value="Grid Trading">Grid Trading</option>
                                            <option value="DCA">Dollar-Cost Averaging (DCA)</option>
                                            <option value="Momentum Breakout">Momentum Breakout</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* STOCK CONFIGURATION */}
                            {selectedAsset === 'stock' && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-2">Stock Ticker</label>
                                        <input
                                            type="text"
                                            value={config.stockTicker}
                                            onChange={(e) => handleConfigChange('stockTicker', e.target.value.toUpperCase())}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 uppercase"
                                            placeholder="e.g. AAPL, TSLA, NVDA"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-2">Exchange Market</label>
                                        <select
                                            value={config.exchange}
                                            onChange={(e) => handleConfigChange('exchange', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                                        >
                                            <option value="NASDAQ">NASDAQ</option>
                                            <option value="NYSE">NYSE</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-2">Order Execution Type</label>
                                        <select
                                            value={config.orderType}
                                            onChange={(e) => handleConfigChange('orderType', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                                        >
                                            <option value="Limit">Limit Order</option>
                                            <option value="Market">Market Order</option>
                                            <option value="TWAP">TWAP (Time-Weighted)</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* MEV CONFIGURATION */}
                            {selectedAsset === 'mev' && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-2">Slippage Tolerance</label>
                                        <select
                                            value={config.slippage}
                                            onChange={(e) => handleConfigChange('slippage', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                                        >
                                            <option value="0.1%">0.1% (Strict)</option>
                                            <option value="0.5%">0.5% (Standard)</option>
                                            <option value="1.0%">1.0% (Flexible)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-2">Gas Priority Fee</label>
                                        <input
                                            type="text"
                                            value={config.gasPriority}
                                            onChange={(e) => handleConfigChange('gasPriority', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-2">Mempool Protection</label>
                                        <div className="flex items-center h-10 space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={config.privateRpc}
                                                onChange={(e) => handleConfigChange('privateRpc', e.target.checked)}
                                                className="h-4 w-4 rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-cyan-500"
                                            />
                                            <span className="text-xs text-slate-300">Use Private RPC / Flashbots</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                    </div>

                    {/* Right Column: Capital Allocation & Summary Card */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sticky top-24 space-y-6 shadow-xl">
                            <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-4">Capital Allocation</h3>

                            {/* Capital Input */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-medium text-slate-400">Total Bot Capital ($)</label>
                                    <span className="text-xs text-cyan-400 font-semibold">Min: $200</span>
                                </div>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">$</span>
                                    <input
                                        type="number"
                                        min="200"
                                        value={fundAmount}
                                        onChange={(e) => setFundAmount(Number(e.target.value))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                                {fundAmount < 200 && (
                                    <p className="text-xs text-rose-400 mt-1.5 flex items-center space-x-1">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        <span>Amount must be at least $200</span>
                                    </p>
                                )}
                            </div>

                            {/* Fund Percentage Slider */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-medium text-slate-400">Funds Allocation Limit</label>
                                    <span className="text-xs text-white font-semibold">{allocationPercent}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    step="5"
                                    value={allocationPercent}
                                    onChange={(e) => setAllocationPercent(Number(e.target.value))}
                                    className="w-full accent-cyan-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                                    <span>10% (Conservative)</span>
                                    <span>100% (Full Balance)</span>
                                </div>
                            </div>

                            {/* Summary Breakdown Box */}
                            <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 space-y-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Active Module:</span>
                                    <span className="text-white font-semibold uppercase">{selectedAsset} Bot</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Allocated Amount:</span>
                                    <span className="text-cyan-400 font-semibold">${(fundAmount * (allocationPercent / 100)).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Execution Status:</span>
                                    <span className="text-emerald-400 font-semibold">Ready to Initialize</span>
                                </div>
                            </div>

                            {/* Error / Success Alerts */}
                            {error && (
                                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center space-x-2">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {successMessage && (
                                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center space-x-2">
                                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                                    <span>{successMessage}</span>
                                </div>
                            )}

                            {/* Action Button */}
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-cyan-500/20 transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer"
                            >
                                <span>Deploy {selectedAsset.toUpperCase()} Strategy</span>
                                <Zap className="h-4 w-4 fill-current" />
                            </button>

                            <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-500 pt-1">
                                <Lock className="h-3 w-3" />
                                <span>Encrypted API & Non-Custodial Connection</span>
                            </div>
                        </div>
                    </div>

                </form>
            </main>
        </div>
    );
}