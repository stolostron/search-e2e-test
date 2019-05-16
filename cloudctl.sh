curl -kLo cloudctl https://9.30.183.233:8443/api/cli/cloudctl-linux-amd64
chmod 755 cloudctl
sudo mv ./cloudctl /usr/local/bin/cloudctl

curl -kLo kubectl https://9.30.183.233:8443/api/cli/kubectl-linux-amd64
chmod 755 kubectl
sudo mv ./kubectl /usr/local/bin/kubectl

#cp ~/.kube/noted-skunk-icp-cluster/*.pem ~/.helm/


cloudctl login -a https://9.30.183.233:8443 -u admin -p ${CLOUD_PW} -n kube-system
echo 'check1'
kubectl version
helm version --tls
echo 'bye'
