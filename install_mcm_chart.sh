git clone git@github.ibm.com:IBMPrivateCloud/ibm-mcm-chart
cd ibm-mcm-chart

cloudctl login -a https://9.30.183.233:8443 -u admin -p ${CLOUD_PW} -n kube-system
kubectl delete secret my-docker-secret

kubectl create secret docker-registry -n kube-system  my-docker-secret --docker-server=hyc-cloud-private-integration-docker-local.artifactory.swg-devops.com  --docker-username=${DOCKER_USERNAME} --docker-password=${DOCKER_PASSWORD}

# make local for mcm-chart
LOCAL_REPO=hyc-cloud-private-integration-docker-local.artifactory.swg-devops.com/ibmcom
for file in `find . -name values.yaml`; do echo $$file; sed -i -e "s|ibmcom|$LOCAL_REPO|g" $$file; done
make charts
for file in `find . -name values.yaml`; do echo $$file; sed -i -e "s|$LOCAL_REPO|ibmcom|g" $$file; done

helm upgrade --install multicluster-hub --namespace kube-system --set compliance.mcmNamespace=mcm --set global.pullSecret=my-docker-secret repo/stable/ibm-mcm-prod-99.99.99.tgz --tls
cd ..

kubectl get pods | grep multicluster
