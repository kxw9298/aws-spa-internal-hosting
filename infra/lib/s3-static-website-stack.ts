import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import {
  NetworkLoadBalancer, NetworkListener, NetworkTargetGroup, Protocol,
  ApplicationLoadBalancer, ApplicationListener, ApplicationTargetGroup,
  ListenerCondition
} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Vpc, SecurityGroup, Peer, Port, InterfaceVpcEndpointAwsService, GatewayVpcEndpointAwsService, SubnetType, IpAddresses } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';

export class S3StaticWebsiteStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create an S3 bucket
    const bucket = new Bucket(this, 'MySpaBucket', {
      bucketName: 'aws-spa-internal-hosting-s3-static-website-bucket', // Replace with your desired bucket name
      websiteIndexDocument: 'index.html',
      publicReadAccess: false,
      // Note: Setting removalPolicy is a good practice when hardcoding bucket names
      removalPolicy: RemovalPolicy.DESTROY, // Adjust based on your use case
    });

    // Create VPC
    const vpc = new Vpc(this, 'MyVpc', {
      ipAddresses: IpAddresses.cidr('10.0.0.0/24'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: SubnetType.PUBLIC,
        }
      ],
      natGateways: 0, // No NAT gateways required
    });

    // Lambda function to retrieve content from S3
    const s3ProxyLambda = new lambda.Function(this, 'S3ProxyLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../service/lambda'), 
      vpc: vpc, // Deploy the Lambda function in the VPC
      allowPublicSubnet: true,
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    // Grant the Lambda function read access to the S3 bucket
    bucket.grantRead(s3ProxyLambda);

    // Create a Security Group for the ALB
    const albSecurityGroup = new SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Security group for ALB',
      allowAllOutbound: true
    });

    // Allow HTTP access to the ALB
    albSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80), 'Allow HTTP traffic');

    // Create an ALB
    const alb = new ApplicationLoadBalancer(this, 'MyALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup
    });

    // Add a listener to the ALB
    const albListener = alb.addListener('AlbListener', {
      port: 80,
      open: true
    });

    // Create a target group for the Lambda function
    const lambdaTargetGroup = new ApplicationTargetGroup(this, 'LambdaTargetGroup', {
      vpc,
      // port: 80, // This should be removed for Lambda targets
      targetType: elbv2.TargetType.LAMBDA,
    });

    // Create a Lambda function target
    const lambdaFunctionTarget = new targets.LambdaTarget(s3ProxyLambda);
    

    // Attach the Lambda function target to the target group
    lambdaTargetGroup.addTarget(lambdaFunctionTarget);

    // Add the target group to the ALB listener
    albListener.addTargetGroups('LambdaTargetGroupAttachment', {
      targetGroups: [lambdaTargetGroup]
    });


    // Create a Security Group for the NLB
    const nlbSecurityGroup = new SecurityGroup(this, 'NlbSecurityGroup', {
      vpc,
      description: 'Security group for NLB',
      allowAllOutbound: true
    });

    // Create a publicly accessible NLB
    const nlb = new NetworkLoadBalancer(this, 'MyNLB', {
      vpc,
      internetFacing: true
    });

    // Add a listener to the NLB
    const nlbListener = new NetworkListener(this, 'NlbListener', {
      loadBalancer: nlb,
      port: 80,
    });

    // Forward NLB traffic to appropriate targets (e.g., EC2 instances)
    // Note: Adjust this according to your actual target setup
    const nlbTargetGroup = new NetworkTargetGroup(this, 'NlbTargetGroup', {
      vpc,
      protocol: Protocol.TCP,
      port: 80,
      // targets: [Add your targets here]
    });

    nlbListener.addTargetGroups('NlbTargetGroupAttachment', nlbTargetGroup);

    const gatewayEndpoint = vpc.addGatewayEndpoint('S3Endpoint', {
      service: GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: SubnetType.PUBLIC}]
    });

    // Create an S3 VPC Endpoint
    const S3VpcEndpoint = vpc.addInterfaceEndpoint('S3VpcEndpoint', {
      service: InterfaceVpcEndpointAwsService.S3,
      privateDnsEnabled: true,
      subnets: { subnetType: SubnetType.PUBLIC}
    });

    S3VpcEndpoint.node.addDependency(gatewayEndpoint);

    // Additional configurations (Route 53, etc.) go here
  }
}
