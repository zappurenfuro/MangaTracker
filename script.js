function getMangaList() {
    return JSON.parse(localStorage.getItem('mangaList') || '[]');
}

function addOrUpdateManga(title, chapter) {
    if (!title) title = document.getElementById('mangaTitle').value;
    if (!chapter) chapter = document.getElementById('mangaChapter').value;

    const mangaList = getMangaList();
    const mangaIndex = mangaList.findIndex(manga => manga.title === title);

    if (mangaIndex > -1) {
        mangaList[mangaIndex].chapter = chapter;
    } else {
        mangaList.push({ title, chapter });
    }

    localStorage.setItem('mangaList', JSON.stringify(mangaList));
    displayMangaList();  // Refresh the list display
}

function deleteManga(title) {
    let mangaList = getMangaList();
    mangaList = mangaList.filter(manga => manga.title !== title);
    localStorage.setItem('mangaList', JSON.stringify(mangaList));
    displayMangaList();  // Refresh the list display
}

function editManga(title) {
    const newChapter = prompt(`Update the chapter for ${title}:`);
    if (newChapter) {
        addOrUpdateManga(title, newChapter);
    }
}

function displayMangaList() {
    const mangaList = getMangaList();
    const listContainer = document.getElementById('mangaList');
    listContainer.innerHTML = '';

    mangaList.forEach(manga => {
        const mangaElement = document.createElement('div');
        mangaElement.innerHTML = `${manga.title} - Chapter ${manga.chapter} 
                                 <button onclick="editManga('${manga.title.replace(/'/g, "\\'")}')">Edit</button> 
                                 <button onclick="deleteManga('${manga.title.replace(/'/g, "\\'")}')">Delete</button>`;
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
