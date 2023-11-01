import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { execSync } from 'child_process';
import * as fs from 'fs';

export class MySslCertStack extends Stack {

    public readonly sslCertSecretArn: string;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Generate self-signed certificate using openssl
        execSync('openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"', {
            stdio: 'inherit',
        });

        // Read the generated certificate and private key
        const privateKey = fs.readFileSync('key.pem').toString();
        const certificate = fs.readFileSync('cert.pem').toString();

        // Store them in Secrets Manager
        const sslCertSecret = new Secret(this, 'SslCertSecret', {
            description: 'SSL Certificate and Private Key',
            generateSecretString: {
                secretStringTemplate: JSON.stringify({
                    certificate,
                    privateKey,
                }),
                generateStringKey: 'password',
            },
        });

        this.sslCertSecretArn = sslCertSecret.secretArn;

        new CfnOutput(this, 'SslCertSecretArn', {
            value: this.sslCertSecretArn,
            exportName: 'SslCertSecretArn',
        });
    }
}