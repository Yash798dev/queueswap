import { Injectable } from '@angular/core';
import { ethers } from 'ethers';

// Polygon Amoy Testnet chain config
const AMOY_CHAIN_ID = '0x13882'; // 80002 in hex
const AMOY_CHAIN_CONFIG = {
    chainId: AMOY_CHAIN_ID,
    chainName: 'Polygon Amoy Testnet',
    nativeCurrency: {
        name: 'POL',
        symbol: 'POL',
        decimals: 18
    },
    rpcUrls: ['https://rpc-amoy.polygon.technology'],
    blockExplorerUrls: ['https://amoy.polygonscan.com/']
};

// Contract ABI (minimal — same as backend)
const CONTRACT_ABI = [
    'function createSwapOffer(uint256 queuePosition) payable returns (uint256)',
    'function acceptSwapOffer(uint256 offerId)',
    'function getSwapOffer(uint256 offerId) view returns (address offerer, uint256 queuePosition, uint256 price, bool isActive, address accepter)',
    'function offerCount() view returns (uint256)',
    'event SwapCreated(uint256 indexed offerId, address indexed offerer, uint256 queuePosition, uint256 price)',
    'event SwapCompleted(uint256 indexed offerId, address indexed offerer, address indexed accepter, uint256 offererPosition, uint256 accepterPosition)'
];

const CONTRACT_ADDRESS = '0xD49A3A6f8C71E6204A2A2E248c61CAF85c169222';

@Injectable({
    providedIn: 'root'
})
export class BlockchainService {
    private provider: ethers.BrowserProvider | null = null;
    private signer: ethers.Signer | null = null;
    private contract: ethers.Contract | null = null;
    private account: string | null = null;

    constructor() { }

    /**
     * Check if MetaMask is available (injected window.ethereum)
     */
    isMetaMaskAvailable(): boolean {
        return typeof (window as any).ethereum !== 'undefined';
    }

    /**
     * Check if user is on a mobile device
     */
    isMobile(): boolean {
        return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        );
    }

    /**
     * Check if running inside MetaMask's in-app browser
     */
    isInMetaMaskBrowser(): boolean {
        return typeof (window as any).ethereum !== 'undefined' &&
               (window as any).ethereum.isMetaMask === true;
    }

    /**
     * Get a MetaMask deep link to open the current page in MetaMask's in-app browser
     */
    getMetaMaskDeepLink(): string {
        const currentUrl = window.location.href.replace(/^https?:\/\//, '');
        return `https://metamask.app.link/dapp/${currentUrl}`;
    }

    /**
     * Connect to MetaMask wallet and switch to Amoy network
     */
    async connectWallet(): Promise<string> {
        if (!this.isMetaMaskAvailable()) {
            throw new Error('MetaMask is not installed. Please install MetaMask to use blockchain features.');
        }

        const ethereum = (window as any).ethereum;

        // Force MetaMask to show account picker (not just reuse cached account)
        await ethereum.request({
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }]
        });

        // Now get the selected account
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        this.account = accounts[0];

        // Switch to Polygon Amoy
        try {
            await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: AMOY_CHAIN_ID }]
            });
        } catch (switchError: any) {
            // Chain not added yet — add it
            if (switchError.code === 4902) {
                await ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [AMOY_CHAIN_CONFIG]
                });
            } else {
                throw switchError;
            }
        }

        // Set up ethers provider + signer
        this.provider = new ethers.BrowserProvider(ethereum);
        this.signer = await this.provider.getSigner();
        this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);

        console.log('[BlockchainService] Connected wallet:', this.account);
        return this.account!;
    }

    /**
     * Get the connected account address
     */
    getAccount(): string | null {
        return this.account;
    }

    /**
     * Create a swap offer on-chain. Sends POL as msg.value.
     * @param queuePosition The user's current queue position
     * @param priceInPOL Price in POL (e.g. "0.01")
     * @returns Transaction receipt with offerId
     */
    async createSwapOffer(queuePosition: number, priceInPOL: string): Promise<{
        txHash: string;
        offerId: string;
        priceWei: string;
    }> {
        if (!this.contract || !this.signer || !this.provider) {
            throw new Error('Wallet not connected');
        }

        const priceWei = ethers.parseEther(priceInPOL);

        console.log(`[BlockchainService] Creating swap offer: position=${queuePosition}, price=${priceInPOL} POL`);

        // Get current fee data to handle Amoy's high minimums
        const feeData = await this.provider.getFeeData();
        
        // Amoy often requires at least 25-30 Gwei for maxPriorityFeePerGas
        // We set it to 30 Gwei to be safe (30,000,000,000 wei)
        const minPriorityFee = 30000000000n; // 30 gwei
        
        // Use the network's priority fee if it's higher, otherwise use our minimum
        const priorityFee = feeData.maxPriorityFeePerGas && feeData.maxPriorityFeePerGas > minPriorityFee 
            ? feeData.maxPriorityFeePerGas 
            : minPriorityFee;
            
        // Calculate maxFeePerGas (base fee + priority fee)
        // Add a buffer to the base fee to ensure it goes through
        const baseFee = feeData.maxFeePerGas ? (feeData.maxFeePerGas - (feeData.maxPriorityFeePerGas || 0n)) : 0n;
        const maxFee = baseFee + priorityFee + 10000000000n; // Extra 10 gwei buffer

        const tx = await this.contract['createSwapOffer'](queuePosition, {
            value: priceWei,
            maxPriorityFeePerGas: priorityFee,
            maxFeePerGas: maxFee
        });

        console.log(`[BlockchainService] Transaction sent: ${tx.hash}`);

        // Wait for confirmation
        const receipt = await tx.wait();
        console.log(`[BlockchainService] Transaction confirmed in block ${receipt.blockNumber}`);

        // Extract offerId from SwapCreated event
        let offerId = '0';
        for (const log of receipt.logs) {
            try {
                const parsed = this.contract.interface.parseLog({
                    topics: log.topics as string[],
                    data: log.data
                });
                if (parsed && parsed.name === 'SwapCreated') {
                    offerId = parsed.args[0].toString();
                    break;
                }
            } catch {
                // Skip logs that don't match our ABI
            }
        }

        return {
            txHash: tx.hash,
            offerId: offerId,
            priceWei: priceWei.toString()
        };
    }

    /**
     * Accept a swap offer on-chain.
     * @param offerId The on-chain offer ID
     */
    async acceptSwapOffer(offerId: number): Promise<{ txHash: string }> {
        if (!this.contract || !this.signer || !this.provider) {
            throw new Error('Wallet not connected');
        }

        console.log(`[BlockchainService] Accepting swap offer: ${offerId}`);

        // Get current fee data to handle Amoy's high minimums
        const feeData = await this.provider.getFeeData();
        const minPriorityFee = 30000000000n; // 30 gwei
        const priorityFee = feeData.maxPriorityFeePerGas && feeData.maxPriorityFeePerGas > minPriorityFee
            ? feeData.maxPriorityFeePerGas
            : minPriorityFee;
        const baseFee = feeData.maxFeePerGas ? (feeData.maxFeePerGas - (feeData.maxPriorityFeePerGas || 0n)) : 0n;
        const maxFee = baseFee + priorityFee + 10000000000n;

        const tx = await this.contract['acceptSwapOffer'](offerId, {
            maxPriorityFeePerGas: priorityFee,
            maxFeePerGas: maxFee
        });
        console.log(`[BlockchainService] Transaction sent: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`[BlockchainService] Accept confirmed in block ${receipt.blockNumber}`);

        return { txHash: tx.hash };
    }

    /**
     * Read an offer's details from the contract
     */
    async getSwapOffer(offerId: number): Promise<{
        offerer: string;
        queuePosition: number;
        price: string;
        isActive: boolean;
        accepter: string;
    }> {
        if (!this.contract) {
            throw new Error('Wallet not connected');
        }

        const result = await this.contract['getSwapOffer'](offerId);
        return {
            offerer: result[0],
            queuePosition: Number(result[1]),
            price: ethers.formatEther(result[2]),
            isActive: result[3],
            accepter: result[4]
        };
    }

    /**
     * Format wei to POL (human readable)
     */
    formatPOL(weiValue: string): string {
        try {
            return ethers.formatEther(weiValue);
        } catch {
            return '0';
        }
    }
}
