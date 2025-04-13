# File to Text Converter

A simple web application that extracts text content from PDF, DOC, and DOCX files. Built with FastAPI and modern web technologies.

## Features

- Upload PDF, DOC, and DOCX files through a modern drag-and-drop interface
- Extract text content from uploaded files
- Support for multiple file formats
- Real-time status updates and error handling
- Clean and responsive user interface

## Technologies Used

- **Backend:**
  - FastAPI (Python web framework)
  - PyPDF2 (PDF text extraction)
  - python-docx (DOC/DOCX text extraction)
  - Uvicorn (ASGI server)

- **Frontend:**
  - HTML5
  - JavaScript (Vanilla)
  - Tailwind CSS (Styling)

## Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
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