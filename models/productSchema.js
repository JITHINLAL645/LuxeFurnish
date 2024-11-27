import mongoose, { model } from "mongoose";
import { Schema } from "mongoose";


const productSchema = mongoose.Schema({
  productname: {
    type: String,
    required: true,
    trim: true
  },
  isDelete: {
    type: Boolean,
    default: false
},
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref:"category",
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  images: {
    type: [String],
     required: true 
  },
  offer:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Offer'
},
discount_price:{
  type:Number,
  default:0
},
  specifications: [
    {
        key: String,
        value: String
    }
]
}, { timestamps: true });
const Product = mongoose.model('Product', productSchema);

export default Product;