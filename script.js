document.addEventListener('DOMContentLoaded', () => {
    const content = document.getElementById('content');
    const links = document.querySelectorAll('nav a[data-section]');
    const languageSelect = document.getElementById('language-select');
    const countrySelect = document.getElementById('country-select');
    const weatherDisplay = document.getElementById('weather-display');
    const timeDisplay = document.getElementById('time-display');

    // Language selector initialization
    if (languageSelect) {
        console.log('Language select element found');
        languageSelect.addEventListener('change', () => {
            console.log('Language changed to:', languageSelect.value);
            translateContent();
        });
    } else {
        console.error('Language select element not found!');
    }

    // Navigation link event listeners
    links.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const section = e.target.getAttribute('data-section');
            await loadContent(section);
            updateActiveLink(e.target);
        });
    });

    // Content loading function
    async function loadContent(section) {
        try {
            const response = await fetch(`content/${section}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            await updateContent(data, section);
        } catch (error) {
            console.error('Error loading content:', error);
            content.innerHTML = `<p>Error loading content: ${error.message}</p>`;
        }
    }

    // Photo display function
    async function displayPhotos(data) {
        const photoGrid = data.photos.map(photo => `
            <div class="photo-item">
                <img src="photos/${photo}" alt="Photo">
            </div>
        `).join('');
        
        return `<div class="photo-grid">${photoGrid}</div>`;
    }

    // Content update function
    async function updateContent(data, section) {
        let htmlContent = '';
    
        if (section === 'about') {
            htmlContent = `
                <div class="about-content">
                    <div class="text-content">
                        ${data.content}
                    </div>
                    <div class="media-grid">
                        <div class="image-container">
                            <img src="photos/me.png" alt="Picture of me" class="about-image">
                        </div>
                        <div class="gif-container">
                        <img src="photos/trampolining.gif" alt="Trampolining GIF" class="about-gif">
                    </div>
                    </div>
                </div>
            `;
        } else if (section === 'experience') {
            htmlContent = data.jobs.map((job, index) => `
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
            htmlContent = `
                <div class="resume-container">
                    <iframe src="https://docs.google.com/document/d/e/2PACX-1vQqY9CgBwYwlKX9K3n2zfWjuMX4AykA6RGDFzq1WtADBXunhln6fMcpQZZO9r4DBj4GLEjMAga3Lrua/pub?embedded=true" width="100%" height="600px"></iframe>
                </div>
            `;
        } else {
            htmlContent = `<h2>${data.title}</h2>${data.content}`;
        }
    
        content.innerHTML = htmlContent;
    
        console.log('Content updated');
    
        // Translate content if a non-English language is selected
        const currentLang = languageSelect.value;
        if (currentLang !== 'en') {
            await translateAllTextNodes(currentLang);
        }
    }

    // Update active link
    function updateActiveLink(clickedLink) {
        links.forEach(link => link.classList.remove('active'));
        clickedLink.classList.add('active');
    }

    // GitHub repositories fetch function
    async function fetchGitHubRepos(username) {
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&direction=desc`);
        return response.json();
    }

    // GitHub repository card creation function
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

    // Projects display function
    async function displayProjects(data) {
        const repos = await fetchGitHubRepos(data.githubUsername);
        const projectsHtml = repos.slice(0, 6).map(createRepoCard).join('');
        return `<div class="repo-container">${projectsHtml}</div>`;
    }

    // Fetch countries and populate the dropdown
    fetch('https://restcountries.com/v3.1/all')
        .then(response => response.json())
        .then(data => {
            data.sort((a, b) => a.name.common.localeCompare(b.name.common));
            data.forEach(country => {
                const option = document.createElement('option');
                option.value = country.cca2;
                option.textContent = country.name.common;
                countrySelect.appendChild(option);
                
                // Set United Kingdom as default
                if (country.cca2 === 'GB') {
                    option.selected = true;
                }
            });
            
            // Trigger the change event to load UK data
            const event = new Event('change');
            countrySelect.dispatchEvent(event);
        });

    // Weather and time update
    countrySelect.addEventListener('change', () => {
        const selectedCountry = countrySelect.value;
        if (selectedCountry) {
            fetch(`https://restcountries.com/v3.1/alpha/${selectedCountry}`)
                .then(response => {
                    if (!response.ok) throw new Error('Country API response not ok');
                    return response.json();
                })
                .then(countryData => {
                    if (!countryData[0] || !countryData[0].timezones || countryData[0].timezones.length === 0) {
                        throw new Error('No timezone found for country');
                    }
                    const timezone = countryData[0].timezones[0];
                    const capital = countryData[0].capital[0];
                    
                    // Fetch weather data
                    return Promise.all([
                        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${capital}&appid=${process.env.WEATHER_API_KEY}`),
                        Promise.resolve(timezone)
                    ]);
                })
                .then(([weatherResponse, timezone]) => {
                    if (!weatherResponse.ok) throw new Error('Weather API response not ok');
                    return Promise.all([weatherResponse.json(), Promise.resolve(timezone)]);
                })
                .then(([weatherData, timezone]) => {
                    const tempCelsius = Math.round(weatherData.main.temp - 273.15);
                    weatherDisplay.textContent = `Weather in ${weatherData.name}: ${weatherData.weather[0].description}, ${tempCelsius}°C`;
                    
                    const currentTime = new Date();
                    
                    // Parse the UTC offset
                    const utcOffset = timezone.replace("UTC", "").split(":");
                    const offsetHours = parseInt(utcOffset[0]);
                    const offsetMinutes = utcOffset[1] ? parseInt(utcOffset[1]) : 0;
                    
                    // Adjust the time based on UTC offset
                    currentTime.setUTCHours(currentTime.getUTCHours() + offsetHours);
                    currentTime.setUTCMinutes(currentTime.getUTCMinutes() + offsetMinutes);
                    
                    const timeString = currentTime.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit'
                    });
                    timeDisplay.textContent = `Local Time: ${timeString}`;
                })
                .catch(error => {
                    console.error('Detailed error:', error);
                    weatherDisplay.textContent = `Weather data unavailable: ${error.message}`;
                    timeDisplay.textContent = 'Local time unavailable';
                });
        }
    });

    // Update time every minute
    setInterval(() => {
        if (countrySelect.value) {
            const event = new Event('change');
            countrySelect.dispatchEvent(event);
        }
    }, 60000);

    // Translate all text nodes function
    async function translateAllTextNodes(targetLang) {
        console.log('Translating all text nodes to:', targetLang);
        const textNodes = [];
        const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while (node = walk.nextNode()) {
            if (node.nodeValue.trim() !== '' && !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.parentNode.tagName)) {
                textNodes.push(node);
            }
        }
        console.log('Number of text nodes to translate:', textNodes.length);
        for (let node of textNodes) {
            try {
                const translatedText = await translateText(node.nodeValue, targetLang);
                node.nodeValue = translatedText;
            } catch (error) {
                console.error('Translation error for node:', node.nodeValue, error);
            }
        }
    }

    // Translate text function
    async function translateText(text, targetLang) {
        try {
            const sourceLang = 'en'; // Assuming English is the source language
            const encodedText = encodeURIComponent(text);
            const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${sourceLang}|${targetLang}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Translation request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.responseStatus === 200) {
                return data.responseData.translatedText;
            } else {
                throw new Error(`Translation failed: ${data.responseStatus}`);
            }
        } catch (error) {
            console.error('Detailed translation error:', error);
            return text; // Return original text if translation fails
        }
    }

    // Initial load
    loadContent('about').then(() => {
        updateActiveLink(document.querySelector('nav a[data-section="about"]'));
    });
});