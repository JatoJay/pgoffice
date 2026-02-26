bucket         = "pgmonitor-terraform-state-production"
key            = "production/terraform.tfstate"
region         = "us-east-1"
encrypt        = true
dynamodb_table = "pgmonitor-terraform-locks-production"
