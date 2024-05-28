// response_data.ts

import { SRTError, SRTResponseError } from "./errors";
import { TrainData, PayData } from "./reservation";

/**
 * Interface representing a JSON response.
 */
interface JsonResponse {
    resultMap: ResultMap[];
    trainListMap: TrainListMap[];
    payListMap?: PayListMap[];
    outDataSets?: OutDataSets;
    ErrorCode?: string;
    ErrorMsg?: string;
    [key: string]: any; // 너무 많아지고 복잡해져서... 엄격한 타입 세팅은 나중에.
}

/**
 * Interface representing the status of a response.
 */
interface Status {
    strResult?: string;
    msgTxt?: string;
}

/**
 * Interface representing a result map.
 */
interface ResultMap {
    strResult?: string;
    msgTxt?: string;
    [key: string]: any;
}

/**
 * Interface representing a train list map.
 * Extends TrainData interface.
 */
interface TrainListMap extends TrainData {
    [key: string]: any;
}

/**
 * Interface representing output data sets.
 */
interface OutDataSets {
    dsOutput1: TrainListMap[];
    dsOutput0: any;
    [key: string]: any;
}

/**
 * Interface representing a pay list map.
 * Extends PayData interface.
 */
interface PayListMap extends PayData {
    [key: string]: any;
}

/**
 * Class representing the response data from an SRT API request.
 */
export class SRTResponseData {
    static STATUS_SUCCESS = "SUCC";
    static STATUS_FAIL = "FAIL";

    /**
     * The JSON response data.
     * @type {JsonResponse}
     * @private
     */
    private _json: JsonResponse;

    /**
     * The status of the response.
     * @type {Status}
     * @private
     */
    private _status: Status;

    /**
     * Create an instance of SRTResponseData.
     * @param {string} response - The response data as a JSON string.
     */
    constructor(response: string) {
        // response가 JSON이면 그대로 사용
        this._json =
            typeof response === "string" ? JSON.parse(response) : response;
        this._status = {};

        // Parse response data
        this._parse();
    }

    /**
     * Parse the response data.
     * @private
     */
    private _parse(): void {
        if (this._json.resultMap) {
            this._status = this._json.resultMap[0];
            return;
        }

        if (this._json.ErrorCode && this._json.ErrorMsg) {
            throw new SRTResponseError(
                `Undefined result status "[${this._json.ErrorCode}]: ${this._json.ErrorMsg}"`
            );
        }
        throw new SRTError(`Unexpected case [${JSON.stringify(this._json)}]`);
    }

    /**
     * Check if the response is successful.
     * @returns {boolean} True if successful, false otherwise.
     */
    success(): boolean {
        const result = this._status.strResult;
        if (result === undefined) {
            throw new SRTResponseError("Response status is not given");
        }
        if (result === SRTResponseData.STATUS_SUCCESS) {
            return true;
        } else if (result === SRTResponseData.STATUS_FAIL) {
            return false;
        } else {
            throw new SRTResponseError(`Undefined result status "${result}"`);
        }
    }

    /**
     * Get the message from the response status.
     * @returns {string} The message text.
     */
    message(): string {
        return this._status.msgTxt || "";
    }

    /**
     * Get all parsed data.
     * @returns {JsonResponse} The parsed JSON response data.
     */
    getAll(): JsonResponse {
        return { ...this._json };
    }

    /**
     * Get the status data.
     * @returns {Status} The status data.
     */
    getStatus(): Status {
        return { ...this._status };
    }
}
