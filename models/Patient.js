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
    required: true,
  },
  patientHistory: {
    type: [
      {
        surgeryName : String,
        surgeonName : String,
        surgeonTitle : String,
        surgeryOrg : String,
        surgeryDate : Date,
        surgeryId : {
          type: Schema.Types.ObjectId,
          ref: "Surgery"
        }
      }
    ]
  },
});

module.exports = mongoose.model("Patient", PatientSchema);
