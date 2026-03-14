const { ethers } = require('ethers');
const QueueEntry = require('../models/QueueEntry');
const SwapRequest = require('../models/SwapRequest');

const ABI = require('../contracts/QueueSwapABI.json');

let provider = null;
let contract = null;
let pollInterval = null;
let lastBlock = 0;

const POLL_INTERVAL_MS = 15000; // Poll every 15 seconds

/**
 * Initialize the blockchain listener using polling (getLogs).
 * Public RPCs don't support eth_getFilterChanges, so we poll instead.
 */
function startListener() {
    const rpcUrl = process.env.POLYGON_AMOY_RPC || 'https://rpc-amoy.polygon.technology';
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!contractAddress) {
        console.warn('[BLOCKCHAIN] CONTRACT_ADDRESS not set in .env — skipping listener');
        return;
    }

    try {
        provider = new ethers.JsonRpcProvider(rpcUrl);
        contract = new ethers.Contract(contractAddress, ABI, provider);

        console.log(`[BLOCKCHAIN] Listening for events on contract: ${contractAddress}`);
        console.log(`[BLOCKCHAIN] RPC: ${rpcUrl}`);
        console.log(`[BLOCKCHAIN] Mode: Polling every ${POLL_INTERVAL_MS / 1000}s`);

        // Get the current block to start from
        provider.getBlockNumber().then(blockNum => {
            lastBlock = blockNum;
            console.log(`[BLOCKCHAIN] Starting from block: ${lastBlock}`);

            // Start polling
            pollInterval = setInterval(() => pollForEvents(), POLL_INTERVAL_MS);
        }).catch(err => {
            console.error('[BLOCKCHAIN] Failed to get block number:', err.message);
        });

    } catch (err) {
        console.error('[BLOCKCHAIN] Failed to start listener:', err);
    }
}

/**
 * Poll for new events since lastBlock
 */
async function pollForEvents() {
    try {
        const currentBlock = await provider.getBlockNumber();

        if (currentBlock <= lastBlock) return;

        const fromBlock = lastBlock + 1;
        const toBlock = currentBlock;

        // Query SwapCreated events
        try {
            const createdEvents = await contract.queryFilter('SwapCreated', fromBlock, toBlock);
            for (const event of createdEvents) {
                await handleSwapCreated(event);
            }
        } catch (err) {
            console.error('[BLOCKCHAIN] Error querying SwapCreated:', err.message);
        }

        // Query SwapCompleted events
        try {
            const completedEvents = await contract.queryFilter('SwapCompleted', fromBlock, toBlock);
            for (const event of completedEvents) {
                await handleSwapCompleted(event);
            }
        } catch (err) {
            console.error('[BLOCKCHAIN] Error querying SwapCompleted:', err.message);
        }

        lastBlock = toBlock;
    } catch (err) {
        console.error('[BLOCKCHAIN] Polling error:', err.message);
    }
}

/**
 * Handle a SwapCreated event
 */
async function handleSwapCreated(event) {
    try {
        const offerId = event.args[0];
        const offerer = event.args[1];
        const queuePosition = event.args[2];
        const price = event.args[3];
        const txHash = event.transactionHash;

        console.log(`[BLOCKCHAIN] SwapCreated event:`);
        console.log(`  offerId: ${offerId.toString()}, offerer: ${offerer}`);
        console.log(`  position: ${queuePosition.toString()}, price: ${ethers.formatEther(price)} POL`);

        // Find the queue entry by wallet address
        const queueEntry = await QueueEntry.findOne({
            walletAddress: offerer.toLowerCase(),
            status: 'Waiting'
        });

        if (queueEntry) {
            const existing = await SwapRequest.findOne({ onChainOfferId: Number(offerId) });
            if (!existing) {
                const swapRequest = new SwapRequest({
                    businessId: queueEntry.businessId,
                    requesterUniqueId: queueEntry.uniqueId,
                    requesterTokenNumber: queueEntry.tokenNumber,
                    requesterName: queueEntry.userName,
                    status: 'Pending',
                    onChainOfferId: Number(offerId),
                    priceOffered: price.toString(),
                    txHash: txHash,
                    blockchainStatus: 'OnChain',
                    requesterWallet: offerer.toLowerCase()
                });
                await swapRequest.save();
                console.log(`[BLOCKCHAIN] SwapRequest created: ${swapRequest._id}`);
            }
        } else {
            console.log(`[BLOCKCHAIN] No queue entry found for wallet: ${offerer}`);
        }
    } catch (err) {
        console.error('[BLOCKCHAIN] Error processing SwapCreated:', err);
    }
}

/**
 * Handle a SwapCompleted event
 */
async function handleSwapCompleted(event) {
    try {
        const offerId = event.args[0];
        const offerer = event.args[1];
        const accepter = event.args[2];

        console.log(`[BLOCKCHAIN] SwapCompleted event:`);
        console.log(`  offerId: ${offerId.toString()}, offerer: ${offerer}, accepter: ${accepter}`);

        const swapRequest = await SwapRequest.findOne({
            onChainOfferId: Number(offerId),
            status: 'Pending'
        });

        if (!swapRequest) {
            console.log(`[BLOCKCHAIN] No pending SwapRequest for offerId: ${offerId}`);
            return;
        }

        // Find both queue entries by wallet address (case insensitive)
        const offererEntry = await QueueEntry.findOne({
            walletAddress: { $regex: new RegExp(`^${offerer}$`, 'i') },
            status: 'Waiting'
        });

        const accepterEntry = await QueueEntry.findOne({
            walletAddress: { $regex: new RegExp(`^${accepter}$`, 'i') },
            status: 'Waiting'
        });

        // Store original token number before swapping
        let originalAccepterToken = null;
        if (accepterEntry) {
            originalAccepterToken = accepterEntry.tokenNumber;
        }

        if (offererEntry && accepterEntry) {
            const tempToken = offererEntry.tokenNumber;
            offererEntry.tokenNumber = accepterEntry.tokenNumber;
            accepterEntry.tokenNumber = tempToken;

            await offererEntry.save();
            await accepterEntry.save();

            console.log(`[BLOCKCHAIN] Tokens swapped: ${offererEntry.userName} (#${offererEntry.tokenNumber}) <-> ${accepterEntry.userName} (#${accepterEntry.tokenNumber})`);
        } else {
            console.log(`[BLOCKCHAIN] Could not find both queue entries for swap`);
        }

        // Update SwapRequest
        swapRequest.status = 'Accepted';
        swapRequest.blockchainStatus = 'Completed';
        swapRequest.accepterWallet = accepter.toLowerCase();
        if (accepterEntry) {
            swapRequest.acceptedByUniqueId = accepterEntry.uniqueId;
            swapRequest.acceptedByTokenNumber = originalAccepterToken; // Original token number
            swapRequest.acceptedByName = accepterEntry.userName;
        }
        await swapRequest.save();

        console.log(`[BLOCKCHAIN] SwapRequest ${swapRequest._id} marked Completed`);
    } catch (err) {
        console.error('[BLOCKCHAIN] Error processing SwapCompleted:', err);
    }
}

/**
 * Stop polling and cleanup.
 */
function stopListener() {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
        console.log('[BLOCKCHAIN] Polling stopped');
    }
}

module.exports = { startListener, stopListener };
