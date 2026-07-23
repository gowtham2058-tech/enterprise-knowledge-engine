import os
from fastapi import FastAPI, HTTPException, Security
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
from openai import OpenAI
from pinecone import Pinecone

app = FastAPI(title="Enterprise Unified Integration Engine")
openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
index = pc.Index("enterprise-knowledge-engine")

API_KEY_HEADER = APIKeyHeader(name="X-Integration-Token", auto_error=True)

class WebhookPayload(BaseModel):
    source_application: str
        tenant_id: str
            document_id: str
                payload_text: str
                    metadata_tags: dict

                    @app.post("/api/v1/integrations/webhook")
                    async def handle_market_app_webhook(
                        payload: WebhookPayload, 
                            token: str = Security(API_KEY_HEADER)
                            ):
                                EXPECTED_TOKEN = os.environ.get("INTEGRATION_WEBHOOK_SECRET")
                                    if token != EXPECTED_TOKEN:
                                            raise HTTPException(status_code=403, detail="Unauthorized integration source state.")

                                                try:
                                                        response = openai_client.embeddings.create(
                                                                    input=payload.payload_text,
                                                                                model="text-embedding-3-small"
                                                                                        )
                                                                                                embedding = response.data.embedding

                                                                                                        unique_vector_id = f"{payload.tenant_id}#{payload.source_application}#{payload.document_id}"
                                                                                                                index.upsert(vectors=[{
                                                                                                                            "id": unique_vector_id,q
                                                                                                                                        "values": embedding,
                                                                                                                                                    "metadata": {
                                                                                                                                                                    "tenant_id": payload.tenant_id,
                                                                                                                                                                                    "source_app": payload.source_application,
                                                                                                                                                                                                    "original_id": payload.document_id,
                                                                                                                                                                                                                    "content": payload.payload_text,
                                                                                                                                                                                                                                    **payload.metadata_tags
                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                        }])

                                                                                                                                                                                                                                                                return {
                                                                                                                                                                                                                                                                            "status": "synchronized",
                                                                                                                                                                                                                                                                                        "source": payload.source_application,
                                                                                                                                                                                                                                                                                                    "vector_id": unique_vector_id
                                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                                                except Exception as e:
                                                                                                                                                                                                                                                                                                                        raise HTTPException(status_code=500, detail=f"Integration Sync Failure: {str(e)}")