const csv = require("csv-parser");
const fs = require("fs");
const moment = require("moment");

function vitalParser(filePath, vitalStartTime) {
  return new Promise((resolve, reject) => {
    const vitals = [];
    const timestamp = [];
    let startTime = vitalStartTime
      ? moment(vitalStartTime, "DD/MM/YYYY HH:mm:ss")
      : null;
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        const keys = Object.keys(data);
        if (startTime) {
          if (
            moment(data["Timestamp"], "DD/MM/YYYY HH:mm:ss").isSameOrAfter(
              startTime
            )
          ) {
            timestamp.push(
              moment(data["Timestamp"], "DD/MM/YYYY HH:mm:ss").diff(
                startTime,
                "seconds"
              )
            );
            for (let i = 1; i < keys.length; i++) {
              let key = keys[i];
              let name = key.split("(")[0].trim();
              let unit = key.match(/\(([^)]+)\)/)[1];
              let value = parseInt(data[key]);

              const index = vitals.findIndex(
                (v) => v.name === name && v.unit === unit
              );
              if (isNaN(value)) value = 0;
              if (index >= 0) {
                vitals[index].values.push(value);
              } else {
                vitals.push({
                  name,
                  unit,
                  values: [value],
                });
              }
            }
          }
        } else {
          if (timestamp.length === 0) {
            startTime = moment(data["Timestamp"], "DD/MM/YYYY HH:mm:ss");
          }
        }
      })
      .on("end", () => {
        console.log(vitals, timestamp);
        const final = { vitals, timestamp };
        resolve(final);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

module.exports = vitalParser;
