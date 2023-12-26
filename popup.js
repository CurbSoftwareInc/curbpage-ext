document.addEventListener('DOMContentLoaded', function() {
    loadAccordions();
    document.getElementById('addAccordionForm').addEventListener('submit', handleAddAccordion);
});

function loadAccordions() {
    chrome.storage.sync.get(['accordions'], function(result) {
        // Clear existing accordions
        document.getElementById('accordionContainer').innerHTML = '';

        if (result.accordions) {
            result.accordions.forEach(accordionData => {
                addAccordion(accordionData.title, accordionData.urls);
            });
        }
    });
}

function handleAddAccordion(event) {
    event.preventDefault();
    const accordionTitle = document.getElementById('accordionTitleInput').value.trim();
    if (accordionTitle) {
        addAccordion(accordionTitle);
        document.getElementById('accordionTitleInput').value = '';
        saveAccordions();
    }
}

function addAccordion(title, urls = []) {
    const accordionContainer = document.getElementById('accordionContainer');

    // Generate a unique ID for the accordion based on the title
    const accordionId = `accordion-${title.replace(/\s+/g, '-').toLowerCase()}`;

    // Check if the accordion already exists
    let accordion = document.getElementById(accordionId);
    if (!accordion) {
        accordion = createAccordion(title, accordionId);
        accordionContainer.prepend(accordion);
    }

    // Add URLs to accordion
    urls.forEach(url => addUrlToAccordion(accordion, url));
}

function createAccordion(title, accordionId) {
    const accordion = document.createElement('div');
    accordion.classList.add('accordion');
    accordion.id = accordionId; // Set the unique ID

    // Create the header container
    const header = document.createElement('div');
    header.classList.add('accordion-header');

    // Span for the title
    const titleSpan = document.createElement('span');
    titleSpan.textContent = title;
    titleSpan.classList.add('accordion-title');
    header.appendChild(titleSpan);

    // Edit button
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', function(event) {
        event.stopPropagation(); // Prevents accordion toggle
        editAccordionTitle(header, this);
    });
    header.appendChild(editButton);

    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', function(event) {
        event.stopPropagation(); // Prevents accordion toggle
        deleteAccordion(accordion);
    });
    header.appendChild(deleteButton);

    // Click event to toggle accordion body
    header.addEventListener('click', function() {
        accordion.querySelector('.accordion-body').classList.toggle('active');
    });

    // Create the accordion body
    const body = document.createElement('div');
    body.classList.add('accordion-body');

    // Append header and body to the accordion
    accordion.appendChild(header);
    accordion.appendChild(body);

    // Add URL form only once
    const urlForm = createUrlForm(accordion);
    body.appendChild(urlForm);

    return accordion;
}


function editAccordionTitle(header, editButton) {
    let titleSpan = header.querySelector('.accordion-title');
    let titleInput = header.querySelector('.accordion-title-input');

    if (editButton.textContent === 'Edit') {
        if (!titleInput) {
            titleInput = document.createElement('input');
            titleInput.type = 'text';
            titleInput.classList.add('accordion-title-input');
            titleInput.value = titleSpan.textContent.trim();
            header.replaceChild(titleInput, titleSpan);

            // Handle 'Enter' key press
            titleInput.addEventListener('keydown', function(event) {
                if (event.key === 'Enter') {
                    updateTitle(header, titleInput, editButton);
                }
            });

            titleInput.focus();
        }
        editButton.textContent = 'Save';
    } else {
        updateTitle(header, titleInput, editButton);
    }
}

function updateTitle(header, titleInput, editButton) {
    if (titleInput) {
        const newTitle = titleInput.value.trim();
        const newTitleSpan = document.createElement('span');
        newTitleSpan.textContent = newTitle;
        newTitleSpan.classList.add('accordion-title');
        header.replaceChild(newTitleSpan, titleInput);
        editButton.textContent = 'Edit';
        saveAccordions();
    }
}


function deleteAccordion(accordion) {
    // Confirm before deleting
    if (confirm('Are you sure you want to delete this accordion?')) {
        accordion.remove();
        // Save the updated accordions to storage
        saveAccordions();
    }
}

function createUrlForm(accordion) {
    const form = document.createElement('form');
    form.classList.add('url-form');

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter a URL (with or without leading /)';
    form.appendChild(input);

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.innerText = 'Add URL';
    form.appendChild(submitButton);

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        const url = input.value.trim();
        if (url) {
            addUrlToAccordion(accordion, url);
            input.value = '';
        }
    });

    return form;
}


function addUrlToAccordion(accordion, url) {
    let table = accordion.querySelector('table');
    if (!table) {
        table = document.createElement('table');
        accordion.querySelector('.accordion-body').appendChild(table);
    }

    const row = document.createElement('tr');

    const navigateCell = document.createElement('td');
    const navigateButton = document.createElement('button');
    navigateButton.innerText = 'Go';
    navigateButton.addEventListener('click', () => navigateToUrl(url));
    navigateCell.appendChild(navigateButton);
    row.appendChild(navigateCell);

    const urlCell = document.createElement('td');
    urlCell.innerText = url;
    row.appendChild(urlCell);

    const editCell = document.createElement('td');
    const editButton = document.createElement('button');
    editButton.innerText = 'Edit';
    editButton.addEventListener('click', function() {
        editUrlInAccordion(this, urlCell, navigateButton);
    });
    editCell.appendChild(editButton);
    row.appendChild(editCell);

    const deleteCell = document.createElement('td');
    const deleteButton = document.createElement('button');
    deleteButton.innerText = 'Delete';
    deleteButton.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete this URL?')) {
            row.remove();
            saveAccordions(); // Save the accordions after deleting a URL
        }
    });
    deleteCell.appendChild(deleteButton);
    row.appendChild(deleteCell);

    table.appendChild(row);
    saveAccordions(); // Save the accordions after adding a new URL
}



function editUrlInAccordion(editButton, urlCell) {
    const navigateButton = urlCell.parentNode.querySelector('button'); // Adjust the selector as needed
    if (editButton.innerText === 'Edit') {
        const currentUrl = urlCell.innerText;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentUrl;
        urlCell.innerHTML = '';
        urlCell.appendChild(input);
        editButton.innerText = 'Save';
    } else {
        const newUrl = urlCell.querySelector('input').value.trim();
        if (newUrl) {
            urlCell.innerText = newUrl;
            editButton.innerText = 'Edit';
            updateNavigateButton(navigateButton, newUrl);
            saveAccordions();
        }
    }
}

function updateNavigateButton(navigateButton, newUrl) {
    navigateButton.removeEventListener('click', navigateButton.clickListener);
    navigateButton.clickListener = () => navigateToUrl(newUrl);
    navigateButton.addEventListener('click', navigateButton.clickListener);
}
function saveAccordions() {
    const accordions = [];
    document.querySelectorAll('.accordion').forEach(accordion => {
        const title = accordion.querySelector('.accordion-header .accordion-title').textContent.trim();
        const urls = Array.from(accordion.querySelectorAll('td:nth-child(2)')).map(td => td.textContent);
        accordions.push({ title, urls });
    });
    chrome.storage.sync.set({ 'accordions': accordions }, () => {
        console.log('Accordions saved');
    });
}

function navigateToUrl(url) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (!tabs[0] || !tabs[0].url) return;
        const currentTabUrl = new URL(tabs[0].url);
        const fullPath = url.startsWith('/') ? url : '/' + url;
        const fullUrl = currentTabUrl.origin + fullPath;
        chrome.tabs.update(tabs[0].id, { url: fullUrl });
    });
}

