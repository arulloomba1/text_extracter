from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request
import PyPDF2
from docx import Document
import io
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain_community.llms import LlamaCpp
import json 
import os

app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Templates
templates = Jinja2Templates(directory="app/templates")

# Initialize the embeddings model
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# Initialize Llama model
model_path = "models/llama-2-7b-chat.Q4_K_M.gguf"
llm = LlamaCpp(
    model_path=model_path,
    temperature=0.7,
    max_tokens=2000,
    n_ctx=2048,
    verbose=True
)

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

def extract_text_from_file(content: bytes, filename: str) -> str:
    text = ""
    
    if filename.lower().endswith('.pdf'):
        # Handle PDF
        pdf_file = io.BytesIO(content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        for page in pdf_reader.pages:
            text += page.extract_text()
    
    elif filename.lower().endswith(('.doc', '.docx')):
        # Handle DOC/DOCX
        doc_file = io.BytesIO(content)
        doc = Document(doc_file)
        for para in doc.paragraphs:
            text += para.text + '\n'
    
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format")
    
    return text

async def analyze_resume(resume_text: str, job_description: str) -> dict:
    try:
        # Split the resume text into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,  # Reduced chunk size
            chunk_overlap=50,  # Reduced overlap
            length_function=len,
        )
        chunks = text_splitter.split_text(resume_text)
        
        # Create a vector store from the resume chunks
        vectorstore = FAISS.from_texts(
            texts=chunks,
            embedding=embeddings
        )
        
        # Get relevant chunks based on job description (increased from 2 to 3)
        relevant_docs = vectorstore.similarity_search(job_description, k=3)
        context = "\n".join([doc.page_content for doc in relevant_docs])
        
        # Extract key skills from job description using a simple approach
        job_skills = []
        skill_keywords = ["skills", "requirements", "qualifications", "experience with", "proficient in", "knowledge of"]
        
        # Simple extraction of skills from job description
        job_lines = job_description.split('\n')
        for line in job_lines:
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in skill_keywords):
                # Extract potential skills (words after colons, dashes, or bullet points)
                parts = line.split(':')
                if len(parts) > 1:
                    skills_text = parts[1]
                else:
                    skills_text = line
                
                # Split by common delimiters
                for delimiter in [',', ';', '-', '•', '*']:
                    skills_text = skills_text.replace(delimiter, '|')
                
                potential_skills = [s.strip() for s in skills_text.split('|') if len(s.strip()) > 3]
                job_skills.extend(potential_skills)
        
        # If no skills were extracted, use a fallback approach
        if not job_skills:
            # Extract words that might be skills (nouns, technical terms)
            import re
            # Look for capitalized words or technical terms
            potential_skills = re.findall(r'\b[A-Z][a-zA-Z0-9+#]+\b', job_description)
            job_skills = [skill for skill in potential_skills if len(skill) > 3]
        
        # Limit to top 5 skills to avoid overwhelming the model
        job_skills = job_skills[:5]
        
        # Create a more direct prompt without example JSON
        prompt = f"""<s>[INST] You are a resume analyzer. Analyze this resume against the job description and provide feedback.

Job Description: {job_description[:500]}

Resume Context: {context[:1000]}

Key Skills to Check: {', '.join(job_skills) if job_skills else 'Not specified'}

Analyze the resume and provide your response in JSON format with the following structure:
{{
  "match_score": <number between 0-100 based on how well the resume matches the job description>,
  "key_skills_match": [
    {{"skill": "<skill from job description>", "matched": <true/false>, "comments": "<specific evidence from resume>"}}
  ],
  "recommendations": [
    "<specific recommendation based on the actual resume content>"
  ]
}}

IMPORTANT: 
1. Base your analysis on the actual content of the resume and job description
2. Provide specific evidence from the resume for each skill match
3. Make recommendations that are relevant to this specific job and resume
4. Calculate the match score based on the actual skills and experience match

Respond with ONLY the JSON object, no other text. [/INST]"""
        
        # Get the analysis directly from the LLM with higher temperature for more variety
        result = llm.invoke(prompt)
        
        # Debug the raw response
        print(f"Raw LLM response: {result}")
        
        # Clean the response to ensure it's valid JSON
        result = result.strip()
        
        # Remove any markdown code block markers
        if result.startswith("```json"):
            result = result[7:]
        if result.startswith("```"):
            result = result[3:]
        if result.endswith("```"):
            result = result[:-3]
        
        # Remove any system message or instruction markers
        result = result.replace("</s>", "").replace("<s>", "").replace("[INST]", "").replace("[/INST]", "")
        
        # Remove any leading/trailing whitespace
        result = result.strip()
        
        # Debug the cleaned response
        print(f"Cleaned response: {result}")
        
        # Parse the response
        try:
            analysis = json.loads(result)
            return analysis
        except json.JSONDecodeError as e:
            print(f"Error parsing analysis response: {str(e)}")
            print(f"Raw response: {result}")
            
            # Try to extract JSON from the response if it's embedded in other text
            import re
            json_match = re.search(r'\{.*\}', result, re.DOTALL)
            if json_match:
                try:
                    extracted_json = json_match.group(0)
                    analysis = json.loads(extracted_json)
                    return analysis
                except json.JSONDecodeError:
                    pass
            
            raise HTTPException(status_code=500, detail="Error parsing analysis response")

    except Exception as e:
        print(f"Error in analyze_resume: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error analyzing resume: {str(e)}")

@app.post("/analyze")
async def analyze_file(file: UploadFile = File(...), job_description: str = Form(...)):
    try:
        print(f"Received file: {file.filename}")
        print(f"Job description length: {len(job_description)}")
        
        content = await file.read()
        print(f"File content length: {len(content)}")
        
        text = extract_text_from_file(content, file.filename)
        print(f"Extracted text length: {len(text)}")
        
        # Get AI analysis
        analysis = await analyze_resume(text, job_description)
        print(f"Analysis completed: {analysis}")
        
        # Combine the extracted text with the analysis
        return {
            "text": text,
            **analysis
        }
    
    except Exception as e:
        print(f"Error in analyze_file: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e)) 