import jwt from'jsonwebtoken';
import User from'../models/user.js';
import { models } from '../models/index.js';
const { User } = models;

exports.protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

exports.admin = async (req, res, next) => {
    try {
        // Vérifier si l'utilisateur est authentifié
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Non authentifié"
            });
        }

        // Vérifier si l'utilisateur est un admin
        const user = await User.findByPk(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Accès non autorisé"
            });
        }

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors de la vérification des droits admin",
            error: error.message
        });
    }
};
