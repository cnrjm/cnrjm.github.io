document.addEventListener('DOMContentLoaded', () => {
    const content = document.getElementById('content');
    const links = document.querySelectorAll('nav a[data-section]');

    links.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const section = e.target.getAttribute('data-section');
            await loadContent(section);
            updateActiveLink(e.target);
        });
    });

    async function loadContent(section) {
        try {
            const response = await fetch(`content/${section}.json`);
            if (!response.ok) {
                throw new Error('Content not found');
            }
            const data = await response.json();
            await updateContent(data, section);
        } catch (error) {
            content.innerHTML = '<p>Error loading content.</p>';
            console.error('Error:', error);
        }
    }

    async function displayPhotos(data) {
        const photoGrid = data.photos.map(photo => `
            <div class="photo-item">
                <img src="photos/${photo}" alt="Photo">
            </div>
        `).join('');
        
        return `<div class="photo-grid">${photoGrid}</div>`;
    }

    async function updateContent(data, section) {
        let htmlContent = '';
        
        if (section === 'experience') {
            htmlContent += data.jobs.map((job, index) => `
                <div class="job">
                    <div class="job-header">
                        <div class="job-role"><strong>${job.role}</strong></div>
                        <div class="job-title">${job.title}</div>
                        <div class="job-dates">${job.dates}</div>
                    </div>
                    <p class="job-description">${job.description}</p>
                </div>
                ${index < data.jobs.length - 1 ? '<div class="job-divider"></div>' : ''}
            `).join('');
        } else if (section === 'projects') {
            htmlContent = await displayProjects(data);
        } else if (section === 'photos') {
                htmlContent = await displayPhotos(data);
            } else if (section === 'resume') {
            htmlContent += '<iframe src="resume.pdf" width="100%" height="600px"></iframe>';
        } else {
            htmlContent += data.content;
        }
    
        content.innerHTML = htmlContent;
    }

    function updateActiveLink(clickedLink) {
        links.forEach(link => link.classList.remove('active'));
        clickedLink.classList.add('active');
    }

    async function fetchGitHubRepos(username) {
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&direction=desc`);
        return response.json();
    }

    function createRepoCard(repo) {
        return `
            <div class="repo-card">
                <h3>${repo.name}</h3>
                <p>${repo.description || 'No description available.'}</p>
                <p>Language: ${repo.language || 'Not specified'}</p>
                <p>Stars: ${repo.stargazers_count}</p>
                <a href="${repo.html_url}" target="_blank">View on GitHub</a>
            </div>
        `;
    }

    async function displayProjects(data) {
        const repos = await fetchGitHubRepos(data.githubUsername);
        const projectsHtml = repos.slice(0, 6).map(createRepoCard).join('');
        return `<div class="repo-container">${projectsHtml}</div>`;
    }

    // Initial load
    loadContent('about').then(() => {
        updateActiveLink(document.querySelector('nav a[data-section="about"]'));
    });
});