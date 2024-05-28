// Make sure to run "tsc" before running this test
// "pnpm minitest" to run this test

import { SRT } from "../dist/index.js";
import dotenv from "dotenv";

dotenv.config();

const username = "010-1234-1234" || process.env.US;
const password = "qwerty" || process.env.PW;

const srt = new SRT(username, password, false);

// 1. see if it logins well
const isLoggedin = await srt.login();
console.log(`login : ${isLoggedin}`);

// 2.  see if it searches well

const [dep, arr, date, time, timeLimit] = [
    "수서",
    "부산",
    "20240605", // need to change the date whenever you want
    "050000",
    "120000",
];

const trains = await srt.searchTrain(dep, arr, date, time, timeLimit, true);

console.log(`trains: ${trains.length}`);

// 3. see if it reserves well
const reserved = await srt.reserve(trains[0]);

console.log(reserved);
