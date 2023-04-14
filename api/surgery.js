var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");
var multer = require("multer");
const storage = require("../utils/multerStorage");

const grantAccess = require("../utils/verifytoken");
const vitalParser = require("../utils/vitalsParser");
const Surgery = require("../models/Surgery");
const Doctor = require("../models/Doctor");
const extractAudio = require("../utils/extractAudio");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
ffmpeg.setFfmpegPath(ffmpegPath);

const upload = multer({ storage: storage });

router.get("/get-logbase", async (req, res) => {
	try {
		const surgeryid = req.query.id;
		const surgery = await Surgery.findById(surgeryid).populate("patientId");
		const leadSurgeon = surgery.surgeryTeam.find(
			(doctor) => doctor.role === "Lead Surgeon"
		);
		const result = {
			likeCount: surgery.likesCount,
			orgName: surgery.surgeryOrg,
			date: surgery.surgeryDate,
			notes: surgery.notes,
			surgeonName: leadSurgeon.doctorName,
			surgeonTitle: "Lead Surgeon",
			surgeryName: surgery.surgeryTitle,
			patientDetails: {
				age: surgery.patientId
					? surgery.patientId.age
					: "Not Specified",
				gender: surgery.patientId
					? surgery.patientId.gender
					: "Not Specified",
			},
			patientHistory: surgery.patientId
				? surgery.patientId.patientHistory
				: [],
			surgeryDetails: {
				team: surgery.surgeryTeam,
				surgeryDurationInMins: surgery.surgeryDurationInMins,
			},
		};
		res.status(200).json({ status: "success", surgery: result });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error" });
	}
});

router.get("/loglog", async (req, res) => {
	const surgeryid = req.query.id;
	const surgery = await Surgery.findById(surgeryid);
	const leadSurgeon = surgery.surgeryTeam.find(
		(doctor) => doctor.role === "Lead Surgeon"
	);
	const result = {
		orgName: surgery.surgeryOrg,
		surgeonName: leadSurgeon.doctorName,
		surgeonTitle: "Lead Surgeon",
		videoLink: surgery.videoLink,
		date: surgery.surgeryDate,
		surgeryName: surgery.surgeryTitle,
		vitals: surgery.vitals,
		vitalTimestamps: surgery.vitalTimestamps,
		transcript: surgery.transcript,
		transcribeProcess: surgery.transcribeProcess,
	};
	res.status(200).json({ status: "success", surgery: result });
});

router.post("/add-discussion", grantAccess(), async (req, res) => {
	try {
		const user = req.user.id;
		const { surgeryId, comment } = req.body;
		const doctor = await Doctor.findById(user);
		const surgery = await Surgery.findById(surgeryId);
		surgery.discussions.push({
			comment: comment,
			doctorId: user,
			replies: [],
			doctorName: doctor.name,
		});
		await surgery.save();
		res.status(200).json({ status: "success", surgery: surgery });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error" });
	}
});

router.post("/add-reply", grantAccess(), async (req, res) => {
	const user = req.user.id;
	const { surgeryId, discussionId, reply } = req.body;
	const doctor = await Doctor.findById(user);
	const surgery = await Surgery.findById(surgeryId);
	surgery.discussions.find();
});

router.post("/edit-surgery", grantAccess(), async (req, res) => {
	const user = req.user.id;
	const { surgeryData } = req.body;

	const surgery = await Surgery.findById(surgeryData.logId);
	if (surgery) {
		if (!surgery.surgeryTeam.some((doctor) => doctor.doctorId !== user)) {
			return res.status(200).json({ message: "Unauthorized" });
		} else {
			surgery.surgeryTitle = surgeryData.surgeryName;
			surgery.surgeryDate = surgeryData.surgeryDate;
			surgery.surgeryOrg = surgeryData.surgeryOrg;
			surgery.surgeryTeam = surgeryData.surgeryTeam;
			surgery.surgeryVisibility = surgeryData.surgeryVisibility;
			if (surgeryData.newNote.note !== "") {
				surgery.notes.push(surgeryData.newNote);
			}
			surgery.privateList = surgeryData.privateList;
			await surgery.save();
			res.status(200).json({ status: "success", surgery: surgery });
		}
	}
});

router.get("/editpage-data", grantAccess(), async (req, res) => {
	const user = req.user.id;
	const surgeryId = req.query.id;
	const surgery = await Surgery.findById(surgeryId).populate("patientId");
	const doctor = await Doctor.findById(user);
	const orgs = doctor.organisations;
	if (surgery) {
		if (!surgery.surgeryTeam.some((doctor) => doctor.doctorId !== user)) {
			return res.status(200).json({ message: "Unauthorized" });
		} else {
			let data = {
				availableOrgs: orgs,
				surgeryName: surgery.surgeryTitle,
				surgeryDate: surgery.surgeryDate,
				surgeryOrg: surgery.surgeryOrg,
				surgeryTeam: surgery.surgeryTeam,
				surgeryVisibility: surgery.surgeryVisibility,
				notes: surgery.notes,
				privateList: surgery.privateList,
				patientId: surgery.patientId
					? surgery.patientId.customPatientId
					: null,
				patientGender: surgery.patientId
					? surgery.patientId.gender
					: null,
				patientAge: surgery.patientId ? surgery.patientId.age : null,
			};
			res.status(200).json({ status: "success", surgery: data });
		}
	}
});

router.post(
	"/create-surgery",
	upload.fields([
		{ name: "operationVideo", maxCount: 1 },
		{ name: "vital", maxCount: 1 },
		{ name: "thumbnail", maxCount: 1 },
	]),
	grantAccess(),
	async (req, res) => {
		try {
			console.log("req.body", req.body);
			let {
				surgeryName,
				surgeryDate,
				surgeryOrg,
				surgeryTeam,
				surgeryVisibility,
				surgeryNote,
			} = req.body;
			surgeryTeam = JSON.parse(surgeryTeam);

			//Thumbnail
			const thumbnailLink = req.files.thumbnail[0].path;

			// Video
			const operationVideoLink = req.files.operationVideo[0].path;
			const operationVideoFileName =
				req.files.operationVideo[0].filename.split(".")[0];

			let duration = 0;

			ffmpeg.ffprobe(operationVideoLink, (err, metadata) => {
				if (err) {
					console.error(err);
				} else {
					const du = metadata.format.duration;
					duration = du / 60;
					
				}
			});
			console.log(`Duration: ${duration} minutes`);

			const audioPath = "static/audio/" + operationVideoFileName + ".wav";

			// Audio

			const command = ffmpeg(operationVideoLink)
				.audioChannels(1)
				.audioFrequency(16000)
				.output(audioPath);

			// Wait for the command to complete before continuing with the other code
			await new Promise((resolve, reject) => {
				command
					.on("end", () => {
						resolve();
					})
					.on("error", (err) => {
						reject(err);
					})
					.run();
			});
			const fs = require("fs");

			fs.access(audioPath, fs.constants.F_OK, (err) => {
				if (err) {
					console.error(err);
					return;
				}

				console.log("File exists");
			});

			// const audipPromise = new Promise((resolve, reject) => {
			// extractAudio(operationVideoLink, audioPath)
			// 	.then((result) => {
			// 		console.log("Audio Extracted");
			// 		resolve(result);
			// 	})
			// 	.catch((err) => {
			// 		reject(err);
			// 		console.log("Error in extracting audio");
			// 	});
			// });
			// console.log("Audio Promise", audipPromise);

			// Create

			const surgeryLog = new Surgery({
				surgeryTitle: surgeryName,
				videoLink: operationVideoLink,
				thumbnailLink: thumbnailLink,
				surgeryOrg,
				surgeryDate,
				surgeryVisibility,
				transcribeProcess: "pending",
				surgeryDurationInMins: Math.round(duration),
				notes: [],
			});

			// Notes
			const noteUser = await Doctor.findById(req.user.id);
			let note = {
				note: surgeryNote,
				doctorId: req.user.id,
				doctorName: noteUser.name,
			};
			surgeryLog.notes.push(note);

			// Team and Invite Team Members
			let teamMembers = [];
			for (let i = 0; i < surgeryTeam.length; i++) {
				console.log(surgeryTeam[i]);
				const doctor = await Doctor.findOne({
					username: surgeryTeam[i].memberUsername,
				});
				if (doctor) {
					if (doctor.username !== noteUser.username) {
						doctor.invites.push({
							surgeryId: surgeryLog._id,
							surgeryName: surgeryName,
							orgName: surgeryOrg,
							status: "pending",
							invitedDoctorId: req.user.id,
							invitedDoctorName: noteUser.name,
						});
						await doctor.save();

						teamMembers.push({
							username: surgeryTeam[i].memberUsername,
							role: surgeryTeam[i].memberRole,
							status: "pending",
							doctorId: doctor._id,
							doctorName: doctor.name,
							doctorusername: doctor.username,
						});
					} else {
						doctor.invites.push({
							surgeryId: surgeryLog._id,
							surgeryName: surgeryName,
							orgName: surgeryOrg,
							status: "accepted",
						});
						await doctor.save();

						teamMembers.push({
							username: surgeryTeam[i].memberUsername,
							role: surgeryTeam[i].memberRole,
							status: "accepted",
							doctorId: doctor._id,
							doctorName: doctor.name,
							doctorusername: doctor.username,
							doctorTitle: doctor.qualification,
							doctorProfilePic: doctor.profilePicture,
						});
					}
				}
			}
			surgeryLog.surgeryTeam = teamMembers;

			const vitalLink = req.files.vital[0].path;
			const vitalsPromise = new Promise((resolve, reject) => {
				vitalParser(vitalLink)
					.then((vitals) => {
						console.log("vitals", vitals);
						resolve(vitals);
					})
					.catch((err) => {
						reject(err);
					});
			});
			const vitalsObj = await vitalsPromise;
			surgeryLog.vitals = vitalsObj.vitals;

			surgeryLog.vitalTimestamps = vitalsObj.timestamp;

			await surgeryLog.save();
			res.status(200).json({ status: "success", surgeryLog });
			console.log("Surgery Log");
		} catch (error) {
			console.log(error);
			res.status(200).json({ status: "error", details: error });
		}
	}
);

router.get("/browse", async (req, res) => {
	const surgeries = await Surgery.find({});
	let trending = surgeries.slice(0, 3);
	let discover = surgeries.slice(3);
	res.status(200).json({ status: "success", trending, discover });
});

router.get("/img/:static/:folder/:filername", async (req, res) => {
	let u = `../${req.params.static}/${req.params.folder}/${req.params.filername}`;
	console.log(u);
	const path = require("path");
	res.sendFile(path.join(__dirname, u));
});

router.get("/video/:static/:folder/:filername", async (req, res) => {
	let u = `../${req.params.static}/${req.params.folder}/${req.params.filername}`;
	console.log(u);
	const path = require("path");
	res.sendFile(path.join(__dirname, u));
});

module.exports = router;
