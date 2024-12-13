export const getSellerData = async (req, res) => {
  try {
    const sellerId = req.params.id;
    const seller = await Seller.findById(sellerId)
      .populate('userId', 'name email')
      .lean();

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    res.status(200).json({
      success: true,
      data: seller
    });
  } catch (error) {
    console.error('Error fetching seller data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching seller data'
    });
  }
}; 