import { Stack, StackProps, Duration, aws_s3 as s3, aws_s3_deployment as s3deploy, RemovalPolicy } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
export class S3Stack extends cdk.Stack {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the S3 Bucket with no public access
    this.bucket = new s3.Bucket(this, 'MyBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,  // Keep the bucket after stack deletion
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [{
        expiration: Duration.days(365)  // example rule to expire objects after 365 days
      }]
    });

    // Deploy local assets to the S3 bucket
    new s3deploy.BucketDeployment(this, 'DeployToLocalAsset', {
      sources: [s3deploy.Source.asset('./lib/dist')],  // Replace with your local directory path
      destinationBucket: this.bucket,
    });
  }
}
