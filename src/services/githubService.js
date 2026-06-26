// src/services/githubService.js
import { LocalStorageService } from './localStorageService.js';

const GITHUB_CONFIG = {
    owner: 'eduardkalimbetov0408',
    repo: 'zoopet',
    path: 'products.json',
};

export const GitHubService = {
    getToken() {
        return LocalStorageService.loadGitHubToken();
    },
    setToken(token) {
        LocalStorageService.saveGitHubToken(token);
    },
    async syncProducts(products) {
        const token = this.getToken();
        if (!token) throw new Error('GitHub token not found');

        const { owner, repo, path } = GITHUB_CONFIG;
        const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        
        const getResp = await fetch(getUrl, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (!getResp.ok) {
            const err = await getResp.json();
            throw new Error(`Failed to get file: ${getResp.status} - ${err.message}`);
        }
        const fileData = await getResp.json();
        const sha = fileData.sha;

        const content = JSON.stringify(products, null, 2);
        const encoded = btoa(unescape(encodeURIComponent(content)));

        const updateUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        const updateResp = await fetch(updateUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Обновление товаров от ${new Date().toLocaleString()}`,
                content: encoded,
                sha: sha
            })
        });
        if (!updateResp.ok) {
            const err = await updateResp.json();
            throw new Error(`Update failed: ${updateResp.status} - ${err.message}`);
        }
        return true;
    }
};
