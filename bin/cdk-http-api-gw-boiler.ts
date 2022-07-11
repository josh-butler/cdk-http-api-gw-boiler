#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkHttpApiGwBoilerStack } from '../lib/cdk-http-api-gw-boiler-stack';

const app = new cdk.App();
new CdkHttpApiGwBoilerStack(app, 'CdkHttpApiGwBoilerStack');
