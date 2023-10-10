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
      maxAzs: 1,
      subnetConfiguration: [{
        cidrMask: 28,
        name: 'Isolated',
        subnetType: SubnetType.PRIVATE_ISOLATED,
      }],
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
  }
}
