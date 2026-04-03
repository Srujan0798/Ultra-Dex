// Copyright (c) 2026 Ultra-Dex — AWS Security Services

import {
  IAMClient,
  CreateUserCommand,
  CreateAccessKeyCommand,
  DeleteAccessKeyCommand,
  ListAccessKeysCommand,
} from '@aws-sdk/client-iam';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';

export class AWSSecurity {
  constructor(config = {}) {
    this.iamClient = new IAMClient({
      region: config.region || process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: config.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    this.stsClient = new STSClient({
      region: config.region || process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: config.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async createIAMUser(userName, path = '/ultra-dex/') {
    const command = new CreateUserCommand({
      UserName: userName,
      Path: path,
      Tags: [
        { Key: 'Application', Value: 'Ultra-Dex' },
        { Key: 'Created', Value: new Date().toISOString() },
      ],
    });

    try {
      const result = await this.iamClient.send(command);
      return {
        userName: result.User.UserName,
        userId: result.User.UserId,
        arn: result.User.Arn,
        createDate: result.User.CreateDate,
      };
    } catch (error) {
      throw new Error(`IAM create user error: ${error.message}`);
    }
  }

  async createAccessKey(userName) {
    const command = new CreateAccessKeyCommand({
      UserName: userName,
    });

    try {
      const result = await this.iamClient.send(command);
      return {
        accessKeyId: result.AccessKey.AccessKeyId,
        secretAccessKey: result.AccessKey.SecretAccessKey,
        status: result.AccessKey.Status,
        createDate: result.AccessKey.CreateDate,
      };
    } catch (error) {
      throw new Error(`IAM create access key error: ${error.message}`);
    }
  }

  async deleteAccessKey(userName, accessKeyId) {
    const command = new DeleteAccessKeyCommand({
      UserName: userName,
      AccessKeyId: accessKeyId,
    });

    try {
      await this.iamClient.send(command);
      return { accessKeyId };
    } catch (error) {
      throw new Error(`IAM delete access key error: ${error.message}`);
    }
  }

  async listAccessKeys(userName) {
    const command = new ListAccessKeysCommand({
      UserName: userName,
    });

    try {
      const result = await this.iamClient.send(command);
      return result.AccessKeyMetadata || [];
    } catch (error) {
      throw new Error(`IAM list access keys error: ${error.message}`);
    }
  }

  async assumeRole(roleArn, sessionName = 'Ultra-Dex-Session') {
    const command = new AssumeRoleCommand({
      RoleArn: roleArn,
      RoleSessionName: sessionName,
      DurationSeconds: 3600, // 1 hour
    });

    try {
      const result = await this.stsClient.send(command);
      return {
        accessKeyId: result.Credentials.AccessKeyId,
        secretAccessKey: result.Credentials.SecretAccessKey,
        sessionToken: result.Credentials.SessionToken,
        expiration: result.Credentials.Expiration,
      };
    } catch (error) {
      throw new Error(`STS assume role error: ${error.message}`);
    }
  }

  // Ultra-Dex specific security methods
  async rotateAccessKeys(userName) {
    const keys = await this.listAccessKeys(userName);
    const results = [];

    for (const key of keys) {
      // Create new key
      const newKey = await this.createAccessKey(userName);

      // Delete old key (in production, you'd verify the new key works first)
      await this.deleteAccessKey(userName, key.AccessKeyId);

      results.push({
        oldKeyId: key.AccessKeyId,
        newKeyId: newKey.accessKeyId,
      });
    }

    return results;
  }

  async createUltraDexUser(userName = 'ultra-dex-user') {
    const user = await this.createIAMUser(userName);
    const accessKey = await this.createAccessKey(userName);

    return {
      user,
      accessKey: {
        accessKeyId: accessKey.accessKeyId,
        secretAccessKey: accessKey.secretAccessKey,
      },
    };
  }
}
