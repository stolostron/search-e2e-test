git clone git@github.ibm.com:IBMPrivateCloud/ibm-mcm-chart

cd ibm-mcm-chart

pwd
ls -la
echo 'files inside stable/ibm-mcm-prod:'
ls -la ./stable/ibm-mcm-prod
cat ./stable/ibm-mcm-prod/values.yaml
cloudctl login -a https://9.30.183.233:8443 -u admin -p AHippopotamusPlaysHopscotchWithAnElephant -n kube-system

kubectl delete secret my-docker-secret

kubectl create secret docker-registry -n kube-system  my-docker-secret --docker-server=hyc-cloud-private-integration-docker-local.artifactory.swg-devops.com  --docker-username=sherin.v@ibm.com --docker-password=AKCp5cbnH2sqVmttjFBmRMFqNfpVfYUYX2xPJmuxzuN77xrpqCUo8GeU5NP7ig9fAwTX42DWu

#make local
pwd
ls -la
echo 'files inside stable:'
ls -la ./stable/ibm-mcm-prod
helm upgrade --install multicluster-hub --namespace kube-system --set compliance.mcmNamespace=mcm --set global.pullSecret=my-docker-secret stable/ibm-mcm-prod --tls

cd ..

kubectl get pods | grep multicluster
