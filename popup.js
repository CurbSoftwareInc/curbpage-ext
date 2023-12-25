document.addEventListener('DOMContentLoaded', function() {
    loadAccordions();
    document.getElementById('addAccordionForm').addEventListener('submit', handleAddAccordion);
});

function loadAccordions() {
    chrome.storage.sync.get(['accordions'], function(result) {
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
    const accordion = createAccordion(title);
    accordionContainer.prepend(accordion);

    urls.forEach(url => addUrlToAccordion(accordion, url));
    const urlForm = createUrlForm(accordion);
    accordion.querySelector('.accordion-body').prepend(urlForm);
}

function createAccordion(title) {
    const accordion = document.createElement('div');
    accordion.classList.add('accordion');

    const header = document.createElement('div');
    header.classList.add('accordion-header');
    header.innerText = title;
    header.addEventListener('click', () => accordion.querySelector('.accordion-body').classList.toggle('active'));

    const body = document.createElement('div');
    body.classList.add('accordion-body');
    const table = document.createElement('table');
    body.appendChild(table);

    accordion.appendChild(header);
    accordion.appendChild(body);
    return accordion;
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
            saveAccordions();
        }
    });

    return form;
}

function addUrlToAccordion(accordion, url) {
    const table = accordion.querySelector('table');
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
        editUrlInAccordion(this, urlCell);
    });
    editCell.appendChild(editButton);
    row.appendChild(editCell);

    const deleteCell = document.createElement('td');
    const deleteButton = document.createElement('button');
    deleteButton.innerText = 'Delete';
    deleteButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this URL?')) {
            row.remove();
            saveAccordions();
        }
    });
    deleteCell.appendChild(deleteButton);
    row.appendChild(deleteCell);

    table.appendChild(row);
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

function editUrlInAccordion(editButton, urlCell) {
    if (editButton.innerText === 'Edit') {
        // Turn the URL cell into a text input field
        const currentUrl = urlCell.innerText;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentUrl;
        urlCell.innerText = '';
        urlCell.appendChild(input);
        editButton.innerText = 'Save';
    } else {
        // Save the edited URL
        const newUrl = urlCell.querySelector('input').value.trim();
        urlCell.innerText = newUrl;
        editButton.innerText = 'Edit';
        saveAccordions();
    }
}

function saveAccordions() {
    const accordions = [];
    document.querySelectorAll('.accordion').forEach(accordion => {
        const title = accordion.querySelector('.accordion-header').innerText;
        const urls = Array.from(accordion.querySelectorAll('td:nth-child(2)')).map(td => td.innerText);
        accordions.push({ title, urls });
    });
    chrome.storage.sync.set({ 'accordions': accordions });
}
