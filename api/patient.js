var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");
var multer = require("multer");
const storage = require("../utils/multerStorage");

const grantAccess = require("../utils/verifytoken");

router.get("/test", (req, res) => {
	res.status(200).json({ status: "hello" });
});


module.exports = router;