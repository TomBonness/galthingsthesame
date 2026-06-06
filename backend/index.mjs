import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || "GaltonBoardRuns";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
};

async function getStats() {
  let totalRuns = 0;
  const binCounts = Array(11).fill(0);
  const questionCounts = Array(10).fill(0);
  let lastEvaluatedKey = undefined;
  do {
    const params = {
      TableName: TABLE_NAME,
    };
    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }
    const response = await docClient.send(new ScanCommand(params));
    if (response.Items) {
      for (const item of response.Items) {
        let answers = item.answers;
        if (typeof answers === "string") {
          answers = answers.split(",").map(Number);
        }
        if (Array.isArray(answers) && answers.length === 10) {
          totalRuns++;
          const sum = answers.reduce((a, b) => a + b, 0);
          if (sum >= 0 && sum <= 10) {
            binCounts[sum]++;
          }
          for (let i = 0; i < 10; i++) {
            if (answers[i] === 1) {
              questionCounts[i]++;
            }
          }
        }
      }
    }
    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  const questionProbs = Array(10).fill(0.5);
  for (let i = 0; i < 10; i++) {
    questionProbs[i] = (questionCounts[i] + 1) / (totalRuns + 2);
  }

  return {
    totalRuns,
    binCounts,
    questionProbs
  };
}

export async function handler(event) {
  const method = (event.requestContext && event.requestContext.http && event.requestContext.http.method) || event.httpMethod || "GET";
  
  if (method === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "CORS preflight ok" })
    };
  }

  try {
    if (method === "GET") {
      const stats = await getStats();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(stats)
      };
    } else if (method === "POST") {
      let body;
      try {
        body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
      } catch (err) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Invalid JSON body" })
        };
      }

      if (!body || !Array.isArray(body.answers) || body.answers.length !== 10) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "answers must be an array of length 10" })
        };
      }

      const validAnswers = body.answers.every(val => val === 0 || val === 1);
      if (!validAnswers) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "answers elements must be 0 or 1" })
        };
      }

      const runId = Date.now().toString() + "-" + Math.random().toString(36).substring(2, 11);
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          id: runId,
          answers: body.answers,
          createdAt: new Date().toISOString()
        }
      }));

      const stats = await getStats();
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(stats)
      };
    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: "Method Not Allowed" })
      };
    }
  } catch (error) {
    console.error("Handler error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal Server Error", details: error.message })
    };
  }
}
