const Business = require('../models/Business');
const User = require('../models/User');
const QueueEntry = require('../models/QueueEntry');
const SwapRequest = require('../models/SwapRequest');
const emailService = require('../services/emailService');
const qrService = require('../services/qrService');
const crypto = require('crypto');

exports.submitBusiness = async (req, res) => {
    try {
        console.log('[BusinessController] Received submission request:', req.body);
        const { userId, name, category, location, mobile } = req.body;

        const newBusiness = new Business({
            userId,
            name,
            category,
            location,
            mobile
        });

        await newBusiness.save();
        res.status(201).json({ message: 'Business details submitted successfully. Status: Pending Approval.' });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting business details', error: error.message });
    }
};

exports.getPendingBusinesses = async (req, res) => {
    try {
        console.log('[DEBUG] GET /api/business/pending called');
        const businesses = await Business.find({ status: 'Pending' }).populate('userId', 'name email');
        console.log(`[DEBUG] Found ${businesses.length} pending businesses`);
        res.json(businesses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pending businesses', error: error.message });
    }
};

exports.getBusinessByOwner = async (req, res) => {
    try {
        const { userId } = req.params;
        const business = await Business.findOne({ userId });
        if (!business) {
            return res.status(404).json({ message: 'Business not found' });
        }
        res.json(business);
    } catch (error) {
        console.error('[ERROR] Error fetching business by owner:', error);
        res.status(500).json({ message: 'Error fetching business', error: error.message });
    }
};


exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'Approved' or 'Rejected'

        const business = await Business.findById(id).populate('userId', 'email');
        if (!business) {
            return res.status(404).json({ message: 'Business not found' });
        }

        business.status = status;

        if (status === 'Approved') {
            // Generate QR Code
            const qrCodeDataURL = await qrService.generateBusinessQRCode(business);
            business.qrCode = qrCodeDataURL;

            // Update user role to "owner"
            await User.findByIdAndUpdate(
                business.userId._id,
                { role: 'owner' }
            );
            console.log(`[DEBUG] User ${business.userId._id} role updated to "owner"`);

            await business.save();
            emailService.sendApprovalEmail(business.userId.email, business.name, qrCodeDataURL).catch(err => console.error('Error sending approval email asynchronously:', err));
        } else {
            await business.save();
            if (status === 'Rejected') {
                emailService.sendRejectionEmail(business.userId.email, business.name).catch(err => console.error('Error sending rejection email asynchronously:', err));
            }
        }

        res.json({ message: `Business status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ message: 'Error updating status', error: error.message });
    }
};

exports.joinQueue = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone } = req.body;

        console.log(`[DEBUG] Join Queue request for Business ID: ${id}`);
        console.log(`[DEBUG] User details - Name: ${name}, Phone: ${phone}`);
        console.log(`[DEBUG] From IP: ${req.ip}`);

        // Validate user details
        if (!name || !phone) {
            return res.status(400).json({ message: 'Name and phone number are required' });
        }

        const business = await Business.findOneAndUpdate(
            { _id: id, status: 'Approved' }, // Only allow if Approved
            { $inc: { queue: 1 } }, // Increment queue count
            { new: true } // Return updated document
        );

        if (!business) {
            return res.status(404).json({ message: 'Business not found or not approved' });
        }

        // Generate unique ID
        const uniqueId = crypto.randomBytes(8).toString('hex');

        // Create queue entry
        const queueEntry = new QueueEntry({
            businessId: business._id,
            tokenNumber: business.queue,
            userName: name,
            userPhone: phone,
            uniqueId: uniqueId
        });

        await queueEntry.save();
        console.log(`[DEBUG] Queue entry created with ID: ${uniqueId}`);

        res.json({
            message: 'Joined queue successfully',
            token: business.queue,
            businessName: business.name,
            location: business.location,
            uniqueId: uniqueId
        });
    } catch (error) {
        console.error('[ERROR] Error joining queue:', error);
        res.status(500).json({ message: 'Error joining queue', error: error.message });
    }
};

// Update queue entry status (mark as served)
exports.updateQueueEntry = async (req, res) => {
    try {
        const { uniqueId, status } = req.body;

        console.log(`[DEBUG] Update queue entry request - Unique ID: ${uniqueId}, Status: ${status}`);

        // Validate input
        if (!uniqueId || !status) {
            return res.status(400).json({ message: 'Unique ID and status are required' });
        }

        // Find the queue entry
        const queueEntry = await QueueEntry.findOne({ uniqueId });

        if (!queueEntry) {
            return res.status(404).json({ message: 'Queue entry not found' });
        }

        // Check if already served
        if (queueEntry.status === 'Served') {
            return res.status(400).json({ message: 'This customer has already been served' });
        }

        // Update queue entry status
        queueEntry.status = status;
        await queueEntry.save();

        // If marking as served, decrement the business queue count
        if (status === 'Served') {
            await Business.findByIdAndUpdate(
                queueEntry.businessId,
                { $inc: { queue: -1 } }
            );
        }

        console.log(`[DEBUG] Queue entry updated successfully - ID: ${uniqueId}`);

        res.json({
            message: 'Queue entry updated successfully',
            queueEntry: {
                tokenNumber: queueEntry.tokenNumber,
                userName: queueEntry.userName,
                userPhone: queueEntry.userPhone,
                status: queueEntry.status
            }
        });
    } catch (error) {
        console.error('[ERROR] Error updating queue entry:', error);
        res.status(500).json({ message: 'Error updating queue entry', error: error.message });
    }
};

// Get all queue entries for a business
exports.getQueueEntries = async (req, res) => {
    try {
        const { businessId } = req.params;

        console.log(`[DEBUG] Fetching queue entries for business: ${businessId}`);

        // Find all queue entries with status "Waiting"
        const queueEntries = await QueueEntry.find({
            businessId: businessId,
            status: 'Waiting'
        }).sort({ tokenNumber: 1 }); // Sort by token number ascending

        console.log(`[DEBUG] Found ${queueEntries.length} queue entries`);

        res.json({
            totalInQueue: queueEntries.length,
            queueEntries: queueEntries.map(entry => ({
                tokenNumber: entry.tokenNumber,
                userName: entry.userName,
                userPhone: entry.userPhone,
                uniqueId: entry.uniqueId,
                createdAt: entry.createdAt
            }))
        });
    } catch (error) {
        console.error('[ERROR] Error fetching queue entries:', error);
        res.status(500).json({ message: 'Error fetching queue entries', error: error.message });
    }
};

// ==================== ANALYTICS ENDPOINTS ====================

// Get Dashboard Analytics for a specific business
exports.getBusinessAnalytics = async (req, res) => {
    try {
        const { id } = req.params; // businessId

        console.log(`[DEBUG] Fetching analytics for business: ${id}`);

        // 1. Queue Statistics
        const currentlyWaiting = await QueueEntry.countDocuments({ businessId: id, status: 'Waiting' });
        const totalServed = await QueueEntry.countDocuments({ businessId: id, status: 'Served' });

        // 2. Swap Statistics
        const swapsCompleted = await SwapRequest.countDocuments({ businessId: id, status: 'Accepted' });

        // 3. Recent Activity History (Combine served customers and accepted swaps)
        // Fetch recently served customers
        const recentServed = await QueueEntry.find({ businessId: id, status: 'Served' })
            .sort({ updatedAt: -1 })
            .limit(20)
            .lean();

        // Fetch recent completed swaps
        const recentSwaps = await SwapRequest.find({ businessId: id, status: 'Accepted' })
            .sort({ updatedAt: -1 })
            .limit(20)
            .lean();

        // Format activity log for the frontend table
        const activityLog = [];

        recentServed.forEach(entry => {
            activityLog.push({
                type: 'served',
                title: 'Customer Served',
                description: `${entry.userName} (Token #${entry.tokenNumber}) completed their queue placement.`,
                timestamp: entry.updatedAt,
                phone: entry.userPhone,
                tokenNumber: entry.tokenNumber
            });
        });

        recentSwaps.forEach(swap => {
            activityLog.push({
                type: 'swap',
                title: 'Successful Swap',
                description: `${swap.requesterName} (Token #${swap.requesterTokenNumber}) swapped with ${swap.acceptedByName} (Token #${swap.acceptedByTokenNumber}).`,
                timestamp: swap.updatedAt,
                tokenNumber: swap.requesterTokenNumber
            });
        });

        // Sort combined activity by newest first
        activityLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // 4. Time-series data for the graph (Mocking last 7 days of activity)
        // In a real production app, this would be an aggregation pipeline grouping by $dayOfYear on the createdAt timestamp
        // For right now, we will return the raw counts and let the frontend format it or mock the previous days.

        const analyticsData = {
            overview: {
                currentlyWaiting,
                totalServed,
                swapsCompleted
            },
            recentActivity: activityLog.slice(0, 30) // Take top 30 mixed events
        };

        res.json(analyticsData);

    } catch (error) {
        console.error('[ERROR] Error fetching business analytics:', error);
        res.status(500).json({ message: 'Error fetching business analytics', error: error.message });
    }
};

// ==================== SWAP ENDPOINTS ====================

// Request a swap — creates a pending swap request, cancelling any prior ones
exports.requestSwap = async (req, res) => {
    try {
        const { id } = req.params; // businessId
        const { uniqueId } = req.body;

        console.log(`[SWAP] Swap request from uniqueId: ${uniqueId} for business: ${id}`);

        if (!uniqueId) {
            return res.status(400).json({ message: 'uniqueId is required' });
        }

        // Verify the requester is in the queue
        const requester = await QueueEntry.findOne({ businessId: id, uniqueId, status: 'Waiting' });
        if (!requester) {
            return res.status(404).json({ message: 'You are not in this queue or have already been served' });
        }

        // Cancel any prior pending swap requests from this user
        await SwapRequest.updateMany(
            { businessId: id, requesterUniqueId: uniqueId, status: 'Pending' },
            { status: 'Cancelled' }
        );

        // Create new swap request
        const swapRequest = new SwapRequest({
            businessId: id,
            requesterUniqueId: uniqueId,
            requesterTokenNumber: requester.tokenNumber,
            requesterName: requester.userName
        });

        await swapRequest.save();
        console.log(`[SWAP] Swap request created: ${swapRequest._id}`);

        res.json({
            message: 'Swap request created',
            swapId: swapRequest._id,
            tokenNumber: requester.tokenNumber,
            userName: requester.userName
        });
    } catch (error) {
        console.error('[ERROR] Error creating swap request:', error);
        res.status(500).json({ message: 'Error creating swap request', error: error.message });
    }
};

// Get pending swap requests for a business queue (excluding the requesting user's own)
exports.getPendingSwaps = async (req, res) => {
    try {
        const { id } = req.params; // businessId
        const excludeUniqueId = req.query.excludeUniqueId || '';

        const swaps = await SwapRequest.find({
            businessId: id,
            status: 'Pending',
            requesterUniqueId: { $ne: excludeUniqueId },
            blockchainStatus: { $ne: 'OnChain' } // Exclude blockchain swaps — they appear via the blockchain endpoint
        }).sort({ createdAt: -1 });

        res.json({
            pendingSwaps: swaps.map(s => ({
                swapId: s._id,
                requesterName: s.requesterName,
                requesterTokenNumber: s.requesterTokenNumber,
                requesterUniqueId: s.requesterUniqueId,
                createdAt: s.createdAt
            }))
        });
    } catch (error) {
        console.error('[ERROR] Error fetching pending swaps:', error);
        res.status(500).json({ message: 'Error fetching pending swaps', error: error.message });
    }
};

// Accept a swap — atomically exchange token numbers between two queue entries
exports.acceptSwap = async (req, res) => {
    try {
        const { swapId, accepterUniqueId } = req.body;

        console.log(`[SWAP] Accept swap: ${swapId} by ${accepterUniqueId}`);

        if (!swapId || !accepterUniqueId) {
            return res.status(400).json({ message: 'swapId and accepterUniqueId are required' });
        }

        // Find the swap request
        const swapRequest = await SwapRequest.findById(swapId);
        if (!swapRequest || swapRequest.status !== 'Pending') {
            return res.status(404).json({ message: 'Swap request not found or already processed' });
        }

        // Prevent self-accept
        if (swapRequest.requesterUniqueId === accepterUniqueId) {
            return res.status(400).json({ message: 'You cannot accept your own swap request' });
        }

        // Find both queue entries
        const requesterEntry = await QueueEntry.findOne({
            businessId: swapRequest.businessId,
            uniqueId: swapRequest.requesterUniqueId,
            status: 'Waiting'
        });

        const accepterEntry = await QueueEntry.findOne({
            businessId: swapRequest.businessId,
            uniqueId: accepterUniqueId,
            status: 'Waiting'
        });

        if (!requesterEntry || !accepterEntry) {
            return res.status(400).json({ message: 'One or both users are no longer in the queue' });
        }

        // Capture original token before swap
        const originalAccepterToken = accepterEntry.tokenNumber;

        // Swap token numbers
        const tempToken = requesterEntry.tokenNumber;
        requesterEntry.tokenNumber = accepterEntry.tokenNumber;
        accepterEntry.tokenNumber = tempToken;

        await requesterEntry.save();
        await accepterEntry.save();

        // Update swap request
        swapRequest.status = 'Accepted';
        swapRequest.acceptedByUniqueId = accepterUniqueId;
        swapRequest.acceptedByTokenNumber = originalAccepterToken; // Their original token
        swapRequest.acceptedByName = accepterEntry.userName;
        // Save accepter wallet if available
        if (accepterEntry.walletAddress) {
            swapRequest.accepterWallet = accepterEntry.walletAddress.toLowerCase();
        }
        // If this was a blockchain swap, mark as completed
        if (swapRequest.blockchainStatus === 'OnChain') {
            swapRequest.blockchainStatus = 'Completed';
        }
        await swapRequest.save();

        console.log(`[SWAP] Swap completed! ${swapRequest.requesterName} (#${accepterEntry.tokenNumber}) <-> ${accepterEntry.userName} (#${requesterEntry.tokenNumber})`);

        res.json({
            message: 'Swap successful!',
            requester: {
                uniqueId: requesterEntry.uniqueId,
                newTokenNumber: requesterEntry.tokenNumber,
                name: requesterEntry.userName
            },
            accepter: {
                uniqueId: accepterEntry.uniqueId,
                newTokenNumber: accepterEntry.tokenNumber,
                name: accepterEntry.userName
            }
        });
    } catch (error) {
        console.error('[ERROR] Error accepting swap:', error);
        res.status(500).json({ message: 'Error accepting swap', error: error.message });
    }
};

// Decline a swap request
exports.declineSwap = async (req, res) => {
    try {
        const { swapId } = req.body;

        console.log(`[SWAP] Decline swap: ${swapId}`);

        if (!swapId) {
            return res.status(400).json({ message: 'swapId is required' });
        }

        const swapRequest = await SwapRequest.findById(swapId);
        if (!swapRequest || swapRequest.status !== 'Pending') {
            return res.status(404).json({ message: 'Swap request not found or already processed' });
        }

        swapRequest.status = 'Declined';
        await swapRequest.save();

        res.json({ message: 'Swap request declined' });
    } catch (error) {
        console.error('[ERROR] Error declining swap:', error);
        res.status(500).json({ message: 'Error declining swap', error: error.message });
    }
};

// Get swap status (for requester to poll whether their swap was accepted/declined)
exports.getSwapStatus = async (req, res) => {
    try {
        const { swapId } = req.params;

        const swapRequest = await SwapRequest.findById(swapId);
        if (!swapRequest) {
            return res.status(404).json({ message: 'Swap request not found' });
        }

        res.json({
            swapId: swapRequest._id,
            status: swapRequest.status,
            acceptedByName: swapRequest.acceptedByName || null,
            acceptedByTokenNumber: swapRequest.acceptedByTokenNumber || null
        });
    } catch (error) {
        console.error('[ERROR] Error getting swap status:', error);
        res.status(500).json({ message: 'Error getting swap status', error: error.message });
    }
};

// ==================== BLOCKCHAIN SWAP ENDPOINTS ====================

// Connect wallet — link a wallet address to a queue entry
exports.connectWallet = async (req, res) => {
    try {
        const { uniqueId, walletAddress } = req.body;

        console.log(`[BLOCKCHAIN] Connect wallet: ${walletAddress} for uniqueId: ${uniqueId}`);

        if (!uniqueId || !walletAddress) {
            return res.status(400).json({ message: 'uniqueId and walletAddress are required' });
        }

        const queueEntry = await QueueEntry.findOne({ uniqueId, status: 'Waiting' });
        if (!queueEntry) {
            return res.status(404).json({ message: 'Queue entry not found' });
        }

        queueEntry.walletAddress = walletAddress.toLowerCase();
        await queueEntry.save();

        console.log(`[BLOCKCHAIN] Wallet ${walletAddress} linked to queue entry ${uniqueId}`);

        res.json({
            message: 'Wallet connected successfully',
            walletAddress: queueEntry.walletAddress
        });
    } catch (error) {
        console.error('[ERROR] Error connecting wallet:', error);
        res.status(500).json({ message: 'Error connecting wallet', error: error.message });
    }
};

// Create blockchain swap — record an on-chain swap offer in the database
exports.createBlockchainSwap = async (req, res) => {
    try {
        const { id } = req.params; // businessId
        const { uniqueId, onChainOfferId, priceOffered, txHash, walletAddress } = req.body;

        console.log(`[BLOCKCHAIN] Create blockchain swap for business: ${id}`);

        if (!uniqueId || onChainOfferId === undefined || !priceOffered || !txHash) {
            return res.status(400).json({ message: 'uniqueId, onChainOfferId, priceOffered, and txHash are required' });
        }

        // Find the queue entry
        const queueEntry = await QueueEntry.findOne({ businessId: id, uniqueId, status: 'Waiting' });
        if (!queueEntry) {
            return res.status(404).json({ message: 'Queue entry not found' });
        }

        // Cancel any prior pending swap requests from this user
        await SwapRequest.updateMany(
            { businessId: id, requesterUniqueId: uniqueId, status: 'Pending' },
            { status: 'Cancelled' }
        );

        // Create new swap request with blockchain info
        const swapRequest = new SwapRequest({
            businessId: id,
            requesterUniqueId: uniqueId,
            requesterTokenNumber: queueEntry.tokenNumber,
            requesterName: queueEntry.userName,
            status: 'Pending',
            onChainOfferId: Number(onChainOfferId),
            priceOffered: priceOffered,
            txHash: txHash,
            blockchainStatus: 'OnChain',
            requesterWallet: (walletAddress || '').toLowerCase()
        });

        await swapRequest.save();
        console.log(`[BLOCKCHAIN] Swap request created: ${swapRequest._id} (offerId: ${onChainOfferId})`);

        res.json({
            message: 'Blockchain swap offer recorded',
            swapId: swapRequest._id,
            onChainOfferId: swapRequest.onChainOfferId
        });
    } catch (error) {
        console.error('[ERROR] Error creating blockchain swap:', error);
        res.status(500).json({ message: 'Error creating blockchain swap', error: error.message });
    }
};

// Get pending blockchain swaps with price info
exports.getBlockchainPendingSwaps = async (req, res) => {
    try {
        const { id } = req.params; // businessId
        const excludeUniqueId = req.query.excludeUniqueId || '';

        const swaps = await SwapRequest.find({
            businessId: id,
            status: 'Pending',
            blockchainStatus: 'OnChain',
            requesterUniqueId: { $ne: excludeUniqueId }
        }).sort({ createdAt: -1 });

        res.json({
            pendingSwaps: swaps.map(s => ({
                swapId: s._id,
                requesterName: s.requesterName,
                requesterTokenNumber: s.requesterTokenNumber,
                requesterUniqueId: s.requesterUniqueId,
                onChainOfferId: s.onChainOfferId,
                priceOffered: s.priceOffered,
                txHash: s.txHash,
                createdAt: s.createdAt
            }))
        });
    } catch (error) {
        console.error('[ERROR] Error fetching blockchain pending swaps:', error);
        res.status(500).json({ message: 'Error fetching blockchain pending swaps', error: error.message });
    }
};
