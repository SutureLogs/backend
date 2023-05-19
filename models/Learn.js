const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Department = new Schema({
  learn: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Department", Department);
