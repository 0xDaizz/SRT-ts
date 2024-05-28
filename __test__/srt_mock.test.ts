// __tests__/srt.test.ts
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { SRT } from "../src/srt";
import { SRTLoginError, SRTResponseError } from "../src/errors";
import { SRTReservation, SRTTicket } from "../src/reservation";
import { API_ENDPOINTS } from "../src/constants";

describe("SRT", () => {
    let mockAxios: MockAdapter;

    beforeEach(() => {
        mockAxios = new MockAdapter(axios);
    });

    afterEach(() => {
        mockAxios.restore();
    });

    it("should login successfully", async () => {
        mockAxios
            .onPost(API_ENDPOINTS.login)
            .replyOnce(200, require("./mock_responses/login_success.json"));

        const srt = new SRT("010-1234-1234", "password", false);
        const result = await srt.login();

        expect(result).toBe(true);
    });

    it("should fail login with wrong password", async () => {
        mockAxios
            .onPost(API_ENDPOINTS.login)
            .replyOnce(
                200,
                require("./mock_responses/login_fail_password.json")
            );

        const srt = new SRT("010-1234-1234", "password", false);

        await expect(srt.login()).rejects.toThrow(SRTLoginError);
    });

    it("should fail login with wrong username", async () => {
        mockAxios
            .onPost(API_ENDPOINTS.login)
            .replyOnce(
                200,
                require("./mock_responses/login_fail_no_user.json")
            );

        const srt = new SRT("010-1234-1234", "password", false);

        await expect(srt.login()).rejects.toThrow(SRTLoginError);
    });

    it("should logout successfully", async () => {
        mockAxios
            .onPost(API_ENDPOINTS.login)
            .replyOnce(200, require("./mock_responses/login_success.json"));
        mockAxios
            .onPost(API_ENDPOINTS.logout)
            .replyOnce(200, require("./mock_responses/logout_success.json"));

        const srt = new SRT("010-1234-1234", "password", false);
        await srt.login();
        const result = await srt.logout();

        expect(result).toBe(true);
    });

    // 결제 테스트를 위한 mock reservation
    const mockReservation = new SRTReservation(
        {
            pnrNo: "000000000",
            tkSpecNum: "1",
            rcvdAmt: "36900",
        },
        {
            stlbTrnClsfCd: "00",
            trnNo: "0000",
            dptDt: "20231024",
            dptTm: "000000",
            dptRsStnCd: "0551",
            arvTm: "000000",
            arvRsStnCd: "0015",
            iseLmtDt: "20231024",
            iseLmtTm: "000000",
            stlFlg: "N",
        },
        [
            new SRTTicket({
                scarNo: "1",
                seatNo: "1",
                psrmClCd: "1",
                psgTpCd: "1",
                rcvdAmt: "36900",
                stdrPrc: "36900",
                dcntPrc: "600",
            }),
        ]
    );

    it("should pay with card successfully", async () => {
        mockAxios
            .onPost(API_ENDPOINTS.login)
            .replyOnce(200, require("./mock_responses/login_success.json"));
        mockAxios
            .onPost(API_ENDPOINTS.payment)
            .replyOnce(
                200,
                require("./mock_responses/pay_with_card_success.json")
            );

        const srt = new SRT("010-1234-1234", "password", false);
        await srt.login();

        const result = await srt.payWithCard(
            mockReservation,
            "0000000000000000",
            "12",
            "700101",
            "1221",
            0,
            "J"
        );

        expect(result).toBe(true);
    });

    it("should fail to pay with card due to bad request", async () => {
        mockAxios
            .onPost(API_ENDPOINTS.login)
            .replyOnce(200, require("./mock_responses/login_success.json"));
        mockAxios
            .onPost(API_ENDPOINTS.payment)
            .replyOnce(
                200,
                require("./mock_responses/pay_with_card_fail_bad_request.json")
            );

        const srt = new SRT("010-1234-1234", "password", false);
        await srt.login();

        await expect(
            srt.payWithCard(
                mockReservation,
                "0000000000000000",
                "12",
                "700101",
                "1221",
                0,
                "J"
            )
        ).rejects.toThrow(SRTResponseError);
    });

    it("should fail to pay with card due to cant installment", async () => {
        mockAxios
            .onPost(API_ENDPOINTS.login)
            .replyOnce(200, require("./mock_responses/login_success.json"));
        mockAxios
            .onPost(API_ENDPOINTS.payment)
            .replyOnce(
                200,
                require("./mock_responses/pay_with_card_fail_cant_installment.json")
            );

        const srt = new SRT("010-1234-1234", "password", false);
        await srt.login();

        await expect(
            srt.payWithCard(
                mockReservation,
                "0000000000000000",
                "12",
                "700101",
                "1221",
                0,
                "J"
            )
        ).rejects.toThrow(SRTResponseError);
    });

    it("should fail to pay with card due to card password", async () => {
        mockAxios
            .onPost(API_ENDPOINTS.login)
            .replyOnce(200, require("./mock_responses/login_success.json"));
        mockAxios
            .onPost(API_ENDPOINTS.payment)
            .replyOnce(
                200,
                require("./mock_responses/pay_with_card_fail_card_password.json")
            );

        const srt = new SRT("010-1234-1234", "password", false);
        await srt.login();

        await expect(
            srt.payWithCard(
                mockReservation,
                "0000000000000000",
                "12",
                "700101",
                "1221",
                0,
                "J"
            )
        ).rejects.toThrow(SRTResponseError);
    });

    it("should fail to pay with card due to expired card", async () => {
        mockAxios
            .onPost(API_ENDPOINTS.login)
            .replyOnce(200, require("./mock_responses/login_success.json"));
        mockAxios
            .onPost(API_ENDPOINTS.payment)
            .replyOnce(
                200,
                require("./mock_responses/pay_with_card_fail_expired_card.json")
            );

        const srt = new SRT("010-1234-1234", "password", false);
        await srt.login();

        await expect(
            srt.payWithCard(
                mockReservation,
                "0000000000000000",
                "12",
                "700101",
                "1221",
                0,
                "J"
            )
        ).rejects.toThrow(SRTResponseError);
    });

    it("should fail to pay with card due to invalid auth number", async () => {
        mockAxios
            .onPost(API_ENDPOINTS.login)
            .replyOnce(200, require("./mock_responses/login_success.json"));
        mockAxios
            .onPost(API_ENDPOINTS.payment)
            .replyOnce(
                200,
                require("./mock_responses/pay_with_card_fail_invalid_auth_number.json")
            );

        const srt = new SRT("010-1234-1234", "password", false);
        await srt.login();

        await expect(
            srt.payWithCard(
                mockReservation,
                "0000000000000000",
                "12",
                "700101",
                "1221",
                0,
                "J"
            )
        ).rejects.toThrow(SRTResponseError);
    });

    it("should fail to pay with card due to invalid card number", async () => {
        mockAxios
            .onPost(API_ENDPOINTS.login)
            .replyOnce(200, require("./mock_responses/login_success.json"));
        mockAxios
            .onPost(API_ENDPOINTS.payment)
            .replyOnce(
                200,
                require("./mock_responses/pay_with_card_fail_invalid_card_number.json")
            );

        const srt = new SRT("010-1234-1234", "password", false);
        await srt.login();

        await expect(
            srt.payWithCard(
                mockReservation,
                "0000000000000000",
                "12",
                "700101",
                "1221",
                0,
                "J"
            )
        ).rejects.toThrow(SRTResponseError);
    });

    it("should fail to pay with card due to invalid expiration date", async () => {
        mockAxios
            .onPost(API_ENDPOINTS.login)
            .replyOnce(200, require("./mock_responses/login_success.json"));
        mockAxios
            .onPost(API_ENDPOINTS.payment)
            .replyOnce(
                200,
                require("./mock_responses/pay_with_card_fail_invalid_expiration_date.json")
            );

        const srt = new SRT("010-1234-1234", "password", false);
        await srt.login();

        await expect(
            srt.payWithCard(
                mockReservation,
                "0000000000000000",
                "12",
                "700101",
                "1221",
                0,
                "J"
            )
        ).rejects.toThrow(SRTResponseError);
    });

    it("should fail to pay with card due to invalid reservation", async () => {
        mockAxios
            .onPost(API_ENDPOINTS.login)
            .replyOnce(200, require("./mock_responses/login_success.json"));
        mockAxios
            .onPost(API_ENDPOINTS.payment)
            .replyOnce(
                200,
                require("./mock_responses/pay_with_card_fail_invalid_reservation.json")
            );

        const srt = new SRT("010-1234-1234", "password", false);
        await srt.login();

        await expect(
            srt.payWithCard(
                mockReservation,
                "0000000000000000",
                "12",
                "700101",
                "1221",
                0,
                "J"
            )
        ).rejects.toThrow(SRTResponseError);
    });

    it("should fail to pay with card due to over limit", async () => {
        mockAxios
            .onPost(API_ENDPOINTS.login)
            .replyOnce(200, require("./mock_responses/login_success.json"));
        mockAxios
            .onPost(API_ENDPOINTS.payment)
            .replyOnce(
                200,
                require("./mock_responses/pay_with_card_fail_over_limit.json")
            );

        const srt = new SRT("010-1234-1234", "password", false);
        await srt.login();

        await expect(
            srt.payWithCard(
                mockReservation,
                "0000000000000000",
                "12",
                "700101",
                "1221",
                0,
                "J"
            )
        ).rejects.toThrow(SRTResponseError);
    });

    it("should fail to pay with card due to suspension card", async () => {
        mockAxios
            .onPost(API_ENDPOINTS.login)
            .replyOnce(200, require("./mock_responses/login_success.json"));
        mockAxios
            .onPost(API_ENDPOINTS.payment)
            .replyOnce(
                200,
                require("./mock_responses/pay_with_card_fail_suspension_card.json")
            );

        const srt = new SRT("010-1234-1234", "password", false);
        await srt.login();

        await expect(
            srt.payWithCard(
                mockReservation,
                "0000000000000000",
                "12",
                "700101",
                "1221",
                0,
                "J"
            )
        ).rejects.toThrow(SRTResponseError);
    });
});

/*
Test Suites: 2 passed, 2 total
Tests:       22 passed, 22 total
Snapshots:   0 total
Time:        6.144 s, estimated 7 s
Ran all test suites.
*/
