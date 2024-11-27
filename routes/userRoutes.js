import express from "express";
import { LoadHomepage,
   /* pageNotFound,  */
   loadSignup,
    signup,
     verifyOtp,
     resendOtp,
     login, 
     loadLogin,
     productDetails,
     shop,
     loadprofile,
     loadAddressPage,
     Add_Address,
     userlogout,
     changepassword,
     loadEditAddresspage,
     updateAddress,
     deleteAddress,
     cart ,
     addtocart,
     deleteCart,
     checkout,
     checkoutupdateAddress}from "../controller/user/usercontroller.js";  
import User from "../models/userschema.js";
import Address from "../models/addressSchema.js";
import passport from "passport";
 import Product from "../models/productSchema.js";
import Cart from "../models/cartSchema.js"


const router = express.Router();

router.get("/", LoadHomepage);
router.get("/signup", loadSignup);
router.post("/signup", signup);
router.post("/verify-otp",verifyOtp)
router.post("/resend-otp",resendOtp)
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
  res.redirect('/')
})

router.get('/login',loadLogin)
router.post("/login",login)

router.get("/productDetails/:id",productDetails)
router.get("/productDetails",productDetails)

router.get("/shop",shop)

router.get('/profile',loadprofile)
router.get('/addAddresspage',loadAddressPage)
router.post('/address',Add_Address)
router.post('/userlogout',userlogout)
router.post('/changepassword',changepassword)
router.get('/editAddresspage/:addressId', loadEditAddresspage);
router.post('/updateAddress/:addressId', updateAddress);

router.delete('/deleteAddress/:addressId', deleteAddress);

router.get('/Cart',cart )
router.post('/addtocart/:productId',addtocart)
router.delete('/delete/:productId', deleteCart);

router.get('/checkout', checkout);
router.post('/checkoutupdateAddress',checkoutupdateAddress)

export default router;
