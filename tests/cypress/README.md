# Search-UI Cypress Tests

[![Build Status](https://travis-ci.com/stolostron/search-e2e-test.svg?token=jzyyzQmWYBEu33MCMh9p&branch=main)](https://travis-ci.com/stolostron/search-e2e-test)

The Cypress tests for search within [Search-UI](https://github.com/stolostron/search-ui)

## Development

How to run Cypress tests

### Prerequisites

- Install NodeJS (v12) (npm will be installed with Node)
- From the root directory, run `npm install`

#### Live Cluster

When targeting a live cluster for testing, the user can either configure the `options.yaml` file or export environment variables for the tests environment.

<details>
    <summary>
        Configuring environment with options file:
    </summary>

1. Copy `options.yaml.template` and rename it `options.yaml`
2. Replace value fields with the your cluster values.

```yaml
options:
  hub:
    baseDomain: BASE_DOMAIN
    user: BASE_USER
    password: BASE_PASSWORD
```

</details>

<details>
    <summary>
        Configuring environment with environment variables:
    </summary>

1. Export the following environemnt variables:

   - OPTIONS_HUB_BASEDOMAIN (e.g. `<cluster>.dev07.open-cluster-management.com`)
   - OPTIONS_HUB_USER (`login username`; defaults to `kubeadmin` if not set)
   - OPTIONS_HUB_PASSWORD (`login password`)

```bash
export OPTIONS_HUB_BASEDOMAIN=BASE_DOMAIN
export OPTIONS_HUB_USER=BASE_USER
export OPTIONS_HUB_PASSWORD=BASE_PASSWORD

or

export CYPRESS_OPTIONS_HUB_BASEDOMAIN=BASE_DOMAIN
export CYPRESS_OPTIONS_HUB_USER=BASE_USER
export CYPRESS_OPTIONS_HUB_PASSWORD=BASE_PASSWOR
```

**Note:** Environment variables that start with `CYPRESS` are accessible via `Cypress.env`. These are not the same as OS-level environment variables. Cypress environment variables can also be set within the `cypress.env.json` or `cypress.json` file.

</details>

### Testing

<details>
    <summary>
        From the root directory, running the following commands will allow you to run the tests within the different modes:
    </summary>

#### Debug Mode

```bash
npm run test:debug
```

#### Development Mode

```bash
npm run test:headed or npm run test:headless
```

#### Production Mode

```bash
npm run test:production
```

</details>

#### Skipping Tests

For development, to skip either the API or UI tests, the following environment variables must be exported:

```bash
export SKIP_API_TEST=true # Default: false
export SKIP_UI_TEST=true # Default: false
```

## Video and Screenshots

After the test finish executing, Cypress will send the results gathered to the `results/` directory. The user will be able to view any screenshots/videos captured throughout the progression of their tests.

```bash
results/
├── json
├── screenshots
└── videos
```

## Cypress Dashboard

The Cypress dashboard provides a tool for user to better analyze their E2E tests results, before it makes it to the canary.

Before the user can access the dashboard, you will need to visit the [Cypress Dashboard](https://dashboard.cypress.io) website. From there you will be able to sign up with your GitHub account and start your own project, Cypress will give you a command to run the tests exclusively within your own dashboard. To view somebody's dashboard, you will need to be invited by that user.

![Dashboard](../../docs/readme/images/cypress-dashboard.gif)

After receiving the command from Cypress, do not forget to add the `projectID` to `cypress.json` or else the dashboard will not be availble within the current project.

**_cypress.json_**

```bash
{
    ...
    "projectId": "7mm***"
}
```

## Environment Variables

Control the behavior of this service with these environment variables.

| Name                   | Required | Default Value | Descripition                                                                                                                                 |
| ---------------------- | -------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| BROWSER                | no       | chrome        | Run Cypress in the browser with the given name (**_chrome, firefox_**)                                                                       |
| CYPRESS_BASE_URL       | no       | chrome        | Base url of the target cluster (**_This is only required when the user test the E2E tests with the following command: `npx cypress open`_**) |
| LIVE_MODE              | no       | false         | Display the E2E tests being executed in the browser                                                                                          |
| NODE_ENV               | no       | development   | The environment to run the test (**_debug, development, production_**)                                                                       |
| OPTIONS_HUB_BASEDOMAIN | yes      |               | Base domain of the target cluster (**_Variable can also be exported as CYPRESS_OPTIONS_HUB_BASEDOMAIN_**)                                    |
| OPTIONS_HUB_PASSWORD   | yes      |               | Base password of the target cluster (**_Variable can also be exported as CYPRESS_OPTIONS_HUB_PASSWORD_**)                                    |
| OPTIONS_HUB_USER       | yes      |               | Base user of the targeted cluster (**_Variable can also be exported as CYPRESS_OPTIONS_HUB_USER_**)                                          |
| RECORD                 | no       | false         | When set to true, Cypress tests will be recorded in the Cypress dashboard                                                                    |
| RECORD_KEY             | no       |               | Record key that is provided when the dashboard is set up (**_This is only required when the `RECORD` variable is set to true_**)             |
| SKIP_API_TEST          | no       | false         | Skip the API tests when running all tests                                                                                                    |
| SKIP_UI_TEST           | no       | false         | Skip the UI tests when running all tests                                                                                                     |

## Links

These are a few useful links that will help provide technical references and best practices when developing E2E tests in Cypress.

- [Cypress Docs](https://docs.cypress.io/guides/getting-started/writing-your-first-test#Add-a-test-file)
