const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

function extractAudio(inputFilePath, outputFilePath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputFilePath)
        .output(outputFilePath)
        .on('end', () => {
          console.log('Conversion complete');
          resolve();
        })
        .on('error', (err) => {
          console.log(`Error converting file: ${err}`);
          reject(err);
        })
        .run();
    });
  }

module.exports = extractAudio;