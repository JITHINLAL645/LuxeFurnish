
import mongoose from 'mongoose'
const { Schema } = mongoose;  // Destructure Schema from mongoose

const categorySchema = mongoose.Schema({
    category_name: {
        type: String
    },
    offer: {
        type: Schema.Types.ObjectId,
        ref: 'Offer'  // Reference to the Offer model
    },
});



const category = mongoose.model("category", categorySchema)
export default category 
