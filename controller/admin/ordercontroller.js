import Order from "../../models/orderSchema.js"







const loard_OrderMng = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = parseInt(req.query.limit) || 10; 
        const skip = (page - 1) * limit; 

        const [orders, totalOrders] = await Promise.all([
            Order.find()
                .populate({
                    path: 'orderItems.product',  // Corrected path to orderItems.product
                    select: 'name price'   // Select the fields you want to display
                })
                .populate('address')  // Populate address if required
                .sort({ createdAt: -1 })  // Sort by creation date (newest first)
                .skip(skip)  // Pagination skip
                .limit(limit),  // Limit number of records
            Order.countDocuments()  // Get total number of orders
        ]);

        console.log("email",orders);

        // Calculate total pages based on totalOrders and limit
        const totalPages = Math.ceil(totalOrders / limit);

        // If there are no orders, render an empty message but avoid an error
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
        console.log("sdfghjklkjhg",orders);
        

        // Render the order management page with fetched orders
        res.render('admin/order', {
            orders,
            title: 'Order Management',
            currentPage: page,
            totalPages,
            limit,
            error: null  // No error, so pass null for error
        });

    } catch (error) {
        console.error('Error loading orders:', error);
        // If there's an error, render with an error message
        res.render('admin/order', {
            orders: [],  // No orders to display
            title: 'Order Management',
            currentPage: 1,
            totalPages: 1,
            limit: 10,
            error: 'Failed to load orders. Please try again later.'  // Display the error
        });
    }
};



const getOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.id; // Get the order ID from the URL parameter
        const order = await Order.findById(orderId)
            .populate('orderItems.product')
            .populate('address');

        // Check if the order exists
        if (!order) {
            return res.status(404).render('admin/orderDetails', { error: 'Order not found' });
        }
console.log(order);

        // Pass the order object to the view
        res.render('admin/orderDetails', { order });
    } catch (error) {
        console.error('Error getting order details:', error);
        return res.status(500).render('admin/orderDetails', { error: 'Failed to load order details' });
    }
};





export{
    loard_OrderMng,
    getOrderDetails
}