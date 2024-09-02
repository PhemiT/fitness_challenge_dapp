const { hexToString, stringToHex } = require("viem");

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);

let challenges = {};
let participants = {};

function createChallenge(creatorId, title, description, startDate, endDate, goalType, goalValue) {
  const challengeId = Date.now().toString();
  const newChallenge = {
    id: challengeId,
    creatorId,
    title,
    description,
    startDate,
    endDate,
    goalType,
    goalValue,
    participants: [],
    createdAt: new Date().toISOString()
  };
  challenges[challengeId] = newChallenge;

  return {
    message: "Challenge created successfully",
    challengeId: challengeId
  };
}

function joinChallenge(userId, challengeId) {
  if (!challenges[challengeId]) {
    throw new Error("Challenge not found");
  }

  if (!participants[challengeId]) {
    participants[challengeId] = {};
  }

  participants[challengeId][userId] = {
    userId,
    joinedAt: new Date().toISOString(),
    progress: 0
  };

  challenges[challengeId].participants.push(userId);

  return {
    message: "Joined challenge successfully",
    challengeId: challengeId
  };
}

function logProgress(userId, challengeId, progress) {
  if (!challenges[challengeId]) {
    throw new Error("Challenge not found");
  }

  if (!participants[challengeId] || !participants[challengeId][userId]) {
    throw new Error("User is not a participant in this challenge");
  }

  participants[challengeId][userId].progress = progress;
  participants[challengeId][userId].lastUpdated = new Date().toISOString();

  return {
    message: "Progress logged successfully",
    challengeId: challengeId,
    progress: progress
  };
}

function getChallengeLeaderboard(challengeId) {
  if (!challenges[challengeId]) {
    throw new Error("Challenge not found");
  }

  const leaderboard = Object.values(participants[challengeId] || {})
    .sort((a, b) => b.progress - a.progress)
    .map(({ userId, progress }) => ({ userId, progress }));

  return leaderboard;
}

async function handle_advance(data) {
  console.log("Received advance request data " + JSON.stringify(data));
  const payloadString = hexToString(data.payload);
  console.log(`Converted payload: ${payloadString}`);

  try {
    const payload = JSON.parse(payloadString);
    let result;

    switch (payload.action) {
      case "createChallenge":
        result = createChallenge(payload.creatorId, payload.title, payload.description, 
                                 payload.startDate, payload.endDate, payload.goalType, payload.goalValue);
        break;
      case "joinChallenge":
        result = joinChallenge(payload.userId, payload.challengeId);
        break;
      case "logProgress":
        result = logProgress(payload.userId, payload.challengeId, payload.progress);
        break;
      case "getChallengeLeaderboard":
        result = getChallengeLeaderboard(payload.challengeId);
        break;
      default:
        throw new Error("Invalid action");
    }

    const outputStr = stringToHex(JSON.stringify(result));

    await fetch(rollup_server + "/notice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload: outputStr }),
    });
  } catch (error) {
    console.error("Error processing request:", error);
    const errorStr = stringToHex(JSON.stringify({ error: error.message }));
    await fetch(rollup_server + "/notice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload: errorStr }),
    });
  }
  return "accept";
}

async function handle_inspect(data) {
  console.log("Received inspect request data " + JSON.stringify(data));

  const payload = data["payload"];
  const route = hexToString(payload);

  let responseObject;

  if (route === "challenges") {
    responseObject = JSON.stringify({ challenges });
  } else if (route === "participants") {
    responseObject = JSON.stringify({ participants });
  } else {
    responseObject = "route not implemented";
  }

  await fetch(rollup_server + "/report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload: stringToHex(responseObject) }),
  });

  return "accept";
}

var handlers = {
  advance_state: handle_advance,
  inspect_state: handle_inspect,
};

var finish = { status: "accept" };

(async () => {
  while (true) {
    const finish_req = await fetch(rollup_server + "/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "accept" }),
    });

    console.log("Received finish status " + finish_req.status);

    if (finish_req.status == 202) {
      console.log("No pending rollup request, trying again");
    } else {
      const rollup_req = await finish_req.json();
      var handler = handlers[rollup_req["request_type"]];
      finish["status"] = await handler(rollup_req["data"]);
    }
  }
})();