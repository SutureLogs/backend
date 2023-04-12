var createError = require("http-errors");
var express = require("express");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");

var authRouter = require("./api/auth");
var doctorRouter = require("./api/doctor");
var surgeryRouter = require("./api/surgery");
var patientRouter = require("./api/patient");

var app = express();
var mongoose = require("mongoose");
mongoose
	.connect("mongodb://localhost:27017/suturelogs_db")
  .then(() => {
    console.log("Successfully connected to MongoDB database.");
  })
	.catch((error) => handleError(error));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: '*'
}));

app.use("/api/auth", authRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/surgery", surgeryRouter);
app.use("/api/patient", patientRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});
// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get("env") === "development" ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.json("error");
});
module.exports = app;
