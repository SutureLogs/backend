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
				replies: {
					type: [
						{
							comment: String,
							doctorId: {
								type: Schema.Types.ObjectId,
								ref: "Doctor",
							},
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
					type: Schema.Types.ObjectId,
					ref: "Doctor",
				},
			},
		],
	},
	likesCount: {
		type: Number,
		default: 0,
	},
	belongsTo: {
		type: Schema.Types.ObjectId,
		ref: "Admin",
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
	surgeryDurationInMins: {
		type: Number,
	},
});

module.exports = mongoose.model("Surgery", SurgeryLogSchema);
