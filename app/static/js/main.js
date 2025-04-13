document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('resumeForm');
    const fileInput = document.getElementById('resumeFile');
    const dropZone = document.getElementById('dropZone');
    const fileInfo = document.getElementById('fileInfo');
    const result = document.getElementById('result');
    const extractedText = document.getElementById('extractedText');
    const statusBanner = document.getElementById('statusBanner');
    const statusIcon = document.getElementById('statusIcon');
    const statusMessage = document.getElementById('statusMessage');
    const copyButton = document.getElementById('copyButton');

    // Function to format text with proper spacing and line breaks
    function formatText(text) {
        // Remove excessive whitespace while preserving paragraphs
        return text
            .replace(/\n\s*\n\s*\n/g, '\n\n')  // Replace multiple empty lines with double line break
            .replace(/[ \t]+/g, ' ')            // Replace multiple spaces/tabs with single space
            .trim();                            // Remove leading/trailing whitespace
    }

    // Function to handle copy button click
    async function handleCopyClick() {
        try {
            await navigator.clipboard.writeText(extractedText.textContent);
            copyButton.innerHTML = `
                <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Copied!
            `;
            copyButton.classList.remove('text-blue-700', 'bg-blue-100', 'hover:bg-blue-200');
            copyButton.classList.add('text-green-700', 'bg-green-100', 'hover:bg-green-200');
            
            setTimeout(() => {
                copyButton.innerHTML = `
                    <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                    </svg>
                    Copy Text
                `;
                copyButton.classList.remove('text-green-700', 'bg-green-100', 'hover:bg-green-200');
                copyButton.classList.add('text-blue-700', 'bg-blue-100', 'hover:bg-blue-200');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            showStatus('error', 'Failed to copy text to clipboard');
        }
    }

    // Add copy button click handler
    copyButton.addEventListener('click', handleCopyClick);

    function showStatus(type, message) {
        const icons = {
            success: `<svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>`,
            error: `<svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>`,
            loading: `<svg class="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>`
        };

        const styles = {
            success: 'bg-green-50 border-green-100',
            error: 'bg-red-50 border-red-100',
            loading: 'bg-blue-50 border-blue-100'
        };

        const textStyles = {
            success: 'text-green-800',
            error: 'text-red-800',
            loading: 'text-blue-800'
        };

        statusIcon.innerHTML = icons[type];
        statusMessage.textContent = message;
        statusMessage.className = `text-sm font-medium ${textStyles[type]}`;
        statusBanner.className = `rounded-md p-4 mt-4 border ${styles[type]}`;
        statusBanner.classList.remove('hidden');
    }

    // Function to update file info display
    function updateFileInfo(file) {
        if (file) {
            fileInfo.textContent = `Currently uploaded: ${file.name}`;
            fileInfo.classList.remove('hidden');
        } else {
            fileInfo.textContent = '';
            fileInfo.classList.add('hidden');
        }
    }

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!fileInput.files[0]) {
            showStatus('error', 'Please select a file');
            return;
        }

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        try {
            showStatus('loading', 'Converting file to text...');

            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Format and show the result
            extractedText.textContent = formatText(data.text);
            result.classList.remove('hidden');
            
            // Update status
            showStatus('success', 'Text extracted successfully!');
        } catch (error) {
            console.error('Error:', error);
            showStatus('error', `Error: ${error.message}`);
        }
    });

    // Handle file selection
    fileInput.addEventListener('change', function(e) {
        if (this.files[0]) {
            updateFileInfo(this.files[0]);
        } else {
            updateFileInfo(null);
        }
    });

    // Make the drop zone clickable
    dropZone.addEventListener('click', function(e) {
        fileInput.click();
    });

    // Handle drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('border-blue-500');
    }

    function unhighlight(e) {
        dropZone.classList.remove('border-blue-500');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            fileInput.files = files;
            updateFileInfo(files[0]);
        }
    }
}); 