import moongose from 'mongoose'

const catSchema = new moongose.Schema({
    name: String
})

const catModel = moongose.model('acdasc',catSchema)

export default catModel;
