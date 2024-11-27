import mongoose from 'mongoose'

const categorySchema = mongoose.Schema({
    category_name: {
        type: String
    }
});



const category = mongoose.model("category", categorySchema)
export default category