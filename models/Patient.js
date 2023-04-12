const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PatientSchema = new Schema({
  customPatientId: {
    type: String,
    required: true,
    unique: true,
  },
  patientDob: {
    type: Date,
    required: true,
  },
  patientAge: {
    type: Number,
    required: true,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    required: true,
  },
  patientHistory: {
    type: [String],
  },
});

module.exports = mongoose.model("Patient", PatientSchema);
