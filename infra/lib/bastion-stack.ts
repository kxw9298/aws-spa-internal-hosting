import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Instance, InstanceType, MachineImage, Vpc, SecurityGroup, Peer, Port, SubnetType } from 'aws-cdk-lib/aws-ec2';

interface BastionStackProps extends cdk.StackProps {
    vpc: Vpc;
}

export class BastionStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: BastionStackProps) {
        super(scope, id, props);

        const vpc = props.vpc;

        // Create a security group that allows inbound SSH traffic
        const bastionSecurityGroup = new SecurityGroup(this, 'BastionSecurityGroup', {
            vpc: vpc,
            description: 'Allow inbound SSH access',
            allowAllOutbound: true   // Default is true, but it's a good practice to specify it.
        });

        bastionSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(22), 'Allow SSH access from anywhere');

        // Create the EC2 instance
        new Instance(this, 'BastionHost', {
            vpc: vpc,
            instanceType: new InstanceType('t2.micro'),
            machineImage: MachineImage.latestAmazonLinux2(), // Use latest Amazon Linux AMI
            vpcSubnets: { subnetType: SubnetType.PUBLIC }, // Place in the private subnet
            keyName: 'my-keypair',
            securityGroup: bastionSecurityGroup
        });
    }
}

