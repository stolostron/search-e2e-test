curl -kLo cloudctl https://9.30.183.233:8443/api/cli/cloudctl-linux-amd64
chmod 755 cloudctl
sudo mv ./cloudctl /usr/local/bin/cloudctl
cloudctl login -a https://9.30.183.233:8443 -u admin -p AHippopotamusPlaysHopscotchWithAnElephant -n kube-system

curl -kLo kubectl https://9.30.183.233:8443/api/cli/kubectl-linux-amd64
chmod 755 kubectl
sudo mv ./kubectl /usr/local/bin/kubectl
kubectl config set-cluster noted-skunk-icp-cluster --server=https://9.30.183.233:8001 --insecure-skip-tls-verify=true
kubectl config set-context noted-skunk-icp-cluster-context --cluster=noted-skunk-icp-cluster
kubectl config set-credentials admin --token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdF9oYXNoIjoiODZiZmE1NjIxYzM2N2U5ZmRkNWNhMzM0NGY1MDc1ODc1YzZkNmU1MyIsInJlYWxtTmFtZSI6ImN1c3RvbVJlYWxtIiwidW5pcXVlU2VjdXJpdHlOYW1lIjoiYWRtaW4iLCJpc3MiOiJodHRwczovLzEyNy4wLjAuMTo5NDQzL29pZGMvZW5kcG9pbnQvT1AiLCJhdWQiOiJkNzhhNWUzNWI5Njk2ZmY4YjY5YjAxMWQ1MGQ2YTkwNiIsImV4cCI6MTU1Nzg3MjE4MCwiaWF0IjoxNTU3ODQzMzgwLCJzdWIiOiJhZG1pbiIsInRlYW1Sb2xlTWFwcGluZ3MiOltdfQ.h7SET2u9KCP41Cu9qwMvHNHh0u4S5QJupx3UHDTKzME4LVmPU2c0s8vVm3dKJL6jcUQtZR2D1Eua6RwXsQ98VUz97RnEMKOAKVjCnud6OrIccT2oSsI6-Vzd9RMLc0mwQW0gJ82b_HGgsZxBhluGWAoglqkgBcfwHGSyWBHppdClGC5WJpsr9Mfzx5Jg3Lbr8pIEbE-yBmPO6L3sqSOy8scZdCrbxNw8kHlmhUktSYIthlHq_dibT6IERxR6q8PmecMblV9EXy_XIdzX0bgLEE-twHS9m8a3nkLosEpRH-I5InDL-9G5F8-G2EjIRxBRBgFa6BwZ9UXFSSzaUAWyLg
kubectl config set-context noted-skunk-icp-cluster-context --user=admin --namespace=default
kubectl config use-context noted-skunk-icp-cluster-context
echo 'check1'
kubectl version

curl -kLo helm-linux-amd64.tar.gz https://9.30.183.233:8443/api/cli/helm-linux-amd64.tar.gz
mkdir helm-unpacked
tar -xvzf helm-linux-amd64.tar.gz -C helm-unpacked
chmod 755 ./helm-unpacked/*/helm
sudo mv ./helm-unpacked/*/helm /usr/local/bin/helm
rm -rf ./helm-unpacked ./helm-linux-amd64.tar.gz
helm init
echo 'check2'
cp ~/.kube/noted-skunk-icp-cluster/*.pem ~/.helm/
helm version --tls

echo 'bye'
