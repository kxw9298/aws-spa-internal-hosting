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
          cidrMask: 28,
          name: 'Isolated',
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
        {
          cidrMask: 28,
          name: 'Public',
          subnetType: SubnetType.PUBLIC,
        },
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

    // Create the VPC Endpoint for S3
    // new ec2.GatewayVpcEndpoint(this, 'S3VpcEndpoint', {
    //   service: ec2.GatewayVpcEndpointAwsService.S3,
    //   vpc: this.vpc
    // });
  }
}
