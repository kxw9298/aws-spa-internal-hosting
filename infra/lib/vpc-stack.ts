import * as cdk from 'aws-cdk-lib';
import { Vpc, SubnetType, GatewayVpcEndpointAwsService, InterfaceVpcEndpointAwsService } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class VpcStack extends cdk.Stack {
  public readonly vpc: Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the VPC
    this.vpc = new Vpc(this, 'MyVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/24'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 26,
          name: 'Public',
          subnetType: SubnetType.PUBLIC,
        }
      ],
      natGateways: 0, // No NAT gateways required
    });

    // Define the VPC Endpoint for S3
    const vpcEndpoint = this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: GatewayVpcEndpointAwsService.S3,
    });

    // Define VPC Interface Endpoints for Systems Manager (SSM)
    const ssmEndpoint = this.vpc.addInterfaceEndpoint('SSMEndpoint', {
      service: InterfaceVpcEndpointAwsService.SSM,
      privateDnsEnabled: true, // Important for name resolution
    });

    // VPC Endpoint for ECR API
    const ecrApiEndpoint = new ec2.InterfaceVpcEndpoint(this, 'EcrApiEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
      privateDnsEnabled: true,
      vpc: this.vpc,
    });

    // VPC Endpoint for ECR DKR (Docker) 
    const ecrDkrEndpoint = new ec2.InterfaceVpcEndpoint(this, 'EcrDkrEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
      privateDnsEnabled: true,
      vpc: this.vpc,
    });

    // Creating a VPC endpoint for CloudWatch Logs
    new ec2.InterfaceVpcEndpoint(this, 'CloudWatchLogsEndpoint', {
      vpc: this.vpc,
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      privateDnsEnabled: true, // Default is true
    });

    // Creating a VPC endpoint for Secret Manager
    new ec2.InterfaceVpcEndpoint(this, 'secretManagerEndpoint', {
      vpc: this.vpc,
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      privateDnsEnabled: true, // Default is true
    });

  }
}
