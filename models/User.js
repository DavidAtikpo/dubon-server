import mongoose from "mongoose";
import bcrypt from "bcrypt"
import crypto from "crypto"

// Declare the Schema of the Mongo model
const userSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  // mobile: {
  //   type: String,
  //   required: [true, 'Mobile number is required'],
  //   unique: true,
  //   sparse: true 
  // },
  password: {
    type: String,
    required: true,
  },
  role: 
  { type: String, 
    enum: ["user", "seller", "superAdmin", "admin", "deliveryPerson"], 
    default: "user" 
},
  isTrialActive: { 
    type: Boolean, 
    default: false 
},
  trialEndDate: { 
    type: Date, 
    default: null 
},
  subscriptionPaid: { 
    type: Boolean, 
    default: false 
},
  isBlocked:{
    type:Boolean,
    default:false
  },
  profilePhotoURL: {
    type: String, 
    default: '/default-user-profile-svgrepo-com (1).svg' // URL par défaut si l'utilisateur n'a pas de photo de profil
  },
  refreshToken:{
 type:String
  },
  passwordChangeAt:Date,
  verificationCode:Number,
  verificationCodeExpires:Date,

  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
},
{
  timestamps:true
}
);

userSchema.pre("save", async function(next){
  if(!this.isModified("password")){
    next();
  }
  const salt = bcrypt.genSaltSync(10);
  this.password = await bcrypt.hash(this.password, salt)
});
userSchema.methods.isPasswordMatched = async function(enteredPassword){
  return await bcrypt.compare(enteredPassword,this.password)
};
userSchema.methods.createPasswordResetToken= async function() {
  const resettoken =crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(resettoken).digest("hex");
  this.passwordResetExpires = Date.now() + 30*60*1000; //10 minutes
  return resettoken
}
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;