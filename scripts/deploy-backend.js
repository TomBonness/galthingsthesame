const { execSync } = require("child_process");
const fs = require("fs");

function runCmd(cmd) {
  try {
    return execSync(cmd, { stdio: "pipe" }).toString().trim();
  } catch (err) {
    // Return stderr or error message if it fails
    const msg = err.stderr ? err.stderr.toString().trim() : err.message;
    throw new Error(msg);
  }
}

function runCmdIgnoreError(cmd) {
  try {
    return execSync(cmd, { stdio: "pipe" }).toString().trim();
  } catch (err) {
    return null;
  }
}

async function main() {
  console.log("=== STARTING AWS SERVERLESS BACKEND DEPLOYMENT ===");

  // 1. Get Account ID and Region
  console.log("Fetching AWS identity and region...");
  const accountId = JSON.parse(runCmd("aws sts get-caller-identity")).Account;
  let region = runCmdIgnoreError("aws configure get region") || "us-east-1";
  console.log(`AWS Account: ${accountId}`);
  console.log(`AWS Region: ${region}`);

  // 2. Ensure DynamoDB Table exists
  console.log("\n[1/6] Checking DynamoDB table 'GaltonBoardRuns'...");
  let tableExists = false;
  try {
    const tableInfo = JSON.parse(runCmd("aws dynamodb describe-table --table-name GaltonBoardRuns"));
    console.log(`Table exists. Status: ${tableInfo.Table.TableStatus}`);
    tableExists = true;
  } catch (err) {
    console.log("Table does not exist. Creating table 'GaltonBoardRuns'...");
    runCmd(
      "aws dynamodb create-table --table-name GaltonBoardRuns " +
      "--attribute-definitions AttributeName=id,AttributeType=S " +
      "--key-schema AttributeName=id,KeyType=HASH " +
      "--billing-mode PAY_PER_REQUEST"
    );
    console.log("Table creation initiated.");
  }

  // Wait for table to be active if it was just created
  if (!tableExists) {
    console.log("Waiting for table to become ACTIVE...");
    let retries = 0;
    while (retries < 15) {
      const status = JSON.parse(runCmd("aws dynamodb describe-table --table-name GaltonBoardRuns")).Table.TableStatus;
      if (status === "ACTIVE") {
        console.log("Table is ACTIVE.");
        break;
      }
      console.log("Still waiting...");
      retries++;
      execSync("sleep 2");
    }
  }

  // 3. Ensure IAM Role exists
  console.log("\n[2/6] Checking IAM role 'GaltonBoardLambdaRole'...");
  let roleArn = "";
  let roleExists = false;
  try {
    const roleInfo = JSON.parse(runCmd("aws iam get-role --role-name GaltonBoardLambdaRole"));
    roleArn = roleInfo.Role.Arn;
    console.log(`Role exists. ARN: ${roleArn}`);
    roleExists = true;
  } catch (err) {
    console.log("Role does not exist. Creating role 'GaltonBoardLambdaRole'...");
    const trustPolicy = JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { Service: "lambda.amazonaws.com" },
          Action: "sts:AssumeRole"
        }
      ]
    });
    fs.writeFileSync("trust-policy.json", trustPolicy);
    const roleInfo = JSON.parse(runCmd("aws iam create-role --role-name GaltonBoardLambdaRole --assume-role-policy-document file://trust-policy.json"));
    roleArn = roleInfo.Role.Arn;
    fs.unlinkSync("trust-policy.json");
    console.log(`Role created. ARN: ${roleArn}`);
    
    // Wait for IAM propagation
    console.log("Waiting 10 seconds for IAM role propagation...");
    execSync("sleep 10");
  }

  // Put policies on the role
  console.log("Attaching policies to IAM role...");
  runCmd("aws iam attach-role-policy --role-name GaltonBoardLambdaRole --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole");

  const dynamodbPolicy = JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: [
          "dynamodb:PutItem",
          "dynamodb:Scan",
          "dynamodb:DescribeTable"
        ],
        Resource: `arn:aws:dynamodb:${region}:${accountId}:table/GaltonBoardRuns`
      }
    ]
  });
  fs.writeFileSync("dynamodb-policy.json", dynamodbPolicy);
  runCmd("aws iam put-role-policy --role-name GaltonBoardLambdaRole --policy-name DynamoDBAccess --policy-document file://dynamodb-policy.json");
  fs.unlinkSync("dynamodb-policy.json");
  console.log("Policies attached successfully.");

  // 4. Create zip file
  console.log("\n[3/6] Packaging Lambda function code...");
  if (fs.existsSync("backend.zip")) {
    fs.unlinkSync("backend.zip");
  }
  runCmd("zip -j backend.zip backend/index.mjs");
  console.log("Code packaged into 'backend.zip'.");

  // 5. Ensure Lambda Function exists
  console.log("\n[4/6] Checking Lambda function 'galton-board-backend'...");
  let lambdaArn = "";
  let lambdaExists = false;
  try {
    const lambdaInfo = JSON.parse(runCmd("aws lambda get-function --function-name galton-board-backend"));
    lambdaArn = lambdaInfo.Configuration.FunctionArn;
    console.log(`Lambda exists. ARN: ${lambdaArn}`);
    lambdaExists = true;
  } catch (err) {
    console.log("Lambda does not exist. Creating function 'galton-board-backend'...");
    const createRes = JSON.parse(runCmd(
      `aws lambda create-function --function-name galton-board-backend ` +
      `--runtime nodejs20.x --role ${roleArn} --handler index.handler ` +
      `--zip-file fileb://backend.zip --environment Variables={TABLE_NAME=GaltonBoardRuns}`
    ));
    lambdaArn = createRes.FunctionArn;
    console.log(`Lambda created. ARN: ${lambdaArn}`);
  }

  if (lambdaExists) {
    console.log("Updating Lambda function code...");
    runCmd("aws lambda update-function-code --function-name galton-board-backend --zip-file fileb://backend.zip");
    console.log("Waiting for Lambda function update to complete...");
    runCmd("aws lambda wait function-updated --function-name galton-board-backend");
    console.log("Updating Lambda function configuration...");
    runCmd(
      `aws lambda update-function-configuration --function-name galton-board-backend ` +
      `--environment Variables={TABLE_NAME=GaltonBoardRuns}`
    );
    console.log("Lambda function updated.");
  }

  // Cleanup zip
  if (fs.existsSync("backend.zip")) {
    fs.unlinkSync("backend.zip");
  }

  // 6. Ensure API Gateway HTTP API exists
  console.log("\n[5/6] Checking API Gateway HTTP API 'galton-board-api'...");
  let apiId = "";
  const apisRes = JSON.parse(runCmd("aws apigatewayv2 get-apis"));
  const existingApi = apisRes.Items.find(api => api.Name === "galton-board-api");

  if (existingApi) {
    apiId = existingApi.ApiId;
    console.log(`API exists. ID: ${apiId}`);
  } else {
    console.log("API does not exist. Creating API Gateway HTTP API...");
    // Create API Gateway with Lambda target. This auto-creates integration and $default route!
    const apiRes = JSON.parse(runCmd(
      `aws apigatewayv2 create-api --name galton-board-api --protocol-type HTTP --target ${lambdaArn}`
    ));
    apiId = apiRes.ApiId;
    console.log(`API created. ID: ${apiId}`);
  }

  // 7. Ensure Lambda Permission for API Gateway
  console.log("\n[6/6] Setting up permissions for API Gateway invocation...");
  let hasPermission = false;
  try {
    const policyRes = JSON.parse(runCmd(`aws lambda get-policy --function-name galton-board-backend`));
    const policy = JSON.parse(policyRes.Policy);
    hasPermission = policy.Statement.some(stmt => stmt.Sid === "apigateway-invoke");
  } catch (err) {
    // Policy does not exist at all, which is fine
  }

  if (!hasPermission) {
    console.log("Adding invocation permission to Lambda...");
    runCmd(
      `aws lambda add-permission --function-name galton-board-backend ` +
      `--statement-id apigateway-invoke --action lambda:InvokeFunction ` +
      `--principal apigateway.amazonaws.com ` +
      `--source-arn "arn:aws:execute-api:${region}:${accountId}:${apiId}/*/*"`
    );
    console.log("Permission added.");
  } else {
    console.log("Permission already exists.");
  }

  // 8. Output results
  const endpoint = `https://${apiId}.execute-api.${region}.amazonaws.com`;
  console.log("\n=== DEPLOYMENT COMPLETED SUCCESSFULLY ===");
  console.log(`API Endpoint: ${endpoint}`);
  console.log("=========================================");
}

main().catch(err => {
  console.error("\nDeployment failed!");
  console.error(err.message);
  process.exit(1);
});
