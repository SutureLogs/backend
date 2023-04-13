var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");
var multer = require("multer");
const storage = require("../utils/multerStorage");

const grantAccess = require("../utils/verifytoken");
const vitalParser = require("../utils/vitalsParser");
const Surgery = require("../models/Surgery");
const Doctor = require("../models/Doctor");

const upload = multer({ storage: storage });

router.get("/get-logbase", async (req, res) => {
	try {
		const surgeryid = req.query.id;
		const surgery = await Surgery.findById(surgeryid).populate("patientId");
		const leadSurgeon = surgery.surgeryTeam.find(doctor => doctor.role === "Lead Surgeon");
		const result = {
			likeCount: surgery.likesCount,
			orgName: surgery.surgeryOrg,
			date : surgery.surgeryDate,
			notes: surgery.notes,
			surgeonName: leadSurgeon.doctorName,
			surgeonTitle: "Lead Surgeon",
			surgeryName: surgery.surgeryTitle,
			patientDetails : {
				age: surgery.patientId.age,
				gender: surgery.patientId.gender
			},
			patientHistory: surgery.patientId.patientHistory,
			surgeryDetails:{
				team : surgery.surgeryTeam,
			},
		}
		res.status(200).json({ status: "success", surgery: result });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error" });
	}
});

router.get("/loglog", async (req, res) => {
	const surgeryid = req.query.id;
	const surgery = await Surgery.findById(surgeryid);
	const leadSurgeon = surgery.surgeryTeam.find(doctor => doctor.role === "Lead Surgeon");
	const result = {
		orgName : surgery.surgeryOrg,
		surgeonName : leadSurgeon.doctorName,
		surgeonTitle : "Lead Surgeon",
		videoLink: surgery.videoLink,
		date : surgery.surgeryDate,
		surgeryName : surgery.surgeryTitle,
		vitals : surgery.vitals,
		transcript : surgery.transcript,
		transcribeProcess : surgery.transcribeProcess,
	}
	res.status(200).json({ status: "success", surgery: result });

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

			// Audio

			// Create

			const surgeryLog = new Surgery({
				surgeryTitle: surgeryName,
				videoLink: operationVideoLink,
				thumbnailLink: thumbnailLink,
				surgeryOrg,
				surgeryDate,
				surgeryVisibility,
				transcribeProcess: "pending",
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
			surgeryLog.vitals = vitalsObj;

			await surgeryLog.save();
			res.status(200).json({ status: "success", surgeryLog });
		} catch (error) {
			console.log(error);
			res.status(200).json({ status: "error", details: error });
		}
	}
);

module.exports = router;
