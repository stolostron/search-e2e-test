// Copyright (c) 2020 Red Hat, Inc.

/**
 * String created from the Date.now() (Primarily used as a postfix)
 */
const hash = Date.now()

/**
 * Returns new application object instance.
 * @param {string} namespace The target namespace for where the application resource instance will be created.
 * @param  {...any} args Additional optional parameters for the application object.
 * @returns
 */
export const application = (namespace, ...args) => ({
  kind: 'application',
  name: `auto-test-app-${hash}`,
  namespace: `${namespace}-${hash}`,
  args,
})

/**
 * Returns new deployment object instance.
 * @param {string} namespace The target namespace for where the deployment resource instance will be created.
 * @param  {...any} args Additional optional parameters for the deployment object.
 * @returns
 */
export const deployment = (namespace, ...args) => ({
  kind: 'deployment',
  name: `auto-test-deploy-${hash}`,
  namespace: `${namespace}-${hash}`,
  image: 'openshift/hello-openshift',
  args,
})

/**
 * Returns new namespace object instance.
 * @param {string} name The name of the new namespace resource instance that will be created.
 * @param  {...any} args Additional optional parameters for the namspace object.
 * @returns
 */
export const namespace = (name, ...args) => ({
  kind: 'namespace',
  name: `${name}-${hash}`,
  args,
})
