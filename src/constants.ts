// constants.ts

/**
 * Object containing station codes.
 * @constant
 * @type {Object.<string, string>}
 */
export const STATION_CODE: { [key: string]: string } = {
    수서: "0551",
    동탄: "0552",
    평택지제: "0553",
    곡성: "0049",
    공주: "0514",
    광주송정: "0036",
    구례구: "0050",
    "김천(구미)": "0507",
    나주: "0037",
    남원: "0048",
    대전: "0010",
    동대구: "0015",
    마산: "0059",
    목포: "0041",
    밀양: "0017",
    부산: "0020",
    서대구: "0506",
    순천: "0051",
    신경주: "0508",
    여수EXPO: "0053",
    여천: "0139",
    오송: "0297",
    "울산(통도사)": "0509",
    익산: "0030",
    전주: "0045",
    정읍: "0033",
    진영: "0056",
    진주: "0063",
    창원: "0057",
    창원중앙: "0512",
    천안아산: "0502",
    포항: "0515",
};

/**
 * Object containing station names.
 * @constant
 * @type {Object.<string, string>}
 */
export const STATION_NAME: { [key: string]: string } = Object.fromEntries(
    Object.entries(STATION_CODE).map(([k, v]) => [v, k])
);

/**
 * Object containing train names.
 * @constant
 * @type {Object.<string, string>}
 */
export const TRAIN_NAME: { [key: string]: string } = {
    "00": "KTX",
    "02": "무궁화",
    "03": "통근열차",
    "04": "누리로",
    "05": "전체",
    "07": "KTX-산천",
    "08": "ITX-새마을",
    "09": "ITX-청춘",
    "10": "KTX-산천",
    "17": "SRT",
    "18": "ITX-마음",
};

/**
 * Object containing window seat preferences.
 * @constant
 * @type {Object.<string, string>}
 */
export const WINDOW_SEAT: { [key: string]: string } = {
    null: "000",
    true: "012",
    false: "013",
};

/**
 * URL for SRT mobile.
 * @constant
 * @type {string}
 */
export const SRT_MOBILE = "https://app.srail.or.kr:443";

/**
 * Object containing API endpoints.
 * @constant
 * @type {Object.<string, string>}
 */
export const API_ENDPOINTS: { [key: string]: string } = {
    main: `${SRT_MOBILE}/main/main.do`,
    login: `${SRT_MOBILE}/apb/selectListApb01080_n.do`,
    logout: `${SRT_MOBILE}/login/loginOut.do`,
    search_schedule: `${SRT_MOBILE}/ara/selectListAra10007_n.do`,
    reserve: `${SRT_MOBILE}/arc/selectListArc05013_n.do`,
    tickets: `${SRT_MOBILE}/atc/selectListAtc14016_n.do`,
    ticket_info: `${SRT_MOBILE}/ard/selectListArd02017_n.do?`,
    cancel: `${SRT_MOBILE}/ard/selectListArd02045_n.do`,
    standby_option: `${SRT_MOBILE}/ata/selectListAta01135_n.do`,
    payment: `${SRT_MOBILE}/ata/selectListAta09036_n.do`,
};
