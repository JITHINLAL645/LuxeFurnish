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
     updateCartQuantity,
     addtocart,
     deleteCart,
     checkout,
     checkoutupdateAddress,
     sortProducts,
     successpage,getOrder,placeorder,cancelOrder,loadForgot,post_ResetPage,get_RestPassword,postResetPassword}from "../controller/user/usercontroller.js";  
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
// router.get('/forgot-password',getforgotpassword)


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
router.post('/cart/update-quantity', updateCartQuantity);

router.post('/addtocart/:productId',addtocart)
router.delete('/delete/:productId', deleteCart);

router.get('/checkout', checkout);
router.post('/checkoutupdateAddress',checkoutupdateAddress)

router.post('/placeorder',placeorder)
router.get('/successpage',successpage)


router.get('/order',getOrder);
router.post('/cancelOrder',cancelOrder);


router.get('/forgotPassword',loadForgot)
router.post('/postResetPage',post_ResetPage);
router.get('/getRestPassword/:token',get_RestPassword)
router.post('/reset-password', postResetPassword);




export default router;
