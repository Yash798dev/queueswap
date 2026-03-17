const User = require('../models/User');
const Business = require('../models/Business');
const QueueEntry = require('../models/QueueEntry');
const SwapRequest = require('../models/SwapRequest');
const Transaction = require('../models/Transaction');

exports.getAnalytics = async (req, res) => {
    try {
        console.log('[DEBUG] Fetching admin analytics');

        // Total Users & Owners
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalOwners = await User.countDocuments({ role: 'owner' });

        // Total Businesses (Approved vs Pending)
        const approvedBusinesses = await Business.countDocuments({ status: 'Approved' });
        const pendingBusinessesCount = await Business.countDocuments({ status: 'Pending' });

        // Swaps data
        const totalSwapsCompleted = await SwapRequest.countDocuments({ status: 'Accepted' });
        const totalSwapsRequested = await SwapRequest.countDocuments();

        // Queue entries (Served vs Waiting)
        const totalServed = await QueueEntry.countDocuments({ status: 'Served' });
        const totalWaiting = await QueueEntry.countDocuments({ status: 'Waiting' });

        // Build business-wise statistics
        const businesses = await Business.find({ status: 'Approved' }).populate('userId', 'name email');
        const businessStats = [];

        for (const business of businesses) {
            const currentlyWaiting = await QueueEntry.countDocuments({ businessId: business._id, status: 'Waiting' });
            const totalServedBusiness = await QueueEntry.countDocuments({ businessId: business._id, status: 'Served' });
            const swapsCompletedBusiness = await SwapRequest.countDocuments({ businessId: business._id, status: 'Accepted' });

            businessStats.push({
                _id: business._id,
                name: business.name,
                category: business.category,
                location: business.location,
                ownerName: business.userId?.name || 'Unknown',
                ownerEmail: business.userId?.email || 'Unknown',
                currentlyWaiting,
                totalServed: totalServedBusiness,
                swapsCompleted: swapsCompletedBusiness
            });
        }

        // Send aggregated response
        res.json({
            platform: {
                users: totalUsers,
                owners: totalOwners,
                approvedBusinesses,
                pendingBusinesses: pendingBusinessesCount,
                swapsCompleted: totalSwapsCompleted,
                swapsRequested: totalSwapsRequested,
                totalServed,
                totalWaiting
            },
            businessStats
        });

    } catch (error) {
        console.error('[ERROR] fetching admin analytics', error);
        res.status(500).json({ message: 'Error fetching analytics', error: error.message });
    }
};

exports.getDetailedStats = async (req, res) => {
    try {
        const { type } = req.params;
        let data = [];

        switch (type) {
            case 'users':
                // Fetch all users and owners
                data = await User.find({}, '-password').sort({ createdAt: -1 });
                break;
            case 'businesses':
                // Fetch all businesses
                data = await Business.find().populate('userId', 'name email').sort({ createdAt: -1 });
                break;
            case 'swaps':
                // Fetch completed swaps
                data = await SwapRequest.find({ status: 'Accepted' })
                    .populate('businessId', 'name')
                    .sort({ createdAt: -1 });
                break;
            case 'queue':
                // Fetch all queue entries (Served)
                data = await QueueEntry.find({ status: 'Served' })
                    .populate('businessId', 'name')
                    .sort({ createdAt: -1 });
                break;
            default:
                return res.status(400).json({ message: 'Invalid stats type requested' });
        }

        res.json(data);
    } catch (error) {
        console.error(`[ERROR] fetching detailed stats for ${req.params?.type}`, error);
        res.status(500).json({ message: 'Error fetching detailed stats', error: error.message });
    }
};

// Revenue & Transaction Analytics
exports.getRevenueAnalytics = async (req, res) => {
    try {
        const transactions = await Transaction.find()
            .sort({ createdAt: -1 })
            .lean();

        const totalRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
        const totalPlatformEarnings = transactions.reduce((sum, t) => sum + t.platformFee, 0);
        const totalPayouts = transactions.reduce((sum, t) => sum + t.receiverAmount, 0);

        // Business-wise breakdown
        const businessMap = {};
        transactions.forEach(t => {
            if (!businessMap[t.businessName]) {
                businessMap[t.businessName] = {
                    businessName: t.businessName,
                    businessId: t.businessId,
                    totalTransactions: 0,
                    totalRevenue: 0,
                    platformEarnings: 0,
                    payouts: 0
                };
            }
            businessMap[t.businessName].totalTransactions++;
            businessMap[t.businessName].totalRevenue += t.totalAmount;
            businessMap[t.businessName].platformEarnings += t.platformFee;
            businessMap[t.businessName].payouts += t.receiverAmount;
        });

        res.json({
            summary: {
                totalTransactions: transactions.length,
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                totalPlatformEarnings: Math.round(totalPlatformEarnings * 100) / 100,
                totalPayouts: Math.round(totalPayouts * 100) / 100,
                platformFeePercent: 5
            },
            businessBreakdown: Object.values(businessMap),
            transactions: transactions.map(t => ({
                _id: t._id,
                businessName: t.businessName,
                payerName: t.payerName,
                payerTokenBefore: t.payerTokenBefore,
                payerTokenAfter: t.payerTokenAfter,
                receiverName: t.receiverName,
                receiverTokenBefore: t.receiverTokenBefore,
                receiverTokenAfter: t.receiverTokenAfter,
                totalAmount: t.totalAmount,
                platformFee: t.platformFee,
                receiverAmount: t.receiverAmount,
                createdAt: t.createdAt
            }))
        });
    } catch (error) {
        console.error('[ERROR] Revenue analytics:', error);
        res.status(500).json({ message: 'Error fetching revenue analytics', error: error.message });
    }
};
