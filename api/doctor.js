var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");
var multer = require("multer");
var fs = require("fs");
const storage = require("../utils/multerStorage");

const grantAccess = require("../utils/verifytoken");
const Doctor = require("../models/Doctor");
const Surgery = require("../models/Surgery");

router.get("/getorgs", grantAccess(), async (req, res) => {
  try {
    const userid = req.user.id;
    const doctor = await Doctor.findById(userid).populate("belongsTo");
    const orgs = doctor.belongsTo.organisation;
    let result = [];
    result[0] = orgs;
    res.status(200).json({ status: "success", organisations: result });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/username-exists", async (req, res) => {
  try {
    const username = req.query.username;
    const doctor = await Doctor.findOne({ username });
    if (doctor) {
      res.status(200).json({ status: "success", exists: true });
    } else {
      res.status(200).json({ status: "success", exists: false });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/profile", async (req, res) => {
  try {
    const userid = req.query.id;
    const doctor = await Doctor.findById(userid)
      .populate("surgeries")
      .populate("belongsTo");
    const result = {
      doctorFullName: doctor.name,
      doctorQualification: doctor.qualification,
      doctorOrganisation: [doctor.belongsTo.organisation],
      doctorImg: doctor.profilePicture,
      surgeries: doctor.surgeries,
    };
    res.status(200).json({ status: "success", doctor: result });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/portfolio", grantAccess(), async (req, res) => {
  try {
    const userid = req.user.id;
    const doctor = await Doctor.findById(userid).populate(
      "surgeries invites.surgeryId invites.invitedDoctorId belongsTo"
    );

    const invites = doctor.invites.map((invite) => ({
      logId: invite.surgeryId._id,
      surgeryName: invite.surgeryId.surgeryTitle,
      orgName: doctor.belongsTo.organisation,
      status: invite.status,
      inviteUser: {
        userID: invite.invitedDoctorId._id,
        username: invite.invitedDoctorId.name,
      },
    }));

    // Remove all the invites that have been accepted
    const pendingInvites = invites.filter(
      (invite) => invite.status !== "accepted"
    );

    const surgeries = doctor.surgeries.map((surgery) => ({
      logId: surgery._id,
      surgeryName: surgery.surgeryTitle,
      surgeryImage: surgery.thumbnailLink,
    }));

    res.status(200).json({
      status: "success",
      invites: pendingInvites,
      surgeries,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/invite-action", grantAccess(), async (req, res) => {
  try {
    const userid = req.user.id;
    const { surgeryId, action } = req.body;
    const doctor = await Doctor.findById(userid);
    const surgery = await Surgery.findById(surgeryId);
    if (action === "accepted") {
      doctor.surgeries.push(surgeryId);
      doctor.invites.find((invite) => {
        if (invite.surgeryId.toString() === surgeryId) {
          invite.status = "accepted";
        }
      });
      surgery.surgeryTeam.find((member) => {
        if (member.doctorId.toString() === userid) {
          member.status = "accepted";
        }
      });
      await surgery.save();
      await doctor.save();
      res.status(200).json({ status: "success" });
    } else {
      doctor.invites.find((invite) => {
        if (invite.surgeryId.toString() === surgeryId) {
          invite.status = action;
        }
      });
      surgery.surgeryTeam.find((member) => {
        if (member.doctorId.toString() === userid) {
          member.status = action;
        }
      });
      await surgery.save();
      res.status(200).json({ status: "success" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
