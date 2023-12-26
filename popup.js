document.addEventListener('DOMContentLoaded', function() {
    loadAccordions();
    document.getElementById('addAccordionForm').addEventListener('submit', handleAddAccordion);
});

function loadAccordions() {
    chrome.storage.sync.get(['accordions'], function(result) {
        document.getElementById('accordionContainer').innerHTML = '';
        if (result.accordions) {
            result.accordions.forEach(accordionData => {
                addAccordion(escapeHTML(accordionData.title), accordionData.urls.map(url => escapeHTML(url)));
            });
        }
    });
}

function handleAddAccordion(event) {
    event.preventDefault();
    const accordionTitle = escapeHTML(document.getElementById('accordionTitleInput').value.trim());
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
}

function createAccordion(title) {
    const accordion = document.createElement('div');
    accordion.classList.add('accordion');
    const header = document.createElement('div');
    header.classList.add('accordion-header');
    const titleSpan = document.createElement('span');
    titleSpan.textContent = title;
    header.appendChild(titleSpan);
    addAccordionControlButtons(header, accordion);
    const body = document.createElement('div');
    body.classList.add('accordion-body');
    accordion.appendChild(header);
    accordion.appendChild(body);
    body.appendChild(createUrlForm(accordion));
    return accordion;
}

function addAccordionControlButtons(header, accordion) {
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', event => {
        event.stopPropagation();
        editAccordionTitle(header, editButton);
    });
    header.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', event => {
        event.stopPropagation();
        deleteAccordion(accordion);
    });
    header.appendChild(deleteButton);

    header.addEventListener('click', () => {
        accordion.querySelector('.accordion-body').classList.toggle('active');
    });
}

function editAccordionTitle(header, editButton) {
    let titleSpan = header.querySelector('span');
    let titleInput = header.querySelector('input');

    if (editButton.textContent === 'Edit') {
        if (titleSpan) {
            titleInput = document.createElement('input');
            titleInput.type = 'text';
            titleInput.value = titleSpan.textContent;
            header.replaceChild(titleInput, titleSpan);
            editButton.textContent = 'Save';
        }
    } else {
        if (titleInput) {
            const newTitle = titleInput.value.trim();
            titleSpan = document.createElement('span');
            titleSpan.textContent = newTitle;
            header.replaceChild(titleSpan, titleInput);
            editButton.textContent = 'Edit';
            // Save the updated title
            saveAccordions();
        }
    }
}


function updateTitle(header, titleInput, editButton) {
    // Update the title and switch the button text back to 'Edit'
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
    if (confirm('Are you sure you want to delete this accordion?')) {
        accordion.remove();
        saveAccordions();
    }
}

function createUrlForm(accordion) {
    const form = document.createElement('form');
    form.classList.add('url-form');
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter a relative URL (with or without leading / )';
    form.appendChild(input);
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.innerText = 'Add URL';
    form.appendChild(submitButton);
    form.addEventListener('submit', event => {
        event.preventDefault();
        const url = escapeHTML(input.value.trim());
        if (url) {
            addUrlToAccordion(accordion, url);
            input.value = '';
        }
    });
    return form;
}

function addUrlToAccordion(accordion, url) {
    const table = accordion.querySelector('table') || createTableForAccordion(accordion);
    const row = createUrlRow(url);
    table.appendChild(row);
    saveAccordions();
}

function createTableForAccordion(accordion) {
    const table = document.createElement('table');
    accordion.querySelector('.accordion-body').appendChild(table);
    return table;
}

function createUrlRow(url) {
    const row = document.createElement('tr');
    row.appendChild(createTableCellWithButton('Go', () => navigateToUrl(url)));
    row.appendChild(createTableCell(url));
    row.appendChild(createTableCellWithButton('Edit', function() {
        editUrlInRow(this, row);
    }));
    row.appendChild(createTableCellWithButton('Delete', function() {
        deleteUrlRow(this, row);
    }));
    return row;
}

function createTableCellWithButton(text, onClick) {
    const cell = document.createElement('td');
    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', onClick);
    cell.appendChild(button);
    return cell;
}

function createTableCell(text) {
    const cell = document.createElement('td');
    cell.textContent = text;
    return cell;
}

function editUrlInRow(editButton, row) {
    const urlCell = row.cells[1]; // Assuming the URL is always in the second cell
    if (editButton.textContent === 'Edit') {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = urlCell.textContent;
        urlCell.textContent = '';
        urlCell.appendChild(input);
        editButton.textContent = 'Save';
    } else {
        const input = urlCell.querySelector('input');
        const newUrl = escapeHTML(input.value.trim());
        urlCell.textContent = newUrl;
        editButton.textContent = 'Edit';
        updateNavigateButton(row.cells[0].querySelector('button'), newUrl);
        saveAccordions();
    }
}

function deleteUrlRow(deleteButton, row) {
    if (confirm('Are you sure you want to delete this URL?')) {
        row.remove();
        saveAccordions();
    }
}

function updateNavigateButton(navigateButton, newUrl) {
    navigateButton.removeEventListener('click', navigateButton.clickListener);
    navigateButton.clickListener = () => navigateToUrl(newUrl);
    navigateButton.addEventListener('click', navigateButton.clickListener);
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

function saveAccordions() {
    const accordions = [];
    document.querySelectorAll('.accordion').forEach(accordion => {
        const title = accordion.querySelector('.accordion-header span').textContent.trim();
        const urls = Array.from(accordion.querySelectorAll('td:nth-child(2)'))
                          .map(td => td.textContent);
        accordions.push({ title, urls });
    });
    chrome.storage.sync.set({ 'accordions': accordions });
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
