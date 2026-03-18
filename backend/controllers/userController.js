const QueueEntry = require('../models/QueueEntry');
const Transaction = require('../models/Transaction');

exports.getUserDashboard = async (req, res) => {
    try {
        const { email } = req.params;

        // 1. Fetch Active Queues for this user
        // We look for QueueEntry documents containing this email, that are 'waiting'
        const activeQueues = await QueueEntry.find({ 
            userEmail: email,
            status: 'waiting'
        })
        .populate('businessId', 'name category location')
        .sort({ joinedAt: -1 });

        // Calculate progress for each active queue
        const activeQueuesWithProgress = await Promise.all(activeQueues.map(async (entry) => {
            // Count how many people are ahead of this token in this specific business
            const peopleAhead = await QueueEntry.countDocuments({
                businessId: entry.businessId._id,
                status: 'waiting',
                tokenNumber: { $lt: entry.tokenNumber }
            });
            
            return {
                ...entry.toObject(),
                peopleAhead,
                estimatedWaitMins: peopleAhead * 5 // Rough estimate: 5 mins per person
            };
        }));

        // 2. Fetch Wallet Balance & Transaction History
        // User gets 95% of the transaction when they sell a position
        // We assume the receiverEmail is matching (or user name matches if we don't have email in Transaction)
        // Let's match by receiverName for now, since Transaction stores receiverName
        // To be safer, we should search if the user was the requester or acceptedby? We can use email if available 
        // But Transaction only has receiverName. Let's find transactions where the logged-in user got paid.
        
        let walletBalance = 0;
        let badges = {
            levelName: 'Beginner Queueist',
            progress: 0,
            earned: []
        };

        const recentTransactions = await Transaction.find({
            // Note: Since transaction doesn't strictly store emails, we match receiverName if we have it
            // as this requires frontend sending the name or matching user DB. 
            // For now, let's fetch by email if we add it, or fetch all and filter.
            // Wait, we can fetch the User by email to get their name
        }).sort({ createdAt: -1 });

        // Let's require the frontend to just send the name in query or we lookup User
        const User = require('../models/User');
        const userDoc = await User.findOne({ email });
        
        let userTransactions = [];
        if (userDoc) {
            userTransactions = await Transaction.find({
                receiverName: userDoc.name
            }).sort({ createdAt: -1 }).limit(10);

            // Calculate earnings
            const allEarned = await Transaction.find({ receiverName: userDoc.name });
            walletBalance = allEarned.reduce((sum, tx) => sum + tx.receiverAmount, 0);

            // Badges logic
            if (allEarned.length >= 1) {
                badges.levelName = 'Queue Rookie';
                badges.earned.push('First Sale');
            }
            if (allEarned.length >= 5) {
                badges.levelName = 'The Negotiator';
                badges.earned.push('The Negotiator');
            }
            if (allEarned.length >= 10) {
                badges.levelName = 'Level 3 Queue Master';
                badges.earned.push('Queue Master');
            }
            badges.progress = Math.min((allEarned.length / 10) * 100, 100);
        }

        res.status(200).json({
            activeQueues: activeQueuesWithProgress,
            walletBalance,
            recentTransactions: userTransactions,
            badges
        });
    } catch (error) {
        console.error('Error fetching user dashboard:', error);
        res.status(500).json({ message: 'Error fetching user dashboard', error: error.message });
    }
};
