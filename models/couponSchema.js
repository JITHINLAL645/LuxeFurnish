import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true, 
  },
  users: [{
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
          }
}],
  // offerPrice: {  
  //   type: Number,
  //   required: true,
  // },
  expiration: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true, 
  },
  usageCount: {
    type: Number,
    default: 0, 
  },
  maxAmount: {
    type: Number,
    required: true, 
  },
  discount:{
type:Number,
require:true
  },
  description:{
type:String,
require:true,
  },
  minAmount:{
    type:Number,
    required:true,
  }
}, {
  timestamps: true, 
});

const Coupon = mongoose.model('Coupon', CouponSchema);
export default Coupon;
