var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");
var multer = require("multer");
const bcrypt = require("bcryptjs");
const storage = require("../utils/multerStorage");

const grantAccess = require("../utils/verifytoken");

const Doctor = require("../models/Doctor");

const upload = multer({ storage: storage });

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const doctor = await Doctor.findOne({ username });

    if (!doctor) {
      return res.status(200).json({ message: "Invalid username or password" });
    }
    const isValidPassword = await bcrypt.compare(password, doctor.password);
    if (!isValidPassword) {
      return res.status(200).json({ message: "Invalid username or password" });
    }
    const token = jwt.sign({ id: doctor._id }, "myprecious");
    res
      .status(200)
      .json({ status: "success", token, id: doctor._id, name: doctor.name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  const existingDoctor = await Doctor.findOne({ username });

  if (existingDoctor) {
    return res.status(200).json({ message: "Username already exists" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const doctor = new Doctor({
    username,
    password: hashedPassword,
  });
  await doctor.save();
  const token = jwt.sign({ id: doctor._id }, "myprecious");
  res.status(200).json({
    status: "success",
    token,
    username,
    id: doctor._id,
  });
});

router.post(
  "/onboard",
  grantAccess(),
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "verificationDocument", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const userid = await Doctor.findById(req.user.id);
      const { name, qualification, organisation } = req.body;
      console.log(userid, name, qualification, organisation);
      let doctor = await Doctor.findById(userid);

      if (!doctor) {
        return res.status(200).json({ message: "Doctor not found" });
      }

      doctor.name = name;
      doctor.qualification = qualification;
      doctor.profilePicture = req.files.profilePicture[0].path;
      doctor.verificationDocument = req.files.verificationDocument[0].path;
      doctor.organisations = JSON.parse(organisation);

      await doctor.save();

      res.status(200).json({
        status: "success",
        id: doctor._id,
        name: doctor.name,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

module.exports = router;
