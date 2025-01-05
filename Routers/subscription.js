router.post('/subscription/initiate', authMiddleware, initiateSubscription);
router.post('/subscription/callback/:subscriptionId', handlePaymentCallback); 