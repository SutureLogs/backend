const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AdminSchema = new Schema({
    username: {
        type: String,
    },
    password: {
        type: String,
        required: true,
    },
    organisation: {
        type: String,
    },
    departments: [
        {
            type: Schema.Types.ObjectId,
            ref: "Department",
        }
    ],
})

module.exports = mongoose.model("Admin", AdminSchema)