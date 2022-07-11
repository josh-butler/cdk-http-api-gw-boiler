# CDK HTTP API Gateway Boiler

A boiler plate CDK projet that deploys a HTTP API Gateway

## Development

### Makefile
A Makefile is provided in the project root directory and is used to run helper commands during local development.

Default environment variables used by the Makefile can be overwritten by creating a `Makefile.env` file as shown below. This file is **OPTIONAL** and should **NOT** be committed into version control.

```bash
AWS_PROFILE=default
LAMBDA_NAME=StatusGet
LAMBDA_EVENT=events/event.json
TEST_NAME=mytest
...
```

**Usage Examples**
```bash
make test
```

| Command     | Description                                  |
| ----------- | -------------------------------------------- |
| help        | Describe all available commands              |
| npmi        | Install npm dependencies                     |
| test        | Run unit tests and code coverage report      |
| test-single | Run a single unit test/suite                 |
| coverage    | Run unit tests & coverage report             |
| unit        | Run unit tests                               |
| clean       | Delete local artifacts                       |
| local-init  | Generate initial local dev support files     |
| deploy      | Deploy CDK app using local build             |
| invoke      | Invoke individual Lambda                     |
| invoke-out  | Invoke individual Lambda & pipe logs to file |


### Code Linting

ESLint is used for static code analysis.

### Local Lambda Execution

Lambda functions can be run locally during testing & development by running `make invoke` or `make invoke-out`

#### Requirements
* AWS SAM CLI
* Docker
* Make (installed by default in OSX)

#### Process
1. Run `make local-init` (only once)
2. Choose the lambda to run by setting LAMBDA_NAME in `Makefile.env`
3. Choose the event that will be sent to the lambda setting LAMBDA_EVENT in `Makefile.env`
4. Run `make invoke-out`
5. View resulting lambda execution logs in `invoke.out`
