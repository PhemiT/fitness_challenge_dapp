# Fitness Challenge DApp

This decentralized application (DApp) implements a fitness challenge system using Cartesi Rollups technology. Users can create challenges, join existing challenges, log their progress, and view leaderboards.

## Features

1. Create fitness challenges with custom goals and durations
2. Join existing challenges
3. Log progress for challenges
4. View challenge leaderboards
5. Inspect all challenges and participants

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```

## Running the DApp

Start the DApp using the Cartesi Rollups environment. Refer to the Cartesi documentation for detailed instructions on how to run a Rollups DApp.

## Interacting with the DApp

### Sending Inputs (Advance Requests)

To interact with the DApp, send a JSON payload with the following structure:

1. Create a challenge:

```json
{
  "action": "createChallenge",
  "creatorId": "user123",
  "title": "30-Day Running Challenge",
  "description": "Run 5km every day for 30 days",
  "startDate": "2023-06-01",
  "endDate": "2023-06-30",
  "goalType": "distance",
  "goalValue": 150
}
```

2. Join a challenge:

```json
{
  "action": "joinChallenge",
  "userId": "user456",
  "challengeId": "1685500000000"
}
```

3. Log progress:

```json
{
  "action": "logProgress",
  "userId": "user456",
  "challengeId": "1685500000000",
  "progress": 10
}
```

4. Get challenge leaderboard:

```json
{
  "action": "getChallengeLeaderboard",
  "challengeId": "1685500000000"
}
```
