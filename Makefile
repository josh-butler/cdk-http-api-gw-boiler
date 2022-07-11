.PHONY: all \
help local-init arm64 \
clean npmi build deploy \
lint unit test test-single coverage \
invoke invoke-out codegen

-include Makefile.env

ROOT_PATH=$(PWD)
SRC_PATH=$(ROOT_PATH)/src
BIN:=$(ROOT_PATH)/node_modules/.bin
ESLINT=$(BIN)/eslint
JEST=$(BIN)/jest
AMPLIFY=$(BIN)/amplify

APP_NAME?=cdk-http-api-gw-boiler
AWS_REGION?=us-east-1
AWS_OPTIONS=

STACK_NAME?=CdkHttpApiGwBoilerStack
LAMBDA_EVENT?=events/event.json
LAMBDA_ENV?=.env.local.json

ifdef AWS_PROFILE
AWS_OPTIONS=--profile $(AWS_PROFILE)
endif

define ENV_LOCAL_JSON
{
  "StatusGet": {
    "TABLE_NAME": "table-name-here"
  }
}
endef
export ENV_LOCAL_JSON

define EVENT_LOCAL_JSON
{
  "version": "2.0",
  "routeKey": "$default",
  "rawPath": "/path/to/resource",
  "rawQueryString": "parameter1=value1&parameter1=value2&parameter2=value",
  "cookies": [
    "cookie1",
    "cookie2"
  ],
  "headers": {
    "Header1": "value1",
    "Header2": "value1,value2"
  },
  "queryStringParameters": {
    "parameter1": "value1,value2",
    "parameter2": "value"
  },
  "requestContext": {
    "accountId": "123456789012",
    "apiId": "api-id",
    "authentication": {
      "clientCert": {
        "clientCertPem": "CERT_CONTENT",
        "subjectDN": "www.example.com",
        "issuerDN": "Example issuer",
        "serialNumber": "a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1",
        "validity": {
          "notBefore": "May 28 12:30:02 2019 GMT",
          "notAfter": "Aug  5 09:36:04 2021 GMT"
        }
      }
    },
    "authorizer": {
      "jwt": {
        "claims": {
          "claim1": "value1",
          "claim2": "value2"
        },
        "scopes": [
          "scope1",
          "scope2"
        ]
      }
    },
    "domainName": "id.execute-api.us-east-1.amazonaws.com",
    "domainPrefix": "id",
    "http": {
      "method": "POST",
      "path": "/path/to/resource",
      "protocol": "HTTP/1.1",
      "sourceIp": "192.168.0.1/32",
      "userAgent": "agent"
    },
    "requestId": "id",
    "routeKey": "$default",
    "stage": "$default",
    "time": "12/Mar/2020:19:03:58 +0000",
    "timeEpoch": 1583348638390
  },
  "body": "eyJ0ZXN0IjoiYm9keSJ9",
  "pathParameters": {
    "parameter1": "value1"
  },
  "isBase64Encoded": true,
  "stageVariables": {
    "stageVariable1": "value1",
    "stageVariable2": "value2"
  }
}
endef
export EVENT_LOCAL_JSON


all: lint unit

# test: lint coverage ## Run code linter, unit tests and code coverage report
test: unit ## Run unit tests and code coverage report

help: ## Describe all available commands
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n\nTargets:\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

clean: ## Delete local artifacts
	rm -rf coverage build cdk.out

npmi: ## Install npm dependencies
	npm i

arm64: ## Enable local Linux OS ARM64 support
	docker run --rm --privileged multiarch/qemu-user-static --reset -p yes

local-init: ## Generate initial local dev support files 
	@if [ ! -f ./Makefile.env ]; then \
		echo "AWS_PROFILE=default\nLAMBDA_NAME=StatusGet\nLAMBDA_EVENT=events/event.json\nTEST_NAME=test" > ./Makefile.env; \
	fi

	@if [ ! -f $(LAMBDA_ENV) ]; then \
		echo "$$ENV_LOCAL_JSON" > $(LAMBDA_ENV); \
	fi

	@if [ ! -d ./events ]; then \
		mkdir ./events && echo "$$EVENT_LOCAL_JSON" > ./events/event.json; \
	fi

lint: ## Run code linter
	@echo "Linting code..."
	@$(ESLINT) --quiet --ext .js,.ts $(SRC_PATH)
	@echo "Linting PASSED"

unit: ## Run unit tests
	@echo "Running unit tests..."
	@$(JEST)

coverage: ## Run unit tests & coverage report
	@echo "Running unit tests and coverage..."
	@$(JEST) --coverage

test-single: ## Run unit tests
	@echo "Running single unit test/suite..."
	@$(JEST) --coverage=false -t $(TEST_NAME)

api: build ## Start the API GW locally
	sam local start-api -t ./cdk.out/$(STACK_NAME).template.json -n $(LAMBDA_ENV) $(AWS_OPTIONS)

invoke: build ## Invoke individual Lambda
	sam local invoke $(LAMBDA_NAME) $(SAM_PARAMS) -t ./cdk.out/$(STACK_NAME).template.json --event $(LAMBDA_EVENT) --env-vars $(LAMBDA_ENV) $(AWS_OPTIONS)

invoke-out: build ## Invoke individual Lambda & pipe logs to file 
	make invoke > invoke.out 2>&1

build: ## Build CDK app using local code
	cdk synth --no-staging

deploy: ## Deploy CDK app using local build
	cdk deploy $(STACK_NAME) --require-approval never --verbose $(AWS_OPTIONS)
