const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Learn = new Schema({
  surgeryID: String,
  quiz: [],
  flashcard: [],
});

module.exports = mongoose.model("Learn", Learn);
