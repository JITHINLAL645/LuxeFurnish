import mongoose from 'mongoose';

const salesReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,  // Reference to the User model
    ref: 'User',
    required: true
  },
  reportDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  totalSales: {
    type: Number,
    required: true
  },
  itemsSold: [{
    productName: String,
    quantity: Number,
    price: Number
  }],
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  }
});

// Export the SalesReport model using ES6 export syntax
const SalesReport = mongoose.model('SalesReport', salesReportSchema);
export default SalesReport;
