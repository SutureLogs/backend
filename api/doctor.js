var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");
var multer = require("multer");
const storage = require("../utils/multerStorage");

const grantAccess = require("../utils/verifytoken");
const Doctor = require("../models/Doctor");
const Surgery = require("../models/Surgery");

router.get("/test/:url", (req, res) => {
	res.status(200).json({ status: "hello" });
});

router.get("/getorgs", grantAccess(), async (req, res) => {
	const userid = req.user.id;
	const doctor = await Doctor.findById(userid);
	const orgs = doctor.organisations;
	res.status(200).json({ status: "success", organisations: orgs });
});

router.get("/username-exists", async (req, res) => {
	const username = req.query.username;
	const doctor = await Doctor.findOne({ username });
	if (doctor) {
		res.status(200).json({ status: "success", exists: true });
	} else {
		res.status(200).json({ status: "success", exists: false });
	}
});

router.get("/portfolio", grantAccess(), async (req, res) => {
	const userid = req.user.id;
	const doctor = await Doctor.findById(userid).populate("surgeries");
	const invites = doctor.invites.map((invite) => {
		return {
			logId: invite.surgeryId,
			surgeryName: invite.surgeryName,
			orgName: invite.orgName,
			status: invite.status,
			inviteUser: {
				userID: invite.invitedDoctorId,
				username: invite.invitedDoctorName,
			},
		};
	});
	// remove all the invites that have been accepted
	const pendingInvites = invites.filter((invite) => {
		return invite.status !== "accepted";
	});
	const surgeries = doctor.surgeries.map((surgery) => {
		return {
			logId: surgery._id,
			surgeryName: surgery.surgeryTitle,
			surgeryImage: surgery.thumbnailLink,
		};
	});

	res.status(200).json({
		status: "success",
		invites: pendingInvites,
		surgeries,
	});
});

router.post("/invite-action", grantAccess(), async (req, res) => {
	const userid = req.user.id;
	const { surgeryId, action } = req.body;
	const doctor = await Doctor.findById(userid);
	const surgery = await Surgery.findById(surgeryId);
	if (action === "accepted") {
		doctor.surgeries.push(surgeryId);
		doctor.invites.find((invite) => {
			if (invite.surgeryId === surgeryId) {
				invite.status = "accepted";
			}
		});
		surgery.surgeryTeam.find((member) => {
			if (member.doctorId === userid) {
				member.status = "accepted";
			}
		});
		await surgery.save();
		await doctor.save();
		res.status(200).json({ status: "success" });
	} else {
		doctor.invites.find((invite) => {
			if (invite.surgeryId === surgeryId) {
				invite.status = action;
			}
		});
		surgery.surgeryTeam.find((member) => {
			if (member.doctorId === userid) {
				member.status = action;
			}
		});
		await surgery.save();
		res.status(200).json({ status: "success" });
	}
});

module.exports = router;
