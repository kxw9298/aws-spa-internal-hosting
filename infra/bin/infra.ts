#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';
import { S3Stack } from "../lib/s3-stack";
import { MeshAppStack } from '../lib/mesh-app';
import { ECRStack } from '../lib/ecr-stack';

const app = new cdk.App();

const s3Stack = new S3Stack(app, 'MyS3Stack');

// const vpcStack = new VpcStack(app, 'MyVpcStack');

// const ecrStack = new ECRStack(app, 'MyECRStack');

// const meshAppStack = new MeshAppStack(app, 'MeshAppStack', {
//   vpc: vpcStack.vpc,
//   ecrRepository: ecrStack.Repository
// }
// )