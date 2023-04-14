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
	thumbnailLink: {
		type: String,
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
			},
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
	customPatientId: {
		type: String,
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
				doctorTitle: String,
				doctorProfilePic: String,


			},
		],
	},
	surgeryVisibility: {
		type: String,
	},
	privateList: {
		type: [String],
	},
	discussions: {
		type: [
			{
				comment: String,
				doctorId: {
					type: String,
					required: true,
				},
				doctorName: String,
				replies: {
					type: [
						{
							comment: String,
							doctorId: String,
							doctorName: String,
						},
					],
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
				doctorName: String,
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
	vitalTimestamps: {
		type: [Number],
	},
	surgeryDurationInMins:{
		type: Number,
	}
});

module.exports = mongoose.model("Surgery", SurgeryLogSchema);

//surgeryorg
