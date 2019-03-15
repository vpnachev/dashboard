
//
// Copyright (c) 2019 by SAP SE or an SAP affiliate company. All rights reserved. This file is licensed under the Apache Software License, v. 2 except as noted otherwise in the LICENSE file
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

'use strict'

const kubernetes = require('../../kubernetes')
const {
  toSecretResource
} = require('./terminalResources')

const CLUSTER_ROLE_TERMINAL_ATTACH = 'garden.sapcloud.io:dashboard-terminal-attach'

const SaTypeEnum = {
  attach: 'attach',
  access: 'access'
}

async function createKubeconfig ({ coreClient, namespace, serviceAccountTokenObj, serviceAccountName, serviceAccountNamespace, target, server, ownerReferences }) {
  const name = `${serviceAccountName}.kubeconfig`

  const { token, caData } = serviceAccountTokenObj
  const contextName = `${target}-${serviceAccountNamespace}`
  const kubeconfig = kubernetes.getKubeconfigFromServiceAccount({ serviceAccountName, contextName, serviceAccountNamespace, token, server, caData })

  const client = coreClient.namespace(namespace).secrets
  const body = toSecretResource({ name, ownerReferences, rawData: { kubeconfig } }) // TODO pass username?
  await replaceResource({ client, name, body })

  return name
}

async function replaceResource ({ client, name, body }) {
  try {
    await client.get({ name })
    return client.mergePatch({ name, body })
  } catch (err) {
    if (err.code === 404) {
      return client.post({ body })
    }
    throw err
  }
}

module.exports = {
  CLUSTER_ROLE_TERMINAL_ATTACH,
  replaceResource,
  createKubeconfig,
  SaTypeEnum
}
