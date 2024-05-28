// seat_type.ts

/**
 * Enum for seat types.
 * @enum {SeatType}
 */
export enum SeatType {
    /**
     * General seat with priority.
     * 일반실 우선
     */
    GENERAL_FIRST = 1,

    /**
     * General seat only.
     * 일반실만
     */
    GENERAL_ONLY,

    /**
     * Special seat with priority.
     * 특실 우선
     */
    SPECIAL_FIRST,

    /**
     * Special seat only.
     * 특실만
     */
    SPECIAL_ONLY,
}
