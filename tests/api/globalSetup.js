// Copyright Contributors to the Open Cluster Management project

const { execSync } = require('child_process')
const { getSearchApiRoute } = require('../common-lib/clusterAccess')

module.exports = async () => {
  console.log('Start globalSetup.')

  const namespace = execSync(`oc get mch -A -o jsonpath='{.items[0].metadata.namespace}'`).toString()

  // Allow Route traffic through the search-api NetworkPolicy.
  execSync(`cat <<'EOF' | oc apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: search-api-e2e-route-access
  namespace: ${namespace}
spec:
  podSelector:
    matchLabels:
      name: search-api
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: openshift-ingress
    ports:
    - port: 4010
      protocol: TCP
EOF`)
  console.log('Created NetworkPolicy search-api-e2e-route-access.')

  await getSearchApiRoute()
  console.log('Done globalSetup.')
}
