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
				console.log(surgeryTeam[i])
				const doctor = await Doctor.findOne({
					username: surgeryTeam[i].username,
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
							username: surgeryTeam[i].username,
							role: surgeryTeam[i].role,
							status: "pending",
							doctorId: doctor._id,
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
							username: surgeryTeam[i].username,
							role: surgeryTeam[i].role,
							status: "accepted",
							doctorId: doctor._id,
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
