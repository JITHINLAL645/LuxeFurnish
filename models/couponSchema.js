import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true, // Ensures that each coupon code is unique
  },
  // offerPrice: {  // Changed 'discount' to 'offerPrice' for clarity
  //   type: Number,
  //   required: true,
  // },
  expiration: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,  // Defaults to true (active coupon)
  },
  usageCount: {
    type: Number,
    default: 0,  // Defaults to 0 when the coupon is first created
  },
  maxAmount: {
    type: Number,
    required: true, // Ensures maxUses is always provided
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
  timestamps: true, // Adds 'createdAt' and 'updatedAt' fields automatically
});

const Coupon = mongoose.model('Coupon', CouponSchema);
export default Coupon;
