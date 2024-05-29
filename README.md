# SRT-ts

[![npm version](https://img.shields.io/npm/v/srt-ts.svg)](https://www.npmjs.com/package/srt-ts)
[![license](https://img.shields.io/github/license/0xdaizz/srt-ts.svg?style=flat)](LICENSE)
[![types](https://img.shields.io/npm/types/typedoc-material-theme)](https://github.com/microsoft/TypeScript)
![twitter](https://img.shields.io/twitter/follow/Lucky_daiz?style=social)

Unofficial typescript API client for Korean [SRT](https://etk.srail.kr) train.

Special thanks to [SRT by ryanking13](https://github.com/ryanking13/SRT).

> [!warning]
>
> Although this package has passed many tests, problems may still occur.
>
> By using this package, you are responsible for any kind of problems it may bring.
>
> This software should be used at your own risk.

## Start

```
npm i srt-ts
```

If you want to install via pnpm,

```
pnpm add srt-ts
```

## Examples

### Import & Initialize

```Typescript
import { SRT } from "srt-ts";

const srt = new SRT("010-1234-5678", "password");
```

### Search Trains

```Typescript
const dep = "수서"; // 출발역
const arr = "부산"; // 도착역
const date = "20240529"; // 날짜 (2024년 05월 29일)
const time = "110000"; // 시간 (11시 0분)

const trains = await srt.searchTrain(dep, arr, date, time); // 검색

// trains.toString()
// [SRT 361] 05월 29일, 수서~부산(18:37~21:24) 특실 매진, 일반실 예약가능, ...
// [SRT 365] 05월 29일, 수서~부산(19:15~21:44) 특실 매진, 일반실 예약가능, ...
// [SRT 371] 05월 29일, 수서~부산(20:28~23:14) 특실 매진, 일반실 예약가능, ...

const res = await srt.reserve(trains[0]);   // 예약

// res.toString()
// '[SRT] 05월 29일, 수서~부산 (18:37~21:24) 51600원(1석), 구입기한 05월 29일 02:12'


const ticket = await srt.ticketInfo(res);   // 예약 티켓 조회

// ticket.toString()
// '7호차 5C (일반실) 어른/청소년 [51600원(1300원 할인)]'

const c = await srt.cancel(res);    // 예약 취소

// c = true

```

## Docs

**[Docs page](https://0xdaizz.github.io/SRT-ts/)**

You can check the whole api reference on this page.

## (WIP)
