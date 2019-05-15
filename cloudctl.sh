curl -kLo cloudctl https://9.30.183.233:8443/api/cli/cloudctl-linux-amd64
chmod 755 cloudctl
sudo mv ./cloudctl /usr/local/bin/cloudctl
cloudctl login -a https://9.30.183.233:8443 -u admin -p ${CLOUD_PW} -n kube-system

curl -kLo kubectl https://9.30.183.233:8443/api/cli/kubectl-linux-amd64
chmod 755 kubectl
sudo mv ./kubectl /usr/local/bin/kubectl

kubectl config set-cluster noted-skunk-icp-cluster --server=https://9.30.183.233:8001 --insecure-skip-tls-verify=true
kubectl config set-context noted-skunk-icp-cluster-context --cluster=noted-skunk-icp-cluster
kubectl config set-credentials admin --token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdF9oYXNoIjoiMWNmMTFlNjcwYjZjODBmYWU4ZDZhNjkxMGFiN2RkYzBjYjk4ODM1NyIsInJlYWxtTmFtZSI6ImN1c3RvbVJlYWxtIiwidW5pcXVlU2VjdXJpdHlOYW1lIjoiYWRtaW4iLCJpc3MiOiJodHRwczovLzEyNy4wLjAuMTo5NDQzL29pZGMvZW5kcG9pbnQvT1AiLCJhdWQiOiJkNzhhNWUzNWI5Njk2ZmY4YjY5YjAxMWQ1MGQ2YTkwNiIsImV4cCI6MTU1Nzk3MTExNCwiaWF0IjoxNTU3OTQyMzE0LCJzdWIiOiJhZG1pbiIsInRlYW1Sb2xlTWFwcGluZ3MiOltdfQ.vxp721ns5kEkir9p4ik9Tz_bKcbVTZLddGVzT1wgvPSbQz98pIpCYBIDcwMj2mdyaN5VqinwQpAQaR0MLJNXdd7_cWUmJPlfYTMDsfccJaEI6kjmkV2aoz7qahigkUuADXJOpFvN3OZ64GFB-X77hpcm_KqtJ3rygRfY5XbhI70Gh7E1wr6hx9wXH5_R6WJC5X2RT5AqrbZ0xN4MhgUxy4qLhoSk7VZyV7e2VqZXsiWlikr89ZakP-ZDgEq7J_FGAnGIYWJ7gzq4uuUWSq4RkZz26lROhIAx72fD5QxaKxAKQPm17OouHTeOSU_3rjPLmRwIqWxCsN8bV1WBkxcpWg
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
ls -laR ~/.kube
echo 'kube check'
ls -laR /usr/local/bin/kubectl
echo 'kubectl check'

#cp ~/.kube/noted-skunk-icp-cluster/*.pem ~/.helm/
helm version --tls

echo 'bye'
