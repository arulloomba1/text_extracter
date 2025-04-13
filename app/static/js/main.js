document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('resumeForm');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('resume');
    const fileInfo = document.getElementById('fileInfo');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const results = document.getElementById('results');

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const file = fileInput.files[0];
        const jobDescription = document.getElementById('jobDescription').value;
        
        if (!file) {
            alert('Please select a resume file');
            return;
        }
        
        if (!jobDescription) {
            alert('Please enter a job description');
            return;
        }

        // Show loading spinner
        loadingSpinner.classList.remove('hidden');
        results.classList.add('hidden');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('job_description', jobDescription);

            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const data = await response.json();
            showAnalysisResults(data);
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while analyzing the resume. Please try again.');
        } finally {
            loadingSpinner.classList.add('hidden');
        }
    });

    // Handle file selection
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            updateFileInfo(file);
        }
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
        const file = dt.files[0];
        
        if (file && (file.type === 'application/pdf' || 
                    file.type === 'application/msword' || 
                    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
            fileInput.files = dt.files;
            updateFileInfo(file);
        } else {
            alert('Please upload a PDF, DOC, or DOCX file');
        }
    }

    function updateFileInfo(file) {
        fileInfo.textContent = `Selected file: ${file.name} (${formatFileSize(file.size)})`;
        fileInfo.classList.remove('hidden');
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function showAnalysisResults(data) {
        results.innerHTML = `
            <div class="bg-white shadow rounded-lg overflow-hidden">
                <div class="p-6">
                    <h2 class="text-2xl font-bold text-gray-900 mb-6">Analysis Results</h2>
                    
                    <!-- Match Score -->
                    <div class="mb-8">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Match Score</h3>
                        <div class="flex items-center">
                            <div class="flex-1">
                                <div class="h-4 bg-gray-200 rounded-full">
                                    <div class="h-4 bg-blue-600 rounded-full" style="width: ${data.match_score}%"></div>
                                </div>
                            </div>
                            <span class="ml-4 text-2xl font-bold text-blue-600">${data.match_score}%</span>
                        </div>
                    </div>

                    <!-- Key Skills -->
                    <div class="mb-8">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Key Skills</h3>
                        <div class="flex flex-wrap gap-2">
                            ${data.key_skills_match.map(skill => `
                                <span class="px-3 py-1 ${skill.matched ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} rounded-full text-sm">
                                    ${skill.skill}
                                </span>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Recommendations -->
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Recommendations</h3>
                        <ul class="list-disc list-inside space-y-2 text-gray-700">
                            ${data.recommendations.map(rec => `
                                <li>${rec}</li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;
        results.classList.remove('hidden');
    }
}); 