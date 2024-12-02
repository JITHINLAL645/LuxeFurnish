import Order from "../../models/orderSchema.js"
const loard_OrderMng = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = parseInt(req.query.limit) || 10; 
        const skip = (page - 1) * limit; 

        const [orders, totalOrders] = await Promise.all([
            Order.find()
                .populate('user', 'name email') 
                .populate('items.product') 
                .populate('address') 
                .sort({ createdAt: -1 }) 
                .skip(skip) 
                .limit(limit), 
            Order.countDocuments() 
        ]);

        const totalPages = Math.ceil(totalOrders / limit);

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
            error: 'Failed to load orders' 
        });
    }
};



export{
    loard_OrderMng
}