import { Stack, RemovalPolicy, StackProps } from 'aws-cdk-lib';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { ContainerImage } from 'aws-cdk-lib/aws-ecs';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { Construct } from 'constructs';

export class ECRStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Step 1: Create ECR Repository
    const repository = new Repository(this, 'MyRepository', {
      repositoryName: 'my-nginx-repo',
      removalPolicy: RemovalPolicy.DESTROY,  // Only for dev/test environments
    });
  }
}
