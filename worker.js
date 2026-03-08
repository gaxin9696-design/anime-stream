export default {
  async fetch(request) {

    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return new Response("Missing id", { status: 400 })
    }

    const upstream = await fetch(`https://pixeldrain.com/api/file/${id}`)

    return new Response(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "video/mp4",
        "Access-Control-Allow-Origin": "*",
        "Accept-Ranges": "bytes"
      }
    })
  }
}