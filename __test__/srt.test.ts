// __tests__/srt.test.ts
import { SRT, SRTLoginError } from "../src/index";
import { SRTReservation } from "../src/reservation";
import dotenv from "dotenv";

describe("SRT Class", () => {
    // make sure to touch .env and fill credentials before running this test
    dotenv.config();

    let srt: SRT;
    let username: string;
    let password: string;

    beforeEach(async () => {
        username = process.env.US || "";
        password = process.env.PW || "";
        srt = new SRT(username, password, false, true);
    });

    // test begins

    it("should login successfully", async () => {
        const isLogin = await srt.login();
        expect(isLogin).toBe(true);
    });

    it("should logout successfully", async () => {
        const isLogin = await srt.login();
        expect(isLogin).toBe(true);
        const isLogout = await srt.logout();
        expect(isLogout).toBe(true);
    });

    it("should fail to login with wrong credentials", async () => {
        const wrongSrt = new SRT("010-1234-5678", "deadbeef", false);
        await expect(async () => {
            await wrongSrt.login();
        }).rejects.toThrow(SRTLoginError);
    });

    it("should search trains", async () => {
        await srt.login();
        const dep = "수서";
        const arr = "부산";
        const time = "000000";
        const timeLimit = "120000";
        const date = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10)
            .replace(/-/g, "");

        const trains = await srt.searchTrain(
            dep,
            arr,
            date,
            time,
            timeLimit,
            false
        );
        expect(trains.length).not.toBe(0);
    });

    it("should get reservations", async () => {
        await srt.login();
        await srt.getReservations();
    });

    it("should reserve and set standby options", async () => {
        await srt.login();
        const dep = "수서";
        const arr = "부산";
        const time = "090000";
        const timeLimit = "240000";
        const date = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10)
            .replace(/-/g, "");

        let day = 3;
        let reservation: SRTReservation | null = null;
        while (!reservation && day < 30) {
            const date = new Date(Date.now() + day * 24 * 60 * 60 * 1000)
                .toISOString()
                .slice(0, 10)
                .replace(/-/g, "");

            const trains = await srt.searchTrain(
                dep,
                arr,
                date,
                time,
                timeLimit,
                false
            );

            expect(trains.length).not.toBe(0);

            const standbyAvailableTrains = trains.filter((t) =>
                t.reserveStandbyAvailable()
            );

            for (const train of standbyAvailableTrains) {
                reservation = await srt.reserveStandby(train);

                if (reservation) {
                    break;
                }
            }

            day++;
        }

        if (!reservation) {
            console.warn("Empty seat not found, skipping reservation test");
            return;
        }

        const isSuccess = await srt.reserveStandbyOptionSettings(
            reservation,
            true,
            true,
            "010-1234-1234"
        );

        expect(isSuccess).toBe(true);
    });

    it("should reserve and cancel", async () => {
        const isLoggedin = await srt.login();
        expect(isLoggedin).toBe(true);

        const dep = "수서";
        const arr = "부산";
        const time = "090000";

        let reservation: SRTReservation | null = null;
        for (let day = 5; day < 30; day++) {
            const date = new Date(Date.now() + day * 24 * 60 * 60 * 1000)
                .toISOString()
                .slice(0, 10)
                .replace(/-/g, "");

            const trains = await srt.searchTrain(
                dep,
                arr,
                date,
                time,
                "",
                false
            );

            expect(trains.length).not.toBe(0);

            for (const train of trains) {
                if (train.generalSeatAvailable()) {
                    reservation = await srt.reserve(train);
                    break;
                }
            }

            if (reservation) {
                break;
            }
        }

        if (!reservation) {
            console.warn("Empty seat not found, skipping reservation test");
            return;
        }

        await srt.cancel(reservation);
    });
});

/*

 PASS  __test__/srt.test.ts (5.845 s)
  SRT Class
    ✓ should login successfully (147 ms)
    ✓ should logout successfully (142 ms)
    ✓ should fail to login with wrong credentials (44 ms)
    ✓ should search trains (994 ms)
    ✓ should get reservations (165 ms)
    ✓ should reserve and set standby options (2054 ms)
    ✓ should reserve and cancel (1639 ms)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        5.865 s
Ran all test suites.

*/
