var express = require("express");
const Admin = require("../models/Admin");
var router = express.Router();



router.post("/admin-signup", async (req, res) => {
    try{
        const { username, password, OrgName } = req.body;
        const existingAdmin = await Admin.findOne({ username });
        if (existingAdmin) {
            return res.status(200).json({ message: "Username already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = new Admin({
            username,
            password: hashedPassword,
            organisation : OrgName,
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

module.exports = router;