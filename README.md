# aws-spa-internal-hosting
### Create a key pair to ssh into your jumpbox
### Creae ssh key pair and upload public key(id_rsa.pub) to sftp user
```
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

## Docs
```
[Tutorial: Getting started with AWS Transfer Family server endpoints](https://docs.aws.amazon.com/transfer/latest/userguide/getting-started.html)

[Create an SFTP-enabled server](https://docs.aws.amazon.com/transfer/latest/userguide/create-server-sftp.html)

[Tutorial: Using Amazon EFS file systems with Amazon ECS using the console](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/tutorial-efs-volumes.html)