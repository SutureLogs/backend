# SutureLogs - Backend

#### Geeks for Geeks - Solving for India Hackathon 2023

<br/>

## Problem Statement

There is a lack of a centralized platform to share detailed surgical logs and outcomes, making it challenging for surgeons to learn from each other's experiences, identify areas for improvement, and stay up-to-date with the latest developments in the field. As a result, there is a need for a solution that can streamline the process of recording and sharing surgical logs, while also fostering collaboration and promoting knowledge sharing among surgeons.

<br/>

## Technologies Used

The backend is using the following technologies:

-   ExpressJS
-   MongoDB
-   OpenAI Whisper
-   GPT 3.5
-   Hosted on Google Cloud AMD T2D Instance
-   Ngnix

<br/>

## Setup

To get started with the project, follow these steps:

1.  Clone the repository: `git clone https://github.com/SutureLogs/backend`
2.  Install dependencies: `npm install`
3.  Create a `.env` file and add the following variable `OPENAI_API_KEY=<openai_api_key>`
4.  Start the server: `npm run start`
5.  The server runs on port `3001`

<br/>

## Submission Video

https://youtu.be/qRUZjKnmgAw

<br/>

## Frontend Repository

The frontend code for the project is hosted here [https://github.com/SutureLogs/frontend](https://github.com/SutureLogs/frontend) , check it out for more details

<br/>

## Transcribe Server

The backend relies on a Flask server to generate the transcriptions for the surgery videos, the code is hosted here https://github.com/SutureLogs/transcribe
