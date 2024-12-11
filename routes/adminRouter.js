import express from "express";
import { loadLogin, login, loadDashboard, logout } from "../controller/admin/admincontroller.js";
import { customerInfo, customerBlocked, customerunBlocked } from "../controller/admin/customercontroller.js";
import { restore_Category, delete_Category, edit_Category, add_Category, load_CategoryPage, } from "../controller/admin/categorycontroller.js"
import { loadProductPage, addProductPage, loadAdminDash, add_Product, loadEditProductPage, editProduct, delete_Product, restore_Product } from "../controller/admin/productcontroller.js";
import { loard_OrderMng,getOrderDetails} from "../controller/admin/ordercontroller.js"
import { load_CouponPage, add_Coupon,edit_Coupon, cancel_Coupon} from "../controller/admin/couponcontroller.js"
import {loadoffer,addOffer_Product,edit_Offer,delete_Offer,restore_Offer,update_ProductOffer,update_CategoryOffer} from "../controller/admin/offerController.js"
import {load_SalesReport,generateSalesReport,generateSalesReportController} from "../controller/admin/salescontroller.js"

import { adminAuth } from "../middlewares/auth.js";

import multer from '../config/multer.js'

const router = express.Router();

router.get("/login", loadLogin);
router.post("/do-login", login);
router.get("/dashboard", adminAuth, loadDashboard);
router.get("/logout", logout);

router.get("/users", adminAuth, customerInfo);
router.get("/admin/customers", adminAuth, customerInfo);
router.get("/blockCustomer", adminAuth, customerBlocked);
router.get("/unblockCustomer", adminAuth, customerunBlocked);


router.get('/categories',adminAuth, load_CategoryPage);
router.post('/addCategory',adminAuth, add_Category);
router.put('/editCategory/:id', edit_Category);
router.put('/deleteCategory/:id', adminAuth, delete_Category);
router.put('/restoreCategory/:id', adminAuth, restore_Category);


router.get("/loadAdminDash", adminAuth, loadAdminDash); 
router.get('/products', adminAuth, loadProductPage);
//router.get('/loadProuctPage',loadProductPage);
router.get('/addProductPage', adminAuth, addProductPage);
router.post('/addProduct', multer.any(), add_Product);
router.get('/editProductPage/:id',multer.any(), loadEditProductPage);
router.post('/editProduct/:id',multer.any(), editProduct);
router.put('/deleteProduct/:productId', delete_Product);
router.put('/restoreProduct/:productId', adminAuth, restore_Product)
router.get("/loadAdminDash", adminAuth, (req, res) => {
  res.render("admin/dashboard", { title: "Admin Dashboard" });
});



router.get('/loardOrderMng',adminAuth,loard_OrderMng)
router.get('/getOrderDetails/:id', adminAuth, getOrderDetails);


router.get('/loadCouponPage',adminAuth,load_CouponPage)
router.post('/addCoupon',adminAuth,add_Coupon)
router.post('/editCoupon',adminAuth,edit_Coupon)
router.post('/cancel-coupon',adminAuth, cancel_Coupon);


router.get('/loadoffer',adminAuth,loadoffer)
router.post('/addOfferProduct',adminAuth,addOffer_Product)
router.post('/editOffer',adminAuth,edit_Offer)
router.put('/deleteOffer/:id',adminAuth,delete_Offer);
router.put('/restoreOffer/:id',adminAuth,restore_Offer);
router.post('/updateProductOffer',adminAuth,update_ProductOffer)
router.post('/updateCategoryOffer',adminAuth,update_CategoryOffer)


router.get('/salesReport',load_SalesReport);
router.post('/generateSalesReport',adminAuth,generateSalesReport)
// router.get('/salesChart',adminAuth,sales_Chart)
router.post('/generateSalesReport', generateSalesReportController);







export default router;
