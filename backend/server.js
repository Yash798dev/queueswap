const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: [
        'https://queueswap-app.onrender.com',
        'https://queueswap-landing.onrender.com',
        'http://localhost:4200'
    ],
    credentials: true
}));
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/queue_swap';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB');

    // Start blockchain listener after DB is connected
    const { startListener } = require('./services/blockchainListener');
    startListener();

  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};

connectDB();

// Routes
const authController = require('./controllers/authController');
const businessController = require('./controllers/businessController');
const userController = require('./controllers/userController');

app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/verify/:token', authController.verify);

// Admin Routes
const adminController = require('./controllers/adminController');
app.get('/api/admin/analytics', adminController.getAnalytics);
app.get('/api/admin/details/:type', adminController.getDetailedStats);
app.get('/api/admin/revenue', adminController.getRevenueAnalytics);

// Consumer Routes
app.get('/api/user/dashboard/:email', userController.getUserDashboard);

// Business Routes
app.get('/api/business/explore', businessController.exploreBusinesses);
app.get('/api/business/trending', businessController.getTrendingBusinesses);
app.post('/api/business/submit', businessController.submitBusiness);
app.get('/api/business/pending', businessController.getPendingBusinesses);
app.get('/api/business/owner/:userId', businessController.getBusinessByOwner);
app.put('/api/business/:id/status', businessController.updateStatus);
app.get('/api/business/:id/analytics', businessController.getBusinessAnalytics);
app.post('/api/business/:id/join', businessController.joinQueue);
app.get('/api/business/:id/join', businessController.joinQueue);
app.post('/api/business/:id/queue/remote-join', businessController.remoteJoinQueue);
app.put('/api/business/queue/update', businessController.updateQueueEntry);
app.get('/api/business/:businessId/queue', businessController.getQueueEntries);

// Swap Routes (off-chain)
app.post('/api/business/:id/swap/request', businessController.requestSwap);
app.get('/api/business/:id/swap/pending', businessController.getPendingSwaps);
app.post('/api/business/swap/accept', businessController.acceptSwap);
app.post('/api/business/swap/decline', businessController.declineSwap);
app.get('/api/business/swap/:swapId/status', businessController.getSwapStatus);

// Blockchain Swap Routes
app.post('/api/business/wallet/connect', businessController.connectWallet);
app.post('/api/business/:id/swap/blockchain', businessController.createBlockchainSwap);
app.get('/api/business/:id/swap/blockchain/pending', businessController.getBlockchainPendingSwaps);

// Fast Service Marketplace Routes
app.post('/api/business/:id/fast-service/request', businessController.createFastServiceRequest);
app.post('/api/business/:id/fast-service/offer', businessController.submitFastServiceOffer);
app.get('/api/business/:id/fast-service/open', businessController.getOpenFastServiceRequests);
app.post('/api/business/:id/fast-service/accept', businessController.acceptFastServiceOffer);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Accepting connections on 0.0.0.0 (All Interfaces)`);
});
