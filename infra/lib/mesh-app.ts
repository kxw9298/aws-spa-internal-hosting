import * as cdk from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster, FargateTaskDefinition, ContainerImage, FargateService } from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';
import { LogDrivers } from 'aws-cdk-lib/aws-ecs';
import { Role, ServicePrincipal, ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import * as ecr from 'aws-cdk-lib/aws-ecr';

interface MeshAppStackProps extends cdk.StackProps {
  vpc: Vpc;
  nginxRepoName: string;
}

export class MeshAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MeshAppStackProps) {
    super(scope, id, props);

    const vpc = props.vpc;

    // Create the ECS Cluster
    const cluster = new Cluster(this, 'FargateCluster', {
      vpc: vpc
    });

    // Define the ECS task role
    const ecsTaskRole = new Role(this, 'ECSTaskRole', {
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com')
    });

    // Attach the AWS managed policy for task execution
    ecsTaskRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonECSTaskExecutionRolePolicy'));

    // Define the Fargate Task
    const taskDef = new FargateTaskDefinition(this, 'NginxTask', {
      taskRole: ecsTaskRole,
      // ... other properties ...
    });

    const nginxRepo = ecr.Repository.fromRepositoryName(this, 'NginxRepo', props.nginxRepoName);

    const container = taskDef.addContainer('NginxContainer', {
      image: ContainerImage.fromEcrRepository(nginxRepo, 'latest'),
      memoryLimitMiB: 512,
      // Health check for Nginx
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost/ || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        startPeriod: cdk.Duration.seconds(5),
        retries: 3,
      },
      logging: LogDrivers.awsLogs({ streamPrefix: 'nginx' }), // enable logging
    });

    container.addPortMappings({
      containerPort: 80,
    });

    // Create Fargate Service
    new FargateService(this, 'NginxService', {
      cluster: cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
    });
  }
}
