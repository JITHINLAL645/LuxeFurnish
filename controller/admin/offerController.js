import Offer from '../../models/offerSchema.js';  // Correct path to the 'Offer' model
import Product from '../../models/productSchema.js';
import Category from '../../models/categorySchema.js';

const loadoffer = async (req, res) => {
    try {
        // Fetch all offers (including active ones)
        const offer = await Offer.find();

        // Fetch offers that are active (not deleted and started)
        const selectoffer = await Offer.find({ isDelete: false, offerStartDate: { $lte: new Date() } });

        // Fetch products and categories, including the associated offers (populate offer field)
        const products = await Product.find({ isDelete: false }).populate('offer');  // Populate offer field for products
        const categories = await Category.find({ isDeleted: false }).populate('offer');  // Populate offer field for categories

        // Render the offerProductPage view with necessary data
        res.render('admin/offerProductPage', {
            title: 'Offer Management',
            offer,
            category: categories,  // Pass the fetched categories
            product: products,  // Pass the fetched products
            selectoffer
        });
    } catch (error) {
        // Log the error and send a response with a 500 status if something goes wrong
        console.error('Error fetching offer, category, or product data:', error);
        res.status(500).send('Error retrieving data');
    }
};


const addOffer_Product=async(req,res)=>{
    try {
        const nameRegex = /^[a-zA-Z\s\-]+$/;
        const { offerName, offerPercentage, offerStartDate } =req.body;
        const currentDate = new Date();
  
        if (!offerName) {
          return res.json({ success: false, error: "offer name is empty" });
        }
  
        if (offerName.length < 2) {
          return res.json({
            success: false,
            error: "Name must need minimum 2 characters.",
          });
        }
  
        if (!nameRegex.test(offerName)) {
          return res.json({
            success: false,
            error: "Name should not contain numbers or special characters.",
          });
        }
  
        if (!offerPercentage) {
          return res.json({ success: false, error: "offerPercentage is empty" });
        }
  
        if (isNaN(offerPercentage)) {
          return res.json({
            success: false,
            error: "Percentage must be a number.",
          });
        }
  
        if (offerPercentage < 1 || offerPercentage > 100) {
          return res.json({
            success: false,
            error: "Percentage not more than 100 and less than 0",
          });
        }
  
        if (offerPercentage !== Math.floor(offerPercentage)) {
          return res.json({
            success: false,
            error: "Percentage must be a whole number.",
          });
        }
  
        if (!offerStartDate) {
          return res.json({ success: false, error: "offerStartDate is empty" });
        }
        if (offerStartDate < currentDate) {
          return res.json({
            success: false,
            error: "Start date cannot be in the past.",
          });
        }
        const newOffer = new Offer({
          offerName: offerName,
          offerPercentage: offerPercentage,
          offerStartDate: new Date(offerStartDate),
         
        });
  
        await newOffer.save();
        res.json({ success: true, message: "new offer addedd successfully" });
      
    } catch (error) {
      console.error("Error occurred while adding new offer:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };


  const edit_Offer=async(req,res)=>{
    try {
      const { editOfferId, editOfferName, editOfferPercentage, editOfferStartDate }=req.body
      if(!editOfferName){
        return res.status(200).json({success:false,message:"Offer name is empty"})
      }
      if(!editOfferPercentage){
        return res.json({success:false,error:'offer discount is empty'})
    }
    let discountValue = parseInt(editOfferPercentage);
    if (isNaN(discountValue)) {      
        return res.json({success:false,error:'discount must be a number.'})
    }
    if (discountValue < 1 || discountValue > 100) {
      return res.json({success:false,error:'discount not more than 100 and less than 0'})
  }
  if (discountValue !== Math.floor(discountValue)) {
      return res.json({ success: false, error: 'Discount must be a whole number.' });
  }
  const currentDate = new Date()

        if (editOfferStartDate < currentDate) {
            return res.json({success:false,error:'Start date cannot be in the past'})
        }
        await Offer.findByIdAndUpdate(editOfferId,{
            
          offerName:editOfferName,
          offerPercentage:discountValue,
          offerStartDate:new Date(editOfferStartDate),
       })
      res.json({success:true,message:'Offer edited successfully'})
    } catch (error) {
      console.error("Error occurred while adding new offer:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }



  const delete_Offer=async (req, res) => {
    try {
        const { id } = req.params;
        const offer = await Offer.findById(id);
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }
        offer.isDelete=true
        await offer.save();
        res.status(200).json({ success: true, message: 'Offer deleted successfully' });
    } catch (error) {
        console.error('Error deleting offer:', error);
        res.status(500).json({ success: false, message: 'Failed to delete offer' });
    }
  };

  const restore_Offer=async (req, res) => {
    try {
        const { id } = req.params;
        const offer = await Offer.findById(id);
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }
        if (!offer.isDelete) {
            return res.status(400).json({ success: false, message: 'Offer is not deleted' });
        }
        offer.isDelete = false;
        await offer.save();
        res.status(200).json({ success: true, message: 'Offer restored successfully' });
    } catch (error) {
        console.error('Error restoring offer:', error);
        res.status(500).json({ success: false, message: 'Failed to restore offer' });
    }
  };


  const update_ProductOffer = async (req, res) => {
    try {
      const { productId, offerId} = req.body;
      const product = await Product.findOne({_id: productId});
      const offer = await Offer.findById(offerId);
      if (!product) {
        return res.json({ success: false, error: "product not found" });
      }
      if(productId===offerId){
        product.offer=null
        product.discount_price=0
        await product.save();
        return res.json({ success: true, message: "product offer successfully removed" });
      }
      if (!offer) {
        return res.json({ success: false, error: "offer not found" });
      }
      const discountPrice = Math.floor(
        product.price - (product.price * offer.offerPercentage) / 100
      );
      product.discount_price = discountPrice;
      product.offer = offerId;
      await product.save();
      res.json({ success: true, message: "product offer successfully updated" });
    } catch (error) {
      console.log("Error occurred while updating offer:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };



  const update_CategoryOffer = async (req, res) => {
    try {
      const { categoryId, offerId } = req.body;
      const category = await Category.findOne({ _id: categoryId });
      const offer = await Offer.findById(offerId)
  
      if (!category) {
        return res.json({ success: false, error: "Category not found" });
      }
      if(categoryId===offerId){
        category.offer=null
        category.discount_price=0
        await category.save();
        const products = await Product.find({ category_id: categoryId });
        for (let product of products){
          product.offer = null; 
          product.discount_price = 0; 
          await product.save(); 
        }
        return res.json({ success: true, message: "product offer successfully removed" });
      }
      if (!offer) {
        return res.json({ success: false, error: "offer not found" });
      }
      if (!offer) {
        return res.json({ success: false, error: "Offer not found" });
      }
  
      const products = await Product.find({ category_id: categoryId }).populate('offer');
  
      if (products.length === 0) {
        return res.json({ success: false, error: "No products found for this category" });
      }
  
      for (let product of products) {
        let productChanged = false;
        let bestOffer = null;
  
        if (offer && !offer.isDelete) {
          bestOffer = {
            percentage: offer.offerPercentage,
            type: "category",
          };
        }
  
        if (product.offer && product.offer instanceof Object && !product.offer.isDelete) {
          const productOffer = product.offer;
          if (
            productOffer.offerPercentage > (bestOffer ? bestOffer.percentage : 0)
          ) {
            bestOffer = {
              percentage: productOffer.offerPercentage,
              type: "product",
            };
          }
        }
  
        if (bestOffer) {
          const discountPrice = Math.floor(
            product.price - (product.price * bestOffer.percentage) / 100
          );
  
          if (
            product.discount_price !== discountPrice ||
            String(product.offer) !== (bestOffer.type === "category" ? String(offer._id) : String(product.offer))
          ) {
            product.discount_price = discountPrice;
            product.offer = bestOffer.type === "category" ? offer._id : product.offer;
            productChanged = true;
          }
        } else {
          product.offer = null;
          product.discount_price = 0;
        }
  
        if (productChanged) {
          await product.save();
        }
      }
  
      category.offer = offerId;
      await category.save();
      res.json({ success: true, message: "Category offer successfully updated" });
    } catch (error) {
      console.error("Error occurred while updating offer:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  

export { loadoffer,
    addOffer_Product,
    edit_Offer,
    delete_Offer,
    restore_Offer,
    update_ProductOffer,
    update_CategoryOffer
};
