import { models } from '../models/index.js';
const { Category, Subcategory, Product } = models;

export const createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la catégorie",
      error: error.message
    });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    // 1. Récupérer toutes les catégories principales
    const categories = await Category.findAll({
      attributes: ['id', 'name', 'description'],
      order: [['name', 'ASC']]
    });

    // 2. Pour chaque catégorie, récupérer ses sous-catégories
    const transformedCategories = await Promise.all(categories.map(async (category) => {
      const plainCategory = category.get({ plain: true });
      
      // Récupérer les sous-catégories pour cette catégorie
      const subcategories = await Subcategory.findAll({
        where: { categoryId: category.id },
        attributes: ['id', 'name', 'description'],
        order: [['name', 'ASC']]
      });

      // Pour chaque sous-catégorie, récupérer ses produits
      const subcategoriesWithProducts = await Promise.all(subcategories.map(async (subcategory) => {
        const plainSubcategory = subcategory.get({ plain: true });
        
        // Récupérer les produits pour cette sous-catégorie
        const products = await Product.findAll({
          where: { 
            subcategoryId: subcategory.id,
            status: 'active'
          },
          attributes: ['id', 'name', 'price', 'images', 'mainImage', 'description', 'shortDescription'],
          order: [['name', 'ASC']]
        });

        return {
          id: plainSubcategory.id,
          name: plainSubcategory.name,
          description: plainSubcategory.description,
          products: products.map(product => {
            const plainProduct = product.get({ plain: true });
            return {
              id: plainProduct.id,
              name: plainProduct.name,
              price: plainProduct.price,
              description: plainProduct.description,
              shortDescription: plainProduct.shortDescription,
              image: plainProduct.mainImage || (Array.isArray(plainProduct.images) && plainProduct.images[0]) || null
            };
          })
        };
      }));

      return {
        id: plainCategory.id,
        name: plainCategory.name,
        description: plainCategory.description,
        subcategories: subcategoriesWithProducts
      };
    }));

    res.status(200).json({
      success: true,
      data: transformedCategories
    });
  } catch (error) {
    console.error('Erreur getAllCategories:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des catégories",
      error: error.message
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Catégorie non trouvée"
      });
    }

    await category.update(req.body);
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la catégorie",
      error: error.message
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Catégorie non trouvée"
      });
    }

    // Vérifier s'il y a des produits associés
    const productsCount = await Product.count({
      where: { categoryId: id }
    });

    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Impossible de supprimer une catégorie contenant des produits"
      });
    }

    await category.destroy();
    res.status(200).json({
      success: true,
      message: "Catégorie supprimée avec succès"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la catégorie",
      error: error.message
    });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'subcategories',
          include: ['products']
        },
        'products'
      ]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Catégorie non trouvée"
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la catégorie",
      error: error.message
    });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const products = await Product.findAndCountAll({
      where: { categoryId: id },
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: ['reviews']
    });

    res.status(200).json({
      success: true,
      data: {
        products: products.rows,
        total: products.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(products.count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des produits",
      error: error.message
    });
  }
}; 