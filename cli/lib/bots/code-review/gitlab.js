import https from 'https';

export async function fetchMergeRequestDiff(projectId, mrIid, token) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'gitlab.com',
      path: `/api/v4/projects/${encodeURIComponent(projectId)}/merge_requests/${mrIid}/changes`,
      method: 'GET',
      headers: {
        'Private-Token': token,
        'User-Agent': 'Ultra-Dex'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk.toString());
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`GitLab API error: ${res.statusCode}`));
          return;
        }
        resolve(JSON.parse(data));
      });
    });
    req.on('error', reject);
    req.end();
  });
}

export default { fetchMergeRequestDiff };
