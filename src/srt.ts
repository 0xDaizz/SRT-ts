import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import qs from "qs";
import { STATION_CODE, API_ENDPOINTS } from "./constants";
import {
    SRTError,
    SRTLoginError,
    SRTNotLoggedInError,
    SRTResponseError,
} from "./errors";
import { Passenger, Adult } from "./passenger";
import { SRTReservation, SRTTicket } from "./reservation";
import { SRTResponseData } from "./response_data";
import { SeatType } from "./seat_type";
import { SRTTrain } from "./train";
import { zip } from "./helper";

const EMAIL_REGEX = /[^@]+@[^@]+\.[^@]+/;
const PHONE_NUMBER_REGEX = /(\d{3})-(\d{3,4})-(\d{4})/;

const DEFAULT_HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (Linux; Android 5.1.1; LGM-V300K Build/N2G47H) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Version/4.0 Chrome/39.0.0.0 Mobile Safari/537.36SRT-APP-Android V.1.0.6",
    Accept: "application/json",
    "Content-Type": "application/x-www-form-urlencoded",
};

const RESULT_SUCCESS = "SUCC";
const RESULT_FAIL = "FAIL";

const RESERVE_JOBID = {
    PERSONAL: "1101", // 개인예약
    STANDBY: "1102", // 예약대기
};

/**
 * Class representing the SRT service.
 */
export class SRT {
    private _session;
    private srtId: string;
    private srtPw: string;
    private verbose: boolean;
    private isLogin: boolean;
    private jar;
    private membershipNumber?: string;

    /**
     * Create an SRT instance.
     * @param {string} srtId - The SRT ID.
     * @param {string} srtPw - The SRT password.
     * @param {boolean} [autoLogin=true] - Whether to log in automatically.
     * @param {boolean} [verbose=false] - Whether to enable verbose logging.
     */
    constructor(
        srtId: string,
        srtPw: string,
        autoLogin: boolean = true,
        verbose: boolean = false
    ) {
        this.srtId = srtId;
        this.srtPw = srtPw;
        this.verbose = verbose;
        this.isLogin = false;

        this.jar = new CookieJar();
        this._session = wrapper(
            axios.create({
                headers: DEFAULT_HEADERS,
                withCredentials: true,
                jar: this.jar,
            })
        );
        if (autoLogin) {
            this.login(srtId, srtPw);
        }
    }

    /**
     * Log a message if verbose mode is enabled.
     * @param {string} msg - The message to log.
     * @private
     */
    private _log(msg: string): void {
        if (this.verbose) {
            console.log("[*] " + msg);
        }
    }

    /**
     * Log in to the SRT service.
     * @param {string} [id] - The SRT ID.
     * @param {string} [pw] - The SRT password.
     * @returns {Promise<boolean>} - The login status.
     */
    async login(id?: string, pw?: string): Promise<boolean> {
        if (id) {
            this.srtId = id;
        } else {
            id = this.srtId;
        }

        if (pw) {
            this.srtPw = pw;
        } else {
            pw = this.srtPw;
        }

        const LOGIN_TYPES: { [key: string]: string } = {
            MEMBERSHIP_ID: "1",
            EMAIL: "2",
            PHONE_NUMBER: "3",
        };

        let loginType: string;
        if (EMAIL_REGEX.test(this.srtId)) {
            loginType = LOGIN_TYPES["EMAIL"];
        } else if (PHONE_NUMBER_REGEX.test(this.srtId)) {
            loginType = LOGIN_TYPES["PHONE_NUMBER"];
            this.srtId = this.srtId.replace(/-/g, "");
        } else {
            loginType = LOGIN_TYPES["MEMBERSHIP_ID"];
        }

        const url = API_ENDPOINTS["login"];
        const data = {
            auto: "Y",
            check: "Y",
            page: "menu",
            deviceKey: "-",
            customerYn: "",
            login_referer: API_ENDPOINTS["main"],
            srchDvCd: loginType,
            srchDvNm: this.srtId,
            hmpgPwdCphd: this.srtPw,
        };

        const response = await this._session.post(url, qs.stringify(data), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            withCredentials: true,
        });

        const responseString = JSON.stringify(response.data, null, 2);

        if (responseString.includes("존재하지않는 회원입니다")) {
            this.isLogin = false;
            this._log(response.data.MSG);
            throw new SRTLoginError(response.data.MSG);
        }

        if (responseString.includes("비밀번호 오류")) {
            this.isLogin = false;
            this._log(response.data.MSG);
            throw new SRTLoginError(response.data.MSG);
        }

        if (
            responseString.includes(
                "Your IP Address Blocked due to abnormal access."
            )
        ) {
            this.isLogin = false;
            this._log(response.data.trim());
            throw new SRTLoginError(response.data.trim());
        }

        this.isLogin = true;
        this._log(response.data.userMap.MSG);
        this.membershipNumber = response.data.userMap.MB_CRD_NO;

        return true;
    }

    /**
     * Log out of the SRT service.
     * @returns {Promise<boolean>} - The logout status.
     */
    async logout(): Promise<boolean> {
        if (!this.isLogin) {
            return true;
        }

        const url = API_ENDPOINTS["logout"];
        const response = await this._session.post(url, undefined, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            withCredentials: true,
        });

        if (!response.status) {
            throw new SRTResponseError(response.data);
        }

        this.isLogin = false;
        this._log("정상적으로 로그아웃 되었습니다.");
        this.membershipNumber = undefined;

        return true;
    }

    /**
     * Search for trains.
     * @param {string} dep - The departure station.
     * @param {string} arr - The arrival station.
     * @param {string} [date] - The date of travel (yyyyMMdd).
     * @param {string} [time="000000"] - The time of travel (HHmmss).
     * @param {string} [timeLimit] - The time limit (HHmmss).
     * @param {boolean} [availableOnly=true] - Whether to include only available trains.
     * @returns {Promise<SRTTrain[]>} - The list of trains.
     */
    async searchTrain(
        dep: string,
        arr: string,
        date?: string,
        time: string = "000000",
        timeLimit?: string,
        availableOnly: boolean = true
    ): Promise<SRTTrain[]> {
        if (!(dep in STATION_CODE)) {
            throw new Error(`Station "${dep}" not exists`);
        }
        if (!(arr in STATION_CODE)) {
            throw new Error(`Station "${arr}" not exists`);
        }

        const depCode = STATION_CODE[dep];
        const arrCode = STATION_CODE[arr];

        if (!date) {
            date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        }

        const url = API_ENDPOINTS["search_schedule"];
        const data = {
            chtnDvCd: "1",
            arriveTime: "N",
            seatAttCd: "015",
            psgNum: 1,
            trnGpCd: 109,
            stlbTrnClsfCd: "05",
            dptDt: date,
            dptTm: time,
            arvRsStnCd: arrCode,
            dptRsStnCd: depCode,
        };

        let response = await this._session.post(url, qs.stringify(data), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            withCredentials: true,
        });

        const parser = new SRTResponseData(response.data);

        if (!parser.success()) {
            throw new SRTResponseError(parser.message());
        }

        this._log(parser.message());
        let allTrains = parser.getAll().outDataSets?.dsOutput1 ?? [];
        let trains = allTrains.map((train: any) => new SRTTrain(train));

        while (trains.length) {
            const lastDepTime = new Date(
                `1970-01-01T${trains[trains.length - 1].depTime.slice(
                    0,
                    2
                )}:${trains[trains.length - 1].depTime.slice(2, 4)}:00Z`
            );
            const nextDepTime = new Date(lastDepTime.getTime() + 1000);
            data.dptTm = nextDepTime
                .toISOString()
                .slice(11, 19)
                .replace(/:/g, "");

            response = await this._session.post(url, qs.stringify(data), {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                withCredentials: true,
            });

            const parser = new SRTResponseData(response.data);

            if (!parser.success()) {
                break;
            }

            const newTrains = parser.getAll().outDataSets?.dsOutput1 || [];
            trains = trains.concat(
                newTrains.map((train: any) => new SRTTrain(train))
            );
        }

        trains = trains.filter((t) => t.trainName === "SRT");

        if (availableOnly) {
            trains = trains.filter((t) => t.seatAvailable());
        }

        if (timeLimit) {
            trains = trains.filter((t) => t.depTime <= timeLimit);
        }

        return trains;
    }

    /**
     * Reserve a train ticket.
     * @param {SRTTrain} train - The train to reserve.
     * @param {Passenger[]} [passengers=[new Adult()]] - The list of passengers.
     * @param {SeatType} [specialSeat=SeatType.GENERAL_FIRST] - The seat type.
     * @param {boolean} [windowSeat] - Whether to request a window seat.
     * @returns {Promise<SRTReservation>} - The reservation details.
     */
    async reserve(
        train: SRTTrain,
        passengers: Passenger[] = [new Adult()],
        specialSeat: SeatType = SeatType.GENERAL_FIRST,
        windowSeat?: boolean
    ): Promise<SRTReservation> {
        return this._reserve(
            RESERVE_JOBID["PERSONAL"],
            train,
            passengers,
            specialSeat,
            windowSeat
        );
    }

    /**
     * Reserve a standby train ticket.
     * @param {SRTTrain} train - The train to reserve.
     * @param {Passenger[]} [passengers=[new Adult()]] - The list of passengers.
     * @param {SeatType} [specialSeat=SeatType.GENERAL_FIRST] - The seat type.
     * @param {string} [mblPhone] - The mobile phone number.
     * @returns {Promise<SRTReservation>} - The reservation details.
     */
    async reserveStandby(
        train: SRTTrain,
        passengers: Passenger[] = [new Adult()],
        specialSeat: SeatType = SeatType.GENERAL_FIRST,
        mblPhone?: string
    ): Promise<SRTReservation> {
        return this._reserve(
            RESERVE_JOBID["STANDBY"],
            train,
            passengers,
            specialSeat,
            undefined,
            mblPhone
        );
    }

    /**
     * Reserve a train ticket with specific job ID.
     * @param {string} jobid - The job ID.
     * @param {SRTTrain} train - The train to reserve.
     * @param {Passenger[]} [passengers=[new Adult()]] - The list of passengers.
     * @param {SeatType} [specialSeat=SeatType.GENERAL_FIRST] - The seat type.
     * @param {boolean} [windowSeat] - Whether to request a window seat.
     * @param {string} [mblPhone] - The mobile phone number.
     * @returns {Promise<SRTReservation>} - The reservation details.
     * @private
     */
    private async _reserve(
        jobid: string,
        train: SRTTrain,
        passengers: Passenger[] = [new Adult()],
        specialSeat: SeatType = SeatType.GENERAL_FIRST,
        windowSeat?: boolean,
        mblPhone?: string
    ): Promise<SRTReservation> {
        if (!this.isLogin) {
            throw new SRTNotLoggedInError();
        }

        if (!(train instanceof SRTTrain)) {
            throw new TypeError(
                '"train" parameter must be a SRTTrain instance'
            );
        }

        if (train.trainName !== "SRT") {
            throw new Error(
                `"SRT" expected for a train name, ${train.trainName} given`
            );
        }

        passengers = Passenger.combine(passengers);

        const isSpecialSeat: boolean = (() => {
            switch (specialSeat) {
                case SeatType.GENERAL_ONLY:
                    return false;
                case SeatType.SPECIAL_ONLY:
                    return true;
                case SeatType.GENERAL_FIRST:
                    return !train.generalSeatAvailable();
                case SeatType.SPECIAL_FIRST:
                    return train.specialSeatAvailable();
                default:
                    return false;
            }
        })();

        const url = API_ENDPOINTS["reserve"];
        const data = {
            jobId: jobid,
            jrnyCnt: "1",
            jrnyTpCd: "11",
            jrnySqno1: "001",
            stndFlg: "N",
            trnGpCd1: "300",
            trnGpCd: "109",
            grpDv: "0",
            rtnDv: "0",
            stlbTrnClsfCd1: train.trainCode,
            dptRsStnCd1: train.depStationCode,
            dptRsStnCdNm1: train.depStationName,
            arvRsStnCd1: train.arrStationCode,
            arvRsStnCdNm1: train.arrStationName,
            dptDt1: train.depDate,
            dptTm1: train.depTime,
            arvTm1: train.arrTime,
            totPrnb: passengers.length,
            psgGridcnt: passengers.length,
            psgTpCd1: passengers.length,
            psgInfoPerPrnb1: passengers.length,
            trnNo1: ("00000" + train.trainNumber).slice(-5),
            runDt1: train.depDate,
            psrmClCd1: isSpecialSeat ? "2" : "1",
            dptStnConsOrdr1: train.depStationConstitutionOrder,
            arvStnConsOrdr1: train.arrStationConstitutionOrder,
            dptStnRunOrdr1: train.depStationRunOrder,
            arvStnRunOrdr1: train.arrStationRunOrder,
            smkSeatAttCd1: "000",
            dirSeatAttCd1: "009",
            locSeatAttCd1: "000",
            rqSeatAttCd1: "015",
            etcSeatAttCd1: "000",
            smkSeatAttCd2: "000",
            dirSeatAttCd2: "009",
            rqSeatAttCd2: "015",
            mblPhone: mblPhone,
        };

        if (jobid === RESERVE_JOBID["PERSONAL"]) {
            Object.assign(data, {
                reserveType: "1",
                ...Passenger.getPassengerDict(
                    passengers,
                    isSpecialSeat,
                    windowSeat
                ),
            });
        }

        const response = await this._session.post(url, qs.stringify(data), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            withCredentials: true,
        });

        const parser = new SRTResponseData(response.data);

        if (!parser.success()) {
            throw new SRTResponseError(parser.message());
        }

        this._log(parser.message());
        const reservationResult = parser.getAll().reservListMap[0];

        const tickets = await this.getReservations();
        for (const ticket of tickets) {
            if (ticket.reservationNumber === reservationResult.pnrNo) {
                return ticket;
            }
        }

        throw new SRTError("Ticket not found: check reservation status");
    }

    /**
     * Set standby option settings for a reservation.
     * @param {SRTReservation | number} reservation - The reservation or reservation number.
     * @param {boolean} isAgreeSMS - Whether to agree to SMS notifications.
     * @param {boolean} isAgreeClassChange - Whether to agree to class change.
     * @param {string} [telNo] - The telephone number.
     * @returns {Promise<boolean>} - The status of the operation.
     */
    async reserveStandbyOptionSettings(
        reservation: SRTReservation | number,
        isAgreeSMS: boolean,
        isAgreeClassChange: boolean,
        telNo?: string
    ): Promise<boolean> {
        if (!this.isLogin) {
            throw new SRTNotLoggedInError();
        }

        if (reservation instanceof SRTReservation) {
            reservation = Number(reservation.reservationNumber);
        }

        const url = API_ENDPOINTS["standby_option"];
        const data = {
            pnrNo: reservation,
            psrmClChgFlg: isAgreeClassChange ? "Y" : "N",
            smsSndFlg: isAgreeSMS ? "Y" : "N",
            telNo: isAgreeSMS ? telNo : "",
        };

        const response = await this._session.post(url, qs.stringify(data), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            withCredentials: true,
        });
        return response.status === 200;
    }

    /**
     * Get the list of reservations.
     * @param {boolean} [paidOnly=false] - Whether to include only paid reservations.
     * @returns {Promise<SRTReservation[]>} - The list of reservations.
     */
    async getReservations(
        paidOnly: boolean = false
    ): Promise<SRTReservation[]> {
        if (!this.isLogin) {
            throw new SRTNotLoggedInError();
        }

        const url = API_ENDPOINTS["tickets"];
        const data = { pageNo: "0" };

        const response = await this._session.post(url, qs.stringify(data), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            withCredentials: true,
        });
        const parser = new SRTResponseData(response.data);

        if (!parser.success()) {
            throw new SRTResponseError(parser.message());
        }

        this._log(parser.message());

        const trainData = parser.getAll().trainListMap;
        const payData = parser.getAll().payListMap || [];
        const reservations = [];

        for (const [train, pay] of zip(trainData, payData)) {
            if (paidOnly && pay.stlFlg === "N") {
                continue;
            }
            const ticket = await this.ticketInfo(Number(train.pnrNo));
            const reservation = new SRTReservation(train, pay, ticket);
            reservations.push(reservation);
        }

        return reservations;
    }

    /**
     * Get ticket information for a reservation.
     * @param {SRTReservation | number} reservation - The reservation or reservation number.
     * @returns {Promise<SRTTicket[]>} - The list of tickets.
     */
    async ticketInfo(
        reservation: SRTReservation | number
    ): Promise<SRTTicket[]> {
        if (!this.isLogin) {
            throw new SRTNotLoggedInError();
        }

        if (reservation instanceof SRTReservation) {
            reservation = Number(reservation.reservationNumber);
        }

        const url = API_ENDPOINTS["ticket_info"];
        const data = { pnrNo: reservation, jrnySqno: "1" };

        const response = await this._session.post(url, qs.stringify(data), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            withCredentials: true,
        });
        const parser = new SRTResponseData(response.data);

        if (!parser.success()) {
            throw new SRTResponseError(parser.message());
        }

        return parser
            .getAll()
            .trainListMap?.map((ticket: any) => new SRTTicket(ticket));
    }

    /**
     * Cancel a reservation.
     * @param {SRTReservation | number} reservation - The reservation or reservation number.
     * @returns {Promise<boolean>} - The status of the operation.
     */
    async cancel(reservation: SRTReservation | number): Promise<boolean> {
        if (!this.isLogin) {
            throw new SRTNotLoggedInError();
        }

        if (reservation instanceof SRTReservation) {
            reservation = Number(reservation.reservationNumber);
        }

        const url = API_ENDPOINTS["cancel"];
        const data = { pnrNo: reservation, jrnyCnt: "1", rsvChgTno: "0" };

        const response = await this._session.post(url, qs.stringify(data), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            withCredentials: true,
        });
        const parser = new SRTResponseData(response.data);

        if (!parser.success()) {
            throw new SRTResponseError(parser.message());
        }

        this._log(parser.message());

        return true;
    }

    /**
     * Pay for a reservation with a credit card.
     * @param {SRTReservation} reservation - The reservation.
     * @param {string} number - The credit card number.
     * @param {string} password - The credit card password.
     * @param {string} validationNumber - The validation number (e.g., birthdate or business number).
     * @param {string} expireDate - The expiration date (YYMM).
     * @param {number} [installment=0] - The number of installments.
     * @param {string} [cardType="J"] - The card type (J: 개인, S: 법인).
     * @returns {Promise<boolean>} - The status of the payment.
     */
    async payWithCard(
        reservation: SRTReservation,
        number: string,
        password: string,
        validationNumber: string,
        expireDate: string,
        installment: number = 0,
        cardType: string = "J"
    ): Promise<boolean> {
        if (!this.isLogin) {
            throw new SRTNotLoggedInError();
        }

        const url = API_ENDPOINTS["payment"];
        const data = {
            stlDmnDt: new Date().toISOString().slice(0, 10).replace(/-/g, ""), // 날짜 (yyyyMMdd)
            mbCrdNo: this.membershipNumber, // 회원번호
            stlMnsSqno1: "1", // 결제수단 일련번호1 (고정값인듯)
            ststlGrdinct: "1", // 결제수단수 (고정값인듯)
            totNewStlAmt: reservation.totalCost, // 총 신규 결제금액
            athnDvCd1: cardType, // 카드타입 (J: 개인, S: 법인)
            vanPw1: password, // 카드비밀번호 앞 2자리
            crdVlidTrm1: expireDate, // 카드유효기간(YYMM)
            stlMnsCd1: "02", // 결제수단코드1 (02: 신용카드, 11: 전자지갑, 12: 포인트)
            rsvChgTno: "0", // 예약변경번호 (고정값인듯)
            chgMcs: "0", // 변경마이크로초 (고정값인듯)
            ismtMnthNum1: installment, // 할부선택 (0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 24)
            ctlDvCd: "3102", // 조정구분코드 (3102 고정값인듯)
            cgpSId: "korail", // korail 고정
            pnrNo: reservation.reservationNumber, // 예약번호
            totPrnb: reservation.seatCount, // 승차인원
            nmsStlAmt1: reservation.totalCost, // 결제금액
            crdInPlayCd1: "0", // 카드입력방식코드 (0: 신용카드/직불카드, "": 전자지갑)
            athnVal1: validationNumber, // 생년월일/사업자번호
            stlCrdNo1: number, // 카드번호
            jrnyCnt: "1", // 여정수 (1 고정)
            strJobId: "3102", // 업무구분코드 (3102 고정값인듯)
            inrcmnsGrdinct: "1", // 입력구분수 (1 고정)
            dptTm: reservation.depTime, // 출발시간
            arvTm: reservation.arrTime, // 도착시간
            dptStnConsOrdr2: "000000", // 출발역구성순서2 (000000 고정)
            arvStnConsOrdr2: "000000", // 도착역구성순서2 (000000 고정)
            trnGpCd: "300", // 열차그룹코드 (고정)
            pageNo: "-", // 페이지번호 (고정)
            rowCnt: "-", // 페이지당건수 (- 고정)
            pageUrl: "", // 페이지URL (빈값 고정)
        };

        const response = await this._session.post(url, qs.stringify(data), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            withCredentials: true,
        });
        const parser =
            typeof response.data === "string"
                ? JSON.parse(response.data)
                : response.data;

        if (parser.outDataSets.dsOutput0[0].strResult === RESULT_FAIL) {
            throw new SRTResponseError(parser.outDataSets.dsOutput0[0].msgTxt);
        }

        return true;
    }
}
