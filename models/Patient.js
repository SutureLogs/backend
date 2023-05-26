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
  },
  age: {
    type: Number,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  patientHistory: {
    type: [
      {
        leadSurgeonId: {
          type: Schema.Types.ObjectId,
          ref: "Doctor"
        },
        surgeryId : {
          type: Schema.Types.ObjectId,
          ref: "Surgery"
        }
      }
    ]
  },
});

module.exports = mongoose.model("Patient", PatientSchema);
