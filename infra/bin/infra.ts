#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { VpcStack } from './lib/vpc-stack.ts';
import { InfraStack } from './lib/infra-stack';
import { S3Stack } from "./lib/S3Stack.ts"
import { MeshAppStack } from './MeshAppStack';

const app = new cdk.App();
const vpcStack = new VpcStack(app, 'MyVpcStack');

const appStack = new InfraStack(app, 'InfraStack', {
  vpc: vpcStack.vpc,
});

const s3Stack = new S3Stack(app, 'MyS3Stack');

const ecrStack = new ECRStack(app, 'MyECRStack');

const meshAppStack = new MeshAppStack(app, 'MeshAppStack', {
  vpc: vpcStack.vpc,
  ecrRepository: ecrStack.Repository
}
)