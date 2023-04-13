var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
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
	const { patientId, patientAge, patientGender, logId } = req.body;
	console.log(patientId, patientAge, patientGender,logId);
	const patient = new Patient({
		customPatientId: patientId,
		age: patientAge,
		gender: patientGender,
	});

	const surgery = await Surgery.findById(logId);
	let surgeryDetails = {
		surgeryId: logId,
		surgeryName: surgery.surgeryTitle,
		surgeryOrg: surgery.surgeryOrg,
		surgeryDate: surgery.surgeryDate,
		patientHistory: [],
	};
	patient.patientHistory.push(surgeryDetails);
	surgery.patientId = patient._id;
	surgery.customPatientId = patient.customPatientId;
	await patient.save();
	await surgery.save();

	res.status(200).json({ status: "success" });
});

router.post("/add-surgery", async (req, res) => {
	const { patientId, surgeryId } = req.body;
	const surgery = await Surgery.findById(surgeryId);
	const patient = await Patient.findOne({ customPatientId: patientId });
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
	res.status(200).json({ status: "success" });
});

module.exports = router;
