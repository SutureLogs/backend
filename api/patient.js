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
	try {
		const patientId = req.query.patientId;
		const patient = await Patient.findOne({ customPatientId: patientId });
		if (patient) {
			res.status(200).json({ status: "success", patientExists: true });
		} else {
			res.status(200).json({ status: "success", patientExists: false });
		}
	} catch (err) {
		console.log(err);
		res.status(500).json({ message: "Internal server error" });
	}
});

router.post("/create-patient", async (req, res) => {
	try {
		const { patientId, patientAge, patientGender, logId } = req.body;
		console.log(patientId, patientAge, patientGender, logId);

		const patient = new Patient({
			customPatientId: patientId,
			age: patientAge,
			gender: patientGender,
		});

		const surgery = await Surgery.findById(logId);
		const leadSurgeon = surgery.surgeryTeam.find(
			(doctor) => doctor.role === "Lead Surgeon"
		);
		let surgeryDetails = {
			surgeryId: logId,
			leadSurgeonId: leadSurgeon.doctorId,
		};
		patient.patientHistory.push(surgeryDetails);
		surgery.patientId = patient._id;
		surgery.customPatientId = patient.customPatientId;
		await patient.save();
		await surgery.save();

		res.status(200).json({ status: "success" });
	} catch (err) {
		console.log(err);
		res.status(500).json({ message: "Internal server error" });
	}
});

router.post("/add-surgery", async (req, res) => {
	try {
		const { patientId, surgeryId } = req.body;
		const surgery = await Surgery.findById(surgeryId);
		const leadSurgeon = surgery.surgeryTeam.find(
			(doctor) => doctor.role === "Lead Surgeon"
		);
		const patient = await Patient.findOne({ customPatientId: patientId });
		let surgeryDetails = {
			surgeryId: surgeryId,
			leadSurgeonId: leadSurgeon.doctorId,
		};
		patient.patientHistory.push(surgeryDetails);
		surgery.patientId = patient._id;
		surgery.customPatientId = patient.customPatientId;
		await patient.save();
		await surgery.save();
		res.status(200).json({ status: "success" });
	} catch (err) {
		console.log(err);
		res.status(500).json({ message: "Internal server error" });
	}
});

module.exports = router;
