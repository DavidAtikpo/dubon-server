import Order from "../models/Order.js"; 


//  const createOrder = async (req, res) => {
//   try {
//     const { 
//       buyer_id, 
//       product_id, 
//       quantity, 
//       order_price, 
//       payment_method, 
//       order_category, 
//       delivery_address 
//     } = req.body;

//     // Calcul du prix total (quantité * prix unitaire)
//     const total_price = quantity * order_price;

//     // Création de la commande
//     const newOrder = new Orders({
//       buyer_id,
//       product_id,
//       quantity,
//       order_price,
//       total_price,
//       payment_method,
//       order_category,
//       delivery_address,
//       order_date: new Date(),  // Date automatique à la création
//       status: "pending",  // Statut initial de la commande
//     });

//     // Enregistrer la commande dans la base de données
//     const savedOrder = await newOrder.save();
//     res.status(201).json(savedOrder);  // Renvoie la commande créée avec un statut 201
//   } catch (error) {
//     console.error("Erreur lors de la création de la commande :", error);
//     res.status(500).json({ message: "Erreur du serveur lors de la création de la commande." });
//   }
// };


// Créer une commande et générer un lien de paiement
const createOrder = async (req, res) => {
  const { fullName, email, phone, address, items, total } = req.body;

  if (!fullName || !email || !phone || !address || !items || !total) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }
console.log("req.body",req.body);

  try {
    const order = await Order.create({ fullName, email, phone, address, items, total });
console.log("order",order);

const response = await fedapayAPI.post("/transactions", {
  description: `Commande #${order._id}`,
  amount: total * 100, // Montant en centimes
  currency: "XOF",
  customer: {
    firstname: fullName,
    email,
    phone_number: phone,
  },
  callback_url: `${process.env.BASE_URL}/api/payment-success/${order._id}`,
  return_url: `${process.env.BASE_URL}/payment-success`,
});
console.log("response",response);

    

    const paymentUrl = response.data.data.authorization_url;
    res.status(201).json({ order, paymentUrl });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Erreur lors de la création de la commande." });
  }
};



// Récupérer les commandes par identifiant de l'acheteur
const getOrdersByUserId = async (req, res) => {
    try {
      const orders = await Orders.find({ user_id_id: req.params.user_id });
      if (orders.length === 0) {
        return res.status(404).json({ message: "Aucune commande trouvée pour cet acheteur." });
      }
      res.status(200).json(orders);
    } catch (error) {
      console.error("Erreur lors de la récupération des commandes :", error);
      res.status(500).json({ message: "Erreur du serveur." });
    }
  };
  
  // Récupérer les commandes par catégorie
   const getOrderByCategory = async (req, res) => {
    try {
      const orders = await Orders.aggregate([
        {
          $match: {
            user_id: req.params.user_id,
            order_category: req.params.order_category.toUpperCase(),
          },
        },
      ]);
      if (orders.length === 0) {
        return res.status(404).json({ message: "Aucune commande trouvée pour cette catégorie." });
      }
      res.status(200).json(orders);
    } catch (error) {
      console.error("Erreur lors de la récupération par catégorie :", error);
      res.status(500).json({ message: "Erreur du serveur." });
    }
  };
  
  // Récupérer les commandes par date d'achat
   const getOrdersByPurchaseDate = async (req, res) => {
    try {
      const orders = await Orders.aggregate([
        {
          $match: {
            user_id: req.params.user_id,
            order_date: new Date(req.params.order_date),
          },
        },
      ]);
      if (orders.length === 0) {
        return res.status(404).json({ message: "Aucune commande trouvée pour cette date." });
      }
      res.status(200).json(orders);
    } catch (error) {
      console.error("Erreur lors de la récupération par date :", error);
      res.status(500).json({ message: "Erreur du serveur." });
    }
  };
  
  export default {createOrder,getOrdersByUserId,getOrderByCategory,getOrdersByPurchaseDate}