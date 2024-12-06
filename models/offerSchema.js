import mongoose from 'mongoose'
const { Schema } = mongoose;

const offerSchema = new mongoose.Schema({
    offerName:{
        type:String,
        required:true
    },
    offerPercentage:{
        type:Number,
        required:true
    },
    offerStartDate:{
        type:Date,
        required:true
    },
    isDelete:{
        type:Boolean,
        default:false
    }
});

const Offer = mongoose.model('Offer',offerSchema)

export default Offer