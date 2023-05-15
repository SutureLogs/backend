var express = require("express");
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Department = require("../models/Department");
const grantAccess = require("../utils/verifytoken");
var router = express.Router();

router.post("/admin-signup", async (req, res) => {
	try {
		const { username, password, OrgName } = req.body;
		const existingAdmin = await Admin.findOne({ username });
		if (existingAdmin) {
			return res.status(200).json({ message: "Username already exists" });
		}
		const hashedPassword = await bcrypt.hash(password, 10);
		const admin = new Admin({
			username,
			password: hashedPassword,
			organisation: OrgName,
		});
		await admin.save();
		const token = jwt.sign({ id: admin._id }, "myprecious");
		res.status(200).json({
			status: "success",
			token,
			username,
			id: admin._id,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error" });
	}
});

router.post("/admin-login", async (req, res) => {
	try {
		const { username, password } = req.body;
		const admin = await Admin.findOne({ username });

		if (!admin) {
			return res
				.status(200)
				.json({ message: "Invalid username or password" });
		}
		const isValidPassword = await bcrypt.compare(password, admin.password);
		if (!isValidPassword) {
			return res
				.status(200)
				.json({ message: "Invalid username or password" });
		}
		const token = jwt.sign({ id: admin._id }, "myprecious");
		res.status(200).json({
			status: "success",
			token,
			id: admin._id,
			name: admin.username,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error" });
	}
});

router.post("/add-department", grantAccess(), async (req, res) => {
	try {
		const { department: dept } = req.body;
		if (dept) {
			const department = new Department({
				name: dept,
			});
			const admin = await Admin.findById(req.user.id);
			admin.departments.push(department._id);
			await department.save();
			await admin.save();

			res.status(200).json({
				status: "success",
				department,
			});
		}
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error" });
	}
});

module.exports = router;

router.get("/get-departments", grantAccess(), async (req, res) => {
	try {
		const userid = req.user.id;
		const admin = await Admin.findById(userid).populate("departments");
        console.log(admin.departments);
		let departments = [];
		for (let i = 0; i < admin.departments.length; i++) {
			departments.push(admin.departments[i].name);
		}
		res.status(200).json({
			status: "success",
			departments,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error" });
	}
});
