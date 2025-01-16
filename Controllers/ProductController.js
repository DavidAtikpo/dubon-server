// Récupérer les produits similaires
export const getSimilarProducts = async (req, res) => {
  try {
    const { categoryId, subcategoryId, productId } = req.params;

    // Récupérer les produits de la même sous-catégorie (excluant le produit actuel)
    const similarBySubcategory = await Product.findAll({
      where: {
        subcategoryId,
        id: { [Op.ne]: productId },
        status: 'active'
      },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: Subcategory,
          as: 'subcategory',
          attributes: ['id', 'name']
        }
      ],
      attributes: [
        'id', 'name', 'price', 'images', 'mainImage', 
        'description', 'shortDescription', 'slug'
      ],
      limit: 4,
      order: [['createdAt', 'DESC']]
    });

    // Récupérer les produits de la même catégorie (excluant la sous-catégorie actuelle)
    const similarByCategory = await Product.findAll({
      where: {
        categoryId,
        subcategoryId: { [Op.ne]: subcategoryId },
        status: 'active'
      },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: Subcategory,
          as: 'subcategory',
          attributes: ['id', 'name']
        }
      ],
      attributes: [
        'id', 'name', 'price', 'images', 'mainImage', 
        'description', 'shortDescription', 'slug'
      ],
      limit: 4,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        similarBySubcategory,
        similarByCategory
      }
    });
  } catch (error) {
    console.error('Erreur getSimilarProducts:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des produits similaires",
      error: error.message
    });
  }
}; 