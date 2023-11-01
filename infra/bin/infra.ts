#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';
import { S3Stack } from "../lib/s3-stack";
import { ECSStack } from '../lib/ecs-stack';
import { ECRStack } from '../lib/ecr-stack';
import { SftpEfsStack } from '../lib/sftp-efs-stack';
import { MySslCertStack } from '../lib/ssl-stack';


const app = new cdk.App();

const s3Stack = new S3Stack(app, 'MyS3Stack');

const ecrStack = new ECRStack(app, 'MyECRStack');


const sslStack = new MySslCertStack(app, 'MySslCertStack');

// const vpcStack = new VpcStack(app, 'MyVpcStack');

// const ecsStack = new ECSStack(app, 'MyECSStack', {
//   vpc: vpcStack.vpc,
//   nginxRepoName: ecrStack.nginxRepo.repositoryName,
// }
// )
// ecsStack.addDependency(vpcStack);
