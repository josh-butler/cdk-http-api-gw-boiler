import { Duration, Stack, StackProps } from 'aws-cdk-lib';
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

    // ==== Lambda ====
    const statusGetLambda = new NodejsFunction(this, 'StatusGet', {
      memorySize: 128,
      timeout: Duration.seconds(30),
      runtime: Runtime.NODEJS_14_X,
      handler: 'handler',
      entry: './src/handlers/status-get.js',
      bundling: {
        minify: true,
        externalModules: ['aws-sdk'],
      },
    });

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
