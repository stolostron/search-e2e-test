curl -kLo cloudctl https://9.30.183.233:8443/api/cli/cloudctl-linux-amd64
chmod 755 cloudctl
sudo mv ./cloudctl /usr/local/bin/cloudctl
cloudctl login -a https://9.30.183.233:8443 -u admin -p ${CLOUD_PW} -n kube-system

curl -kLo kubectl https://9.30.183.233:8443/api/cli/kubectl-linux-amd64
chmod 755 kubectl
sudo mv ./kubectl /usr/local/bin/kubectl

kubectl config set-cluster noted-skunk-icp-cluster --server=https://9.30.183.233:8001 --insecure-skip-tls-verify=true
kubectl config set-context noted-skunk-icp-cluster-context --cluster=noted-skunk-icp-cluster
kubectl config set-credentials admin --token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdF9oYXNoIjoiYTI2Y2IzYzc0YmU5NGFlMmRiZDM4NWU0MDgzNzM4MDI0MjE2YTlhZSIsInJlYWxtTmFtZSI6ImN1c3RvbVJlYWxtIiwidW5pcXVlU2VjdXJpdHlOYW1lIjoiYWRtaW4iLCJpc3MiOiJodHRwczovLzEyNy4wLjAuMTo5NDQzL29pZGMvZW5kcG9pbnQvT1AiLCJhdWQiOiJkNzhhNWUzNWI5Njk2ZmY4YjY5YjAxMWQ1MGQ2YTkwNiIsImV4cCI6MTU1ODA0ODUxOCwiaWF0IjoxNTU4MDE5NzE4LCJzdWIiOiJhZG1pbiIsInRlYW1Sb2xlTWFwcGluZ3MiOltdfQ.CzdaoK3Yu6M04S1jFpbtRMkj0hC4qeJMjNdZjsOdkhNugJr6DJbvd03ylNZUXRoW-HokhungkHAzVt5bdHi1P92D8a7ic_De9G9sMauVYqE11XF1Q20QxZyDtc14GDIpbh8Nvm18zhGyEv17yBt5p6a4H1S1pHYcMXJTH0jJiWNnl-3M1R6z__QVPYV5iuKRZFjeVVeH5fcEpZwlfjgPQvkgAz5Mv7_lXeZOTtjuxq7mW-QjbMFhiVRMJ7mgX7vwhx1h9LILIhFqXAg2afhlxwSIbRRMS9bWBBaUrRPjfq8KCkSxKFcrJOmwzel85Xr2VoooYj-XE7I0Sz0qZB4yaQ
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
