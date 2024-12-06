// import mongoose from 'mongoose';

//  const { Schema } = mongoose;  // Destructure Schema from mongoose

// const categorySchema = new Schema({
//     category_name: {
//         type: String,
//         required: true  // It's a good idea to specify required fields
//     },
//     offer: {
//         type: Schema.Types.ObjectId,
//         ref: 'Offer'  // Reference to the Offer model
//     },
// });

// const Category = mongoose.model('Category', categorySchema);  // Model name should be capitalized by convention

// export default Category;
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
