import mongoose, { Schema, model } from "mongoose";
import { v4 as uuidv4 } from 'uuid';

const orderSchema= new Schema({
    orderId:{
        type:String,
        default:()=>uuidv4(),
        unique:true
    },
    orderItems:[{
        product:{
            type:Schema.Types.ObjectId,
            ref:"Product",
            required:true
        },
        quentity:{
            type:String,
            required:true
        },
        price:{
            type:Number,
            default:0
            
        }
    }],
    totalPrice:{
        type:Number,
        required:true
    },
    discount:{
        type:Number,
default:0
    },
    finalAmount:{
        type:Number,
        required:true
    },
    address:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    invoiceData:{
        type:Date,
     
    },
    status:{
        type:String,
        required:true,
        enum:['Pending','processing','shipped','Delivered','cancelled','Return Request','Returned']
    },
    createdOn:{
        type:Date,
        default:Date.now,
        required:true
    },
    couponApplied:{
        type:Boolean,
        default:false
    }
})

const order=mongoose.model("Order",CategorySchema)
export default order;