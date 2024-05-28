// errors.ts

/**
 * Class representing a general SRT error.
 * @extends Error
 */
class SRTError extends Error {
    /**
     * Create an SRTError.
     * @param {string} msg - The error message.
     */
    constructor(public msg: string) {
        super(msg);
        this.name = "SRTError";
    }

    /**
     * Get a string representation of the error.
     * @returns {string} The error message.
     */
    toString(): string {
        return this.msg;
    }
}

/**
 * Class representing an SRT login error.
 * @extends SRTError
 */
class SRTLoginError extends SRTError {
    /**
     * Create an SRTLoginError.
     * @param {string} [msg="Login failed, please check ID/PW"] - The error message.
     */
    constructor(msg: string = "Login failed, please check ID/PW") {
        super(msg);
        this.name = "SRTLoginError";
    }
}

/**
 * Class representing an SRT response error.
 * @extends SRTError
 */
class SRTResponseError extends SRTError {
    /**
     * Create an SRTResponseError.
     * @param {string} msg - The error message.
     */
    constructor(msg: string) {
        super(msg);
        this.name = "SRTResponseError";
    }
}

/**
 * Class representing an SRT duplicate error.
 * @extends SRTResponseError
 */
class SRTDuplicateError extends SRTResponseError {
    /**
     * Create an SRTDuplicateError.
     * @param {string} msg - The error message.
     */
    constructor(msg: string) {
        super(msg);
        this.name = "SRTDuplicateError";
    }
}

/**
 * Class representing an error for not being logged in to SRT.
 * @extends SRTError
 */
class SRTNotLoggedInError extends SRTError {
    /**
     * Create an SRTNotLoggedInError.
     */
    constructor() {
        super("Not logged in");
        this.name = "SRTNotLoggedInError";
    }
}

export {
    SRTError,
    SRTLoginError,
    SRTResponseError,
    SRTDuplicateError,
    SRTNotLoggedInError,
};
