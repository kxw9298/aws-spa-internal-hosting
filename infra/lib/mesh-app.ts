import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecr from '@aws-cdk/aws-ecr';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as appmesh from '@aws-cdk/aws-appmesh';
import * as s3 from '@aws-cdk/aws-s3';

interface MeshAppStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  ecrRepository: ecr.Repository;
}

export class MeshAppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: MeshAppStackProps) {
    super(scope, id, props);

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: props.vpc,
    });

    // Task Definition with ECR image
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDefinition');

    const container = taskDefinition.addContainer('nginx-container', {
      image: ecs.ContainerImage.fromEcrRepository(props.ecrRepository),
      memoryLimitMiB: 512,
    });

    // App Mesh Components
    const mesh = new appmesh.Mesh(this, 'NginxMesh', {
      meshName: 'nginx-mesh',
    });

    const virtualNode = mesh.addVirtualNode('NginxNode', {
      dnsHostName: 'nginx.local',
      serviceDiscovery: appmesh.ServiceDiscovery.dns('nginx.local'),
      listeners: [appmesh.VirtualNodeListener.http()],
    });

    const virtualRouter = mesh.addVirtualRouter('NginxRouter', {
      listeners: [appmesh.VirtualRouterListener.http()],
    });

    virtualRouter.addRoute('NginxRoute', {
      routeTargets: [virtualNode],
      match: {
        prefixPath: '/',
      },
    });

    // ALB
    const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc: props.vpc,
      internetFacing: true,
    });

    const listener = lb.addListener('Listener', {
      port: 80,
    });

    // ECS Service
    const service = new ecs.FargateService(this, 'Service', {
      cluster,
      taskDefinition,
      assignPublicIp: true,
    });

    listener.addTargets('NginxTarget', {
      port: 80,
      targets: [service],
    });

    service.connections.allowFrom(lb, ec2.Port.tcp(80));
  }
}
