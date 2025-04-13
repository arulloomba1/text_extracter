from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request
import PyPDF2
from docx import Document
import io

app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Templates
templates = Jinja2Templates(directory="app/templates")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        content = await file.read()
        text = ""
        
        if file.filename.lower().endswith('.pdf'):
            # Handle PDF
            pdf_file = io.BytesIO(content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            for page in pdf_reader.pages:
                text += page.extract_text()
        
        elif file.filename.lower().endswith(('.doc', '.docx')):
            # Handle DOC/DOCX
            doc_file = io.BytesIO(content)
            doc = Document(doc_file)
            for para in doc.paragraphs:
                text += para.text + '\n'
        
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
        
        return {"text": text}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 