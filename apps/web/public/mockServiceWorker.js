/* eslint-disable */
/* tslint:disable */

/**
 * Mock Service Worker.
 * @see https://github.com/mswjs/msw
 * - Please do NOT modify this file.
 * - Please do NOT serve this file on production.
 */

const PACKAGE_VERSION = '2.10.5'
const INTEGRITY_CHECKSUM = '26357c79639bfa20d64c0efca2a87423'
const IS_MOCKED_RESPONSE = Symbol('isMockedResponse')
const activeMocks = new Map()
const events = new Map()
const emitter = {
  on(type, listener) {
    events.set(type, listener)
  },
  removeListener(type, listener) {
    events.delete(type)
  },
  emit(type, ...data) {
    const listener = events.get(type)
    if (listener) {
      listener(...data)
    }
  },
}

self.addEventListener('message', async function (event) {
  const clientId = event.source.id
  const message = JSON.parse(event.data)
  switch (message.type) {
    case 'MOCK_ACTIVATE': {
      activeMocks.set(clientId, message)
      self.postMessage('MOCKING_ENABLED', { type: 'mockServiceWorker' })
      break
    }
    case 'MOCK_DEACTIVATE': {
      activeMocks.delete(clientId)
      break
    }
    case 'INTEGRITY_CHECK_REQUEST': {
      self.postMessage(INTEGRITY_CHECKSUM, { type: 'mockServiceWorker' })
      break
    }
  }
})

self.addEventListener('fetch', function (event) {
  const { clientId, request } = event
  const mock = activeMocks.get(clientId)
  if (!mock) {
    return
  }
  return event.respondWith(
    handleRequest(event, clientId).catch((error) => {
      if (error.name === 'NetworkError') {
        console.warn(
          '[MSW] Successfully emulated a network error for the "%s %s" request.',
          request.method,
          request.url,
        )
        return
      }
      throw error
    }),
  )
})

async function handleRequest(event, clientId) {
  const { request } = event
  const requestClone = request.clone()
  const getOriginalResponse = () => fetch(requestClone)
  const requestUrl = new URL(request.url)
  const mock = activeMocks.get(clientId)
  const handlersSource = mock?.handlersSource || 'browser'

  const resolverResult = await self.MSW_RESOLVE_HANDLER?.(
    request,
    requestUrl,
    handlersSource,
  )

  switch (resolverResult?.type) {
    case 'handler': {
      const mockedResponse = await resolverResult.response()
      return respondWithMock(mockedResponse)
    }
    case 'mocked-response': {
      return resolverResult.response
    }
    case 'passthrough': {
      return getOriginalResponse()
    }
  }

  return getOriginalResponse()
}

function respondWithMock(response) {
  if (response.status === 302) {
    return Response.redirect(response.headers.get('location'), 302)
  }
  return response
}












