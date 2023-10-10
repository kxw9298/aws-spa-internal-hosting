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

    // Step 2: Build & Push Docker Image to ECR
    const dockerImageAsset = new DockerImageAsset(this, 'DockerImageAsset', {
      directory: './lib/dist',  // Point to the directory containing your Dockerfile
    });

    // Use the ECR image in your ECS service/task definition
    const containerImage = ContainerImage.fromEcrRepository(repository, dockerImageAsset.imageUri);

    // ... The rest of your ECS service/task definition setup
  }
}
