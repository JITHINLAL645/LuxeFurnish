import User from "../../models/userschema.js";
import Order from "../../models/orderSchema.js";
import Category from "../../models/categorySchema.js"
import Product from "../../models/productSchema.js"
import mongoose from "mongoose";
import bcrypt from "bcrypt";

// admincontroller.js

const loadLogin = (req, res) => {
    if (req.session.isAdmin) {
        return res.redirect("/admin/dashboard");
    }

    res.render("admin/login", { message: null });
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await User.findOne({ email, isAdmin:true });
        if (admin) {
            const passwordMatch = await bcrypt.compare(password, admin.password);
            if (passwordMatch) {
                req.session.isAdmin = true;
                return res.redirect("/admin/dashboard")
            } else {
                return res.redirect("/admin/login")
            }
        } else {
            return res.redirect("/admin/login")
        }
    } catch (error) {
        console.log("login error", error);
        return res.redirect("/user/pagenotfound")

    }
}


// const loadDashboard = async (req, res) => {
//     if (req.session.isAdmin) {
//         try {
//             res.render("admin/dashboard"); 
//         } catch (error) {
//             console.log("Dashboard error:", error);
//             //res.redirect("/user/pagenotfound");
//         }
//     } else {
//         res.redirect("/admin/login"); 
//     }
// };


const loadDashboard = async (req, res) => {
    if (req.session.isAdmin) {
        try {
            // Fetching categories, products, and orders from the database
            const categories = await Category.find();
            const products = await Product.find(); 
            const orders = await Order.find();

            // Calculate sales count for products based on order items
            const productSalesCount = products.map((product) => {
                const sales = orders.reduce((total, order) => {
                    const item = order.orderItems.find(item => item.product.toString() === product._id.toString());
                    if (item) {
                        total += item.quantity; // Add quantity sold in this order
                    }
                    return total;
                }, 0);
                return {
                    ...product.toObject(),
                    saleCount: sales
                };
            });

            // Sort products by sales count in descending order and get the top 3
            const topProducts = productSalesCount.sort((a, b) => b.saleCount - a.saleCount).slice(0, 3);

            // Calculate sales count for categories based on products
            const categorySalesCount = categories.map((category) => {
                const sales = productSalesCount.filter(product => product.category_id.toString() === category._id.toString())
                    .reduce((total, product) => total + product.saleCount, 0);
                return {
                    ...category.toObject(),
                    saleCount: sales
                };
            });

            // Sort categories by sales count in descending order and get the top 3
            const topCategories = categorySalesCount.sort((a, b) => b.saleCount - a.saleCount).slice(0, 3);

            // Pass categories, products, and orders to the template
            res.render("admin/dashboard", { 
                category: topCategories, 
                products: topProducts, 
                orders: orders // Pass orders if needed
            });

        } catch (error) {
            console.log("Error:", error);
            res.render("admin/dashboard", { 
                category: [], 
                products: [], 
                orders: [] // Pass empty array for orders in case of error
            });
        }
    } else {
        res.redirect("/admin/login");
    }
};

  








const logout = (req, res) => {
    req.session.destroy()
    res.redirect("/admin/login")

    /* try {
        req.session.destroy(err=>{
            if(err){
                console.log("Error destroying session");
                return res.redirect("/pagenotfound")
            }
            res.redirect("/admin/login")
        })
    } catch (error) {
        console.log("unexpected error during",error);
        res.redirect("/pagenotfound")
        
    } */
}



export {
    loadLogin,
    login,
    loadDashboard,
    logout,
    
};
