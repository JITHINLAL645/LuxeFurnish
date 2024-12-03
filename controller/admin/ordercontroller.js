import Order from "../../models/orderSchema.js"







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

        console.log("email",orders);

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
        console.log("sdfghjklkjhg",orders);
        

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
console.log(order);

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