pipeline {
    options {
        buildDiscarder(logRotator(daysToKeepStr: '30'))
        timeout(time: 8, unit: 'HOURS')
    }
    // agent {
    //     docker {
    //         image 'quay.io/stolostron/acm-qe:centos9-nodejs22'
    //         registryUrl 'https://quay.io/stolostron/acm-qe'
    //         registryCredentialsId '0089f10c-7a3a-4d16-b5b0-3a2c9abedaa2'
    //         args '--network host -u 0:0'
    //     }
    // }
    agent {
        kubernetes {
            defaultContainer 'search-container'
            yamlFile 'JenkinsAgent.yaml'
        }
    }
    parameters {
        string(name: 'OCP_HUB_CLUSTER_USER', defaultValue: 'kubeadmin', description: 'OCP Hub User Name. (Required)')
        string(name: 'OCP_HUB_CLUSTER_PASSWORD', defaultValue: '', description: 'OCP Hub Password. (Required)')
        string(name: 'OCP_HUB_CLUSTER_API_URL', defaultValue: '', description: 'OCP Hub API URL. (Required)')
        string(name: 'ACM_NAMESPACE', defaultValue: 'ocm', description: 'The Namespace in which ACM is installed. Default is ocm')
        choice(name: 'BROWSER', choices: ['chrome', 'firefox', 'edge', 'electron'], description:'Browser type. e.g. chrome, firefox, edge')
        choice(name: 'SKIP_API_TEST', choices: ['false','true'], description: 'Flag to skip the API tests')
        choice(name: 'SKIP_UI_TEST', choices: ['false','true'], description: 'Flag to skip the UI tests')
        string(name: 'GIT_BRANCH', defaultValue: 'main', description: 'The GIT branch for CLC to checkout')
    }
    environment {
        CI = 'true'
    }
    stages {
        stage('Checkout Search Code') {
            steps {
                echo "Checking out branch specified by parameter: ${params.GIT_BRANCH}"
                // This checkout happens AFTER Jenkins has loaded the parameters.
                git(
                    url: 'https://github.com/stolostron/search-e2e-test.git',
                    branch: params.GIT_BRANCH, // Use the parameter here
                    credentialsId: 'vincent-github-creds'
                )
            }
        }
        stage('Build') {
            steps {                
                sh '''  
                rm -rf results     
                export npm_config_unsafe_perm=true
                npm config get unsafe-perm                    
                npm ci
                npx browserslist@latest --update-db
                '''
            }
        }
        stage('Search Tests') {
            steps {
                catchError(stageResult: 'UNSTABLE',  buildResult: null) { 
                sh """
                    export OPTIONS_HUB_USER=${params.OCP_HUB_CLUSTER_USER}
                    export OPTIONS_HUB_PASSWORD=${params.OCP_HUB_CLUSTER_PASSWORD}
                    export OPTIONS_HUB_BASEDOMAIN=${params.OCP_HUB_CLUSTER_API_URL}
                    export ACM_NAMESPACE=${params.ACM_NAMESPACE}
                    export BROWSER=${params.BROWSER}
                    export SKIP_API_TEST=${params.SKIP_API_TEST}
                    export SKIP_UI_TEST=${params.SKIP_UI_TEST}
                   
                    # # oc cluster login
                    # oc login --insecure-skip-tls-verify -u \$OCP_HUB_CLUSTER_USER -p \$OCP_HUB_CLUSTER_PASSWORD \$OCP_HUB_CLUSTER_API_URL
                    # echo "1- #### export OPTIONS_HUB_BASEDOMAIN"
                    # export OPTIONS_HUB_BASEDOMAIN=\$(oc get ingress.config.openshift.io/cluster -ojson | jq -r '.spec.domain')
                    # echo \$OPTIONS_HUB_BASEDOMAIN
                   
                   if [[ -z "${params.OCP_HUB_CLUSTER_USER}" || -z "${params.OCP_HUB_CLUSTER_PASSWORD}" || -z "${params.OCP_HUB_CLUSTER_API_URL}" ]]; then
                        echo "Aborting test.. OCP/ACM connection details are required for the test execution"
                        exit 1
                    else   
                        # npm install
                        if [[ \$SKIP_UI_TEST == false && \$SKIP_API_TEST == false ]]; then
                            echo "# Both UI and API tests are enabled"
                            npm run test
                        elif [[ \$SKIP_UI_TEST == true && \$SKIP_API_TEST == false ]]; then
                            echo "# UI tests skipped, API tests are enabled"
                            SKIP_UI_TEST=true npm run test
                        elif [[ \$SKIP_UI_TEST == false && \$SKIP_API_TEST == true ]]; then
                            echo "# UI tests are enabled, API tests are skipped"
                            SKIP_API_TEST=true npm run test
                        else
                            echo "Both UI and API tests are set to be skipped. No test command will be executed."
                        fi
                    fi
                """
                }
            }
        }
    }
    post {
        always {
            archiveArtifacts artifacts: 'results/*', followSymlinks: false
            junit 'results/*.xml'
        }
    }
}
