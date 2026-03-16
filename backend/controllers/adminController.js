const User = require('../models/User');
const Business = require('../models/Business');
const QueueEntry = require('../models/QueueEntry');
const SwapRequest = require('../models/SwapRequest');

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
