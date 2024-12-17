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
            // Fetching categories, products, and all orders from the database
            const categories = await Category.find();
            const products = await Product.find();
            const allOrders = await Order.find(); // Fetch all orders (for listing)

            // Filter "Delivered" orders for best-selling calculations
            const deliveredOrders = allOrders.filter(order => order.status === 'Delivered');

            // Calculate sales count for products based on delivered order items
            const productSalesCount = products.map((product) => {
                const sales = deliveredOrders.reduce((total, order) => {
                    const item = order.orderItems.find(item => item.product.toString() === product._id.toString());
                    if (item) {
                        total += item.quantity; // Add the quantity sold in this delivered order
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

            // Pass categories, products, and orders (all orders) to the template
            res.render("admin/dashboard", { 
                category: topCategories, 
                products: topProducts, 
                orders: allOrders // Pass all orders for the listing
            });

        } catch (error) {
            console.log("Error:", error);
            // In case of an error, send empty arrays for categories, products, and orders
            res.render("admin/dashboard", { 
                category: [], 
                products: [], 
                orders: [] 
            });
        }
    } else {
        // Redirect to login page if not an admin
        res.redirect("/admin/login");
    }
};

const orderChart = async (req, res) => {
    const { view } = req.body; // Access the 'view' from the request body
    console.log('Fetching orders for view:', view);

    try {
        // Calculate the start date based on the selected view
        let startDate, endDate;
        const currentDate = new Date();

        if (view === 'monthly') {
            // Start of the current month
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            // End of the current month (Last date of the current month)
            endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        } else if (view === 'yearly') {
            // Start of the current year
            startDate = new Date(currentDate.getFullYear(), 0, 1);
            // End of the current year (December 31st)
            endDate = new Date(currentDate.getFullYear(), 11, 31);
        }

        // Fetch only 'Delivered' orders within the time range
        const orders = await Order.find({
            createdOn: { $gte: startDate, $lte: endDate },
            status: 'Delivered'
        });

        console.log('Fetched Orders:', orders); // Log the fetched orders for debugging

        // Create an array to store the count of delivered orders for each month or year
        let orderCounts = [];

        if (view === 'monthly') {
            // Count orders for each month in the current year
            orderCounts = Array(12).fill(0);
            orders.forEach(order => {
                const orderDate = new Date(order.createdOn);
                const monthIndex = orderDate.getMonth();
                if (orderDate.getFullYear() === currentDate.getFullYear()) {
                    orderCounts[monthIndex]++;
                }
            });
        } else if (view === 'yearly') {
            // Count orders for each year
            orderCounts = Array(3).fill(0); // Example: for 2024, 2025, 2026
            orders.forEach(order => {
                const orderDate = new Date(order.createdOn);
                const yearIndex = orderDate.getFullYear() - 2024; // Adjust if your data spans multiple years
                if (yearIndex >= 0 && yearIndex < 3) {
                    orderCounts[yearIndex]++;
                }
            });
        }

        // Send the order counts to the client
        res.json(orderCounts);

    } catch (error) {
        console.log('Error in fetching order chart data:', error);
        res.status(500).json({ error: 'Failed to fetch order data' });
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
    orderChart
};
