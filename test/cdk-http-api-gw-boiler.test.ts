import * as cdk from 'aws-cdk-lib';
import { Template} from 'aws-cdk-lib/assertions';
import { CdkHttpApiGwBoilerStack } from '../lib/cdk-http-api-gw-boiler-stack';

test('stack-created', () => {
  const app = new cdk.App();
  const stack = new CdkHttpApiGwBoilerStack(app, 'MyTestStack', {});
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::Lambda::Function', {});
});