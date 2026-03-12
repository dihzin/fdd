from pydantic import BaseModel


class FddSectionSummary(BaseModel):
    id: int
    title: str
    section_key: str
