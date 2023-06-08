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
	transcript: [String],
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
					type: Schema.Types.ObjectId,
					ref: "Doctor",
				},
				role: {
					type: String,
					required: true,
				},
				status: String,

				// doctorName: String,
				// doctorusername: String,
				// doctorTitle: String,
				// doctorProfilePic: String,


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
					type: Schema.Types.ObjectId,
					ref: "Doctor",
				},
				// doctorName: String,
				replies: {
					type: [
						{
							comment: String,
							doctorId: {
								type: Schema.Types.ObjectId,
								ref: "Doctor",
							},
							// doctorName: String,
						},
					],
				},
			},
		],
	},
	notes: {
		type: [
			{
				note: [Object],
				doctorId: {
					type: Schema.Types.ObjectId,
					ref: "Doctor",
				},
				createdAt: {
					type: Date,
					default: Date.now,
				},
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
	videoTimestamps: [Number],
	surgeryDurationInMins:{
		type: Number,
	}
});

module.exports = mongoose.model("Surgery", SurgeryLogSchema);

//surgeryorg
