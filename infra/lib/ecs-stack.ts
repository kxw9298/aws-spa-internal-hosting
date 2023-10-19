import * as cdk from 'aws-cdk-lib';
import { Vpc, SubnetType, SecurityGroup, Peer, Port } from 'aws-cdk-lib/aws-ec2';
import { Cluster, FargateTaskDefinition, ContainerImage, FargateService } from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';
import { Role, ServicePrincipal, ManagedPolicy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { ApplicationLoadBalancer, ApplicationProtocol, ApplicationListener, ApplicationTargetGroup } from 'aws-cdk-lib/aws-elasticloadbalancingv2';

interface ECSStackProps extends cdk.StackProps {
  vpc: Vpc;
  nginxRepoName: string;
  fileSystem: efs.FileSystem;
}

export class ECSStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ECSStackProps) {
    super(scope, id, props);

    const vpc = props.vpc;

    const fileSystem = props.fileSystem;

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

    // Add permissions as necessary
    ecsTaskRole.addToPolicy(new iam.PolicyStatement({
      actions: ['elasticfilesystem:ClientMount', 'elasticfilesystem:ClientWrite'],
      resources: ['*'], // You might want to scope this down
    }));

    // Define the Fargate Task
    const taskDef = new FargateTaskDefinition(this, 'NginxTask', {
      taskRole: ecsTaskRole,
      // ... other properties ...
    });

    taskDef.addVolume({
      name: 'efs',
      efsVolumeConfiguration: {
        fileSystemId: fileSystem.fileSystemId,
      },
    });

    const nginxRepo = ecr.Repository.fromRepositoryName(this, 'NginxRepo', props.nginxRepoName);

    const container = taskDef.addContainer('NginxContainer', {
      image: ContainerImage.fromEcrRepository(nginxRepo, 'latest'),
      memoryLimitMiB: 512,
      environment: {
        // This environment variable specifies the directory in EFS where Angular SPA assets are located
        APP_DIR: '/mnt/efs/app',
      },
    });

    container.addPortMappings({
      containerPort: 80,
    });

    container.addMountPoints({
      containerPath: '/mnt/efs',  // Mounting the root of EFS, the specified path in APP_DIR will be used to fetch assets
      sourceVolume: 'efs',
      readOnly: true,
    });

    const mySecurityGroup = new SecurityGroup(this, 'MySecurityGroup', {
      vpc: vpc,
      description: 'Allow all inbound traffic from within VPC',
      allowAllOutbound: true,  // default
    });

    // Allow all inbound traffic from within the VPC
    mySecurityGroup.addIngressRule(Peer.ipv4(vpc.vpcCidrBlock), Port.allTraffic());

    // Create Fargate Service
    const nginxService = new FargateService(this, 'NginxService', {
      cluster: cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      assignPublicIp: false,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED
      },
      securityGroups: [mySecurityGroup]
    });

    // // Create the Application Load Balancer in a public subnet
    // const loadBalancer = new ApplicationLoadBalancer(this, 'ALB', {
    //   vpc: vpc,
    //   internetFacing: true,  // Makes it public
    //   vpcSubnets: {
    //     subnetType: SubnetType.PUBLIC
    //   },
    // });

    // // Security Group to allow HTTP traffic to the ALB
    // const lbSecurityGroup = new SecurityGroup(this, 'LoadBalancerSecurityGroup', {
    //   vpc: vpc,
    // });

    // lbSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80), 'Allow HTTP traffic from anywhere');

    // // Assign the security group to ALB
    // loadBalancer.addSecurityGroup(lbSecurityGroup);

    // // Create a target group for the ALB pointing to the ECS service
    // const targetGroup = new ApplicationTargetGroup(this, 'EcsTargetGroup', {
    //   port: 80,
    //   targets: [],  // We will add our service to this target group later
    //   vpc: vpc,
    //   protocol: ApplicationProtocol.HTTP,
    // });

    // // Add an HTTP listener to the ALB on port 80
    // const listener = loadBalancer.addListener('HttpListener', {
    //   port: 80,
    //   open: true,
    //   defaultTargetGroups: [targetGroup],
    // });

    // // Register the ECS service with the ALB target group
    // targetGroup.addTarget(nginxService);

    // // Output ALB's DNS name
    // new cdk.CfnOutput(this, 'LoadBalancerDNS', {
    //   value: loadBalancer.loadBalancerDnsName,
    //   description: 'The DNS Name of the Load Balancer',
    // });
  }
}
