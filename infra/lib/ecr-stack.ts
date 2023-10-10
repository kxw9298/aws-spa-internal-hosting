import { Stack, RemovalPolicy, StackProps } from 'aws-cdk-lib';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';

export class ECRStack extends Stack {
  public readonly nginxRepo: ecr.IRepository;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Step 1: Create ECR Repository
    this.nginxRepo = new Repository(this, 'MyRepository', {
      repositoryName: 'my-nginx-repo',
      removalPolicy: RemovalPolicy.DESTROY,  // Only for dev/test environments
    });

  }
}
