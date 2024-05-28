// reservation.ts

import { STATION_NAME, TRAIN_NAME } from "./constants";

/**
 * Interface representing ticket data.
 */
interface TicketData {
    scarNo: string;
    seatNo: string;
    psrmClCd: string;
    psgTpCd: string;
    rcvdAmt: string;
    stdrPrc: string;
    dcntPrc: string;
}

/**
 * Interface representing train data.
 */
export interface TrainData {
    pnrNo: string;
    rcvdAmt: string;
    tkSpecNum: string;
}

/**
 * Interface representing payment data.
 */
export interface PayData {
    stlbTrnClsfCd: string;
    trnNo: string;
    dptDt: string;
    dptTm: string;
    dptRsStnCd: string;
    arvTm: string;
    arvRsStnCd: string;
    iseLmtDt: string;
    iseLmtTm: string;
    stlFlg: string;
}

/**
 * Class representing an SRT ticket.
 */
export class SRTTicket {
    private static SEAT_TYPE: { [key: string]: string } = {
        "1": "일반실",
        "2": "특실",
    };

    private static PASSENGER_TYPE: { [key: string]: string } = {
        "1": "어른/청소년",
        "2": "장애 1~3급",
        "3": "장애 4~6급",
        "4": "경로",
        "5": "어린이",
    };

    car: string;
    seat: string;
    seatTypeCode: string;
    seatType: string;
    passengerTypeCode: string;
    passengerType: string;
    price: string;
    originalPrice: string;
    discount: string;

    /**
     * Create an SRT ticket.
     * @param {TicketData} data - The data of the ticket.
     */
    constructor(data: TicketData) {
        this.car = data.scarNo;
        this.seat = data.seatNo;
        this.seatTypeCode = data.psrmClCd;
        this.seatType = SRTTicket.SEAT_TYPE[this.seatTypeCode];
        this.passengerTypeCode = data.psgTpCd;
        this.passengerType = SRTTicket.PASSENGER_TYPE[this.passengerTypeCode];

        this.price = parseInt(data.rcvdAmt).toString();
        this.originalPrice = parseInt(data.stdrPrc).toString();
        this.discount = parseInt(data.dcntPrc).toString();
    }

    /**
     * Get a string representation of the SRT ticket.
     * @returns {string} The string representation of the ticket.
     */
    toString(): string {
        return this.dump();
    }

    /**
     * Dump the ticket information as a string.
     * @returns {string} The ticket information.
     */
    dump(): string {
        return `${this.car}호차 ${this.seat} (${this.seatType}) ${this.passengerType} [${this.price}원(${this.discount}원 할인)]`;
    }
}

/**
 * Class representing an SRT reservation.
 */
export class SRTReservation {
    reservationNumber: string;
    totalCost: string;
    seatCount: string;
    trainCode: string;
    trainName: string;
    trainNumber: string;
    depDate: string;
    depTime: string;
    depStationCode: string;
    depStationName: string;
    arrTime: string;
    arrStationCode: string;
    arrStationName: string;
    paymentDate: string;
    paymentTime: string;
    paid: boolean;
    private _tickets: SRTTicket[];

    /**
     * Create an SRT reservation.
     * @param {TrainData} train - The train data.
     * @param {PayData} pay - The payment data.
     * @param {SRTTicket[]} tickets - The list of tickets.
     */
    constructor(train: TrainData, pay: PayData, tickets: SRTTicket[]) {
        this.reservationNumber = train.pnrNo;
        this.totalCost = train.rcvdAmt.toString();
        this.seatCount = train.tkSpecNum;

        this.trainCode = pay.stlbTrnClsfCd;
        this.trainName = TRAIN_NAME[this.trainCode];
        this.trainNumber = pay.trnNo;
        this.depDate = pay.dptDt;
        this.depTime = pay.dptTm;
        this.depStationCode = pay.dptRsStnCd;
        this.depStationName = STATION_NAME[this.depStationCode];
        this.arrTime = pay.arvTm;
        this.arrStationCode = pay.arvRsStnCd;
        this.arrStationName = STATION_NAME[this.arrStationCode];
        this.paymentDate = pay.iseLmtDt;
        this.paymentTime = pay.iseLmtTm;

        this.paid = pay.stlFlg === "Y"; // 결제 여부
        this._tickets = tickets;
    }

    /**
     * Get a string representation of the SRT reservation.
     * @returns {string} The string representation of the reservation.
     */
    toString(): string {
        return this.dump();
    }

    /**
     * Dump the reservation information as a string.
     * @returns {string} The reservation information.
     */
    dump(): string {
        let result = `[${this.trainName}] ${this.depDate.substring(
            4,
            6
        )}월 ${this.depDate.substring(6, 8)}일, ${this.depStationName}~${
            this.arrStationName
        } (${this.depTime.substring(0, 2)}:${this.depTime.substring(
            2,
            4
        )}~${this.arrTime.substring(0, 2)}:${this.arrTime.substring(2, 4)}) ${
            this.totalCost
        }원(${this.seatCount}석)`;
        if (!this.paid) {
            result += `, 구입기한 ${this.paymentDate.substring(
                4,
                6
            )}월 ${this.paymentDate.substring(
                6,
                8
            )}일 ${this.paymentTime.substring(
                0,
                2
            )}:${this.paymentTime.substring(2, 4)}`;
        }
        return result;
    }

    /**
     * Get the list of tickets.
     * @returns {SRTTicket[]} The list of tickets.
     */
    get tickets(): SRTTicket[] {
        return this._tickets;
    }
}
