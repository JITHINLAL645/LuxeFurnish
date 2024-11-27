import User from "../../models/userschema.js";


const customerInfo = async (req, res) => {
    try {
        let search = "";
        if (req.query.search) {
            search = req.query.search;
        }

        let page = 1;
        if (req.query.page) {
            page = parseInt(req.query.page);
        }

        const limit = 3;

        // Fetch customer data with pagination and search functionality
        const userData = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } }, 
                { email: { $regex: ".*" + search + ".*", $options: "i" } }  
            ]
        })
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();

        // Count total customers matching the search query for pagination
        const count = await User.countDocuments({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } }
            ]
        });

        // Render the customer view with the customer data and pagination info
        res.render("admin/customers", {
            data: userData,            
            totalPages: Math.ceil(count / limit), 
            currentPage: page,          
            search                     
        });

    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).send('Server Error');
    }
};

const customerBlocked = async (req, res) => {
    try {
        let id = req.query.id;
        await User.updateOne({ _id: id }, { $set: { isBlocked: true } });
        res.redirect("/admin/users");  
    } catch (error) {
        console.error(error);
        res.redirect("/pageNotFound");
    }
};

// Controller to unblock customer
const customerunBlocked = async (req, res) => {
    try {
        let id = req.query.id;
        await User.updateOne({ _id: id }, { $set: { isBlocked: false } });
        res.redirect("/admin/users");  
    } catch (error) {
        console.error(error);
        res.redirect("/pageNotFound");
    }
};

export{
    customerInfo,
    customerBlocked,
    customerunBlocked
}