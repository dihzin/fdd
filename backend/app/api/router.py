from fastapi import APIRouter

from app.api.routes.health import router as health_router
from app.domains.auth.router import router as auth_router
from app.domains.documents.router import router as documents_router
from app.domains.projects.router import router as projects_router
from app.domains.requirements.router import router as requirements_router
from app.domains.solutions.router import router as solutions_router
from app.domains.templates.router import router as templates_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(projects_router)
api_router.include_router(requirements_router)
api_router.include_router(solutions_router)
api_router.include_router(documents_router)
api_router.include_router(templates_router)
