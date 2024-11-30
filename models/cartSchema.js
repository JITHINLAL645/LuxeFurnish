import mongoose from 'mongoose';

const { Schema } = mongoose;

const cartSchema = new Schema({
  user: { 
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true 
  },
  items: [
    {
      product: { 
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true 
      },
      quantity: { 
        type: Number,
        required: true, 
        default: 1 
      },
      price:{
        type: Number,
        required:true
      }
    },
  ],
  isDelete: { 
    type: Boolean,
    default: false 
  },
});

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
