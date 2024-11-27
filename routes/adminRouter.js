import express from "express";
import { loadLogin, login, loadDashboard, logout } from "../controller/admin/admincontroller.js";
import { customerInfo, customerBlocked, customerunBlocked } from "../controller/admin/customercontroller.js";
import { restore_Category, delete_Category, edit_Category, add_Category, load_CategoryPage, } from "../controller/admin/categorycontroller.js"
import { loadProductPage, addProductPage, loadAdminDash, add_Product, loadEditProductPage, editProduct, delete_Product, restore_Product } from "../controller/admin/productcontroller.js";

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



export default router;
