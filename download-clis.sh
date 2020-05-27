# Install OpenShift CLI.
curl -kLo oc.tar.gz https://mirror.openshift.com/pub/openshift-v4/clients/oc/4.3/linux/oc.tar.gz
mkdir oc-unpacked
tar -xvzf oc.tar.gz -C oc-unpacked
chmod 755 ./oc-unpacked/oc
export PATH="$PATH:oc-unpacked"
#mv ./oc-unpacked/oc /usr/local/bin/oc
#rm -rf ./oc-unpacked ./oc.tar.gz

# oc login --server=${OCP_SERVER} -u ${OCP_CONSOLE_USR} -p ${OCP_CONSOLE_PWD} --insecure-skip-tls-verify=true

# Install helm CLI.
# curl -kLo helm-linux-amd64.tar.gz https://${CLUSTER_IP}:${CLUSTER_PORT}/api/cli/helm-linux-amd64.tar.gz
# mkdir helm-unpacked
# tar -xvzf helm-linux-amd64.tar.gz -C helm-unpacked
# chmod 755 ./helm-unpacked/*/helm
# sudo mv ./helm-unpacked/*/helm /usr/local/bin/helm
# rm -rf ./helm-unpacked ./helm-linux-amd64.tar.gz
# helm init

# Setup helm certs
# oc get secret helm-tiller-secret -n kube-system -o json | jq -r .data.crt | base64 --decode > ~/.helm/cert.pem
# oc get secret helm-tiller-secret -n kube-system -o json | jq -r .data.key | base64 --decode > ~/.helm/key.pem

# helm version --tls
echo 'set up complete'
