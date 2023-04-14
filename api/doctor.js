var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");
var multer = require("multer");
var fs = require("fs");
const storage = require("../utils/multerStorage");
const speech = require('@google-cloud/speech');
const client = new speech.SpeechClient();

const grantAccess = require("../utils/verifytoken");
const Doctor = require("../models/Doctor");
const Surgery = require("../models/Surgery");

router.get('/transcribe', async (req, res) => {
	const filePath = 'static/audio/preamble.wav';
	const fileStats = fs.statSync(filePath);
	const fileSizeInBytes = fileStats.size;
	const readStream = fs.createReadStream(filePath);
  
	const request = {
	  audio: {
		content: readStream,
		fileSize: fileSizeInBytes,
	  },
	  config: {
		encoding: 'LINEAR16',
		sampleRateHertz: 16000,
		languageCode: 'en-US',
	  },
	};
  
	try {
	  const [response] = await client.recognize(request);
	  const transcription = response.results.map(result => {
		const alternative = result.alternatives[0];
		return {
		  transcript: alternative.transcript,
		  startTime: alternative.words[0].startTime.seconds + alternative.words[0].startTime.nanos / 1e9,
		  endTime: alternative.words[alternative.words.length - 1].endTime.seconds + alternative.words[alternative.words.length - 1].endTime.nanos / 1e9
		};
	  });
	  res.json({ transcript: transcription });
	} catch (error) {
	  console.error(error);
	  res.json({ error: error.message });
	}
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
