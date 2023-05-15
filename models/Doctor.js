const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Define the Doctor schema
const DoctorSchema = new Schema({
	name: {
		type: String,
	},
	qualification: {
		type: String,
	},
	organisations: {
		type: [String],
	},
	belongsTo:{
		type: Schema.Types.ObjectId,
		ref: "Admin",
	},
	department: {
		type: Schema.Types.ObjectId,
		ref: "Department",
	},
	profilePicture: {
		type: String,
	},
	verificationDocument: {
		type: String,
	},
	username: {
		type: String,
		required: true,
		unique: true,
	},
	password: {
		type: String,
		required: true,
	},
	surgeries: [
		{
			type: Schema.Types.ObjectId,
			ref: "Surgery",
		},
	],
    invites: {
        type: [
            {
                surgeryId : String,
                surgeryName: String,
                orgName : String,
                status : String,
				invitedDoctorId : String,
				invitedDoctorName : String,
            }
        ]
    },
});

module.exports = mongoose.model("Doctor", DoctorSchema);
