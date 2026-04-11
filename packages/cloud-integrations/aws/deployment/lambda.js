// Copyright (c) 2026 Ultra-Dex — AWS Lambda Deployment

import {
  LambdaClient,
  CreateFunctionCommand,
  UpdateFunctionCodeCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import { IAMClient, CreateRoleCommand, AttachRolePolicyCommand } from '@aws-sdk/client-iam';

export class AWSLambda {
  constructor(config = {}) {
    this.lambdaClient = new LambdaClient({
      region: config.region || process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: config.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    this.iamClient = new IAMClient({
      region: config.region || process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: config.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async createFunction(
    functionName,
    code,
    handler = 'index.handler',
    runtime = 'nodejs20.x',
    roleArn
  ) {
    if (!roleArn) {
      roleArn = await this._createExecutionRole(functionName);
    }

    const command = new CreateFunctionCommand({
      FunctionName: functionName,
      Runtime: runtime,
      Role: roleArn,
      Handler: handler,
      Code: {
        ZipFile: code,
      },
      Description: 'Ultra-Dex serverless function',
      Timeout: 30,
      MemorySize: 256,
      Environment: {
        Variables: {
          NODE_ENV: 'production',
        },
      },
    });

    try {
      const result = await this.lambdaClient.send(command);
      return {
        functionName: result.FunctionName,
        functionArn: result.FunctionArn,
        lastModified: result.LastModified,
      };
    } catch (error) {
      throw new Error(`Lambda create function error: ${error.message}`);
    }
  }

  async updateFunction(functionName, code) {
    const command = new UpdateFunctionCodeCommand({
      FunctionName: functionName,
      ZipFile: code,
    });

    try {
      const result = await this.lambdaClient.send(command);
      return {
        functionName: result.FunctionName,
        lastModified: result.LastModified,
      };
    } catch (error) {
      throw new Error(`Lambda update function error: ${error.message}`);
    }
  }

  async invoke(functionName, payload = {}) {
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload),
    });

    try {
      const result = await this.lambdaClient.send(command);
      const response = JSON.parse(new TextDecoder().decode(result.Payload));
      return {
        statusCode: result.StatusCode,
        executedVersion: result.ExecutedVersion,
        payload: response,
      };
    } catch (error) {
      throw new Error(`Lambda invoke error: ${error.message}`);
    }
  }

  async _createExecutionRole(functionName) {
    const roleName = `${functionName}-execution-role`;
    const assumeRolePolicyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { Service: 'lambda.amazonaws.com' },
          Action: 'sts:AssumeRole',
        },
      ],
    };

    const createRoleCommand = new CreateRoleCommand({
      RoleName: roleName,
      AssumeRolePolicyDocument: JSON.stringify(assumeRolePolicyDocument),
      Description: 'Execution role for Ultra-Dex Lambda functions',
    });

    try {
      const roleResult = await this.iamClient.send(createRoleCommand);

      // Attach basic execution policy
      const attachPolicyCommand = new AttachRolePolicyCommand({
        RoleName: roleName,
        PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      });

      await this.iamClient.send(attachPolicyCommand);
      return roleResult.Role.Arn;
    } catch (error) {
      throw new Error(`IAM role creation error: ${error.message}`);
    }
  }

  // Deploy Ultra-Dex as serverless functions
  async deployUltraDexFunction(code, functionName = 'ultra-dex-serverless') {
    return this.createFunction(functionName, code, 'index.handler', 'nodejs20.x');
  }

  async deployWorkerFunction(code, functionName = 'ultra-dex-worker') {
    return this.createFunction(functionName, code, 'worker.handler', 'nodejs20.x');
  }
}
