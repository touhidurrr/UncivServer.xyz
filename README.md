# UncivServer.xyz

An Open Source, Unciv Multiplayer server written in TypeScript.
The biggest server in the open source game **Unciv**.

The server reached a record of serving more than **1M requests per day** on average during the preriod of December 6, 2022 to Januray 5, 2023 after nearly 9 months of it being opened for public.

As of January 26, 2023. The server serves **45M+ requests per month**, a growth that came with the server being made the default multiplayer server for many reasons like rate limiting of Dropbox and many users already using the server as their go to multiplayer server for a while for it's performance and reliability and also for many additional features that enriches the gameplay.

The graph below shows request served by the server from November 29, 2022 to January 26, 2022.

![Requests per day from November 29, 2022 to January 26, 2022](https://s3.gifyu.com/images/Requests-per-day-from-November-29-2022-to-January-26-2022.png)

To run the server:
    1. Install Redis on your system and start a Redis Server.
    2. Intsall NodeJs.
    3. Install dependencies and devDependcies.

Then run the following commands...
```bash
tsc
node src/server.js
```
