const csv = require('csv-parser');
const fs = require('fs');

function vitalParser(filePath) {
  return new Promise((resolve, reject) => {
    const vitals = [];
    const timestamp = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        const keys = Object.keys(data);
        timestamp.push(parseInt(data['Timestamp']));

        for (let i = 1; i < keys.length; i++) {
          const key = keys[i];
          const name = key.split('(')[0].trim();
          const unit = key.match(/\(([^)]+)\)/)[1];
          const value = parseInt(data[key]);

          const index = vitals.findIndex((v) => v.name === name && v.unit === unit);

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
      })
      .on('end', () => {
        const final = {vitals, timestamp};
        resolve(final);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

module.exports = vitalParser;
