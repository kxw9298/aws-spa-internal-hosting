#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';
import { S3Stack } from "../lib/s3-stack";
import { ECSStack } from '../lib/ecs-stack';
import { ECRStack } from '../lib/ecr-stack';
import { SftpEfsStack } from '../lib/sftp-efs-stack';

const app = new cdk.App();

const s3Stack = new S3Stack(app, 'MyS3Stack');

const vpcStack = new VpcStack(app, 'MyVpcStack');

const ecrStack = new ECRStack(app, 'MyECRStack');

const sftpEfsStack = new SftpEfsStack(app, 'MySftpEfsStack', { vpc: vpcStack.vpc });
sftpEfsStack.addDependency(vpcStack);

const ecsStack = new ECSStack(app, 'MyECSStack', {
  vpc: vpcStack.vpc,
  nginxRepoName: ecrStack.nginxRepo.repositoryName,
  fileSystem: sftpEfsStack.fileSystem
}
)
ecsStack.addDependency(vpcStack);
ecsStack.addDependency(sftpEfsStack);
