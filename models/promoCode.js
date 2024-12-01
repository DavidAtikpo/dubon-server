import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    used: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: () => {
            // Expiration après 30 jours, par exemple
            const date = new Date();
            date.setDate(date.getDate() + 30);
            return date;
        }
    }
});

export default mongoose.model('PromoCode', promoCodeSchema);
