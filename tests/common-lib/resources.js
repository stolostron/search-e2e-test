// Copyright Contributors to the Open Cluster Management project

/**
 * String created from the Date.now() (Primarily used as a postfix)
 */
const postfix = Date.now()

/**
 * Returns new application object instance.
 * @param {string} namespace The target namespace for where the application resource instance will be created.
 * @returns
 */
export const application = (namespace) => ({
  kind: 'application',
  name: `auto-test-app-${postfix}`,
  namespace: `${namespace}-${postfix}`,
})

/**
 * Returns new deployment object instance.
 * @param {string} namespace The target namespace for where the deployment resource instance will be created.
 * @returns
 */
export const deployment = (namespace) => ({
  kind: 'deployment',
  name: `auto-test-deploy-${postfix}`,
  namespace: `${namespace}-${postfix}`,
  image: 'openshift/hello-openshift',
})

/**
 * Returns new namespace object instance.
 * @param {string} name The name of the new namespace resource instance that will be created.
 * @returns
 */
export const namespace = (name) => ({
  kind: 'namespace',
  name: `${name}-${postfix}`,
})
