import mongoose, { Schema, model } from "mongoose";
import { v4 as uuidv4 } from 'uuid'; 

const orderSchema = new mongoose.Schema({ 
    user: { 
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true 
      },
    orderId: {
        type: String,
        default: () => uuidv4(),
        unique: true
    },
    orderItems: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            default: 0
        }
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    finalAmount: {
        type: Number,
        required: true
    },
    address: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        addressLine: { type: String, required: true },
        city: { type: String, required: true },
        district: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true },
        pincode: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        altPhoneNumber: { type: String },
        email: { type: String, required: true }
    },
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Return Request', 'Returned'],
        default: 'Pending'
    },
    paymentStatus:{
        type:String,
        default:'Pending',
        enum:['Pending','Paid','Failed','Returned']
    },
    createdOn: {
        type: Date,
        default: Date.now,
        required: true
    },
    couponApplied: {
        type: Boolean,
        default: false
    }
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
