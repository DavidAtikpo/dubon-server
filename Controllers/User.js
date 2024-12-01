import User from'../models/User.js';
import generateToken from'../utils/generateToken.js';
import generateRefreshToken from '../config/refreshToken.js';
import nodemailer from'nodemailer';
import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import  sendEmail  from '../utils/emailSender.js'; 



const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // const existingMobile = await User.findOne({ mobile });
    const userExists = await User.findOne({ email });
    console.log('userExists',);
    
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    console.log(userExists);
    
    // if (existingMobile) {
    //   return res.status(400).json({ mobile: 'Mobile already exists' });
    // }

    // Créez un nouvel utilisateur
    const user = await User.create({ name, email, password });

    // Générer un token de vérification d'e-mail
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Stocker le token haché dans la base de données pour sécuriser
    user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    user.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Créer le lien de vérification
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/user/verify-email/${verificationToken}`;

    // Envoyer un e-mail avec le lien de vérification
    // const message = `Bonjour ${name},\n\nMerci de vous être inscrit. Veuillez cliquer sur le lien suivant pour vérifier votre adresse e-mail : \n\n${verificationUrl}\n\nSi vous n'avez pas demandé cette action, veuillez ignorer cet e-mail.`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
      
        <h2>Confirmez votre adresse e-mail</h2>
        <p>Bonjour ${name},</p>
        <p>Merci de vous être inscrit. Pour utiliser votre compte, veuillez confirmer votre adresse e-mail en cliquant sur le bouton ci-dessous.</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; color: #fff; background-color: #0070ba; border-radius: 5px; text-decoration: none; font-weight: bold; margin-top: 20px;">Confirmer votre adresse e-mail</a>
        <p style="margin-top: 20px;">Si vous n'avez pas demandé cette action, veuillez ignorer cet e-mail.</p>
        <p style="margin-top: 20px; color: #555;">Merci,<br>L'équipe de notre site</p>
        <footer style="margin-top: 40px; font-size: 12px; color: #999;">
          <p>© 2024 DUBON SERVICE EVENT. Tous droits réservés.</p>
          <p><a href="#" style="color: #999; text-decoration: none;">Aide et Contact</a> | <a href="#" style="color: #999; text-decoration: none;">Sécurité</a> | <a href="#" style="color: #999; text-decoration: none;">Conditions d'utilisation</a></p>
        </footer>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Vérification de votre adresse e-mail',
      htmlContent,
    });

    res.status(201).json({
      message: 'User created successfully. Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'An error occurred during registration.' });
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
  console.log('login:',req.body);
  
  
  // Trouver l'utilisateur par email
  const findUser = await User.findOne({ email });
  if (!findUser) {
    return res.status(400).json({ message: 'Utilisateur introuvable' });
  }
  
  if (!findUser.emailVerified) {
    return res.status(400).json({ message: 'SVP Votre email n est pas valide par le systeme .' });
  }
  // Vérifier si l'utilisateur existe et si le mot de passe correspond
  if (findUser && await findUser.isPasswordMatched(password)) {
    
    // Générer le refresh token et l'enregistrer dans la base de données
    const refreshToken = generateRefreshToken(findUser._id); 
    await User.findByIdAndUpdate(findUser._id, { refreshToken: refreshToken }, { new: true });

    // Configurer le cookie contenant le refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',  // Le rendre sécurisé en production
      maxAge: 72 * 60 * 60 * 1000,  // 3 jours
    });

    // Répondre avec les informations utilisateur et le token d'accès principal
    console.log('user',findUser.name);
    res.status(200).json({
      _id: findUser._id,
      name: findUser.name,
      // lastname: findUser.lastname,
      mobile: findUser.mobile,
      token: generateToken(findUser._id),  // Générer le token d'accès principal
    });
    
  } else {
    // Si les informations d'identification sont incorrectes
    res.status(401);
    throw new Error("Invalid credentials");
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