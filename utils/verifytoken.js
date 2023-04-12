const jwt = require("jsonwebtoken");

function grantAccess() {
	return (req, res, next) => {
		const token = req.body.token || req.query.token || req.headers["token"];

		if (!token) {
			return res.status(200).json({
				status: "error",
				details: "A token is required to call this api",
			});
		}
		try {
			const decoded = jwt.verify(token, "myprecious");
			console.log(decoded);
			req.user = decoded;
		} catch (err) {
			return res.status(200).json({
				status: "error",
				details: "Invalid Token",
			});
		}
		next();
	};
}
module.exports = grantAccess;
