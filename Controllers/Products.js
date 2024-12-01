import Product from "../models/Products.js";
import asyncHandler from "express-async-handler";
import { get } from "mongoose";
import slugify from "slugify";

// const createProduct = asyncHandler(async (req, res) => {
//   try {
//     // Vérifier si des données de produit sont présentes dans la requête
//     let productData = {};
//     if (req.body.productData && typeof req.body.productData === 'string') {
//       productData = JSON.parse(req.body.productData);
//     } else if (typeof req.body === 'object' && Object.keys(req.body).length > 0) {
//       productData = req.body;
//     } else {
//       return res.status(400).json({ error: 'No product data provided' });
//     }

//     // Vérifier si une URL d'image est présente dans les données du produit
//     let imagePaths = [];
//     if (productData.imageURL) {
//       imagePaths.push(productData.imageURL);
//     } else if (req.files && req.files.length > 0) {
//       // Obtenir les chemins des images uploadées si aucune URL n'est fournie
//       imagePaths = req.files.map((file) => {
//         return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
//       });
//     } else {
//       return res.status(400).json({ error: 'No images provided' });
//     }

//     // Créer un slug unique basé sur le titre ou le nom
//     const slug = slugify(productData.title || productData.name, { lower: true });

//     // Calculer le prix final après remise
//     const finalPrice = productData.discount
//       ? (parseFloat(productData.price) - (parseFloat(productData.price) * (parseFloat(productData.discount) / 100))).toFixed(2)
//       : parseFloat(productData.price).toFixed(2);

//     // Créer un nouvel objet produit avec les données et les images
//     const newProduct = new Product({
//       ...productData,
//       images: imagePaths,
//       slug,
//       finalPrice,
//     });

//     // Enregistrer le produit dans la base de données
//     await newProduct.save();

//     res.status(201).json({ message: 'Product created successfully', product: newProduct });
//   } catch (error) {
//     console.error('Error while creating product:', error);
//     res.status(500).json({ error: 'Failed to add product' });
//   }
// });

const addProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).send({ message: "Produit ajouté avec succès" });
  } catch (error) {
    res.status(500).send({ message: "Erreur lors de l'ajout du produit", error });
  }
};



const createProduct = asyncHandler(async (req, res) => {
  try {
    // Vérifier si des données de produit sont présentes dans la requête
    let productData = {};
    if (req.body.productData && typeof req.body.productData === 'string') {
      productData = JSON.parse(req.body.productData);
    } else if (typeof req.body === 'object' && Object.keys(req.body).length > 0) {
      productData = req.body;
    } else {
      return res.status(400).json({ error: 'No product data provided' });
    }

    // Récupérer l'ID du vendeur à partir de `req.user.id` ajouté par le middleware authorization
    const sellerId = req.user.id;
    if (!sellerId) {
      return res.status(400).json({ error: 'Seller ID is required' });
    }

    // Vérifier si une URL d'image est présente dans les données du produit
    let imagePaths = [];
    if (productData.imageURL) {
      imagePaths.push(productData.imageURL);
    } else if (req.files && req.files.length > 0) {
      // Obtenir les chemins des images uploadées si aucune URL n'est fournie
      imagePaths = req.files.map((file) => {
        return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
      });
    } else {
      return res.status(400).json({ error: 'No images provided' });
    }

    // Créer un slug unique basé sur le titre ou le nom
    const slug = slugify(productData.title || productData.name, { lower: true });

    // Calculer le prix final après remise
    const finalPrice = productData.discount
      ? (parseFloat(productData.price) - (parseFloat(productData.price) * (parseFloat(productData.discount) / 100))).toFixed(2)
      : parseFloat(productData.price).toFixed(2);

    // Créer un nouvel objet produit avec les données, les images et l'ID du vendeur
    const newProduct = new Product({
      ...productData,
      images: imagePaths,
      slug,
      finalPrice,
      sellerId, // Ajout de l'ID du vendeur
    });

    // Enregistrer le produit dans la base de données
    await newProduct.save();

    res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (error) {
    console.error('Error while creating product:', error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});



const getProducts = async (req, res) => {
  const products = await Product.find({});
  
  res.json(products);
};


const getAllProduct = asyncHandler(async(req,res)=>{
  
  try {
    const queryObj = {...req.query};
    const excludeFields = ["page","sort","limit","fields"];
    excludeFields.forEach((el)=>delete queryObj[el])
    // console.log(queryObj);
    
  let queryStr= JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|lte|lt)\b/g, (match)=>`$${match}`);
  let query = Product.find(JSON.parse(queryStr));

  // Sorting 

  if(req.query.sort){
    const sortBy = req.query.sort.split(",").json("");
    query= query.sort(sortBy);
  }else{
    query= query.sort("-createAt");
  }

  // limiting the fields
  if(req.query.fields){
    const fields =req.query.fields. split(",").json("");
    query = query.select(fields);
  }else{
    query=query.select("-__v");
  }

// pagination

const page = req.query.page;
const limit = req.query.limit;
const skip =(page - 1)* limit;
query = query.skip(skip).limit(limit)
if(req.query.page){
const productCount = await Product.countDocuments();
if (skip>=productCount) throw new Error("this page does not exist")
}



  const product = await query;
  
  res.json(product);

} catch (error) {
  throw new Error(error)
}
})


// Récupérer un produit par ID
const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.productId);

  if (product) {
      res.json(product);
  } else {
      res.status(404).json({ message: 'Product not found' });
  }
};


const Promotion = async (req, res) => {
  try {
    // Récupérer les produits avec un champ "discount" > 0
    const promotions = await Product.find({ discount: { $gt: 0 } });

    // Vérifiez s'il y a des promotions
    if (!promotions || promotions.length === 0) {
      return res.status(404).json({ message: "Aucune promotion trouvée." });
    }

    // Retourner les promotions trouvées
    return res.status(200).json(promotions);
  } catch (error) {
    console.error("Erreur lors de la récupération des promotions :", error.message);
    return res.status(500).json({ message: "Erreur serveur. Veuillez réessayer plus tard." });
  }
};


// Route pour récupérer les produits récemment ajoutés
const getNewProduct = async (req, res) => {
  try {
    // Récupérer les produits ajoutés récemment (par exemple, les 10 derniers produits)
    const newProducts = await Product.find().sort({ createdAt: -1 }).limit(10);

    if (newProducts.length === 0) {
      return res.status(404).json({ message: 'Aucun nouveau produit trouvé' });
    }

    res.json(newProducts);
  } catch (error) {
    console.error('Erreur lors de la récupération des nouveaux produits :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Suppression d'un produit
const deleteProduct = async (req, res) => {
  try {
      const { productId } = req.params;
      // const userId = req.user.id
      
      const product = await Product.findById(productId);
      if (!product) {
          return res.status(404).json({ message: 'Produit non trouvé' });
      }
      // if (!product.sellerId.equals(userId)) {
      //   return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce produit' });
      // }
      
      // Supprimer le produit
      await Product.findByIdAndDelete(productId);

      res.status(200).json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
      console.error('Erreur lors de la suppression du produit :', error);
      res.status(500).json({ message: 'Erreur serveur lors de la suppression du produit' });
  }
};



// Mise à jour d'un produit
const updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        // const userId = req.user.id;
        const {
            title,
            slug,
            description,
            price,
            discount,
            finalPrice,
            category,
            quantity,
            specifications,
            variants,
            taxRate,
            availability,
            dimensions,
            tags,
            meta,
            images,
        } = req.body;

        // Trouver le produit par son ID
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        // if (!product.sellerId.equals(userId)) {
        //   return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce produit' });
        // }
        // Mettre à jour les champs du produit
        product.title = title || product.title;
        product.slug = slug || product.slug;
        product.description = description || product.description;
        product.price = price || product.price;
        product.discount = discount || product.discount;
        product.finalPrice = finalPrice || product.finalPrice;
        product.category = category || product.category;
        product.quantity = quantity || product.quantity;
        product.specifications = specifications || product.specifications;
        product.variants = variants || product.variants;
        product.taxRate = taxRate || product.taxRate;
        product.availability = availability || product.availability;
        product.dimensions = dimensions || product.dimensions;
        product.tags = tags || product.tags;
        product.meta = meta || product.meta;
        product.images = images || product.images;

        // Sauvegarder le produit mis à jour
        const updatedProduct = await product.save();

        res.status(200).json({
            message: 'Produit mis à jour avec succès',
            product: updatedProduct,
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du produit :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du produit' });
    }
};


// Récupérer les produits de la même catégorie
const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params; // Récupérer la catégorie depuis l'URL
console.log('category',{category});

    const products = await Product.find({ category });

    if (!products || products.length === 0) {
      return res.status(404).json({ message: 'Aucun produit trouvé dans cette catégorie.' });
    }

    res.status(200).json(products);
  } catch (error) {
    console.error('Erreur lors de la récupération des produits par catégorie :', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};







// Vente rapide
const getQuickSales = async (req, res) => {
  try {
    const products = await Product.find({ isQuickSale: true }).limit(8);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des ventes rapides", error });
  }
};

// Meilleures ventes
const getBestSellers = async (req, res) => {
  try {
    const products = await Product.find({ isBestSeller: true }).limit(8);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des meilleures ventes", error });
  }
};

// Meilleures notes
const getTopRated = async (req, res) => {
  try {
    const products = await Product.find({ isTopRated: true }).limit(8);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des meilleures notes", error });
  }
};

// Nouveaux arrivages
const getNewArrivals = async (req, res) => {
  try {
    const products = await Product.find({ isNewArrival: true }).limit(8);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des nouveaux arrivages", error });
  }
};


export default {createProduct,getNewArrivals,
  getBestSellers,getTopRated,
  getQuickSales,addProduct,
  Promotion,getNewProduct,
  updateProduct,deleteProduct,
  getAllProduct,
  getProductById,
  getProducts,getProductsByCategory}