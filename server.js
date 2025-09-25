const express = require("express");
const { AudioBuffer } = require("web-audio-api");
const toWav = require("audiobuffer-to-wav");

const app = express();
const PORT = 3000;

// Morse code mapping
const morseMap = {
  "a": ".-", "b": "-...", "c": "-.-.", "d": "-..", "e": ".", "f": "..-.",
  "g": "--.", "h": "....", "i": "..", "j": ".---", "k": "-.-", "l": ".-..",
  "m": "--", "n": "-.", "o": "---", "p": ".--.", "q": "--.-", "r": ".-.",
  "s": "...", "t": "-", "u": "..-", "v": "...-", "w": ".--", "x": "-..-",
  "y": "-.--", "z": "--..", "0": "-----", "1": ".----", "2": "..---",
  "3": "...--", "4": "....-", "5": ".....", "6": "-....", "7": "--...",
  "8": "---..", "9": "----."
};

// Convert text to Morse
function textToMorse(text) {
  if (typeof text !== 'string') {
    return '';
  }
  return text
    .toLowerCase()
    .split("")
    .map(ch => morseMap[ch] || (ch === " " ? " " : ""))
    .join(" ");
}

// Generate Morse audio
function morseToAudio(morse) {
  if (!morse) {
    const emptyBuffer = new AudioBuffer(1, 0, 44100);
    return toWav(emptyBuffer);
  }

  const sampleRate = 44100;
  const dotDuration = 0.1;  // seconds
  const dashDuration = 0.3;
  const symbolGap = 0.5;    // gap between symbols
  const wordGap = 1.0;      // gap between words

  let samples = [];

  function beep(duration) {
    const length = Math.floor(duration * sampleRate);
    let buffer = new Array(length).fill(0).map((_, i) =>
      Math.sin(2 * Math.PI * 600 * (i / sampleRate)) * 0.5
    );
    samples.push(...buffer);
  }

  function silence(duration) {
    const length = Math.floor(duration * sampleRate);
    let buffer = new Array(length).fill(0);
    samples.push(...buffer);
  }

  morse.split("").forEach(symbol => {
    if (symbol === ".") {
      beep(dotDuration); silence(symbolGap);
    } else if (symbol === "-") {
      beep(dashDuration); silence(symbolGap);
    } else if (symbol === " ") {
      silence(wordGap); // gap between words
    }
  });

  const buffer = new AudioBuffer(1, samples.length, sampleRate);
  buffer.getChannelData(0).set(samples);
  return toWav(buffer);
}

// Helper to serve audio
function serveMorse(res, phrase) {
  const morse = textToMorse(phrase);
  const wavData = morseToAudio(morse);
  res.setHeader("Content-Type", "audio/wav");
  res.send(Buffer.from(wavData));
}

// Endpoints with random names
app.get("/mars", (req, res) => {
  serveMorse(res, "in march");
});

app.get("/ignition", (req, res) => {
  serveMorse(res, "engine on");
});

app.get("/frost", (req, res) => {
  serveMorse(res, "in january");
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
