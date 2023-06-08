const multer = require("multer");
const { nanoid } = require("nanoid");

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		console.log(file);
		if (
			file.fieldname === "profilePicture" &&
			["image/png", "image/jpeg", "image/jpg"].includes(file.mimetype)
		) {
			cb(null, "./static/profilepicture");
		}
		else if (file.fieldname === "notesPicture" && ["image/png", "image/jpeg", "image/jpg"].includes(file.mimetype)) {
			cb(null, "./static/thumbnail");
		}
		else if (
			file.fieldname === "notesVideo" &&
			["video/mp4", "video/avi", "video/mov", "video/mkv"].includes(
				file.mimetype
			)
		)
		{
			console.log(file.mimetype);
			cb(null, "./static/videos");
		}
		else if (
			file.fieldname === "thumbnail" &&
			["image/png", "image/jpeg", "image/jpg"].includes(file.mimetype)
		) {
			cb(null, "./static/thumbnail");
		} else if (
			file.fieldname === "verificationDocument" &&
			[
				"image/png",
				"image/jpeg",
				"image/jpg",
				"application/pdf",
			].includes(file.mimetype)
		) {
			cb(null, "./static/verification");
		} else if (
			file.fieldname === "operationVideo" &&
			["video/mp4", "video/avi", "video/mov", "video/mkv"].includes(
				file.mimetype
			)
		) {
			console.log(file.mimetype);
			cb(null, "./static/videos");
		} else if (
			file.fieldname === "vital" &&
			["text/csv"].includes(file.mimetype)
		) {
			console.log(file.mimetype);
			cb(null, "./static/vitals");
		} else {
			console.log(file.mimetype);
			cb({ error: "Mime type not supported" });
		}
	},
	filename: function (req, file, cb) {
		let extArray = file.mimetype.split("/");
		let extension = extArray[extArray.length - 1];
		let uniqid = nanoid();
		cb(null, uniqid + "." + extension);
	},
});

module.exports = storage;
