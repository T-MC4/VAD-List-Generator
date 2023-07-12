import dotenv from "dotenv";
dotenv.config();
const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

import { normalizeSpeakers } from "./normalize-speakers.js";
import axios from "axios";
import path from "path";
import fs from "fs";

export async function generateVAP(sourceFolder, fileNameWithExtension) {
	try {
		// Set file path
		console.log("\nsetting file path");
		const filePath = path.join(sourceFolder, fileNameWithExtension);
		console.log("file path set", filePath);

		// Set API endpoint and options
		const url =
			"https://api.deepgram.com/v1/listen?utterances=true&model=phonecall&tier=nova&diarize=true&punctuate=true";
		const options = {
			method: "post",
			url: url,
			headers: {
				Authorization: `Token ${deepgramApiKey}`,
				"Content-Type": determineMimetype(fileNameWithExtension),
			},
			data: fs.createReadStream(filePath),
		};

		// get API response
		const response = await axios(options);
		const json = response.data; // Deepgram Response

		// Get utterances
		const uterrances = getUtterancesArry(json);

		// Normalize the utterances so there are only 2 speakers
		const normalized = await normalizeSpeakers(
			uterrances,
			fileNameWithExtension
		);
		console.log(normalized);

		// Format the JSON to [ [...], [...] ]
		const vaData = transformUtterances(normalized);

		// console.log("transcript array result:", vaData); // Grouping Results

		// Return the transcript
		return vaData;
	} catch (err) {
		console.log(`Error with transcribeDiarizedAudio(): ${err}}`);
	}
}

function determineMimetype(file) {
	const extension = path.extname(file);
	switch (extension) {
		case ".wav":
			return "audio/wav";
		case ".mp3":
			return "audio/mpeg";
		case ".m4a":
			return "audio/mp4";
		// Add more cases as needed for different file types
		default:
			return "application/octet-stream"; // default to binary if unknown
	}
}

function transformUtterances(utterances) {
	console.log("Transforming Utterances");

	// Create empty arrays for two speakers
	let speaker0 = [];
	let speaker1 = [];

	// Iterate over each utterance using forEach
	utterances.forEach((utterance) => {
		let { speaker, start, end } = utterance;

		// Use array destructuring to assign start and end times to arrays
		speaker === 1 ? speaker0.push([start, end]) : speaker1.push([start, end]);
	});

	return [speaker0, speaker1];
}

function getUtterancesArry(data) {
	console.log("Getting Utterances");
	// Create empty array
	let arr = [];

	// Extract the utterances array
	const utterances = data.results.utterances;
	console.log(utterances);

	// Iterate over each utterance using forEach
	utterances.forEach((utterance) => {
		let { speaker, start, end, transcript } = utterance;

		// Use array destructuring to assign start and end times to arrays
		arr.push({ speaker, start, end, transcript });
	});

	return arr;
}
