const Record = require('../models/record.model');
const csv = require('csvtojson');
var path = require('path');
// Retrieve and return all records from the database.
exports.findAll = (req, res) => {
    Record.find()
        .then(records => {
            res.send(records);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Something went wrong while getting list of records."
            });
        });
};
// Create and Save a new Record
exports.create = (req, res) => {
    // Validate request
    if (!req.body) {
        return res.status(400).send({
            message: "Please fill all required field"
        });
    }
    // Create a new Record
    const record = new Record({
        fileName: req.body.fileName,
        invoiceId: req.body.invoiceId,
        invoiceAmount: req.body.invoiceAmount,
        dueDate: req.body.invoiceAmount,
        sellingPrice: req.body.sellingPrice
    });
    // Save record in the database
    record.save()
        .then(data => {
            res.send(data);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Something went wrong while creating new record."
            });
        });
};


// Find a single Record with a id
exports.findOne = (req, res) => {
    Record.findById(req.params.id)
        .then(record => {
            if (!record) {
                return res.status(404).send({
                    message: "Record not found with id " + req.params.id
                });
            }
            res.send(record);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).send({
                    message: "Record not found with id " + req.params.id
                });
            }
            return res.status(500).send({
                message: "Error getting record with id " + req.params.id
            });
        });
};
// Update a Record identified by the id in the request
exports.update = (req, res) => {
    // Validate Request
    if (!req.body) {
        return res.status(400).send({
            message: "Please fill all required field"
        });
    }
    // Find record and update it with the request body
    Record.findByIdAndUpdate(req.params.id, {
            fileName: req.body.fileName,
            invoiceId: req.body.invoiceId,
            invoiceAmount: req.body.invoiceAmount,
            dueDate: req.body.invoiceAmount,
            sellingPrice: req.body.sellingPrice
        }, {
            new: true
        })
        .then(record => {
            if (!record) {
                return res.status(404).send({
                    message: "record not found with id " + req.params.id
                });
            }
            res.send(record);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).send({
                    message: "record not found with id " + req.params.id
                });
            }
            return res.status(500).send({
                message: "Error updating record with id " + req.params.id
            });
        });
};
// Delete a Record with the specified id in the request
exports.delete = (req, res) => {
    Record.findByIdAndRemove(req.params.id)
        .then(record => {
            if (!record) {
                return res.status(404).send({
                    message: "record not found with id " + req.params.id
                });
            }
            res.send({
                message: "record deleted successfully!"
            });
        }).catch(err => {
            if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                return res.status(404).send({
                    message: "record not found with id " + req.params.id
                });
            }
            return res.status(500).send({
                message: "Could not delete record with id " + req.params.id
            });
        });
};


// Retrieve and return all records from the database.
exports.uploadFile = async (req, res) => {
    const file = req.file
    if (!file) {
        return res.status(404).send({
            message: "No File Selected "
        });
    }
    const jsonArray = await convertCSVToJSON(path.join(__dirname, "../../", file.path));
    let validData = [];
    let inValidData = [];
    let thirtyDays = 1000 * 30 * 30 * 24 * 30;
    console.log(".jsonArray....", jsonArray);
    jsonArray.map(item => {
        if (item.invoiceId && item.invoiceAmount && item['due on']) {
            let dueDate = new Date(item['due on'])
            let coefficient = dueDate.getTime() - Date.now() > thirtyDays ? 0.5 : 0.3;
            const record = new Record({
                invoiceId: item.invoiceId,
                invoiceAmount: item.invoiceAmount,
                dueDate: item['due on'],
                sellingPrice: item.invoiceAmount * coefficient
            });
            validData.push(record);
        } else {
            inValidData.push(item);
        }
    });
    if (inValidData.length === 0 && validData.length > 0) {
        // Save record in the database
        Record.insertMany(validData)
            .then(data => {
                console.log("...valid data....", data);
                return res.send(data);
            }).catch(err => {
                return res.status(500).send({
                    message: err.message || "Something went wrong while creating new record."
                });
            });
    } else {
        return res.status(500).send({
            message: "File records are not properly formatted! Try again with properly formmated file."
        });
    }
};


async function convertCSVToJSON(csvFilePath) {
    try {
        const jsonArray = await csv().fromFile(csvFilePath, {
            encoding: 'utf8'
        });
        return jsonArray;
    } catch (error) {
        console.log("..error.......convertCSVToJSON", error);
    }
}