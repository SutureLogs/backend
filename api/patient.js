var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");
var multer = require("multer");
const storage = require("../utils/multerStorage");

const grantAccess = require("../utils/verifytoken");
const Patient = require("../models/Patient");
const Surgery = require("../models/Surgery");

router.get("/test", (req, res) => {
	res.status(200).json({ status: "hello" });
});

router.get("/check-patient-exists", async (req, res) => {
	const patientId = req.query.patientId;
	const patient = await Patient.findOne({ customPatientId: patientId });
	if (patient) {
		res.status(200).json({ status: "success", patientExists: true });
	} else {
		res.status(200).json({ status: "success", patientExists: false });
	}
});

router.post("/create-patient", async (req, res) => {
	const { patientId, patientAge, patientGender } = req.body;
	const patient = new Patient({
		customPatientId: patientId,
		age: patientAge,
		gender: patientGender,
	});
	await patient.save();
	res.status(200).json({ status: "success" });
});

router.post("/add-surgery", async (req, res) => {
	const { patientId, surgeryId } = req.body;

	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const surgery = await Surgery.findById(surgeryId).session(session);
		const patient = await Patient.findOne({
			customPatientId: patientId,
		}).session(session);

		let surgeryDetails = {
			surgeryId: surgeryId,
			surgeryName: surgery.surgeryTitle,
			surgeryOrg: surgery.surgeryOrg,
			surgeryDate: surgery.surgeryDate,
		};

		patient.patientHistory.push(surgeryDetails);
		surgery.patientId = patient._id;
		surgery.customPatientId = patient.customPatientId;

		await patient.save();
		await surgery.save();

		await session.commitTransaction();

		res.status(200).json({ status: "success" });
	} catch (err) {
		await session.abortTransaction();
		throw err;
	} finally {
		session.endSession();
	}
});


module.exports = router;
