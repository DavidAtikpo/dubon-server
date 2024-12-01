import mongoose from "mongoose";

const deliveryPersonSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, },
  phone: { type: String, required: true },
  isBlocked: { type: Boolean, default: false },
  assignedOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const DeliveryPerson = mongoose.models.DeliveryPerson || mongoose.model("DeliveryPerson", deliveryPersonSchema);

export default DeliveryPerson;
