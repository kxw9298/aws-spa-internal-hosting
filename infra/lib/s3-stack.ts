import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';

export class S3Stack extends cdk.Stack {
  public readonly bucket: s3.Bucket;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the S3 Bucket with no public access
    this.bucket = new s3.Bucket(this, 'MyBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Keep the bucket after stack deletion
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [{
        expiration: cdk.Duration.days(365) // example rule to expire objects after 365 days
      }]
    });

    // Deploy local assets to the S3 bucket
    new s3deploy.BucketDeployment(this, 'DeployToLocalAsset', {
      sources: [s3deploy.Source.asset('./dist')], // Replace with your local directory path
      destinationBucket: this.bucket,
    });
  }
}
