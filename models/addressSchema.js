import mongoose from "mongoose";
const { Schema } = mongoose;

// Updated address schema to match the EJS form fields
const addressSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User", // Reference to the User model
        required: true
    },
    address: [
        {
            firstName: {
                type: String,
                required: true
            },
            lastName: {
                type: String,
                required: true
            },
            addressLine: {
                type: String,
                required: true
            },
            place: {
                type: String,
                required: true
            },
            street: {
                type: String,
                required: false
            },
            city: {
                type: String,
                required: true
            },
            district: {
                type: String,
                required: true
            },
            state: {
                type: String,
                required: true
            },
            country: {
                type: String,
                required: true
            },
            pincode: {
                type: String, 
                required: true
            },
            phoneNumber: {
                type: String,
                required: true
            },
            altPhoneNumber: {
                type: String,
                required: false
            },
            email: {
                type: String,
                required: true
            }
        }
    ]
});

const Address = mongoose.model("Address", addressSchema);
export default Address;
