// Copyright (c) 2020 Red Hat, Inc.

const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

exports.sleep = sleep
