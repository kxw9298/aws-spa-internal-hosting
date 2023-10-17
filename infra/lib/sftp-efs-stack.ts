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

        fileSystem.grant(sftpRole, 'elasticfilesystem:ClientWrite');

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
        });

        sftpUser.node.addDependency(sftpServer);


        // Outputs
        new cdk.CfnOutput(this, 'SftpEndpoint', {
            value: sftpServer.attrServerId + '.server.transfer.amazonaws.com',
            description: 'SFTP Endpoint',
        });

        this.fileSystem = fileSystem;
    }
}
