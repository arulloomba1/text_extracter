# File to Text Converter

Simple web application that extracts text content from PDF, DOC, and DOCX files. Built with FastAPI.

## Features

- Upload PDF, DOC, and DOCX files through drag-and-drop interface (can also open file explorer, etc)
- Extract text content from uploaded files (currently only supports single files)
- Support for multiple file formats (PDF, DOC, DOCX)
- Up to 10 MB
- Error-handling
- Clean and responsive user interface

## Technologies Used

- **Backend:**
  - FastAPI (Python web framework)
  - PyPDF2 (PDF text extraction)
  - python-docx (DOC/DOCX text extraction)
- **Frontend:**
  - HTML5
  - JavaScript
  - Tailwind CSS 

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd file-to-text-converter
```

2. Create and activate a virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows, use: .venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Application

1. Start the server:
```bash
python -m uvicorn app.main:app --reload
```

2. Open your browser and navigate to:
```
http://localhost:8000
```

## Usage

1. Click the upload area or drag and drop a file (PDF, DOC, or DOCX)
2. Click "Convert to Text" button
3. View the extracted text content in the results section

## File Format Support

- PDF (.pdf)
- Microsoft Word Documents (.doc, .docx)

## License

MIT License

## Contributing

Feel free to submit issues and enhancement requests! 
