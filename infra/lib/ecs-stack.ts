import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { aws_logs as logs } from 'aws-cdk-lib';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as sm from 'aws-cdk-lib/aws-secretsmanager';

interface ECSStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  nginxRepoName: string;
}

export class ECSStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ECSStackProps) {
    super(scope, id, props);

    const vpc = props.vpc;


    // Security Group for the jump box
    const jumpBoxSecurityGroup = new ec2.SecurityGroup(this, 'JumpBoxSG', {
      vpc,
      description: 'Allow SSH access to jump box',
      allowAllOutbound: true,
    });

    jumpBoxSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH');

    const efsSecurityGroup = new ec2.SecurityGroup(this, 'EfsSecurityGroup', {
      vpc: vpc,
      securityGroupName: 'efsSecurityGroup',
      description: 'Amazon EFS walkthrough 1, SG for EC2 instance',
      allowAllOutbound: true,  // Adjust this based on your requirements
    });

    efsSecurityGroup.addIngressRule(ec2.Peer.ipv4(vpc.vpcCidrBlock), ec2.Port.tcp(2049), 'Allow NFS traffic from within VPC');
    // Allow NFS traffic from EC2 security group to EFS mount target security group
    efsSecurityGroup.addIngressRule(jumpBoxSecurityGroup, ec2.Port.tcp(2049), 'Allow NFS traffic from EC2 jumpbox instance');

    // Define IAM Role for the EC2 instance with S3 read permissions
    const jumpBoxRole = new iam.Role(this, 'JumpBoxRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });

    jumpBoxRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'));

    // Create an EFS FileSystem
    const fileSystem = new efs.FileSystem(this, 'MyEfsFileSystem', {
      vpc,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_7_DAYS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      securityGroup: efsSecurityGroup,
      fileSystemPolicy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            actions: ["elasticfilesystem:ClientMount", "elasticfilesystem:ClientWrite", "elasticfilesystem:ClientRootAccess"],
            effect: iam.Effect.ALLOW,
            resources: ["*"],  // This assumes you want to allow access to any resource
            principals: [new iam.ArnPrincipal('*')],
            conditions: {
              Bool: {
                "elasticfilesystem:AccessedViaMountTarget": "true"
              }
            }
          }),
        ],
      }),
    });

    jumpBoxRole.addToPolicy(new iam.PolicyStatement({
      actions: ['elasticfilesystem:ClientMount', 'elasticfilesystem:ClientWrite', 'elasticfilesystem:ClientRootAccess', 'elasticfilesystem:DescribeMountTargets', 'elasticfilesystem:DescribeFileSystems'],
      resources: [fileSystem.fileSystemArn],
    }));

    // Create an EFS Access Point with a specified path
    const accessPoint = new efs.AccessPoint(this, 'EfsAccessPoint', {
      fileSystem: fileSystem,
      path: '/',  // Specify the path for the access point
      createAcl: {
        ownerGid: '1000',
        ownerUid: '1000',
        permissions: '755',
      },
      posixUser: {
        uid: '1000',
        gid: '1000',
      },
    });

    const region = this.region; // Get the current stack's region
    // Create a JumpBox

    const jumpBox = new ec2.Instance(this, 'JumpBox', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      role: jumpBoxRole,  // Assign the role to the EC2 instance
      instanceType: new ec2.InstanceType('t2.micro'),
      machineImage: new ec2.AmazonLinuxImage(),
      securityGroup: jumpBoxSecurityGroup,
      keyName: 'my-keypair',  // Make sure this key pair exists in your account or generate a new one
      userData: ec2.UserData.custom(`
                #!/bin/bash
                sudo yum -y install amazon-efs-utils  // Installing the EFS mount helper
                mkdir ~/efs-mount-point
                sudo mount -t efs -o tls,iam ${fileSystem.fileSystemId}:/ ~/efs-mount-point
                sudo chown ec2-user:ec2-user ~/efs-mount-point
            `),
    });

    // Security group updates for EFS and EC2 to communicate
    fileSystem.connections.allowFrom(jumpBox, ec2.Port.tcp(2049), 'Allow NFS from JumpBox');
    jumpBox.connections.allowTo(fileSystem, ec2.Port.tcp(2049), 'Allow EFS access from EC2');

    new cdk.CfnOutput(this, 'EFSMountPoint', {
      value: fileSystem.fileSystemId + '.efs.us-east-1.amazonaws.com',
      description: 'EFS Mount Endpoint',
    });

    // Create the ECS Cluster
    const cluster = new ecs.Cluster(this, 'FargateCluster', {
      vpc: vpc
    });

    // Define the ECS task role
    const ecsTaskRole = new iam.Role(this, 'ECSTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
    });

    // Attach the AWS managed policy for task execution
    ecsTaskRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'));

    // Add permissions as necessary
    ecsTaskRole.addToPolicy(new iam.PolicyStatement({
      actions: ['elasticfilesystem:ClientMount', 'elasticfilesystem:ClientWrite', 'elasticfilesystem:ClientRootAccess', 'elasticfilesystem:DescribeMountTargets', 'elasticfilesystem:DescribeFileSystems'],
      resources: ['*'], // You might want to scope this down
    }));

    const ecsExecutionRole = new iam.Role(this, 'ECSExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    ecsExecutionRole.addToPolicy(new iam.PolicyStatement({
      actions: ['elasticfilesystem:ClientMount', 'elasticfilesystem:ClientWrite', 'elasticfilesystem:ClientRootAccess','elasticfilesystem:DescribeMountTargets', 'elasticfilesystem:DescribeFileSystems'],
      resources: ['*'], // You might want to scope this down
    }));

    ecsExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'));

    // Explicitly adding permissions to pull images from ECR
    ecsExecutionRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchCheckLayerAvailability",
        "ecr:BatchGetImage"
      ],
      resources: ["*"], // specify your ECR repository ARN here if needed
    }));

    // Define the Fargate Task
    const taskDef = new ecs.FargateTaskDefinition(this, 'NginxTask', {
      taskRole: ecsTaskRole,
      executionRole: ecsExecutionRole,
      // ... other properties ...

    });

    taskDef.addVolume({
      name: 'efs',
      efsVolumeConfiguration: {
        fileSystemId: fileSystem.fileSystemId,
      },
    });

    const nginxRepo = ecr.Repository.fromRepositoryName(this, 'NginxRepo', props.nginxRepoName);

    // Define the CloudWatch Logs Group
    const logGroup = new logs.LogGroup(this, 'MyECSLogGroup');

    // Import the secret ARN exported by the other stack
    const sslCertSecretArn = cdk.Fn.importValue('SslCertSecretArn');
    const sslCertSecret = sm.Secret.fromSecretCompleteArn(this, 'ImportedSecret', sslCertSecretArn);
    
    sslCertSecret.grantRead(ecsExecutionRole);
    sslCertSecret.grantRead(ecsTaskRole);

    const container = taskDef.addContainer('NginxContainer', {
      image: ecs.ContainerImage.fromEcrRepository(nginxRepo, 'cd2ed86'),
      memoryLimitMiB: 512,
      environment: {
        // This environment variable specifies the directory in EFS where Angular SPA assets are located
        APP_DIR: '/mnt/efs/app',
      },
      secrets: {
        SSL_PRIVATE_KEY: ecs.Secret.fromSecretsManager(sslCertSecret, 'privateKey'), // Accessing the privateKey from the secret
        SSL_CERTIFICATE: ecs.Secret.fromSecretsManager(sslCertSecret, 'certificate'), // Accessing the certificate from the secret
      },
      logging: new ecs.AwsLogDriver({
        streamPrefix: 'MyECSContainer',
        logGroup: logGroup,
      }),
    });

    container.addPortMappings({
      containerPort: 443,
    });

    container.addMountPoints({
      containerPath: '/mnt/efs',  // Mounting the root of EFS, the specified path in APP_DIR will be used to fetch assets
      sourceVolume: 'efs',
      readOnly: true,
    });

    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'ecsSecurityGroup', {
      vpc: vpc,
      description: 'Allow all inbound traffic from within VPC',
      allowAllOutbound: true,  // default
    });

    // Allow all inbound traffic from within the VPC
    ecsSecurityGroup.addIngressRule(ec2.Peer.ipv4(vpc.vpcCidrBlock), ec2.Port.allTraffic());
    // Allow NFS traffic from ECS security group to EFS mount target security group
    efsSecurityGroup.addIngressRule(ecsSecurityGroup, ec2.Port.tcp(2049), 'Allow NFS traffic from ECS SG');
    // allow outbound connections on port 2049 to Amazon EFS file system's security group
    ecsSecurityGroup.addEgressRule(efsSecurityGroup,ec2.Port.tcp(2049), 'Allow NFS traffic to EFS SG');
    ecsSecurityGroup.addIngressRule(efsSecurityGroup,ec2.Port.tcp(2049), 'Allow NFS traffic to ECS SG');

    // Mount targets in all subnets
    fileSystem.connections.securityGroups.push(efsSecurityGroup);

    // Create Fargate Service
    const nginxService = new ecs.FargateService(this, 'NginxService', {
      cluster: cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      assignPublicIp: false,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC
      },
      securityGroups: [ecsSecurityGroup]
    });

    // Create the Application Load Balancer in a public subnet
    const loadBalancer = new elb.ApplicationLoadBalancer(this, 'ALB', {
      vpc: vpc,
      internetFacing: true,  // Makes it public
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC
      },
    });

    // Security Group to allow HTTP traffic to the ALB
    const lbSecurityGroup = new ec2.SecurityGroup(this, 'LoadBalancerSecurityGroup', {
      vpc: vpc,
    });

    lbSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic from anywhere');
    lbSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS traffic from anywhere');

    // Assign the security group to ALB
    loadBalancer.addSecurityGroup(lbSecurityGroup);

    // Create a target group for the ALB pointing to the ECS service
    const targetGroup = new elb.ApplicationTargetGroup(this, 'EcsTargetGroup', {
      port: 443,
      targets: [],  // We will add our service to this target group later
      vpc: vpc,
      protocol: elb.ApplicationProtocol.HTTP,
    });

    // Add an HTTP listener to the ALB on port 80
    const listener = loadBalancer.addListener('HttpListener', {
      port: 80,
      open: true,
      defaultTargetGroups: [targetGroup],
    });

    // Register the ECS service with the ALB target group
    targetGroup.addTarget(nginxService);

    // Output ALB's DNS name
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: loadBalancer.loadBalancerDnsName,
      description: 'The DNS Name of the Load Balancer',
    });
  }

}
