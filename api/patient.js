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

router.post("/link-patient-surgery", grantAccess(), async (req, res) => {
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
		await patient.save();
		await surgery.save();
		res.status(200).json({ status: "success" });
	} catch (err) {
		console.log(err);
		res.status(500).json({ message: "Internal server error" });
	}
});

router.post("/edit-patient-link", grantAccess(), async (req, res) => {
	try {
		const { oldPatientId, newPatientId, surgeryId } = req.body;
		const surgery = await Surgery.findById(surgeryId);
		const leadSurgeon = surgery.surgeryTeam.find(
			(doctor) => doctor.role === "Lead Surgeon"
		);
		// Remove the surgery from the old patient
		const oldpatient = await Patient.findOne({ customPatientId: oldPatientId });
		// delete the surgery history if it contains the surgeryId
		oldpatient.patientHistory = oldpatient.patientHistory.filter(
			(surgery) => surgery.surgeryId !== surgeryId
		);

		// Add the surgery to the new patient
		const newpatient = await Patient.findOne({ customPatientId: newPatientId });
		let surgeryDetails = {
			surgeryId: surgeryId,
			leadSurgeonId: leadSurgeon.doctorId,
		};
		newpatient.patientHistory.push(surgeryDetails);
		surgery.patientId = newpatient._id;
		await oldpatient.save();
		await newpatient.save();
		await surgery.save();
		res.status(200).json({ status: "success" });
	} catch (err) {
		console.log(err);
		res.status(500).json({ message: "Internal server error" });
	}
});



module.exports = router;
