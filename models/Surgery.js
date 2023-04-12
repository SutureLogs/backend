const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SurgeryLogSchema = new Schema({
	surgeryTitle: {
		type: String,
		required: true,
	},
	videoLink: {
		type: String,
		required: true,
	},
	transcript: {
		type: [
			{
				caption: String,
				startTime: Number,
				endTime: Number,
			},
		],
	},
	vitals: {
		type: [
      {
        name: String,
        unit: String,
        values: [Number],
      }
    ],
	},
	sectionsInVideo: {
		type: [
			{
				title: String,
				startTime: Number,
				endTime: Number,
			},
		],
	},
	patientId: {
		type: Schema.Types.ObjectId,
		ref: "Patient",
	},
	surgeryTeam: {
		type: [
			{
				doctorId: {
					type: String,
					required: true,
				},
				role: {
					type: String,
					required: true,
				},
        doctorName: String,
        status: String,
        doctorusername: String,
			},
		],
	},
	surgeryVisibility: {
		type: String,
	},
	privateAccess: {
		type: [String],
	},
	comments: {
		type: [
			{
				comment: String,
				doctorId: {
					type: String,
					required: true,
				},
			},
		],
	},
	notes: {
		type: [
			{
				note: String,
				doctorId: {
					type: String,
					required: true,
				},
        doctorName: String
			},
		],
	},
	likesCount: {
		type: Number,
		default: 0,
	},
	surgeryOrg: {
		type: String,
	},
	surgeryDate: {
		type: Date,
	},
	transcribeProcess: {
		type: String,
	},
});

module.exports = mongoose.model("Surgery", SurgeryLogSchema);

//surgeryorg
