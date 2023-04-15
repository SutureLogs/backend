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
const axios = require("axios");
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
	apiKey: process.env.OPEN_API_KEY,
});
const openai = new OpenAIApi(configuration);

const upload = multer({ storage: storage });

router.get("/get-logbase", async (req, res) => {
	try {
		const surgeryid = req.query.id;
		const surgery = await Surgery.findById(surgeryid).populate("patientId");
		const leadSurgeon = surgery.surgeryTeam.find(
			(doctor) => doctor.role === "Lead Surgeon"
		);
		let team = [];
		for (let i = 0; i < surgery.surgeryTeam.length; i++) {
			if (surgery.surgeryTeam[i].status === "accepted") {
				team.push(surgery.surgeryTeam[i]);
			}
		}
		const result = {
			likeCount: surgery.likesCount,
			orgName: surgery.surgeryOrg,
			date: surgery.surgeryDate,
			notes: surgery.notes,
			surgeonName: leadSurgeon.doctorName,
			surgeonTitle: leadSurgeon.doctorTitle,
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
				team: team,
				surgeryDurationInMins: surgery.surgeryDurationInMins,
			},
		};
		res.status(200).json({ status: "success", surgery: result });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error" });
	}
});

router.post("/search", async (req, res) => {
	const { searchQuery } = req.body;
	const surgeries = await Surgery.find({
		$or: [
			{ surgeryTitle: { $regex: searchQuery, $options: "i" } },
			{ surgeryOrg: { $regex: searchQuery, $options: "i" } },
		],
	});
	let result = [];
	for (let i = 0; i < surgeries.length; i++) {
		const leadSurgeon = surgeries[i].surgeryTeam.find(
			(doctor) => doctor.role === "Lead Surgeon"
		);
		const val = {
			logID: surgeries[i]._id,
			surgeryName: surgeries[i].surgeryTitle,
			surgeonName: leadSurgeon.doctorName,
			orgName: surgeries[i].surgeryOrg,
			img: surgeries[i].thumbnailLink,
		};
		result.push(val);
	}
	res.status(200).json({ status: "success", surgeries: result });
});

router.get("/get-discuss", async (req, res) => {
	const surgeryid = req.query.id;
	const surgery = await Surgery.findById(surgeryid);
	const leadSurgeon = surgery.surgeryTeam.find(
		(doctor) => doctor.role === "Lead Surgeon"
	);
	let discuss = [];
	for (let i = 0; i < surgery.discussions.length; i++) {
		const val = {
			comment: surgery.discussions[i].comment,
			discussionID: surgery.discussions[i]._id,
			memberName: surgery.discussions[i].doctorName,
			replies: surgery.discussions[i].replies,
			surgeryID: surgery._id,
		};
		discuss.push(val);
	}
	const result = {
		date: surgery.surgeryDate,
		orgName: surgery.surgeryOrg,
		surgeryName: surgery.surgeryTitle,
		surgeonName: leadSurgeon.doctorName,
		surgeonTitle: leadSurgeon.doctorTitle,
		discussions: discuss,
	};
	res.status(200).json({ status: "success", surgery: result });
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
		surgeonTitle: leadSurgeon.doctorTitle,
		videoLink: surgery.videoLink,
		videoTimestamps: surgery.videoTimestamps,
		transcript: surgery.transcript,
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
	console.log(surgeryId, discussionId, reply);
	const doctor = await Doctor.findById(user);
	const surgery = await Surgery.findById(surgeryId);
	for (let sur of surgery.discussions) {
		if (sur._id.toString() === discussionId) {
			sur.replies.push({
				comment: reply,
				doctorId: user,
				doctorName: doctor.name,
			});
		}
	}

	await surgery.save();
	res.status(200).json({ status: "success", surgery: surgery });
});

router.post("/edit-surgery", grantAccess(), async (req, res) => {
	const user = req.user.id;
	const { surgeryData } = req.body;

	const surgery = await Surgery.findById(surgeryData.logId);
	const editingDoctor = await Doctor.findById(user);

	if (surgery) {
		let doc = surgery.surgeryTeam.find((doc) => doc.doctorId === user);
		if (!doc) {
			return res.status(200).json({ message: "Unauthorized" });
		} else {
			let newDoctor = [];
			const existingTeam = surgeryData.surgeryTeam.filter((obj) => {
				if (obj.doctorId === "") {
					newDoctor.push(obj);
					return false;
				}
				return true;
			});

			for (let i = 0; i < newDoctor.length; i++) {
				let doctor = await Doctor.findOne({
					username: newDoctor[i].doctorusername,
				});
				newDoctor[i].doctorId = doctor._id;
				newDoctor[i].doctorName = doctor.name;
				newDoctor[i].doctorTitle = doctor.title;
				newDoctor[i].doctorProfilePic = doctor.profilePicture;
				newDoctor[i].status = "pending";
				let invite = {
					surgeryId: surgery._id,
					surgeryName: surgery.surgeryTitle,
					orgName: surgery.surgeryOrg,
					status: "pending",
					invitedDoctorId: user,
					invitedDoctorName: editingDoctor.name,
				};
				doctor.invites.push(invite);
				await doctor.save();
				existingTeam.push(newDoctor[i]);
			}

			surgery.surgeryTitle = surgeryData.surgeryName;
			surgery.surgeryDate = surgeryData.surgeryDate;
			surgery.surgeryOrg = surgeryData.surgeryOrg;
			surgery.surgeryTeam = existingTeam;
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
		let doc = surgery.surgeryTeam.find((doc) => doc.doctorId === user);

		if (!doc) {
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

			// Audio
			const url = "http://localhost:5000/transcribe";
			const headers = {
				"Content-Type": "application/json",
			};
			const body = {
				audioPath: operationVideoFileName,
				surgeryId: surgeryLog._id,
			};
			try {
				const ngl = axios.post(url, body, { headers });
			} catch (err) {
				console.log(err);
			}

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
							doctorTitle: doctor.qualification,
							doctorProfilePic: doctor.profilePicture,
						});
					} else {
						doctor.invites.push({
							surgeryId: surgeryLog._id,
							surgeryName: surgeryName,
							orgName: surgeryOrg,
							status: "accepted",
						});
						doctor.surgeries.push(surgeryLog._id);
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

router.get("/learn", async (req, res) => {
	const surgeryId = req.query.id;
	const surgery = await Surgery.findById(surgeryId);

	let textData = "";
	for (let i = 0; i < surgery.transcript.length; i++) {
		textData += surgery.transcript[i] + " ";
	}
	let numQuestions = 3;
	textData = "Transcript - " + textData;
	const ask =
		'Generate -  1 question from the Transcript.\nFollow the JSON format\n{\n  "question": "",\n  "options": [""],\n  "explanation": "",\n  "answer": ""\n}';
	const prompt = textData + ask;
	console.log(prompt);

	const callGpt = async () => {
		const response = await openai.createCompletion({
			model: "text-davinci-003",
			prompt: prompt,
			temperature: 0.7,
			max_tokens: 3170,
			top_p: 1,
			frequency_penalty: 0,
			presence_penalty: 0,
		});
		return response.data.choices[0].text;
	}
	let quiz = [];
	for(let i = 0; i < numQuestions; i++){
		let response = await callGpt();
		let x = response.replace(/\n/g, "").replace(/\r/g, "").replace(/\t/g, "");
		let y = JSON.parse(x);
		quiz.push(y);
	}

	res.status(200).json({ status: "success", quiz: quiz });
});

router.get("/browse", async (req, res) => {
	const surgeries = await Surgery.find({});
	let trending = surgeries.slice(0, 2);
	let discover = surgeries.slice(2);
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
