import { 
  Duration,
  Fn,
  Stack,
  StackProps,
  RemovalPolicy,
  aws_iam as iam,
  aws_s3 as s3,
  aws_dynamodb as dynamodb,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

import {Runtime} from 'aws-cdk-lib/aws-lambda';
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';

import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
} from '@aws-cdk/aws-apigatewayv2-alpha';
import {HttpLambdaIntegration} from '@aws-cdk/aws-apigatewayv2-integrations-alpha';

export class CdkHttpApiGwBoilerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // ==== Params ====
    const dbSecretArn = Fn.importValue('db-secret-arn');
    const dbClusterArn = Fn.importValue('db-cluster-arn');

    // ==== API Gateway ====
    const httpApi = new HttpApi(this, 'http-api-example', {
      description: 'HTTP API example',
      corsPreflight: {
        allowHeaders: ['*'],
        allowMethods: [
          CorsHttpMethod.OPTIONS,
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.PATCH,
          CorsHttpMethod.DELETE,
        ],
        allowOrigins: ['*'],
      },
    });

    // ==== IAM ====
    const secretReadPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: [dbSecretArn.toString()],
      actions: ['secretsmanager:GetSecretValue'],
    });

    const rdsDataExecPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: [dbClusterArn.toString()],
      actions: [
        'rds-data:BatchExecuteStatement',
        'rds-data:BeginTransaction',
        'rds-data:CommitTransaction',
        'rds-data:ExecuteStatement',
        'rds-data:RollbackTransaction',
      ],
    });

    // ==== S3 ====
    const assetBucket = new s3.Bucket(this, 'AssetBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // ==== DynamoDB ====
    const entityTable = new dynamodb.Table(this, 'EntityTable', {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY, // set RETAIN for prod?
      pointInTimeRecovery: false, // set true for prod?
      partitionKey: {name: 'pk', type: dynamodb.AttributeType.STRING},
      sortKey: {name: 'sk', type: dynamodb.AttributeType.STRING},
    });

    // ==== Lambda ====
    const statusGetLambda = new NodejsFunction(this, 'StatusGet', {
      memorySize: 128,
      timeout: Duration.seconds(30),
      runtime: Runtime.NODEJS_14_X,
      handler: 'handler',
      entry: './src/handlers/status-get.js',
      environment: {
        DB_NAME: 'wave',
        DB_SECRET_ARN: dbSecretArn.toString(),
        DB_CLUSTER_ARN: dbClusterArn.toString(),
        TABLE_NAME: entityTable.tableName,
        ASSET_BUCKET: assetBucket.bucketName,
      },
      bundling: {
        minify: true,
        externalModules: ['aws-sdk'],
      },
    });
    statusGetLambda.addToRolePolicy(secretReadPolicy);
    statusGetLambda.addToRolePolicy(rdsDataExecPolicy);
    statusGetLambda.addPermission('rds', {
      principal: new iam.ServicePrincipal('rds.amazonaws.com'),
      action: 'lambda:InvokeFunction',
    });
    entityTable.grantReadWriteData(statusGetLambda);
    assetBucket.grantReadWrite(statusGetLambda);

    // GET /status
    httpApi.addRoutes({
      path: '/status',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        'get-status-integration',
        statusGetLambda,
      ),
    });
  }
}
