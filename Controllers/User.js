import User from'../models/User.js';
import generateToken from'../utils/generateToken.js';
import generateRefreshToken from '../config/refreshToken.js';
import nodemailer from'nodemailer';
import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import  sendEmail  from '../utils/emailSender.js'; 
import { corsErrorHandler } from '../middleware/authMiddleware.js';



const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    console.log("Tentative d'inscription avec:", { name, email });

    // Vérifier si l'email existe déjà
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (userExists) {
      if (!userExists.emailVerified) {
        try {
          // Tentative d'envoi d'email
          const verificationToken = crypto.randomBytes(32).toString('hex');
          const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
          
          userExists.emailVerificationToken = hashedToken;
          userExists.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
          await userExists.save();

          // Envoyer l'email
          await sendEmail(/* ... */);
        } catch (emailError) {
          console.error("Erreur d'envoi d'email:", emailError);
          // Continuer malgré l'erreur d'email
        }

        return res.status(400).json({ 
          success: false,
          message: "Un compte existe déjà avec cet email mais n'est pas vérifié. Veuillez vérifier votre email ou contacter le support."
        });
      }

      return res.status(400).json({ 
        success: false,
        message: "Un compte existe déjà avec cet email. Veuillez vous connecter."
      });
    }

    // Créer l'utilisateur
    const user = await User.create({ 
      name, 
      email: email.toLowerCase().trim(), 
      password 
    });

    try {
      // Tentative d'envoi d'email
      const verificationToken = crypto.randomBytes(32).toString('hex');
      // ... configuration de l'email
    } catch (emailError) {
      console.error("Erreur d'envoi d'email:", emailError);
      // Continuer malgré l'erreur d'email
    }

    res.status(201).json({
      success: true,
      message: "Inscription réussie ! Un email de vérification vous sera envoyé prochainement.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de l'inscription.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// email verification
export const verifyEmail = async (req, res) => {
  try {
    const token  = req.params.token;
  
    

    if (typeof token !== 'string') {
      return res.status(400).json({ message: 'Format de jeton non valide' });
    }
    // Hachez le token pour le comparer avec celui de la base de données
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  

    // Trouvez un utilisateur avec le token correspondant et vérifiez qu'il n'a pas expiré
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });
    
    if (!user) {
      // Supprime l'utilisateur si le token est invalide ou expiré
      await User.deleteOne({ emailVerificationToken: hashedToken });
      return res.status(400).json({ message: 'Token invalide ou expiré. Utilisateur supprimé.' });
    }

    // Marquez l'e-mail comme vérifié
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Error during email verification:', error);
    res.status(500).json({ message: 'An error occurred during email verification.' });
  }
};



// login User

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  console.log("Email reçu:", email);

  try {
    // Lister tous les utilisateurs pour debug
    const allUsers = await User.find({}, 'email');
    console.log("Liste de tous les emails dans la base:", allUsers.map(u => u.email));

    const normalizedEmail = email.toLowerCase().trim();
    console.log("Email normalisé:", normalizedEmail);

    const user = await User.findOne({ email: normalizedEmail });
    console.log("Recherche utilisateur avec email:", normalizedEmail);
    console.log("Utilisateur trouvé:", user);
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Aucun compte trouvé avec cet email. Veuillez créer un compte pour continuer."
      });
    }

    // Vérifier si l'email est vérifié
    if (!user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Veuillez vérifier votre email avant de vous connecter"
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.isPasswordMatched(password);
    console.log("Validation mot de passe:", isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Mot de passe incorrect"
      });
    }

    // Générer le token
    const token = generateToken(user._id);

    // Envoyer la réponse
    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });

  } catch (error) {
    console.error("Erreur détaillée de connexion:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

  // User Logout

  const logout = asyncHandler(async(req,res)=>{
    const cookie = req.user;
    if(!cookie?.refreshToken) throw new Error("no Refresh Token in cookies")
    const refreshToken= cookie.refreshToken;
  const user = await User.findOne({refreshToken});
  if(!user){
  res.clearCookie("refreshToken",{
    httpOnly:true,
    secure:true,
  })
  res.sendStatus(204);
}
await User.findOneAndUpdate({refreshToken},{
  refreshToken:"",
});
res.clearCookie("refreshToken",{
  httpOnly:true,
  secure:true,
});
res.json("logout successfully")
  });


// Update password

const updatePassword= asyncHandler(async(req,res)=>{
    const {_id}= req.user;
    const {password}= req.body;
    validateMongoDbId(_id);
    const user = await User.findById(_id);
    if(password){
      user.password = password;
      const updatePassword= await user.save();
      res.json(updatePassword);
    }else{
      res.json(user)
    }
  });




  // forgot password

  const forgotPassword = async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ success: false, message: 'Utilisateur non trouvé.' });
      }
  
      //  code de vérification à 4 chiffres
      const verificationCode = Math.floor(100000 + Math.random() * 9000);
      user.verificationCode = verificationCode;
      user.verificationCodeExpires = Date.now() + 3600000;
  
      await user.save();
  
      //  code de vérification par email
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL, 
          pass: process.env.PASSWORD
        }
      });
  
      const mailOptions = {
        to: user.email,
        from: process.env.EMAIL,
        subject: 'Code de vérification pour réinitialisation du mot de passe',
        text: `Votre code de vérification pour la réinitialisation du mot de passe est : ${verificationCode}. Ce code est valable pendant 1 heure.`
      };
  
      transporter.sendMail(mailOptions, (err) => {
        if (err) {
          console.error('Erreur lors de l\'envoi de l\'e-mail:', err);
          return res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi de l\'e-mail.' });
        }
        res.json({ success: true, message: 'E-mail avec le code de vérification envoyé avec succès.' });
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Une erreur est survenue.' });
    }
  };


  //Reset password

  const resetPassword = asyncHandler(async(req,res)=>{
    const {password}= req.body;
    const {token} = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken:hashedToken,
      passwordResetExpires:{$gt:Date.now()},
    });
    if(!user) throw new Error("Token Expired Please try again later")
    user.password.password;
  user.passwordResetToken= undefined;
  user.passwordResetExpires= undefined;
  await user.save();
  res.json(user);
  })





  // Code de verification
 
const verifyCode = async (req, res) => {
    const { email, code } = req.body;
    try {
      const user = await User.findOne({ email });
      console.log(user);
      if (!user) {
        return res.status(400).json({ success: false, message: 'Utilisateur non trouvé.' });
      }
  
      // Vérification du  code  correct et s'il n'a pas expiré
      if (user.verificationCode !== parseInt(code) || user.verificationCodeExpires < Date.now()) {
        return res.status(400).json({ success: false, message: 'Code de vérification invalide ou expiré.' });
      }
  
      // Si le code est correct, autoriser l'utilisateur à réinitialiser son mot de passe
      res.json({ success: true, message: 'Code vérifié avec succès. Vous pouvez maintenant réinitialiser votre mot de passe.' });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Une erreur est survenue.' });
    }
  };
  


  // User Upload profile image

const uploadProfile = async (req, res) => {
    try {
        const { userId } = req.user._id;
        const { profilePhotoURL } = req.body;
        console.log("user", userId, profilePhotoURL);
        const user = await User.findByIdAndUpdate(userId, { profilePhotoURL }, { new: true });
  
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
  
        res.status(200).json({ message: 'Profile photo URL updated successfully', user });
    } catch (error) {
        console.error('Error updating profile photo URL:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
  };

   // Blocked the user by id
   const blockUser = asyncHandler(async(req,res)=>{
    const {id}= req.params;
    validateMongoDbId(id);
    try {
      const block= await User.findByIdAndUpdate(id,
        {
        isBlocked:true,
      },
      {
        new:true,
      });
      res.json({message:"user Blocked"})
    } catch (error) {
      throw new Error(error)
    }
    })

// unblock user
  const unblockUser = asyncHandler(async(req,res)=>{
    const {id}= req.params;
    validateMongoDbId(id);
    try {
      const unblock= await User.findByIdAndUpdate(id,
        {
        isBlocked:false,
      },
      {
        new:true,
      })
      res.json({message:"user Unblocked"});
    } catch (error) {
      throw new Error(error)
    }
  });


// delete User
const deleteUserById = asyncHandler(async(req,res)=>{
  const {id}= req.params;
  validateMongoDbId(id);
  try {
  const getUser = await User.findByIdAndDelete(id)
  if(getUser){
  res.json({message:"delete successfully"})
  }else{
    res.json({message:"User not found"})
  }
  } catch (error) {
    throw new Error(error)
  }
  });

  //handle refresh token
  const handleRefreshToken = asyncHandler(async(req,res)=>{
    const cookie = req.cookies;
    if(!cookie?.refreshToken) throw new Error("no Refresh Token in cookies")
    const refreshToken= cookie.refreshToken;
  const user = await User.findOne({refreshToken});
  if(!user)throw new Error("no Refresh Token present in the db or not match")
  jwt.verify(refreshToken,process.env.JWT_SECRET,(err, decoded)=>{
    if(err || user.id !== decoded.id){
      throw new Error("there is somethig wrong with refresh token")
    };
    const accessToken = generateToken(user?.id);
    res.json({accessToken});
});

  });

  // user info 
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

  export default { 
    userInfo,
    deleteUserById,
    handleRefreshToken, blockUser,
    unblockUser,register,
    login,logout,
    forgotPassword,
    verifyCode,resetPassword,
    updatePassword,uploadProfile,
    verifyEmail}