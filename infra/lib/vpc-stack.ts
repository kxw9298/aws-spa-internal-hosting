import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the VPC
    this.vpc = new ec2.Vpc(this, 'MyVpc', {
      cidr: '10.0.0.0/24',
      maxAzs: 1,
      subnetConfiguration: [{
        cidrMask: 28,
        name: 'Isolated',
        subnetType: ec2.SubnetType.ISOLATED,
      }],
    });

    // Define the VPC Endpoint for S3
    const vpcEndpoint = this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });
  }
}
