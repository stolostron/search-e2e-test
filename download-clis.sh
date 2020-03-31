curl -kLo oc.tar.gz https://mirror.openshift.com/pub/openshift-v4/clients/oc/4.2/linux/oc.tar.gz
mkdir oc-unpacked
tar -xvzf oc.tar.gz -C oc-unpacked
chmod 755 ./oc-unpacked/oc
sudo mv ./oc-unpacked/oc /usr/local/bin/oc
rm -rf ./oc-unpacked ./oc.tar.gz

# curl -kLo kubectl-linux-amd64 https://${CLUSTER_IP}:${CLUSTER_PORT}/api/cli/kubectl-linux-amd64
# mv kubectl-linux-amd64 kubectl
# chmod 755 kubectl
# sudo mv ./kubectl /usr/local/bin/kubectl

# curl -kLo helm-linux-amd64.tar.gz https://${CLUSTER_IP}:${CLUSTER_PORT}/api/cli/helm-linux-amd64.tar.gz
# mkdir helm-unpacked
# tar -xvzf helm-linux-amd64.tar.gz -C helm-unpacked
# chmod 755 ./helm-unpacked/*/helm
# sudo mv ./helm-unpacked/*/helm /usr/local/bin/helm
# rm -rf ./helm-unpacked ./helm-linux-amd64.tar.gz
# helm init

# oc login --server=${OCP_SERVER} -u ${OCP_CONSOLE_USR} -p ${OCP_CONSOLE_PWD} --insecure-skip-tls-verify=true
# kubectl version

# Setup helm certs
# kubectl get secret helm-tiller-secret -n kube-system -o json | jq -r .data.crt | base64 --decode > ~/.helm/cert.pem
# kubectl get secret helm-tiller-secret -n kube-system -o json | jq -r .data.key | base64 --decode > ~/.helm/key.pem

# helm version --tls
echo 'set up complete'
