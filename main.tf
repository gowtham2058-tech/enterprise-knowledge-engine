terraform {
      required_version = ">= 1.5.0"
        required_providers {
                aws = {
                          source  = "hashicorp/aws"
                                version = "~> 5.0"
                }
        }
}

provider "aws" {
      region = "us-east-1"
}

resource "aws_s3_bucket" "enterprise_vault" {
      bucket        = "enterprise-knowledge-vault-prod-025"
        force_destroy = false
}

resource "aws_s3_bucket_public_access_block" "vault_security" {
      bucket = aws_s3_bucket.enterprise_vault.id

        block_public_acls       = true
          block_public_policy     = true
            ignore_public_acls      = true
              restrict_public_buckets = true
}

resource "aws_db_instance" "metadata_store" {
      allocated_storage    = 20
        max_allocated_storage = 100
          engine               = "postgres"
            engine_version       = "15.4"
              instance_class       = "db.t4g.micro"
                db_name              = "enterprisestate"
                  username             = "cloud_admin"
                    password             = "SecureStatePass123!"
                      skip_final_snapshot  = true
                        publicly_accessible  = false
}

output "s3_bucket_domain_name" {
      value       = aws_s3_bucket.enterprise_vault.bucket_regional_domain_name
        description = "Connect your Next.js file upload ingestion core to this domain state."
}

output "database_endpoint" {
      value       = aws_db_instance.metadata_store.endpoint
        description = "Connect your API transactional layer to this database host."
}
}
}
}
}
}
}
                }
        }
}