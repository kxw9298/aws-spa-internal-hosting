import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as transfer from 'aws-cdk-lib/aws-transfer';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface SftpEfsStackProps extends cdk.StackProps {
    vpc: ec2.IVpc;
}

export class SftpEfsStack extends cdk.Stack {
    public readonly fileSystem: efs.FileSystem;

    constructor(scope: Construct, id: string, props: SftpEfsStackProps) {
        super(scope, id, props);

        const vpc = props.vpc;

        // Create an EFS FileSystem
        const fileSystem = new efs.FileSystem(this, 'MyEfsFileSystem', {
            vpc,
            lifecyclePolicy: efs.LifecyclePolicy.AFTER_7_DAYS,
        });

        // Create VPC Endpoint for EFS
        const efsEndpoint = new ec2.InterfaceVpcEndpoint(this, 'EfsEndpoint', {
            service: ec2.InterfaceVpcEndpointAwsService.ELASTIC_FILESYSTEM,
            vpc: vpc,
            privateDnsEnabled: true,
            securityGroups: [fileSystem.connections.securityGroups[0]],  // Use the EFS's security group
        });

        // Update the EFS's security group to allow NFS traffic
        const efsSecurityGroup = fileSystem.connections.securityGroups[0];
        efsSecurityGroup.addIngressRule(ec2.Peer.ipv4(vpc.vpcCidrBlock), ec2.Port.tcp(2049), 'Allow NFS traffic from within VPC');

        // Create an EFS Access Point with a specified path
        const accessPoint = new efs.AccessPoint(this, 'EfsAccessPoint', {
            fileSystem: fileSystem,
            path: '/',  // Specify the path for the access point
            createAcl: {
                ownerGid: '1000',
                ownerUid: '1000',
                permissions: '755',
            },
        });

        // SFTP user's role
        const sftpRole = new iam.Role(this, 'SftpRole', {
            assumedBy: new iam.ServicePrincipal('transfer.amazonaws.com'),
        });

        fileSystem.grant(sftpRole, 'elasticfilesystem:ClientMount', 'elasticfilesystem:ClientWrite', 'elasticfilesystem:ClientRead');


        // Create AWS Transfer for SFTP Server 
        const sftpServer = new transfer.CfnServer(this, 'SftpServer', {
            endpointType: 'PUBLIC',
            identityProviderType: 'SERVICE_MANAGED',
            protocols: ['SFTP'],
            loggingRole: sftpRole.roleArn,
        });

        // Create an SFTP user with EFS as the home directory
        const sftpUser = new transfer.CfnUser(this, 'SftpUser', {
            serverId: sftpServer.attrServerId,
            userName: 'mySftpUser',
            role: sftpRole.roleArn,
            homeDirectory: `/${accessPoint.accessPointId}`,
            sshPublicKeys: ['ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCWCxQj8spgIpPJchfRj8SORq26hgFng2XmKdTd5NLGUqy6el8nf4p8/rXh4nrkgE+s0fegglrp2+XX6jQXfexLshWhYQxDNQCfTHqddL0WfnUrFjb0oste5D22HmLD1+ODyLkl8guaISDFgKNqWjT8T6V1Cj2tmdK2n73imbv1X6oQfwMMPwliVGIDlk1N1xnQDzDOknP5rN9WAJn+SermtxbteQ4/IJdDIGVdJsdOipk7uIK7ZpeBtr4ockLyVnj5TrcQFiqlhOVSy0YbsNytDWM+NpmuI4hTOp13Y6uXaCDQ6i7gFCgxOla9amgP4WASviGSXBGVeuQnfNOtkillKnKJ101qWkNrrIquO2n0QvjHKvDhG4PzRaBro1tsPPgCbo/npRg3Uq53hqn6ueuML+OSVFK/dX/AQx+ZxrHtG7pCHKaT4CprV7nY9k7wN9mh3De3sIzZWy4rSDS/Uk74MvuYP6QRYyqZnINwctqcxCGSjWZlMHSjAE66pzBXG/qITeZvHcbIkQ+6gsXGdqPbvcQq0JnLZzRCWKOAS6ibqliO+3lqICsk5heQidKrmLyzFY2tA1U8Oclp+Ph0DObxobb1DALtbbXlG1Lp+SGBjZWNvJKzYNspAneGwDbum3G1+VD8V7XicC8qfI/JgYJl6TCLJa1JARti2KI2LRPWlw== your_email@example.com'],  // Add this line
        });

        sftpUser.node.addDependency(sftpServer);


        // Outputs
        new cdk.CfnOutput(this, 'SftpEndpoint', {
            value: sftpServer.attrServerId + '.server.transfer.amazonaws.com',
            description: 'SFTP Endpoint',
        });

        this.fileSystem = fileSystem;

        // Security Group for the jump box
        const jumpBoxSecurityGroup = new ec2.SecurityGroup(this, 'JumpBoxSG', {
            vpc,
            description: 'Allow SSH access to jump box',
            allowAllOutbound: true,
        });

        jumpBoxSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH');

        // Define IAM Role for the EC2 instance with S3 read permissions
        const jumpBoxRole = new iam.Role(this, 'JumpBoxRole', {
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        });

        jumpBoxRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'));


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
          yum install -y amazon-efs-utils
          mkdir /mnt/efs
          mount -t efs ${fileSystem.fileSystemId}:/ /mnt/efs
        `),
        });

        fileSystem.connections.allowFrom(jumpBox, ec2.Port.tcp(2049), 'Allow NFS from JumpBox');
    }
}
