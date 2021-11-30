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
        string(name:'BASE_USER', defaultValue: 'kubeadmin', description: 'Cluster IDP')
        string(name:'BASE_DOMAIN', defaultValue: '', description: 'Hub cluster base domain')
        string(name:'BASE_PASSWORD', defaultValue: '', description: 'Hub cluster password')
    }
    stages {
        stage('Build') {
            steps {
                sh '''
                npm config set unsafe-perm true
                rm -rf package-lock.json
                yum groupinstall -y "Development tools"
                npm install
                npm ci
                npx browserslist@latest --update-db
                '''
            }
        }
        stage('Test') {
            steps {
                sh """
                export BASE_OC_IDP="${params.BASE_OC_IDP}"
                export BASE_DOMAIN="${params.BASE_DOMAIN}"
                export BASE_USER="${params.BASE_USER}"
                export BASE_PASSWORD="${params.BASE_PASSWORD}"
                if [[ -z "${BASE_OC_IDP}" || -z "${BASE_DOMAIN}" || -z "${BASE_PASSWORD}" ]]; then
                    echo "Aborting test.. ACM connection details are required for the test execution"
                    exit 1
                else
                    cp resources/options.yaml.template resources/options.yaml
                    /usr/local/bin/yq e -i '.options.identityProvider="'"\$BASE_OC_IDP"'"' resources/options.yaml
                    /usr/local/bin/yq e -i '.options.hub.baseDomain="'"\$BASE_DOMAIN"'"' resources/options.yaml
                    /usr/local/bin/yq e -i '.options.hub.user="'"\$BASE_USER"'"' resources/options.yaml
                    /usr/local/bin/yq e -i '.options.hub.password="'"\$BASE_PASSWORD"'"' resources/options.yaml
                    rm -rf results
                    npm run test
                fi
                """
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