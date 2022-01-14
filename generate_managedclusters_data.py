import subprocess
import json
import base64

def run_command(cmd):
    process = subprocess.run(cmd, check=True, stdout=subprocess.PIPE, universal_newlines=True)
    return process.stdout


cluster_data={"managedClusters":[]}

oc_command = ['oc', 'get', 'managedclusters', '--selector', 'name!=local-cluster','-o', 'json']
managed_clusters = json.loads(run_command(oc_command))

list_index=0

for index,item in enumerate(managed_clusters['items']):
    cluster_status = "Unknown"
    for condition in item['status']['conditions']:
        if condition['type'] == 'ManagedClusterConditionAvailable':
            cluster_status = condition['status']
    if cluster_status == "True":
        if item['metadata']['annotations']["open-cluster-management/created-via"] == "hive":
            cluster_data["managedClusters"].append({"name" : item['metadata']['name']})
            print(item['spec'])
            cluster_data["managedClusters"][list_index]["api_url"] = item['spec']['managedClusterClientConfigs'][0]['url']
            print('---')
            print(item['spec']['managedClusterClientConfigs'][0]['url'].replace("https://api.", "").split(":")[0])
            cluster_data["managedClusters"][list_index]["base_domain"] = item['spec']['managedClusterClientConfigs'][0]['url'].replace("https://api.", "").split(":")[0]
            secret_command = ['oc', 'get', 'secrets','--selector=hive.openshift.io/secret-type=kubeadmincreds', '-o', 'json', '-n']
            secret_command.append(item['metadata']['name'])
            secret_list = json.loads(run_command(secret_command))
            password = base64.b64decode(secret_list['items'][0]['data']['password']).decode('utf-8')
            cluster_data["managedClusters"][list_index]["username"] = 'kubeadmin'
            cluster_data["managedClusters"][list_index]["password"] = password
            list_index += 1

with open('managedClusters.json', 'w') as f:
    json.dump(cluster_data, f)
