var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");
var multer = require("multer");
const storage = require("../utils/multerStorage");

const grantAccess = require("../utils/verifytoken");
const Doctor = require("../models/Doctor");

router.get("/test", (req, res) => {
	res.status(200).json({ status: "hello" });
});

router.get("/getorgs", grantAccess(), async (req, res) => {
	const userid = req.user.id;
	const doctor = await Doctor.findById(userid);
	const orgs = doctor.organisations;
	res.status(200).json({ status: "success", organisations: orgs });
});

router.get("/portfolio", grantAccess(), (req, res) => {
	const userid = req.user.id;

	res.status(200).json({ status: "hello" });
});

module.exports = router;
