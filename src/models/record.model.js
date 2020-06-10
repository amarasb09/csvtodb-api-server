const mongoose = require('mongoose');

const RecordSchema = mongoose.Schema({
    fileName: String,
    invoiceId: String,
    invoiceAmount: Number,
    dueDate: String,
    sellingPrice: Number
}, {
    timestamps: true
});

module.exports = mongoose.model('Record', RecordSchema);