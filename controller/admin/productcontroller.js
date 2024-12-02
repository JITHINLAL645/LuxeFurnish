import product from '../../models/productSchema.js';
import category from '../../models/categorySchema.js'




export const loadProductPage = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 6;
      const skip = (page - 1) * limit;
      
    //   if (req.session.isAdmin) {
        const [products, totalProducts] = await Promise.all([
          product.find().skip(skip).limit(limit),
          product.countDocuments()
        ]);
        const totalPages = Math.ceil(totalProducts / limit);
        res.render("admin/product", {
          Product: products,
          title: "Product Management",
          currentPage: page,
          totalPages,
          limit
        });
    //   } else {
        // res.redirect("/admin/loadAdminDash");
    // }
    } catch (error) {
      console.error(error);
      res.status(500).json({ err: "Something went wrong while loading products" });
    }
  };
  
  
//Add Product Page Section
export const addProductPage =async (req, res) => {
 
  const Category = await category.find({isDeleted:false});
  console.log(Category)
  res.render("admin/addProduct", { Category,title:'add Product'});
      /* if (req.session.isAdmin) {
      const Category = await category.find({isDeleted:false});
      res.render("admin/addProduct", { Category,title:'add Product'});
    } else {
      res.redirect("/admin/addProductPage");
    } */
  }
//Add Product Section
export const add_Product = async (req, res) => {
  console.log(req.body); // Log the request body to check incoming data
  
  try {
    const { productName, Category_id, description, stock, price, specifications } = req.body;
    const images = req.files || []; // Ensure images is always an array
    console.log('images : ', images);
    

    // Check if the product already exists
    const existProduct = await product.findOne({ productname: productName });
    if (existProduct) {
      return res.status(400).json({ error: "Product already exists" });
    }

    console.log('spec',specifications);

    // Parse specifications safely
    let parsedSpecifications;
    try {
      parsedSpecifications = JSON.parse(specifications);
    } catch (parseError) {
      return res.status(400).json({ error: "Invalid JSON format for specifications" });
    }

    console.log('p',parsedSpecifications);

    // Handle images and convert to relative paths
    let Images = [];
    if (images.length > 0) {
      images.forEach(image => {
        const relativePath = image.path.replace(/^.*[\\\/]Public[\\\/]uploads[\\\/]/, '/uploads/');
        Images.push(relativePath);
      });
    }

    // Create new product
    const newProduct = new product({
      productname: productName,
      category_id: Category_id, // Use the correct and consistent naming
      description,
      stock,
      price,
      images: Images,
      specifications: parsedSpecifications,
    });

    console.log('newProducts addded');
    

    // Save product to the database
    await newProduct.save();

    console.log('product saved');
    
    res.status(200).json({ success: true, message: "Product added successfully" });
    console.log("Product added successfully");

  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Error adding product' });
  }
};



//Edit Product Page Loading Section
export const loadEditProductPage  = async (req, res) => {
  try {
    const productId = req.params.id; 
    const Product = await product.findById(productId).populate('category_id')
    const Category=await category.find({isDeleted:false})
    if (!Product) {
      return res.status(404).send('Product not found');
    }
    res.render('admin/editProduct', { Product,Category});
  } catch (error) {
    console.error('Error loading edit page:', error);
    res.status(500).send('Error loading product edit page');
  }
};






export const editProduct = async (req, res) => {
  console.log("dfghjk");
  
  try {  
    console.log("awsedcrfvtgbyhnjm",req.body);
     
    const productId = req.params.id;
    const { productName, Category_id,price,stock,description} = req.body;
    const images = req.files;
    const existingProduct = await product.findById(productId);
    if (!existingProduct) {
      return res.status(404).send('Product not found');
    }
    existingProduct.productname = productName;
    existingProduct.category_id = Category_id;
    existingProduct.description = description;
    existingProduct.stock = stock;
    existingProduct.price = price;
    if (images && images.length > 0) {
      let updatedImages = [];
      images.forEach(image => {
        const relativePath = image.path.replace(/^.*[\\\/]public[\\\/]uploads[\\\/]/, '/uploads/');
        updatedImages.push(relativePath);
      });
      existingProduct.images = updatedImages;
    }
    await existingProduct.save();
    
    res.redirect('/admin/products');
    console.log("Product updated successfully");

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).send('Error updating product');
  }
};



export const delete_Product  = async (req, res) => {
  console.log(req.params)
  //if (req.session.isAdmin) {

    try {
      const { productId } = req.params;
      console.log(productId)
      await product.findByIdAndUpdate(productId, { isDelete: true });
      res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (err) {
      console.error("Something went wrong while deleting the product");
      res.status(500).json({ success: false, err: "Error deleting product" });
    }
  /* } else {
    res.redirect("/admin/login");
  } */
};




export const restore_Product = async (req, res) => {
    try {
      const { productId } = req.params;
      
      // Fetch the product and populate the category
      const Product = await product.findById(productId).populate('category_id');
      
      // Check if the category is deleted
      if (Product.category_id.isDeleted) {
        return res.status(400).json({ success: false, message: 'Category of this product is deleted' });
      }

      // Restore the product
      await product.findByIdAndUpdate(productId, { isDelete: false });
      
      // Respond with success message
      return res.status(200).json({ success: true, message: "Product restored successfully" });
    
    } catch (err) {
      console.error("Error restoring product:", err);  // Log the error to see the exact issue
      return res.status(500).json({ success: false, message: "An unexpected error occurred", error: err.message });
    }
};


// In your controller/admin/admincontroller.js
export const loadAdminDash = (req, res) => {
    if (req.session.isAdmin) {
      res.render("admin/dashboard", { title: "Admin Dashboard" });
    } else {
      res.redirect("/admin/login");
    }
  };



  

// export{
//     loadProductPage,
//     add_Product,
//     loadEditProductPage,
//     editProduct,
//     delete_Product,
//     restore_Product
//   };