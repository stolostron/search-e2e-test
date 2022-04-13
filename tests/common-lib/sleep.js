// Copyright (c) 2020 Red Hat, Inc.

/**
 * Pauses the application and sleeps until the end of the specified interval.
 * @param {int} milliseconds The amount of time to sleep in milliseconds. By default, this will sleep for 5 seconds.
 * @returns {Promise} Returns the promise that will be fulfilled when the timeout has been set for the specified interval.
 */
const sleep = (milliseconds = 5000) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
