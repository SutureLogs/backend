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
	summary: String,
	keywords: [String],
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
		enum: ["public", "private", "organisation"],
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
	likedBy: {
		type: [Schema.Types.ObjectId],
		ref: "Doctor",
	},
	viewsCount: {
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
	scenarios: {
		scenario: String,
		question: String,
		answer: String,
		verdict: String,
		explanation: String,
		cached: Boolean,
	},
});

/*
1st call - take the transcript -> scenario and question
2nd call from frontend - > scenario and question + answer -> query chatgpt with transcript scenario and question + answer 
3rd call to frontend -> transcript scenario and question + answer + verdict
*/

module.exports = mongoose.model("Surgery", SurgeryLogSchema);
