import { Sequelize } from 'sequelize';
import { sequelize } from '../config/dbConfig.js';
import UserModel from './User.js';
import ProductModel from './Product.js';
import CategoryModel from './Category.js';
import OrderModel from './Order.js';
import CartModel from './Cart.js';
import AddressModel from './Address.js';
import PromotionModel from './Promotion.js';
import CustomerFilterModel from './CustomerFilter.js';
import PaymentModel from './Payment.js';
import SellerRequestModel from './SellerRequest.js';
import ContractModel from './Contract.js';
import SellerSettingModel from './SellerSetting.js';
import SellerStatsModel from './SellerStats.js';
import UserActivityModel from './UserActivity.js';
import ReviewModel from './Review.js';
import MessageModel from './Message.js';
import NotificationModel from './Notification.js';
import SystemLogModel from './SystemLog.js';
import SystemSettingModel from './SystemSetting.js';
import ThemeModel from './Theme.js';
import TrainingModel from './Training.js';
import WithdrawalModel from './Withdrawal.js';
import UserProfileModel from './UserProfile.js';
import ServiceModel from './Service.js';
import EventModel from './Event.js';
import RestaurantItemModel from './RestaurantItem.js';
import RefundModel from './Refund.js';
import ReturnModel from './Return.js';
import RatingModel from './Rating.js';
import FavoriteModel from './Favorite.js';
import DisputeModel from './Dispute.js';
import DisputeEvidenceModel from './DisputeEvidence.js';
import CouponModel from './Coupon.js';
import OrderItemModel from './OrderItem.js';
import CartItemModel from './CartItem.js';
import PromotionProductModel from './PromotionProduct.js';
import EventBookingModel from './EventBooking.js';
import ReservationModel from './Reservation.js';
import RestaurantModel from './Restaurant.js';
import TableModel from './Table.js';
import SubscriptionModel from './subscription.js';
import PlanModel from './Plan.js';
import SellerProfile from './SellerProfile.js';
import ShopModel from './Shop.js';
import SellerHistoryModel from './SellerHistory.js';
import SubcategoryModel from './Subcategory.js';
import ParticipantModel from './Participant.js';
import ServiceRequestModel from './ServiceRequest.js';
import DishModel from './Dish.js';
import EventRequestModel from './EventRequest.js';
import ChatMessageModel from './ChatMessage.js';

// Initialiser les modèles
const defineModels = () => {
  const db = {};

  // 1. Modèles de base (sans dépendances)
  db.User = UserModel(sequelize);
  db.Category = CategoryModel(sequelize);
  db.Subcategory = SubcategoryModel(sequelize);
  db.Theme = ThemeModel(sequelize);
  db.SystemSetting = SystemSettingModel(sequelize);
  db.SystemLog = SystemLogModel(sequelize);
  db.Plan = PlanModel(sequelize, Sequelize.DataTypes);

  // 2. Profil vendeur (dépendance critique)
  db.SellerProfile = SellerProfile(sequelize);

  // 3. Shop (dépend de SellerProfile)
  db.Shop = ShopModel(sequelize);

  // 4. Modèles dépendant du profil vendeur et de la boutique
  db.SellerSetting = SellerSettingModel(sequelize);
  db.SellerStats = SellerStatsModel(sequelize);
  db.SellerRequest = SellerRequestModel(sequelize);
  db.Subscription = SubscriptionModel(sequelize, Sequelize.DataTypes);
  db.Product = ProductModel(sequelize);

  // 5. Autres modèles
  db.UserProfile = UserProfileModel(sequelize);
  db.UserActivity = UserActivityModel(sequelize);
  db.Service = ServiceModel(sequelize);
  db.Event = EventModel(sequelize);
  db.EventBooking = EventBookingModel(sequelize);
  db.RestaurantItem = RestaurantItemModel(sequelize);
  db.Training = TrainingModel(sequelize);
  db.Order = OrderModel(sequelize);
  db.OrderItem = OrderItemModel(sequelize);
  db.Cart = CartModel(sequelize);
  db.CartItem = CartItemModel(sequelize);
  db.Payment = PaymentModel(sequelize);
  db.Return = ReturnModel(sequelize);
  db.Refund = RefundModel(sequelize);
  db.Address = AddressModel(sequelize);
  db.Promotion = PromotionModel(sequelize);
  db.CustomerFilter = CustomerFilterModel(sequelize);
  db.Contract = ContractModel(sequelize);
  db.Review = ReviewModel(sequelize);
  db.Rating = RatingModel(sequelize);
  db.Message = MessageModel(sequelize);
  db.Notification = NotificationModel(sequelize);
  db.Withdrawal = WithdrawalModel(sequelize);
  db.Favorite = FavoriteModel(sequelize);
  db.Dispute = DisputeModel(sequelize);
  db.DisputeEvidence = DisputeEvidenceModel(sequelize);
  db.Coupon = CouponModel(sequelize);
  db.PromotionProduct = PromotionProductModel(sequelize);
  db.Restaurant = RestaurantModel(sequelize);
  db.Table = TableModel(sequelize);
  db.Reservation = ReservationModel(sequelize);
  db.SellerHistory = SellerHistoryModel(sequelize);
  db.Participant = ParticipantModel(sequelize);
  db.ServiceRequest = ServiceRequestModel(sequelize);
  db.Dish = DishModel(sequelize);
  db.EventRequest= EventRequestModel(sequelize);
  db.ChatMessage = ChatMessageModel(sequelize);

  // Initialiser les associations
  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  return db;
};

const models = defineModels();

// Synchroniser les modèles avec la base de données
const syncModels = async () => {
  try {
    console.log('🔄 Synchronisation des modèles...');
    
    // Synchroniser spécifiquement le modèle Subcategory
    console.log('🔄 Synchronisation du modèle Subcategory...');
    await models.Subcategory.sync({ force: true });
    console.log('✅ Modèle Subcategory synchronisé avec succès');

    // Synchroniser les autres modèles normalement
    const syncOptions = {
      force: false,
      alter: true
    };
    
    await sequelize.sync(syncOptions);
    console.log('✅ Tous les modèles synchronisés avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation des modèles:', error);
    console.error('Détails de l\'erreur:', error.message);
    throw error;
  }
};

export { models, sequelize, syncModels }; 