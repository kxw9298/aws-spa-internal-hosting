import * as cdk from 'aws-cdk-lib';
import { Vpc, SubnetType, SecurityGroup, Peer, Port } from 'aws-cdk-lib/aws-ec2';
import { Cluster, FargateTaskDefinition, ContainerImage, FargateService } from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';
import { Role, ServicePrincipal, ManagedPolicy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as s3 from 'aws-cdk-lib/aws-s3';

interface MeshAppStackProps extends cdk.StackProps {
  vpc: Vpc;
  nginxRepoName: string;
  bucket: s3.IBucket;
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
    ecsTaskRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'));

    const bucketPolicy = new PolicyStatement({
      actions: ['s3:GetObject', 's3:ListBucket'],
      resources: [props.bucket.bucketArn, props.bucket.arnForObjects('*')],
      effect: Effect.ALLOW,
    });

    ecsTaskRole.addToPolicy(bucketPolicy);

    // Define the Fargate Task
    const taskDef = new FargateTaskDefinition(this, 'NginxTask', {
      taskRole: ecsTaskRole,
      // ... other properties ...
    });

    const nginxRepo = ecr.Repository.fromRepositoryName(this, 'NginxRepo', props.nginxRepoName);

    const container = taskDef.addContainer('NginxContainer', {
      image: ContainerImage.fromEcrRepository(nginxRepo, 'latest'),
      memoryLimitMiB: 512,
    });

    container.addPortMappings({
      containerPort: 80,
    });

    const mySecurityGroup = new SecurityGroup(this, 'MySecurityGroup', {
      vpc: vpc,
      description: 'Allow all inbound traffic from within VPC',
      allowAllOutbound: true,  // default
    });

    // Allow all inbound traffic from within the VPC
    mySecurityGroup.addIngressRule(Peer.ipv4(vpc.vpcCidrBlock), Port.allTraffic());

    // Create Fargate Service
    new FargateService(this, 'NginxService', {
      cluster: cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      assignPublicIp: false,  // This ensures the Fargate task does NOT have a public IP
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED
      },
      securityGroups: [mySecurityGroup]
    });
  }
}
