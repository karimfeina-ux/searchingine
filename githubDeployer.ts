/**
 * GitHub REST API & Cloudflare Deployment Service
 * Enables 1-click in-browser commit & push directly to GitHub repositories
 * and Cloudflare Pages webhook trigger.
 */

export interface GitHubDeployConfig {
  repoOwner: string;
  repoName: string;
  branch: string;
  token: string;
  commitMessage?: string;
}

export interface DeployStepLog {
  step: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  timestamp: string;
}

export async function testGitHubConnection(config: GitHubDeployConfig): Promise<{ success: boolean; error?: string; repoData?: any }> {
  try {
    const res = await fetch(`https://api.github.com/repos/${config.repoOwner}/${config.repoName}`, {
      headers: {
        Authorization: `Bearer ${config.token.trim()}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        return { success: false, error: 'Invalid Personal Access Token. Please ensure the token has "repo" scope.' };
      }
      if (res.status === 404) {
        return { success: false, error: `Repository "${config.repoOwner}/${config.repoName}" not found or token lacks access.` };
      }
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || `GitHub returned HTTP ${res.status}` };
    }

    const repoData = await res.json();
    return { success: true, repoData };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error reaching GitHub API.' };
  }
}

/**
 * Pushes updated repository files directly to GitHub using the Git Data Trees API.
 * This creates a single atomic commit on GitHub and triggers Cloudflare Pages.
 */
export async function pushToGitHub(
  config: GitHubDeployConfig,
  filesToCommit: Array<{ path: string; content: string }>,
  onProgress?: (step: DeployStepLog) => void
): Promise<{ success: boolean; commitUrl?: string; commitSha?: string; error?: string }> {
  const token = config.token.trim();
  const owner = config.repoOwner.trim();
  const repo = config.repoName.trim();
  const branch = (config.branch || 'main').trim();

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };

  const log = (step: string, status: 'pending' | 'running' | 'success' | 'error', message: string) => {
    if (onProgress) {
      onProgress({
        step,
        status,
        message,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  };

  try {
    // 1. Get branch reference
    log('fetch_ref', 'running', `Fetching latest reference for branch "${branch}"...`);
    const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`, { headers });
    
    let latestCommitSha = '';
    if (refRes.ok) {
      const refData = await refRes.json();
      latestCommitSha = refData.object.sha;
    } else {
      // Try master if main not found
      const fallbackRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/master`, { headers });
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        latestCommitSha = fallbackData.object.sha;
      } else {
        throw new Error(`Could not find branch "${branch}" or "master" in repository.`);
      }
    }
    log('fetch_ref', 'success', `Found latest commit: ${latestCommitSha.slice(0, 7)}`);

    // 2. Get latest commit to find base tree
    log('fetch_commit', 'running', 'Fetching base commit tree...');
    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, { headers });
    if (!commitRes.ok) throw new Error('Failed to retrieve base commit information.');
    const commitData = await commitRes.json();
    const baseTreeSha = commitData.tree.sha;
    log('fetch_commit', 'success', `Base tree verified (${baseTreeSha.slice(0, 7)})`);

    // 3. Create blobs for each file
    log('create_blobs', 'running', `Creating Git blobs for ${filesToCommit.length} project files...`);
    const treeItems: Array<{ path: string; mode: string; type: string; sha: string }> = [];

    for (const file of filesToCommit) {
      const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: file.content,
          encoding: 'utf-8'
        })
      });

      if (!blobRes.ok) {
        throw new Error(`Failed to create blob for ${file.path}`);
      }

      const blobData = await blobRes.json();
      treeItems.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha
      });
    }
    log('create_blobs', 'success', `Created ${treeItems.length} Git file blobs`);

    // 4. Create new Git tree
    log('create_tree', 'running', 'Assembling new repository tree...');
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems
      })
    });

    if (!treeRes.ok) throw new Error('Failed to create new Git tree.');
    const newTreeData = await treeRes.json();
    log('create_tree', 'success', `New tree assembled (${newTreeData.sha.slice(0, 7)})`);

    // 5. Create new commit
    log('create_commit', 'running', 'Creating signed commit...');
    const newCommitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: config.commitMessage || 'fix: update client prospecting platform for zero-error Cloudflare Pages build',
        tree: newTreeData.sha,
        parents: [latestCommitSha]
      })
    });

    if (!newCommitRes.ok) throw new Error('Failed to create commit.');
    const newCommitData = await newCommitRes.json();
    log('create_commit', 'success', `Commit created: ${newCommitData.sha.slice(0, 7)}`);

    // 6. Update branch head pointer
    log('update_ref', 'running', `Updating branch "${branch}" pointer to commit...`);
    const updateRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        sha: newCommitData.sha,
        force: true
      })
    });

    if (!updateRefRes.ok) throw new Error('Failed to update branch head pointer.');
    log('update_ref', 'success', `Successfully pushed commit to GitHub!`);

    return {
      success: true,
      commitSha: newCommitData.sha,
      commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommitData.sha}`
    };
  } catch (err: any) {
    log('error', 'error', err.message || 'Deployment error');
    return { success: false, error: err.message };
  }
}
