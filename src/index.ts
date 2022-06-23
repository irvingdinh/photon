export interface Env {
  //
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const src = decodeSourceFromURL(url)

    let response = await caches.default.match(request.clone())
    if (typeof response !== 'undefined') {
      return response
    }

    const res = await fetchSource(src)
    if (res.status > 299) {
      return new Response(null, {status: res.status})
    }

    response = new Response(res.body, {
      headers: computeResponseHeaders(res.headers),
      status: res.status,
    })

    await caches.default.put(request.clone(), response.clone())

    return response;
  },
};

function decodeSourceFromURL(url: URL): string {
  const {pathname} = url
  const srcAsBase64 = pathname.replace(/^\//, '')

  return atob(srcAsBase64)
}

function fetchSource(src: string): Promise<Response> {
  return new Promise((resolve, reject) => {
    fetch(src)
      .then((res) => {
        if (res.status > 299) {
          resolve(new Response(null, {
            status: 404
          }))

          return
        }

        resolve(res)
      })
      .catch((err) => {
        console.error(err)

        resolve(new Response(null, {
          status: 404
        }))
      })
  })
}

function computeResponseHeaders(source: Headers): Headers {
  const headers = new Headers()

  for (let key of source.keys()) {
    if (['content-type'].indexOf(key) !== -1) {
      headers.set(key, source.get(key) || '')
    }
  }

  headers.set('cache-control', 'public, max-age=31536000')

  return headers
}
