curl -kLo cloudctl-linux-amd64 https://${CLUSTER_IP}:8443/api/cli/cloudctl-linux-amd64
mv cloudctl-linux-amd64 cloudctl
chmod 755 cloudctl
sudo mv ./cloudctl /usr/local/bin/cloudctl

curl -kLo kubectl-linux-amd64 https://${CLUSTER_IP}:8443/api/cli/kubectl-linux-amd64
mv kubectl-linux-amd64 kubectl
chmod 755 kubectl
sudo mv ./kubectl /usr/local/bin/kubectl

curl -kLo helm-linux-amd64.tar.gz https://${CLUSTER_IP}:8443/api/cli/helm-linux-amd64.tar.gz
mkdir helm-unpacked
tar -xvzf helm-linux-amd64.tar.gz -C helm-unpacked
chmod 755 ./helm-unpacked/*/helm
sudo mv ./helm-unpacked/*/helm /usr/local/bin/helm
rm -rf ./helm-unpacked ./helm-linux-amd64.tar.gz
helm init

cloudctl login -a https://${CLUSTER_IP}:8443 -u admin -p ${CLOUD_PW} -n kube-system
kubectl version
helm version --tls
echo 'set up complete'
