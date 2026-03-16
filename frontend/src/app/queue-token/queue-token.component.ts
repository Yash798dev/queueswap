import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { timeout } from 'rxjs/operators';
import { BlockchainService } from '../services/blockchain.service';

@Component({
    selector: 'app-queue-token',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './queue-token.component.html',
    styleUrls: ['./queue-token.component.css']
})
export class QueueTokenComponent implements OnInit, OnDestroy {
    businessId: string | null = null;
    token: number | null = null;
    businessName: string | null = null;
    uniqueId: string | null = null;
    isLoading: boolean = false;
    error: string | null = null;
    showForm: boolean = true;

    // User details form
    userName: string = '';
    userPhone: string = '';

    // Queue details
    queueDetails: any[] = [];
    totalInQueue: number = 0;
    showQueueDetails: boolean = false;

    // Swap state
    swapRequested: boolean = false;
    swapPending: boolean = false;
    swapId: string | null = null;
    swapMessage: string | null = null;
    swapMessageType: 'success' | 'error' | 'info' = 'info';
    incomingSwaps: any[] = [];

    // Blockchain state
    walletConnected: boolean = false;
    walletAddress: string | null = null;
    walletConnecting: boolean = false;
    swapPrice: string = '0.01'; // Default price in POL
    txPending: boolean = false;
    txHash: string | null = null;
    hasMetaMask: boolean = false;
    isMobile: boolean = false;
    metaMaskDeepLink: string = '';
    requiresMetaMaskBrowser: boolean = false;

    private swapPollInterval: any = null;
    private swapStatusPollInterval: any = null;
    private queuePollInterval: any = null;

    constructor(
        private route: ActivatedRoute,
        private http: HttpClient,
        private cd: ChangeDetectorRef,
        private blockchain: BlockchainService
    ) { }

    ngOnInit(): void {
        console.log('[QueueTokenComponent] Component initialized');
        this.businessId = this.route.snapshot.paramMap.get('id');
        this.hasMetaMask = this.blockchain.isMetaMaskAvailable();
        this.isMobile = this.blockchain.isMobile();
        this.metaMaskDeepLink = this.blockchain.getMetaMaskDeepLink();
        this.requiresMetaMaskBrowser = this.isMobile && !this.hasMetaMask;

        if (!this.businessId) {
            this.error = 'Invalid QR Code.';
            this.showForm = false;
        } else {
            // Check for existing session in localStorage
            const savedSessionParams = localStorage.getItem(`queueSwap_${this.businessId}`);
            if (savedSessionParams) {
                try {
                    const session = JSON.parse(savedSessionParams);
                    if (session.uniqueId) {
                        this.uniqueId = session.uniqueId;
                        this.token = session.token;
                        this.businessName = session.businessName;
                        this.userName = session.userName;
                        this.showForm = false;
                        
                        console.log('[QueueToken] Restored session for UniqueID:', this.uniqueId);
                        
                        this.loadQueueDetails(this.businessId);
                        this.startSwapPolling();
                        this.startQueuePolling(this.businessId);
                    }
                } catch (e) {
                    console.error('Failed to parse saved session', e);
                    localStorage.removeItem(`queueSwap_${this.businessId}`);
                }
            }
        }
    }

    ngOnDestroy(): void {
        this.stopAllPolling();
    }

    private getApiBase(): string {
        return 'https://queueswap-production.up.railway.app/api/business';
    }

    onSubmit() {
        if (!this.userName || !this.userPhone) {
            this.error = 'Please enter your name and phone number.';
            return;
        }

        if (this.businessId) {
            this.joinQueue(this.businessId);
        }
    }

    joinQueue(id: string) {
        const apiUrl = `${this.getApiBase()}/${id}/join`;

        this.isLoading = true;
        this.error = null;

        this.http.post<any>(apiUrl, {
            name: this.userName,
            phone: this.userPhone
        }).pipe(
            timeout(10000)
        ).subscribe({
            next: (response) => {
                this.token = response.token;
                this.businessName = response.businessName;
                this.uniqueId = response.uniqueId;
                this.isLoading = false;
                this.showForm = false;

                // Save session to localStorage to persist across refreshes
                try {
                    localStorage.setItem(`queueSwap_${id}`, JSON.stringify({
                        uniqueId: this.uniqueId,
                        token: this.token,
                        businessName: this.businessName,
                        userName: this.userName
                    }));
                } catch(e) {
                    console.error('Failed to save session to localStorage', e);
                }

                this.loadQueueDetails(id);
                this.startSwapPolling();
                this.startQueuePolling(id);

                this.cd.detectChanges();
            },
            error: (err) => {
                if (err.name === 'TimeoutError') {
                    this.error = 'Request timed out. Please check your connection and try again.';
                } else {
                    this.error = err.error?.message || 'Failed to join queue. Please try again.';
                }
                this.isLoading = false;
                this.cd.detectChanges();
            }
        });
    }

    loadQueueDetails(businessId: string) {
        const apiUrl = `${this.getApiBase()}/${businessId}/queue`;

        this.http.get<any>(apiUrl).pipe(
            timeout(10000)
        ).subscribe({
            next: (response) => {
                this.queueDetails = response.queueEntries || [];
                this.totalInQueue = response.totalInQueue || 0;
                this.showQueueDetails = true;

                if (this.uniqueId) {
                    const myEntry = this.queueDetails.find(e => e.uniqueId === this.uniqueId);
                    if (myEntry) {
                        if (myEntry.tokenNumber !== this.token) {
                            this.token = myEntry.tokenNumber;
                            // Update stored token 
                            try {
                                const stored = JSON.parse(localStorage.getItem(`queueSwap_${businessId}`) || '{}');
                                stored.token = this.token;
                                localStorage.setItem(`queueSwap_${businessId}`, JSON.stringify(stored));
                            } catch(e) {}
                        }
                    } else {
                        // User is no longer in the queue (served, removed, etc)
                        // Note: Only clear if we actually loaded queue details to prevent premature clearing on network errors
                        if (response.queueEntries) {
                            console.log('[QueueToken] User not found in queue, clearing session');
                            localStorage.removeItem(`queueSwap_${businessId}`);
                            this.showForm = true;
                            this.token = null;
                            this.uniqueId = null;
                            this.stopAllPolling();
                            this.error = "Your token is no longer in the waiting list. You may have been served.";
                        }
                    }
                }

                this.cd.detectChanges();
            },
            error: () => {
                this.cd.detectChanges();
            }
        });
    }

    // ==================== WALLET METHODS ====================

    async connectWallet() {
        if (!this.hasMetaMask) {
            this.swapMessage = 'Please install MetaMask to use blockchain swap features.';
            this.swapMessageType = 'error';
            this.cd.detectChanges();
            return;
        }

        this.walletConnecting = true;
        this.cd.detectChanges();

        try {
            const address = await this.blockchain.connectWallet();
            this.walletAddress = address;
            this.walletConnected = true;
            this.walletConnecting = false;

            // Save wallet to backend
            this.http.post<any>(`${this.getApiBase()}/wallet/connect`, {
                uniqueId: this.uniqueId,
                walletAddress: address
            }).pipe(timeout(10000)).subscribe({
                next: () => console.log('[WALLET] Linked to backend'),
                error: (err) => console.error('[WALLET] Error linking:', err)
            });

            this.swapMessage = `Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`;
            this.swapMessageType = 'success';
            this.cd.detectChanges();

            setTimeout(() => {
                this.swapMessage = null;
                this.cd.detectChanges();
            }, 3000);
        } catch (err: any) {
            this.walletConnecting = false;
            this.swapMessage = err.message || 'Failed to connect wallet.';
            this.swapMessageType = 'error';
            this.cd.detectChanges();
        }
    }

    // ==================== BLOCKCHAIN SWAP METHODS ====================

    async requestSwap() {
        if (!this.businessId || !this.uniqueId || !this.token) return;

        if (!this.walletConnected) {
            this.swapMessage = 'Please connect your wallet first.';
            this.swapMessageType = 'error';
            this.cd.detectChanges();
            return;
        }

        if (!this.swapPrice || parseFloat(this.swapPrice) <= 0) {
            this.swapMessage = 'Please enter a valid price in POL.';
            this.swapMessageType = 'error';
            this.cd.detectChanges();
            return;
        }

        this.swapPending = true;
        this.txPending = true;
        this.swapMessage = 'Confirm transaction in MetaMask...';
        this.swapMessageType = 'info';
        this.cd.detectChanges();

        try {
            // 1. Call smart contract
            const result = await this.blockchain.createSwapOffer(this.token, String(this.swapPrice));

            this.txHash = result.txHash;
            this.swapMessage = 'Transaction confirmed! Recording swap offer...';
            this.cd.detectChanges();

            // 2. Record in backend
            this.http.post<any>(`${this.getApiBase()}/${this.businessId}/swap/blockchain`, {
                uniqueId: this.uniqueId,
                onChainOfferId: result.offerId,
                priceOffered: result.priceWei,
                txHash: result.txHash,
                walletAddress: this.walletAddress
            }).pipe(timeout(10000)).subscribe({
                next: (response) => {
                    this.swapRequested = true;
                    this.swapPending = false;
                    this.txPending = false;
                    this.swapId = response.swapId;
                    this.swapMessage = `Swap offer created for ${this.swapPrice} POL! Waiting for someone to accept...`;
                    this.swapMessageType = 'info';

                    this.startSwapStatusPolling();
                    this.cd.detectChanges();
                },
                error: (err) => {
                    this.swapPending = false;
                    this.txPending = false;
                    this.swapMessage = err.error?.message || 'Failed to record swap in backend.';
                    this.swapMessageType = 'error';
                    this.cd.detectChanges();
                }
            });
        } catch (err: any) {
            this.swapPending = false;
            this.txPending = false;
            if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
                this.swapMessage = 'Transaction cancelled by user.';
            } else {
                this.swapMessage = err.reason || err.message || 'Blockchain transaction failed.';
            }
            this.swapMessageType = 'error';
            this.cd.detectChanges();
        }
    }

    cancelSwap() {
        this.swapRequested = false;
        this.swapId = null;
        this.swapMessage = null;
        this.txHash = null;
        this.stopSwapStatusPolling();
        this.cd.detectChanges();
    }

    async acceptSwap(swap: any) {
        if (!this.uniqueId) return;

        if (!this.walletConnected) {
            this.swapMessage = 'Please connect your wallet first to accept this swap.';
            this.swapMessageType = 'error';
            this.cd.detectChanges();
            return;
        }

        this.txPending = true;
        this.swapMessage = 'Confirm accept transaction in MetaMask...';
        this.swapMessageType = 'info';
        this.cd.detectChanges();

        try {
            if (swap.onChainOfferId !== undefined && swap.onChainOfferId !== null) {
                // Blockchain swap — call smart contract
                const result = await this.blockchain.acceptSwapOffer(swap.onChainOfferId);

                this.txPending = false;
                this.swapMessage = 'Swap accepted on blockchain! Updating positions...';
                this.swapMessageType = 'success';

                // Immediately update the backend DB (don't rely solely on the listener)
                this.http.post<any>(`${this.getApiBase()}/swap/accept`, {
                    swapId: swap.swapId,
                    accepterUniqueId: this.uniqueId
                }).pipe(timeout(10000)).subscribe({
                    next: (response) => {
                        console.log('[SWAP] Backend updated after on-chain accept:', response);
                        // Update local token number
                        const myData = response.requester.uniqueId === this.uniqueId
                            ? response.requester
                            : response.accepter;
                        this.token = myData.newTokenNumber;

                        this.incomingSwaps = this.incomingSwaps.filter(s => s.swapId !== swap.swapId);
                        this.swapMessage = `Swap successful! Your new token is #${this.token}`;
                        this.swapMessageType = 'success';

                        if (this.businessId) {
                            this.loadQueueDetails(this.businessId);
                        }
                        this.cd.detectChanges();

                        setTimeout(() => {
                            this.swapMessage = null;
                            this.cd.detectChanges();
                        }, 5000);
                    },
                    error: (err) => {
                        console.error('[SWAP] Backend update failed:', err);
                        // Still remove the swap from UI since blockchain tx succeeded
                        this.incomingSwaps = this.incomingSwaps.filter(s => s.swapId !== swap.swapId);
                        this.swapMessage = 'Blockchain swap confirmed! Queue will update shortly.';
                        this.swapMessageType = 'success';

                        // Refresh queue after a delay (listener will catch up)
                        setTimeout(() => {
                            if (this.businessId) {
                                this.loadQueueDetails(this.businessId);
                            }
                            this.swapMessage = null;
                            this.cd.detectChanges();
                        }, 8000);
                        this.cd.detectChanges();
                    }
                });

                this.cd.detectChanges();
            } else {
                // Off-chain swap (legacy path)
                this.txPending = false;
                this.acceptSwapOffChain(swap);
            }
        } catch (err: any) {
            this.txPending = false;
            if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
                this.swapMessage = 'Transaction cancelled by user.';
            } else {
                this.swapMessage = err.reason || err.message || 'Failed to accept swap on blockchain.';
            }
            this.swapMessageType = 'error';
            this.cd.detectChanges();
        }
    }

    // Off-chain accept (backwards compatible with old swap system)
    private acceptSwapOffChain(swap: any) {
        const apiUrl = `${this.getApiBase()}/swap/accept`;

        this.http.post<any>(apiUrl, {
            swapId: swap.swapId,
            accepterUniqueId: this.uniqueId
        }).pipe(timeout(10000)).subscribe({
            next: (response) => {
                const myData = response.requester.uniqueId === this.uniqueId
                    ? response.requester
                    : response.accepter;
                this.token = myData.newTokenNumber;
                this.incomingSwaps = this.incomingSwaps.filter(s => s.swapId !== swap.swapId);
                this.swapMessage = `Swap successful! Your new token is #${this.token}`;
                this.swapMessageType = 'success';

                if (this.businessId) {
                    this.loadQueueDetails(this.businessId);
                }
                this.cd.detectChanges();

                setTimeout(() => {
                    this.swapMessage = null;
                    this.cd.detectChanges();
                }, 5000);
            },
            error: (err) => {
                this.swapMessage = err.error?.message || 'Failed to accept swap.';
                this.swapMessageType = 'error';
                this.cd.detectChanges();
            }
        });
    }

    declineSwap(swap: any) {
        const apiUrl = `${this.getApiBase()}/swap/decline`;

        this.http.post<any>(apiUrl, { swapId: swap.swapId }).pipe(
            timeout(10000)
        ).subscribe({
            next: () => {
                this.incomingSwaps = this.incomingSwaps.filter(s => s.swapId !== swap.swapId);
                this.cd.detectChanges();
            },
            error: () => { }
        });
    }

    // ==================== POLLING ====================

    private startSwapPolling() {
        if (this.swapPollInterval) return;

        this.pollIncomingSwaps();
        this.swapPollInterval = setInterval(() => {
            this.pollIncomingSwaps();
        }, 5000);
    }

    private pollIncomingSwaps() {
        if (!this.businessId || !this.uniqueId) return;

        // Poll both off-chain and blockchain pending swaps
        const offChainUrl = `${this.getApiBase()}/${this.businessId}/swap/pending?excludeUniqueId=${this.uniqueId}`;
        const blockchainUrl = `${this.getApiBase()}/${this.businessId}/swap/blockchain/pending?excludeUniqueId=${this.uniqueId}`;

        this.http.get<any>(offChainUrl).pipe(timeout(10000)).subscribe({
            next: (response) => {
                const offChainSwaps = (response.pendingSwaps || []).map((s: any) => ({
                    ...s,
                    isBlockchain: false
                }));

                this.http.get<any>(blockchainUrl).pipe(timeout(10000)).subscribe({
                    next: (bcResponse) => {
                        const blockchainSwaps = (bcResponse.pendingSwaps || []).map((s: any) => ({
                            ...s,
                            isBlockchain: true,
                            priceFormatted: this.blockchain.formatPOL(s.priceOffered)
                        }));

                        // Merge: blockchain swaps first, then off-chain
                        this.incomingSwaps = [...blockchainSwaps, ...offChainSwaps];
                        this.cd.detectChanges();
                    },
                    error: () => {
                        // If blockchain endpoint fails, just show off-chain
                        this.incomingSwaps = offChainSwaps;
                        this.cd.detectChanges();
                    }
                });
            },
            error: () => { }
        });
    }

    private startSwapStatusPolling() {
        this.stopSwapStatusPolling();

        this.swapStatusPollInterval = setInterval(() => {
            if (!this.swapId) return;

            const apiUrl = `${this.getApiBase()}/swap/${this.swapId}/status`;

            this.http.get<any>(apiUrl).pipe(timeout(10000)).subscribe({
                next: (response) => {
                    if (response.status === 'Accepted') {
                        this.swapRequested = false;
                        this.swapMessage = `Swap accepted by ${response.acceptedByName}! Refreshing your token...`;
                        this.swapMessageType = 'success';
                        this.stopSwapStatusPolling();

                        if (this.businessId) {
                            this.loadQueueDetails(this.businessId);
                        }
                        this.cd.detectChanges();

                        setTimeout(() => {
                            this.swapMessage = null;
                            this.swapId = null;
                            this.txHash = null;
                            this.cd.detectChanges();
                        }, 5000);
                    } else if (response.status === 'Declined') {
                        this.swapRequested = false;
                        this.swapMessage = 'Your swap request was declined.';
                        this.swapMessageType = 'error';
                        this.stopSwapStatusPolling();
                        this.cd.detectChanges();

                        setTimeout(() => {
                            this.swapMessage = null;
                            this.swapId = null;
                            this.txHash = null;
                            this.cd.detectChanges();
                        }, 4000);
                    }
                },
                error: () => { }
            });
        }, 3000);
    }

    private stopSwapStatusPolling() {
        if (this.swapStatusPollInterval) {
            clearInterval(this.swapStatusPollInterval);
            this.swapStatusPollInterval = null;
        }
    }

    private startQueuePolling(businessId: string) {
        if (this.queuePollInterval) return;
        this.queuePollInterval = setInterval(() => {
            this.loadQueueDetails(businessId);
        }, 8000);
    }

    private stopAllPolling() {
        if (this.swapPollInterval) {
            clearInterval(this.swapPollInterval);
            this.swapPollInterval = null;
        }
        this.stopSwapStatusPolling();
        if (this.queuePollInterval) {
            clearInterval(this.queuePollInterval);
            this.queuePollInterval = null;
        }
    }
}
