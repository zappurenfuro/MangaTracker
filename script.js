function getMangaList() {
    return JSON.parse(localStorage.getItem('mangaList') || '[]');
}

function addOrUpdateManga(title, chapter, lastUpdated) {
    const mangaList = getMangaList();
    const mangaIndex = mangaList.findIndex(manga => manga.title === title);
    const now = lastUpdated || new Date().toISOString(); // Use the passed timestamp or generate a new one

    if (mangaIndex > -1) {
        mangaList[mangaIndex].chapter = chapter;
        mangaList[mangaIndex].lastUpdated = now; // Update the timestamp
    } else {
        mangaList.push({ title, chapter, lastUpdated: now, addedDate: now });
    }

    localStorage.setItem('mangaList', JSON.stringify(mangaList));
    displayMangaList(); // Refresh the list
}

function deleteManga(title) {
    const isConfirmed = confirm(`Are you sure you want to delete "${title}"?`);
    
    if (isConfirmed) {
        let mangaList = getMangaList();
        mangaList = mangaList.filter(manga => manga.title !== title);
        localStorage.setItem('mangaList', JSON.stringify(mangaList));
        displayMangaList();  // Refresh the list display
    }
}


function editManga(title) {
    const newChapter = prompt(`Update the chapter for ${title}:`);
    if (newChapter) {
        const now = new Date().toISOString(); // Generate the current timestamp
        addOrUpdateManga(title, newChapter, now); // Pass it to the addOrUpdateManga function
        displayMangaList(); // Refresh the list
    }
}

function displayMangaList() {
    const mangaList = getMangaList();
    const listContainer = document.getElementById('mangaList');
    listContainer.innerHTML = '';

    const now = new Date();
    mangaList.forEach(manga => {
        const mangaElement = document.createElement('div');
        
        // Check if the manga was updated in the last 2 weeks
        const lastUpdatedTime = new Date(manga.lastUpdated);
        const isRecentlyUpdated = (now - lastUpdatedTime) < (14 * 24 * 60 * 60 * 1000); // 14 days in milliseconds

        mangaElement.innerHTML = `
            <span style="color: ${isRecentlyUpdated ? 'red' : 'white'};">${manga.title} - Chapter ${manga.chapter}</span>
            <button class="edit-btn" data-title="${manga.title}">Edit</button>
            <button class="delete-btn" data-title="${manga.title}">Delete</button>
        `;
        
        listContainer.appendChild(mangaElement);
    });
}


function loadData() {
    const input = document.getElementById('fileInput');
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const contents = e.target.result;
            const lines = contents.split('\n');
            lines.forEach(line => {
                const lastIndexOfCh = line.lastIndexOf(' ch');
                if (lastIndexOfCh > -1) {
                    const title = line.substring(0, lastIndexOfCh);
                    const chapter = line.substring(lastIndexOfCh + 3); // +3 to skip the space and "ch"
                    if (title && chapter) {
                        addOrUpdateManga(title.trim(), chapter.trim());
                    }
                }
            });
            
        };
        reader.readAsText(file);
    }
}

function downloadList() {
    const mangaList = getMangaList();
    let content = mangaList.map(manga => `${manga.title} ch${manga.chapter}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    // Create a link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mangaList.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function backupList() {
    const mangaList = getMangaList();
    fetch('http://localhost:3000/send-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mangaList: mangaList }),
    })
    .then(response => {
        if (!response.ok) {
            // If the server response was not ok, throw an error
            throw new Error('Network response was not ok');
        }
        return response.json(); // We can safely parse the response as JSON
    })
    .then(data => {
        if (data.message) {
            alert(data.message); // Alert with the message from the server
        } else {
            throw new Error('Unexpected response from the server');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('An error occurred while sending the backup email.');
    });
}

document.getElementById('mangaList').addEventListener('click', function(event) {
    // Check if the clicked element is an edit button
    if (event.target && event.target.matches('.edit-btn')) {
        const title = event.target.getAttribute('data-title');
        editManga(title);
    }
    
    // Check if the clicked element is a delete button
    if (event.target && event.target.matches('.delete-btn')) {
        const title = event.target.getAttribute('data-title');
        deleteManga(title);
    }
});
