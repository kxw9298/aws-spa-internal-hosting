import * as cdk from 'aws-cdk-lib';
import { Vpc, Instance, InstanceType, MachineImage, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { Role, ServicePrincipal, ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface BastionStackProps extends cdk.StackProps {
    vpc: Vpc;
}

export class BastionStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: BastionStackProps) {
        super(scope, id, props);

        const vpc = props.vpc;

        // Create the EC2 instance
        new Instance(this, 'BastionHost', {
            vpc: vpc,
            instanceType: new InstanceType('t2.micro'),
            machineImage: MachineImage.latestAmazonLinux2(), // Use latest Amazon Linux AMI
            vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED }, // Place in the private subnet
            keyName: 'my-keypair'
        });

    }
}
