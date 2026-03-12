from pydantic import BaseModel


class ExportJobStatus(BaseModel):
    status: str
    format: str = "docx"
