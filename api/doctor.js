var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");
var multer = require("multer");
var fs = require("fs");
const storage = require("../utils/multerStorage");
const speech = require("@google-cloud/speech");
const client = new speech.SpeechClient();
const { Storage } = require("@google-cloud/storage");

const storageAudio = new Storage();
const bucketName = "suturelogaudio";
const grantAccess = require("../utils/verifytoken");
const Doctor = require("../models/Doctor");
const Surgery = require("../models/Surgery");

router.get("/transcribe", async (req, res) => {
	const filePath = "static/audio/preamble.wav";
	const file = await storageAudio.bucket(bucketName).upload(filePath);
	const fileUrl = await file[0].makePublic();
	const gcsUri = `gs://${bucketName}/${file[0].name}`;
	console.log(gcsUri);

	const request = {
		audio: {
			uri: gcsUri,
		},
		config: {
			encoding: "LINEAR16",
			languageCode: "en-US",
			enableWordTimeOffsets: true,
			enableAutomaticPunctuation: true,
		},
	};
	try {
		const [operation] = await client.longRunningRecognize(request);
		const [response] = await operation.promise();
		const transcripts = response.results.map((result) => ({
			transcript: result.alternatives[0].transcript,
			startTime: Number(
				(
					result.alternatives[0].words[0].startTime.seconds +
					result.alternatives[0].words[0].startTime.nanos / 1e9
				).toFixed(1)
			),
			endTime: Number(
				(
					result.alternatives[0].words[
						result.alternatives[0].words.length - 1
					].endTime.seconds +
					result.alternatives[0].words[
						result.alternatives[0].words.length - 1
					].endTime.nanos /
						1e9
				).toFixed(1)
			),
		}));

		// Group transcript by sentences
		const groupedTranscripts = groupBySentences(transcripts);

		res.json({ transcript: groupedTranscripts });
	} catch (error) {
		console.error(error);
		res.json({ error: error.message });
	}
});
function groupBySentences(transcripts) {
	const groupedTranscripts = [];
	let currentSentence = "";
	let currentStartTime = "";
	let currentEndTime = "";

	for (const transcript of transcripts) {
		const sentences = transcript.transcript.split(". ");
		for (let i = 0; i < sentences.length; i++) {
			const sentence = sentences[i];
			const isLastSentence = i === sentences.length - 1;

			currentSentence += sentence;
			currentEndTime = isLastSentence
				? transcript.endTime
				: currentEndTime;

			if (isLastSentence || currentSentence.length > 100) {
				groupedTranscripts.push({
					transcript: currentSentence.trim(),
					startTime: currentStartTime,
					endTime: currentEndTime,
				});

				currentSentence = "";
				currentStartTime = isLastSentence ? "" : transcript.startTime;
			} else {
				currentSentence += ". ";
				currentEndTime = transcript.endTime;
				if (currentStartTime === "") {
					currentStartTime = transcript.startTime;
				}
			}
		}
	}

	return groupedTranscripts;
}

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
