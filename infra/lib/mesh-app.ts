import * as cdk from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster, FargateTaskDefinition, ContainerImage, FargateService } from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';

interface MeshAppStackProps extends cdk.StackProps {
  vpc: Vpc;
}

export class MeshAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MeshAppStackProps) {
    super(scope, id, props);

    const vpc = props.vpc;

    // Create the ECS Cluster
    const cluster = new Cluster(this, 'FargateCluster', {
      vpc: vpc
    });

    // Define the Fargate Task
    const taskDef = new FargateTaskDefinition(this, 'NginxTask');

    const container = taskDef.addContainer('NginxContainer', {
      image: ContainerImage.fromRegistry('nginx:latest'),
      memoryLimitMiB: 512,
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
