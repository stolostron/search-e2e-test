git clone git@github.ibm.com:IBMPrivateCloud/ibm-mcm-chart
cd ibm-mcm-chart

#cloudctl login -a https://9.30.183.233:8443 -u admin -p ${CLOUD_PW} -n kube-system
kubectl delete secret my-docker-secret

kubectl create secret docker-registry -n kube-system  my-docker-secret --docker-server=${DOCKER_SERVER}  --docker-username=${DOCKER_USERNAME} --docker-password=${DOCKER_PASSWORD}

# make local for mcm-chart
for file in `find . -name values.yaml`; do echo $file; sed -i -e "s|ibmcom|hyc-cloud-private-integration-docker-local.artifactory.swg-devops.com/ibmcom|g" $file; done
make charts

helm upgrade --install multicluster-hub --namespace kube-system --set compliance.mcmNamespace=mcm --set global.pullSecret=my-docker-secret --set global.tillerIntegration.user=admin repo/stable/ibm-mcm-prod-99.99.99.tgz --tls

cd ..

kubectl get pods | grep multicluster


## declare an array variable
declare -a arr=("multicluster-hub-search-search-collector"
"multicluster-hub-search-redisgraph"
"multicluster-hub-search-search-aggregator"
"multicluster-hub-console-mcmui"
"multicluster-hub-console-mcmuiapi"
)
success=true

## now loop through the above array
IFS=""
for i in "${arr[@]}"
do
results=$(kubectl rollout status --timeout=300s deployment "$i")
echo "$results"
if [[ "$results" != *"successfully rolled out"* ]]; then
success=false
fi
done

# ...do something interesting...
if [ "$success" = true ] ; then
echo 'Proceeding with installation'
kubectl create configmap my-test-config --from-literal=key1=config1 --from-literal=key2=config2
kubectl create deployment my-test-deployment --image=busybox

else
echo 'Cannot proceed with installation. Please check multicluster-hub deployments'
fi
