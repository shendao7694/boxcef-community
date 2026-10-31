// @path: src/js/common/tags.js
let cache = null;
let inflight = null;

export function getTagInfo() {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch('/api/data/tag/list')
      .then(res => res.json())
      .then(data => {
        cache = {
          postTags: Array.isArray(data.postTags) ? data.postTags : [],
          boxplayTypes: Array.isArray(data.boxplayTypes) ? data.boxplayTypes : []
        };
        return cache;
      })
      .catch(() => ({ postTags: [], boxplayTypes: [] }));
  }
  return inflight;
}
