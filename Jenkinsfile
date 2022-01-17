pipeline {
    agent {
        docker {
            image 'quay.io/rhn_support_abutt/centos8-nodejs12'
            args '--network host -u 0:0 -p 3000:3000'
        }
    }
    environment {
        CI = 'true'
    }
    parameters {
        string(name:'BASE_OC_IDP', defaultValue: 'kube:admin', description: 'Cluster IDP')
        string(name:'BASE_URL', defaultValue: '', description: 'ACM URL')
        string(name:'BASE_DOMAIN', defaultValue: '', description: 'Domain name')
        string(name:'BASE_USER', defaultValue: 'kubeadmin', description: 'Cluster IDP')
        string(name:'BASE_PASSWORD', defaultValue: '', description: 'Hub cluster password')
        string(name:'TEST_TAGS', defaultValue:'',description: 'grepTags parameter to use for test execution')
    }
    stages {
        stage('Build') {
            steps {
                sh '''
                npm config set unsafe-perm true
                rm -rf package-lock.json
                npm install
                npm ci
                npx browserslist@latest --update-db
                '''
            }
        }
        stage('Test') {
            steps {
                sh """
                export CYPRESS_OPTIONS_HUB_OC_IDP="${params.BASE_OC_IDP}"
                export CYPRESS_OPTIONS_HUB_BASEDOMAIN="${params.BASE_DOMAIN}"
                export CYPRESS_OPTIONS_HUB_USER="${params.BASE_USER}"
                export CYPRESS_OPTIONS_HUB_PASSWORD="${params.BASE_PASSWORD}"
                export CYPRESS_BASE_URL="${params.BASE_URL}"
                export TEST_TAGS="${params.TEST_TAGS}"
                export OCP_HUB_CLUSTER_API_URL=\$(echo \$CYPRESS_BASE_URL | sed -e 's/multicloud-console.apps/api/g')":6443"
                oc login --insecure-skip-tls-verify -u \$CYPRESS_OPTIONS_HUB_USER -p \$CYPRESS_OPTIONS_HUB_PASSWORD \$OCP_HUB_CLUSTER_API_URL
                sh('./rbac-setup.sh')
                python3 generate_managedclusters_data.py
                if [[ \$(jq '.managedClusters | length' managedClusters.json) > 0 ]]; then
                    export CYPRESS_OPTIONS_MANAGED_USER=\$(cat managedClusters.json |jq -r '.managedClusters[0].username')
                    export CYPRESS_OPTIONS_MANAGED_PASSWORD=\$(cat managedClusters.json |jq -r '.managedClusters[0].password')
                    export CYPRESS_OPTIONS_MANAGED_BASEDOMAIN=\$(cat managedClusters.json |jq -r '.managedClusters[0].base_domain')
                else
                    echo 'No Managed cluster found'
                    exit 1
                fi
                if [[ -z "${BASE_OC_IDP}" || -z "${BASE_URL}" || -z "${BASE_PASSWORD}" ]]; then
                    echo "Aborting test.. ACM connection details are required for the test execution"
                    exit 1
                else
                    cp resources/options.yaml.template resources/options.yaml
                    /usr/local/bin/yq e -i '.options.identityProvider="'"\$BASE_OC_IDP"'"' resources/options.yaml
                    /usr/local/bin/yq e -i '.options.hub.baseDomain="'"\$BASE_DOMAIN"'"' resources/options.yaml
                    /usr/local/bin/yq e -i '.options.hub.user="'"\$BASE_USER"'"' resources/options.yaml
                    /usr/local/bin/yq e -i '.options.hub.password="'"\$BASE_PASSWORD"'"' resources/options.yaml
                    rm -rf cypress/results
                    #npm run test
                    npx cypress run --headless --env grepTags=\"\$TEST_TAGS\"
                fi
                """
            }
        }
    }
    post {
        always {
            archiveArtifacts artifacts: 'cypress/results/*', followSymlinks: false
            junit 'cypress/results/*.xml'
        }
    }
}