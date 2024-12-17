import Order from "../../models/orderSchema.js"
import Product from "../../models/productSchema.js";
import category from "../../models/categorySchema.js";
import Wallet from "../../models/walletSchema.js"




const loard_OrderMng = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = parseInt(req.query.limit) || 10; 
        const skip = (page - 1) * limit; 

        const [orders, totalOrders] = await Promise.all([
            Order.find()
                .populate({
                    path: 'orderItems.product',
                    select: 'name price'  
                })
                .populate('address') 
                .sort({ createdAt: -1 })  
                .skip(skip) 
                .limit(limit), 
            Order.countDocuments()  
        ]);

        // console.log("email",orders);

        const totalPages = Math.ceil(totalOrders / limit);

        if (!orders || orders.length === 0) {
            return res.render('admin/order', {
                orders: [],
                title: 'Order Management',
                currentPage: page,
                totalPages,
                limit,
                error: 'No orders found.'
            });
        }
        // console.log("sdfghjklkjhg",orders);
        

        res.render('admin/order', {
            orders,
            title: 'Order Management',
            currentPage: page,
            totalPages,
            limit,
            error: null  
        });

    } catch (error) {
        console.error('Error loading orders:', error);
        res.render('admin/order', {
            orders: [], 
            title: 'Order Management',
            currentPage: 1,
            totalPages: 1,
            limit: 10,
            error: 'Failed to load orders. Please try again later.'  
        });
    }
};



const getOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.id; 
        const order = await Order.findById(orderId)
            .populate('orderItems.product')
            .populate('address');

        if (!order) {
            return res.status(404).render('admin/orderDetails', { error: 'Order not found' });
        }
// console.log(order);

        res.render('admin/orderDetails', { order });
    } catch (error) {
        console.error('Error getting order details:', error);
        return res.status(500).render('admin/orderDetails', { error: 'Failed to load order details' });
    }
};


const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;

        const order = await Order.findById(orderId).populate('orderItems.product'); // Populate the product details
        // console.log("order", order);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Initialize orderStatusTimestamps if it doesn't exist
        if (!order.orderStatusTimestamps) {
            order.orderStatusTimestamps = {};
        }

        // Check for cancellation
        if (status === 'Cancelled' && order.status !== 'Cancelled') {
                    // console.log("order", status);

            for (const item of order.orderItems) {
                await Product.findByIdAndUpdate(
                    item.product._id,
                    { $inc: { stock: item.quantity } }
                );
            }
        }

        // Handle delivery status
        if (status === 'Delivered') {
            // console.log('status',status);
            
            order.paymentStatus = 'Paid';
            order.status=status
            
            // Check if 'deliveredDate' exists, if not, initialize it
            if (!order.deliveredDate) {
                order.deliveredDate = new Date();
            }

            for (const item of order.orderItems) {
                await Product.findByIdAndUpdate(
                    item.product._id,
                    { $inc: { saleCount: item.quantity } }
                );
                await category.findByIdAndUpdate(
                    item.product.category,
                    { $inc: { saleCount: item.quantity } } // Assuming `category` is the field linking to the Category model
                );
            }
        }

        // Handle refund for cancelled orders
        if (status === 'Cancelled') {
            if (order.paymentStatus === "Paid") {
                const refund = order.totalPrice;
                let wallet = await Wallet.findOne({ user: order.user });
                if (!wallet) {
                    wallet = new Wallet({
                        user: order.user,
                        balanceAmount: 0,
                        wallet_history: [],
                    });
                }
                wallet.balanceAmount += refund;
                wallet.wallet_history.push({
                    date: new Date(),
                    amount: refund,
                    description: `Refund for cancelled item (Order ID: ${order.orderId})`,
                    transactionType: "credited",
                });
                await wallet.save();
            }
        }

        if (order.status === 'Returned') {
            return res.status(400).json({ message: "Cannot modify a returned order" });
        }

        // Update the order status
        order.status = status;

        // Update orderStatusTimestamps for the new status
        order.orderStatusTimestamps[status.toLowerCase()] = new Date();

        const updatedOrder = await order.save();

        res.json({ success: true, message: 'Order status updated successfully', order: updatedOrder });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Failed to update order status' });
    }
};




export{
    loard_OrderMng,
    getOrderDetails,
    updateOrderStatus
}