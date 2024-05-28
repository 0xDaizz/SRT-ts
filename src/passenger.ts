// passenger.ts

import { WINDOW_SEAT } from "./constants";

/**
 * Passenger class. Highly inspired by `srt.py`
 * <https://github.com/dotaitch/SRTpy/blob/master/SRTpy/srt.py>
 * by `dotaitch`
 */
abstract class Passenger {
    name: string;
    typeCode: string;
    count: number;

    /**
     * Create a passenger.
     * @param {string} name - The name of the passenger type.
     * @param {string} typeCode - The type code of the passenger.
     * @param {number} count - The number of passengers.
     */
    constructor(name: string, typeCode: string, count: number) {
        this.name = name;
        this.typeCode = typeCode;
        this.count = count;
    }

    /**
     * Get a string representation of the passenger.
     * @returns {string} The string representation of the passenger.
     */
    toString(): string {
        return `${this.name} ${this.count}명`;
    }

    /**
     * Combine passengers of the same type into a single passenger.
     * @param {Passenger[]} passengers - Array of passengers to combine.
     * @returns {Passenger[]} The combined passengers.
     * @throws {TypeError} If any of the passengers are not based on Passenger.
     */
    static combine(passengers: Passenger[]): Passenger[] {
        if (passengers.some((x) => !(x instanceof Passenger))) {
            throw new TypeError("Passengers must be based on Passenger");
        }

        const tmpPassengers = [...passengers];
        const combinedPassengers: Passenger[] = [];

        while (tmpPassengers.length) {
            const passenger = tmpPassengers.pop()!;
            const sameClass = tmpPassengers.filter(
                (x) => x.constructor === passenger.constructor
            );
            let newPassenger: Passenger | null = null;

            if (!sameClass.length) {
                newPassenger = passenger;
            } else {
                sameClass.forEach((same) => {
                    newPassenger = passenger.add(same);
                    tmpPassengers.splice(tmpPassengers.indexOf(same), 1);
                });
            }

            if (newPassenger && newPassenger.count > 0) {
                combinedPassengers.push(newPassenger);
            }
        }

        return combinedPassengers;
    }

    /**
     * Add another passenger of the same type.
     * @param {Passenger} other - The other passenger to add.
     * @returns {Passenger} The new combined passenger.
     * @throws {Error} If the passengers are of different types.
     */
    abstract add(other: Passenger): Passenger;

    /**
     * Get the total count of passengers.
     * @param {Passenger[]} passengers - Array of passengers.
     * @returns {string} The total count of passengers as a string.
     * @throws {TypeError} If any of the passengers are not based on Passenger.
     */
    static totalCount(passengers: Passenger[]): string {
        if (passengers.some((x) => !(x instanceof Passenger))) {
            throw new TypeError("Passengers must be based on Passenger");
        }

        return passengers
            .reduce((total, passenger) => total + passenger.count, 0)
            .toString();
    }

    /**
     * Get passenger dictionary for API request.
     * @param {Passenger[]} passengers - Array of passengers.
     * @param {boolean} [specialSeat=false] - Flag for special seat.
     * @param {boolean|null} [windowSeat=null] - Window seat preference.
     * @returns {object} The passenger dictionary for the API request.
     * @throws {TypeError} If any of the passengers are not based on Passenger.
     */
    static getPassengerDict(
        passengers: Passenger[],
        specialSeat: boolean = false,
        windowSeat: boolean | null = null
    ): object {
        if (passengers.some((x) => !(x instanceof Passenger))) {
            throw new TypeError("Passengers must be based on Passenger");
        }

        const data: any = {
            totPrnb: Passenger.totalCount(passengers),
            psgGridcnt: passengers.length.toString(),
        };

        passengers.forEach((passenger, i) => {
            data[`psgTpCd${i + 1}`] = passenger.typeCode;
            data[`psgInfoPerPrnb${i + 1}`] = passenger.count.toString();
            // seat location ('000': 기본, '012': 창측, '013': 복도측)
            const windowSeatKey =
                windowSeat === null ? "null" : windowSeat.toString();
            data[`locSeatAttCd${i + 1}`] = WINDOW_SEAT[windowSeatKey];
            // seat requirement ('015': 일반, '021': 휠체어)
            // TODO: 선택 가능하게
            data[`rqSeatAttCd${i + 1}`] = "015";
            // seat direction ('009': 정방향)
            data[`dirSeatAttCd${i + 1}`] = "009";

            data[`smkSeatAttCd${i + 1}`] = "000";
            data[`etcSeatAttCd${i + 1}`] = "000";
            // seat type: ('1': 일반실, '2': 특실)
            data[`psrmClCd${i + 1}`] = specialSeat ? "2" : "1";
        });

        return data;
    }
}

/**
 * Class representing an adult passenger.
 * @extends Passenger
 */
class Adult extends Passenger {
    /**
     * Create an adult passenger.
     * @param {number} [count=1] - The number of adult passengers.
     */
    constructor(count: number = 1) {
        super("어른/청소년", "1", count);
    }

    /**
     * Add another adult passenger.
     * @param {Passenger} other - The other passenger to add.
     * @returns {Passenger} The new combined passenger.
     * @throws {Error} If the other passenger is not an adult.
     */
    add(other: Passenger): Passenger {
        if (other instanceof Adult) {
            return new Adult(this.count + other.count);
        }
        throw new Error("Cannot combine different types of passengers");
    }
}

/**
 * Class representing a child passenger.
 * @extends Passenger
 */
class Child extends Passenger {
    /**
     * Create a child passenger.
     * @param {number} [count=1] - The number of child passengers.
     */
    constructor(count: number = 1) {
        super("어린이", "5", count);
    }

    /**
     * Add another child passenger.
     * @param {Passenger} other - The other passenger to add.
     * @returns {Passenger} The new combined passenger.
     * @throws {Error} If the other passenger is not a child.
     */
    add(other: Passenger): Passenger {
        if (other instanceof Child) {
            return new Child(this.count + other.count);
        }
        throw new Error("Cannot combine different types of passengers");
    }
}

/**
 * Class representing a senior passenger.
 * @extends Passenger
 */
class Senior extends Passenger {
    /**
     * Create a senior passenger.
     * @param {number} [count=1] - The number of senior passengers.
     */
    constructor(count: number = 1) {
        super("경로", "4", count);
    }

    /**
     * Add another senior passenger.
     * @param {Passenger} other - The other passenger to add.
     * @returns {Passenger} The new combined passenger.
     * @throws {Error} If the other passenger is not a senior.
     */
    add(other: Passenger): Passenger {
        if (other instanceof Senior) {
            return new Senior(this.count + other.count);
        }
        throw new Error("Cannot combine different types of passengers");
    }
}

/**
 * Class representing a passenger with disability (1-3 grade).
 * @extends Passenger
 */
class Disability1To3 extends Passenger {
    /**
     * Create a passenger with disability (1-3 grade).
     * @param {number} [count=1] - The number of passengers with disability (1-3 grade).
     */
    constructor(count: number = 1) {
        super("장애 1~3급", "2", count);
    }

    /**
     * Add another passenger with disability (1-3 grade).
     * @param {Passenger} other - The other passenger to add.
     * @returns {Passenger} The new combined passenger.
     * @throws {Error} If the other passenger is not of type Disability1To3.
     */
    add(other: Passenger): Passenger {
        if (other instanceof Disability1To3) {
            return new Disability1To3(this.count + other.count);
        }
        throw new Error("Cannot combine different types of passengers");
    }
}

/**
 * Class representing a passenger with disability (4-6 grade).
 * @extends Passenger
 */
class Disability4To6 extends Passenger {
    /**
     * Create a passenger with disability (4-6 grade).
     * @param {number} [count=1] - The number of passengers with disability (4-6 grade).
     */
    constructor(count: number = 1) {
        super("장애 4~6급", "3", count);
    }

    /**
     * Add another passenger with disability (4-6 grade).
     * @param {Passenger} other - The other passenger to add.
     * @returns {Passenger} The new combined passenger.
     * @throws {Error} If the other passenger is not of type Disability4To6.
     */
    add(other: Passenger): Passenger {
        if (other instanceof Disability4To6) {
            return new Disability4To6(this.count + other.count);
        }
        throw new Error("Cannot combine different types of passengers");
    }
}

export { Passenger, Adult, Child, Senior, Disability1To3, Disability4To6 };
