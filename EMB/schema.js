const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const embSchema = new Schema ({
    Temperature: {
        type: Number,
        required: true
    },
    Humidity: {
        type: Number,
        required: true
    },
    saveDate: {
        type: String,
        required: true
    }
});

const modelSchema = mongoose.model('data', embSchema);

module.exports = modelSchema; 