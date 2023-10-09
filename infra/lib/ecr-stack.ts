import * as cdk from '@aws-cdk/core';
import * as ecr from '@aws-cdk/aws-ecr';
import * as ecs from '@aws-cdk/aws-ecs';
import * as assets from '@aws-cdk/aws-ecr-assets';

export class ECRStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Step 1: Create ECR Repository
    const repository = new ecr.Repository(this, 'MyRepository', {
      repositoryName: 'my-nginx-repo',
      removalPolicy: cdk.RemovalPolicy.DESTROY,  // Only for dev/test environments
    });

    // Step 2: Build & Push Docker Image to ECR
    const dockerImageAsset = new assets.DockerImageAsset(this, 'DockerImageAsset', {
      directory: './path-to-dockerfile-directory',  // Point to the directory containing your Dockerfile
    });

    // Use the ECR image in your ECS service/task definition
    const containerImage = ecs.ContainerImage.fromEcrRepository(repository, dockerImageAsset.imageUri);

    // ... The rest of your ECS service/task definition setup
  }
}
