import User from'../models/User.js';
import Order from'../models/Order.js';

// Récupérer tous les utilisateurs
const getUsers = async (req, res) => {
    const users = await User.find({});
    res.json(users);
};

// Supprimer un utilisateur
const deleteUser = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        await user.remove();
        res.json({ message: 'User removed' });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

const userInfo = async (req, res) => {
    console.log('user:', userInfo);
     try {
       const user = await User.findById(req.params.id);
       
       if (!user) {
         return res.status(404).json({ message: "Utilisateur non trouvé" });
       }
       res.json(user);
     } catch (error) {
       console.error("Erreur lors de la récupération de l'utilisateur:", error);
       res.status(500).json({ message: "Erreur interne du serveur" });
     }
   };

// Récupérer toutes les commandes
const getOrders = async (req, res) => {
    const orders = await Order.find({}).populate('user', 'name email');
    res.json(orders);
};

// Supprimer une commande
const deleteOrder = async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        await order.remove();
        res.json({ message: 'Order removed' });
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};





export default {userInfo,getUsers,deleteUser,deleteOrder,getOrders}