// train.ts

import { STATION_NAME, TRAIN_NAME } from "./constants";

/**
 * Class representing a generic train.
 * Base class (can be extended later if needed)
 */
class Train {
    // Base class (can be extended later if needed)
}

/**
 * Class representing an SRT train.
 * @extends Train
 */
class SRTTrain extends Train {
    trainCode: string;
    trainName: string;
    trainNumber: string;
    depDate: string;
    depTime: string;
    depStationCode: string;
    depStationName: string;
    arrDate: string;
    arrTime: string;
    arrStationCode: string;
    arrStationName: string;
    generalSeatState: string;
    specialSeatState: string;
    reserveWaitPossibleCode: string;
    arrStationRunOrder: string;
    arrStationConstitutionOrder: string;
    depStationRunOrder: string;
    depStationConstitutionOrder: string;

    /**
     * Create an SRT train.
     * @param {Object} data - The data of the train.
     * @param {string} data.stlbTrnClsfCd - The train code.
     * @param {string} data.trnNo - The train number.
     * @param {string} data.dptDt - The departure date.
     * @param {string} data.dptTm - The departure time.
     * @param {string} data.dptRsStnCd - The departure station code.
     * @param {string} data.arvDt - The arrival date.
     * @param {string} data.arvTm - The arrival time.
     * @param {string} data.arvRsStnCd - The arrival station code.
     * @param {string} data.gnrmRsvPsbStr - The general seat state.
     * @param {string} data.sprmRsvPsbStr - The special seat state.
     * @param {string} data.rsvWaitPsbCd - The reserve wait possible code.
     * @param {string} data.arvStnRunOrdr - The arrival station run order.
     * @param {string} data.arvStnConsOrdr - The arrival station constitution order.
     * @param {string} data.dptStnRunOrdr - The departure station run order.
     * @param {string} data.dptStnConsOrdr - The departure station constitution order.
     */
    constructor(data: any) {
        super();
        this.trainCode = data["stlbTrnClsfCd"];
        this.trainName = TRAIN_NAME[this.trainCode];
        this.trainNumber = data["trnNo"];
        this.depDate = data["dptDt"];
        this.depTime = data["dptTm"];
        this.depStationCode = data["dptRsStnCd"];
        this.depStationName = STATION_NAME[this.depStationCode];
        this.arrDate = data["arvDt"];
        this.arrTime = data["arvTm"];
        this.arrStationCode = data["arvRsStnCd"];
        this.arrStationName = STATION_NAME[this.arrStationCode];
        this.generalSeatState = data["gnrmRsvPsbStr"];
        this.specialSeatState = data["sprmRsvPsbStr"];
        this.reserveWaitPossibleCode = data["rsvWaitPsbCd"];
        this.arrStationRunOrder = data["arvStnRunOrdr"];
        this.arrStationConstitutionOrder = data["arvStnConsOrdr"];
        this.depStationRunOrder = data["dptStnRunOrdr"];
        this.depStationConstitutionOrder = data["dptStnConsOrdr"];
    }

    /**
     * Get a string representation of the SRT train.
     * @returns {string} The string representation of the train.
     */
    toString(): string {
        return this.dump();
    }

    /**
     * Dump the train information as a string.
     * @returns {string} The train information.
     */
    dump(): string {
        return `[${this.trainName} ${
            this.trainNumber
        }] ${this.depDate.substring(4, 6)}월 ${this.depDate.substring(
            6,
            8
        )}일, ${this.depStationName}~${
            this.arrStationName
        }(${this.depTime.substring(0, 2)}:${this.depTime.substring(
            2,
            4
        )}~${this.arrTime.substring(0, 2)}:${this.arrTime.substring(
            2,
            4
        )}) 특실 ${this.specialSeatState}, 일반실 ${
            this.generalSeatState
        }, 예약대기 ${this.reserveStandbyAvailable() ? "가능" : "불가능"}`;
    }

    /**
     * Check if general seats are available.
     * @returns {boolean} True if general seats are available, false otherwise.
     */
    generalSeatAvailable(): boolean {
        return this.generalSeatState.includes("예약가능");
    }

    /**
     * Check if special seats are available.
     * @returns {boolean} True if special seats are available, false otherwise.
     */
    specialSeatAvailable(): boolean {
        return this.specialSeatState.includes("예약가능");
    }

    /**
     * Check if reserve standby is available.
     * @returns {boolean} True if reserve standby is available, false otherwise.
     */
    reserveStandbyAvailable(): boolean {
        return this.reserveWaitPossibleCode.includes("9"); // 9인 경우, 예약대기 가능한 상태임
    }

    /**
     * Check if any seats are available.
     * @returns {boolean} True if any seats are available, false otherwise.
     */
    seatAvailable(): boolean {
        return this.generalSeatAvailable() || this.specialSeatAvailable();
    }
}

/**
 * Interface representing SRT train data.
 * @interface
 */
interface SRTTrainData {
    trainCode: string;
    trainName: string;
    trainNumber: string;
    depDate: string;
    depTime: string;
    depStationCode: string;
    depStationName: string;
    arrDate: string;
    arrTime: string;
    arrStationCode: string;
    arrStationName: string;
    generalSeatState: string;
    specialSeatState: string;
    reserveWaitPossibleCode: string;
    arrStationRunOrder: string;
    arrStationConstitutionOrder: string;
    depStationRunOrder: string;
    depStationConstitutionOrder: string;
}

export { Train, SRTTrain, SRTTrainData };
