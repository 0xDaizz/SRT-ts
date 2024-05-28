// index.ts

import {
    SRTError,
    SRTLoginError,
    SRTNotLoggedInError,
    SRTResponseError,
} from "./errors";
import {
    Adult,
    Child,
    Disability1To3,
    Disability4To6,
    Passenger,
    Senior,
} from "./passenger";
import { SeatType } from "./seat_type";
import { SRT } from "./srt";

/**
 * SRT-ts Package
 *
 * This package provides classes and functions to interact with the SRT (Super Rapid Train) service.
 * It includes error handling, passenger types, seat types, and the main SRT service class.
 *
 * @module SRT-ts
 */

export {
    SRT,
    SRTError,
    SRTLoginError,
    SRTNotLoggedInError,
    SRTResponseError,
    Passenger,
    Adult,
    Child,
    Senior,
    Disability1To3,
    Disability4To6,
    SeatType,
};
