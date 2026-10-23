"""FastAPI application factory.

Run:  uvicorn app.main:app --reload
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import APP_VERSION, get_settings
from app.core.errors import register_error_handlers
from app.core.middleware import RequestContextMiddleware


def create_app() -> FastAPI:
    settings = get_settings()
    logging.basicConfig(
        level=logging.DEBUG if settings.debug else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    docs_enabled = not settings.is_production
    app = FastAPI(
        title=f"{settings.app_name} API",
        version=APP_VERSION,
        description="Face recognition & people management backend. Sign in with **Authorize** to try protected endpoints.",
        docs_url="/docs" if docs_enabled else None,
        redoc_url="/redoc" if docs_enabled else None,
        openapi_url="/openapi.json" if docs_enabled else None,
        swagger_ui_parameters={"persistAuthorization": False},
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type", "X-Requested-With", "X-Request-ID"],
        expose_headers=["X-Request-ID", "Retry-After"],
    )
    # Added last = outermost, so request IDs and security headers cover CORS and error responses too.
    app.add_middleware(RequestContextMiddleware)

    register_error_handlers(app)
    app.include_router(api_router)
    return app


app = create_app()
