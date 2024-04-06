const fileInput = document.getElementById('fileInput');
const loadBtn = document.getElementById('loadBtn');
const sortBtn = document.getElementById('sortBtn');
const downloadBtn = document.getElementById('downloadBtn');
const backupBtn = document.getElementById('backupBtn');
const mangaList = document.getElementById('mangaList');
const newEntryInput = document.getElementById('newEntryInput');
const addEntryBtn = document.getElementById('addEntryBtn');

let mangaData = [];
let sortOrder = 'default';

// Load manga list from .txt file
loadBtn.addEventListener('click', () => {
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            mangaData = reader.result.trim().split('\n');
            updateMangaList();
            saveToLocalStorage();
        };
        reader.readAsText(file);
    }
});

// Sort manga list
sortBtn.addEventListener('click', () => {
    if (sortOrder === 'default') {
        mangaData.sort((a, b) => {
            const aUpdated = a.split(' ch')[0].includes('<span style="color:white">');
            const bUpdated = b.split(' ch')[0].includes('<span style="color:white">');
            if (aUpdated && !bUpdated) return -1;
            if (!aUpdated && bUpdated) return 1;
            return a.localeCompare(b);
        });
        sortOrder = 'recently-updated';
    } else {
        mangaData.sort((a, b) => a.localeCompare(b));
        sortOrder = 'alphabetical';
    }
    updateMangaList();
    saveToLocalStorage();
});

// Download manga list as .txt file
downloadBtn.addEventListener('click', () => {
    const mangaListText = mangaData.join('\n');
    const blob = new Blob([mangaListText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'manga_list.txt';
    link.click();
});

// Update manga list display
function updateMangaList() {
    mangaList.innerHTML = '';
    mangaData.forEach((manga, index) => {
        const li = document.createElement('li');
        const mangaText = document.createElement('span');
        mangaText.innerHTML = manga;
        li.appendChild(mangaText);

        const btnGroup = document.createElement('div');
        btnGroup.classList.add('btn-group');

        const updateBtn = document.createElement('button');
        updateBtn.textContent = 'Update';
        updateBtn.classList.add('btn');
        updateBtn.addEventListener('click', () => {
            const newChapter = prompt('Enter the new chapter number:', manga.split(' ch')[1]);
            if (newChapter !== null) {
                const updatedManga = `<span style="color:white; font-weight: bold;">${manga.split(' ch')[0]}</span> ch${newChapter}`;
                mangaData[index] = updatedManga;
                updateMangaList();
                saveToLocalStorage();
            }
        });
        btnGroup.appendChild(updateBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('btn');
        deleteBtn.addEventListener('click', () => {
            mangaData.splice(index, 1);
            updateMangaList();
            saveToLocalStorage();
        });
        btnGroup.appendChild(deleteBtn);

        li.appendChild(btnGroup);

        mangaList.appendChild(li);
    });
}

// Save manga list to local storage
function saveToLocalStorage() {
    localStorage.setItem('mangaData', JSON.stringify(mangaData));
}

// Load manga list from local storage
const storedData = JSON.parse(localStorage.getItem('mangaData'));
if (storedData) {
    mangaData = storedData;
    updateMangaList();
}

// Add new entry
addEntryBtn.addEventListener('click', () => {
    const newEntry = newEntryInput.value.trim();
    if (newEntry) {
        mangaData.push(`${newEntry} ch1`);
        newEntryInput.value = '';
        updateMangaList();
        saveToLocalStorage();
    }
});

// Backup manga list
backupBtn.addEventListener('click', () => {
    const formattedMangaList = mangaData.map(entry => {
        const parts = entry.split(' ch');
        if (parts.length === 2) {
            return { title: parts[0], chapter: parts[1] };
        }
        return null; // Or handle this case differently if needed
    }).filter(entry => entry !== null);

    fetch('https://mangatracker-uq65.onrender.com/send-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mangaList: formattedMangaList }),
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
});
