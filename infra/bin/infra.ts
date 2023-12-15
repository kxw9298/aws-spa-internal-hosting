#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { S3StaticWebsiteStack } from '../lib/s3-static-website-stack';



const app = new cdk.App();

const s3StaticWebsiteStack = new S3StaticWebsiteStack(app, 'S3StaticWebsiteStack');

